// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PoolTypes.sol";
import "../interfaces/IMetaAlgorithm.sol";
import "../interfaces/IMetaFactory.sol";
import "../Algorithms/AlgorithmErrors.sol";
import "../interfaces/IMSPair.sol";

abstract contract MSPairBasic is IMSPair, ReentrancyGuard, Ownable {

    uint128 public multiplier;

    uint128 public startPrice;

    uint128 public tradeFee;

    uint128 public constant MAX_TRADE_FEE = 0.9e18;

    address public recipient;

    address public NFT;

    address public factory;

    PoolTypes.PoolType public currentPoolType;

    IMetaAlgorithm public Algorithm;

    event SellLog( address user, uint inputNFTs, uint amountOut );

    event BuyLog( address user, uint amountIn, uint outputNFTs );

    function _getSellNFTInfo( uint _numNFTs, uint _minExpected ) internal virtual returns ( 
            uint256 outputValue, 
            uint256 protocolFee 
        ) 
    {

        bool isValid;

        uint128 newStartPrice;

        uint128 newDelta;

        (
            isValid, 
            newStartPrice, 
            newDelta, 
            outputValue, 
            protocolFee 
        ) = Algorithm.getSellInfo( 
            multiplier, 
            startPrice, 
            _numNFTs,
            IMetaFactory( factory ).PROTOCOL_FEE(),
            tradeFee
            );

        require( isValid, "Algorithm Error" );

        require( outputValue >= _minExpected, "output amount is les than min expected" );

        if( multiplier != newDelta ) multiplier = newDelta;

        if( startPrice != newStartPrice ) startPrice = newStartPrice;

    }

    function _getBuyNFTInfo( uint _numNFTs, uint _maxExpectedIn ) internal virtual returns ( 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        bool isValid;

        uint128 newStartPrice;

        uint128 newDelta;

        (
            isValid, 
            newStartPrice, 
            newDelta, 
            inputValue, 
            protocolFee 
        ) = Algorithm.getBuyInfo( 
            multiplier, 
            startPrice, 
            _numNFTs, 
            IMetaFactory( factory ).PROTOCOL_FEE(),
            tradeFee
            );

        require( isValid, "Algorithm Error" );

        require( inputValue <= _maxExpectedIn, "output amount is less than min expected" );

        if( multiplier != newDelta ) multiplier = newDelta;

        if( startPrice != newStartPrice ) startPrice = newStartPrice;

    }

    function _sendSellsAndPayFee( uint _protocolFee, uint _amount, address _to ) private {

        address feeRecipient = IMetaFactory( factory ).PROTOCOL_FEE_RECIPIENT();

        ( bool isFeeSended, ) = payable( feeRecipient ).call{value: _protocolFee}("");

        ( bool isAmountSended, ) = payable( _to ).call{ value: _amount - _protocolFee }( "" );

        require( isAmountSended && isFeeSended, "tx error" );

    }

    function _receiveSellsAndPayFee( uint _inputAmount, uint _protocolFee ) private {

        require( msg.value >= _inputAmount, "insufficient amount of ETH" );

        address _recipient = getAssetsRecipient();

        if( _recipient != address( this ) ) {

            ( bool isAssetSended, ) = payable( _recipient ).call{ value: _inputAmount - _protocolFee }("");

            require( isAssetSended, "tx error" );

        }

        address feeRecipient = IMetaFactory( factory ).PROTOCOL_FEE_RECIPIENT();

        ( bool isFeeSended, ) = payable( feeRecipient ).call{ value: _protocolFee }("");

        require( isFeeSended, "tx error");

    }

    function _sendNFTsTo( address _from, address _to, uint[] memory _tokenIDs ) internal virtual;

    function _sendAnyOutNFTs( address _to, uint _numNFTs ) internal virtual;

    function getNFTIds() public virtual view returns ( uint[] memory nftIds);

    function getPoolBuyInfo( uint _numNFTs) public view returns( bool isValid, uint128 newStartPrice, uint128 newDelta, uint inputValue, uint protocolFee ) {

        (
            isValid, 
            newStartPrice, 
            newDelta, 
            inputValue, 
            protocolFee 
        ) = Algorithm.getBuyInfo( 
            multiplier, 
            startPrice, 
            _numNFTs, 
            IMetaFactory( factory ).PROTOCOL_FEE(),
            tradeFee
            );
    
    }

    function getPoolSellInfo( uint _numNFTs) public view returns( bool isValid, uint128 newStartPrice, uint128 newDelta, uint outputValue, uint protocolFee ) {

        (
            isValid, 
            newStartPrice, 
            newDelta, 
            outputValue, 
            protocolFee 
        ) = Algorithm.getSellInfo( 
            multiplier, 
            startPrice, 
            _numNFTs, 
            IMetaFactory( factory ).PROTOCOL_FEE(),
            tradeFee
            );
    
    }

    function getAssetsRecipient() public view returns ( address _recipient ) {

        if ( recipient == address(0) ) _recipient = address( this );

        else _recipient = recipient;

    }

    function init(
        uint128 _multiplier, 
        uint128 _startPrice, 
        address _recipient, 
        address _owner, 
        address _NFT, 
        uint128 _fee, 
        IMetaAlgorithm _Algorithm, 
        PoolTypes.PoolType _poolType 
        ) public payable 
    {

        require( owner() == address(0), "it is already initialized");

        _transferOwnership( _owner );

        if( recipient != _recipient ) recipient = _recipient;

        if( tradeFee != _fee) tradeFee = _fee;

        Algorithm = _Algorithm;

        multiplier = _multiplier;

        startPrice = _startPrice;

        NFT = _NFT;

        currentPoolType = _poolType;

        factory = msg.sender;

    }

    function swapNFTsForSell( uint[] memory _tokenIDs, uint _minExpected, address _user ) public nonReentrant returns( uint256 outputAmount ) {

        require( currentPoolType == PoolTypes.PoolType.Sell || currentPoolType == PoolTypes.PoolType.Trade, "invalid pool Type" );

        uint256 protocolFee;

        ( outputAmount, protocolFee ) = _getSellNFTInfo( _tokenIDs.length, _minExpected );

        address _recipient = getAssetsRecipient();

        _sendNFTsTo( _user, _recipient, _tokenIDs );

        _sendSellsAndPayFee( protocolFee, outputAmount, _user );

        emit SellLog( _user, _tokenIDs.length, outputAmount );

    }

    function swapSellForNFT( uint[] memory _tokenIDs, uint _maxExpectedIn, address _user ) public payable nonReentrant returns( uint256 inputAmount ) {

        require( currentPoolType == PoolTypes.PoolType.Buy || currentPoolType == PoolTypes.PoolType.Trade, "invalid pool Type" );

        uint protocolFee;

        ( inputAmount, protocolFee ) = _getBuyNFTInfo( _tokenIDs.length, _maxExpectedIn );

        _receiveSellsAndPayFee( inputAmount, protocolFee );

        _sendNFTsTo( address( this ), _user, _tokenIDs );

        if ( msg.value > inputAmount ) {

            ( bool isSended , ) = payable( _user).call{ value: msg.value - inputAmount }("");
            
            require( isSended, "tx error" );
            
        }

        emit BuyLog( _user, inputAmount, _tokenIDs.length);
        
    }

    function swapSellForAnyNFT( uint _numNFTs, uint _maxExpectedIn, address _user ) public payable nonReentrant returns( uint256 inputAmount ) {

        require( currentPoolType == PoolTypes.PoolType.Buy || currentPoolType == PoolTypes.PoolType.Trade, "invalid pool Type" );

        uint protocolFee;

        ( inputAmount, protocolFee ) = _getBuyNFTInfo( _numNFTs, _maxExpectedIn );

        _receiveSellsAndPayFee( inputAmount, protocolFee );

        _sendAnyOutNFTs( _user, _numNFTs );

        if ( msg.value > inputAmount ) {

            ( bool isSended , ) = payable( _user).call{ value: msg.value - inputAmount }("");
            
            require( isSended, "tx error" );
            
        }

        emit BuyLog( _user, inputAmount, _numNFTs);
        
    }

    receive() external payable {}

    function setAssetsRecipient( address _newRecipient ) external onlyOwner {

        require( currentPoolType != PoolTypes.PoolType.Trade, "Recipient not supported in trade pools");

        require( recipient != _newRecipient, "New recipient is equal than current" );

        recipient = _newRecipient;

    }

    function setStartPrice( uint128 _newStartPrice ) external onlyOwner {

        require( startPrice != _newStartPrice, "new price is equal than current");

        require( Algorithm.validateStartPrice( _newStartPrice ), "invalid Start Price" );

        startPrice = _newStartPrice;

    }

    function setDelta( uint128 _newDelta ) external onlyOwner {

        require( multiplier != _newDelta, "multiplier is equal than current");

        require( Algorithm.validateDelta( _newDelta ), "invalid multiplier" );

        multiplier = _newDelta;
        
    }

    function withdrawSell() external onlyOwner {

        uint balance = address( this ).balance;

        require( balance > 0, "insufficient balance" );

        ( bool isSended, ) = owner().call{ value: balance }("");

        require(isSended, "amount not sended" );

    }

    function withdrawNFTs( IERC721 _nft, uint[] calldata _nftIds ) external virtual;

}
