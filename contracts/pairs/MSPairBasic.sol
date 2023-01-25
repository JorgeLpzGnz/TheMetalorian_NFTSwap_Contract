// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PoolTypes.sol";
import "../interfaces/ICurve.sol";
import "../interfaces/IMetaFactory.sol";
import "../curves/CurveErrors.sol";
// Uncomment this line to use console.log
import "hardhat/console.sol";

abstract contract MSPairBasic is ReentrancyGuard, Ownable {

    uint128 public delta;

    uint128 public spotPrice;

    uint128 public tradeFee;

    uint128 public constant MAX_TRADE_FEE = 0.9e18;

    address public rewardsRecipent;

    address public NFT;

    address public factory;

    PoolTypes.PoolType public currentPoolType;

    ICurve public curve;

    event SellLog( address user, uint inputNFTs, uint amoutOut );

    event BuyLog( address user, uint amoutIn, uint outputNFTs );

    function _getSellNFTInfo( uint _numNFTs, uint _minExpected ) internal virtual returns ( 
            uint256 outputValue, 
            uint256 protocolFee 
        ) 
    {

        CurveErrors.Error error;

        uint128 newSpotPrice;

        uint128 newDelta;

        (
            error, 
            newSpotPrice, 
            newDelta, 
            outputValue, 
            protocolFee 
        ) = curve.getSellInfo( 
            delta, 
            spotPrice, 
            _numNFTs,
            IMetaFactory( factory ).PROTOCOL_FEE(),
            tradeFee
            );

        require( error == CurveErrors.Error.OK, "curve Error" );

        require( outputValue >= _minExpected, "output amount is les than min espected" );

        if( delta != newDelta ) delta = newDelta;

        if( spotPrice != newSpotPrice ) spotPrice = newSpotPrice;

    }

    function _getBuyNFTInfo( uint _numNFTs, uint _maxEspectedIn ) internal virtual returns ( 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        CurveErrors.Error error;

        uint128 newSpotPrice;

        uint128 newDelta;

        (
            error, 
            newSpotPrice, 
            newDelta, 
            inputValue, 
            protocolFee 
        ) = curve.getBuyInfo( 
            delta, 
            spotPrice, 
            _numNFTs, 
            IMetaFactory( factory ).PROTOCOL_FEE(),
            tradeFee
            );

        require( error == CurveErrors.Error.OK, "curve Error" );

        require( inputValue <= _maxEspectedIn, "output amount is less than min espected" );

        if( delta != newDelta ) delta = newDelta;

        if( spotPrice != newSpotPrice ) spotPrice = newSpotPrice;

    }

    function _sendTokensAndPayFee( uint _protocolFee, uint _amount, address _to ) private {

        address feeRecipient = IMetaFactory( factory ).PROTOCOL_FEE_RECIPIENT();

        ( bool isFeeSended, ) = payable( feeRecipient ).call{value: _protocolFee}("");

        ( bool isAmountSended, ) = payable( _to ).call{ value: _amount - _protocolFee }( "" );

        require( isAmountSended && isFeeSended, "tx error" );

    }

    function _receiveTokensAndPayFee( uint _inputAmount, uint _protocolFee ) private {

        require( msg.value >= _inputAmount, "insufficent amount of ETH" );

        address feeRecipient = IMetaFactory( factory ).PROTOCOL_FEE_RECIPIENT();

        ( bool isSended, ) = payable( feeRecipient ).call{ value: _protocolFee }("");

        require( isSended, "tx error");

    }

    function _sendNFTsTo( address _from, address _to, uint[] calldata _tokenIDs ) internal virtual;

    function _sendAnyOutNFTs( address _to, uint _numNFTs ) internal virtual;

    function getNFTIds() public virtual view returns ( uint[] memory nftIds);

    function init(
        uint128 _delta, 
        uint128 _spotPrice, 
        address _rewardsRecipent, 
        address _owner, 
        address _NFT, 
        uint128 _fee, 
        ICurve _curve, 
        PoolTypes.PoolType _poolType 
        ) public payable 
    {

        require( owner() == address(0), "it is already initialized");

        _transferOwnership( _owner );

        if( rewardsRecipent != _rewardsRecipent ) rewardsRecipent = _rewardsRecipent;

        if( tradeFee != _fee) tradeFee = _fee;

        curve = _curve;

        delta = _delta;

        spotPrice = _spotPrice;

        NFT = _NFT;

        currentPoolType = _poolType;

        factory = msg.sender;

    }

    function swapNFTsForToken( uint[] calldata _tokenIDs, uint _minExpected, address _user ) public nonReentrant {

        require( currentPoolType == PoolTypes.PoolType.Token || currentPoolType == PoolTypes.PoolType.Trade, "invalid pool Type" );

        ( uint256 outputAmount, uint256 protocolFee ) = _getSellNFTInfo( _tokenIDs.length, _minExpected );

        _sendNFTsTo( _user, address( this ), _tokenIDs );

        _sendTokensAndPayFee( protocolFee, outputAmount, _user );

        emit SellLog( _user, _tokenIDs.length, outputAmount );

    }

    function swapTokenForNFT( uint[] calldata _tokenIDs, uint _maxEspectedIn, address _user ) public payable {

        require( currentPoolType == PoolTypes.PoolType.NFT || currentPoolType == PoolTypes.PoolType.Trade, "invalid pool Type" );

        ( uint inputAmount, uint protocolFee ) = _getBuyNFTInfo( _tokenIDs.length, _maxEspectedIn );

        console.log( address( this ).balance );

        _receiveTokensAndPayFee( inputAmount, protocolFee );

        console.log( address( this ).balance );

        _sendNFTsTo( address( this ), _user, _tokenIDs );

        if ( msg.value > inputAmount ) {

            ( bool isSended , ) = payable( _user).call{ value: msg.value - inputAmount }("");
            
            require( isSended, "tx error" );
            
        }

        emit BuyLog( _user, inputAmount, _tokenIDs.length);
        
    }

    function swapTokenForAnyNFT( uint _numNFTs, uint _maxEspectedIn, address _user ) public payable {

        require( currentPoolType == PoolTypes.PoolType.NFT || currentPoolType == PoolTypes.PoolType.Trade );

        ( uint inputAmount, uint protocolFee ) = _getBuyNFTInfo( _numNFTs, _maxEspectedIn );

        _receiveTokensAndPayFee( inputAmount, protocolFee );

        _sendAnyOutNFTs( _user, _numNFTs );

        if ( msg.value > inputAmount ) {

            ( bool isSended , ) = payable( _user).call{ value: msg.value - inputAmount }("");
            
            require( isSended, "tx error" );
            
        }

        emit BuyLog( _user, inputAmount, _numNFTs);
        
    }

    receive() external payable {}

    function setSpotPrice( uint128 _newSpotPrice ) public onlyOwner {

        require( spotPrice != _newSpotPrice, "thats the current value");

        require( curve.validateSpotPrice( _newSpotPrice ) );

        spotPrice = _newSpotPrice;

    }

    function setDelta( uint128 _newDelta ) public onlyOwner {

        require( delta != _newDelta, "thats the current value");

        require( curve.validateDelta( _newDelta ) );

        delta = _newDelta;
        
    }

    function withdrawToken() public onlyOwner {

        uint balance = address( this ).balance;

        require( balance > 0, "insufficent balance" );

        ( bool isSended, ) = payable( address( this )).call{ value: balance }("");

        require(isSended, "amount not sended" );

    }

    function withdrawNFTs( IERC721 _nft, uint[] calldata _nftIds ) external virtual;

}
