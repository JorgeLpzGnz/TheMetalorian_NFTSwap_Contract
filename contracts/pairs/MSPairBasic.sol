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

    function _getSellNFTInfo( uint _numNFTs, uint _maxEspectedOut ) internal virtual returns ( 
            uint256 outputValue, 
            uint256 protocolFee 
        ) 
    {

        CurveErrors.Error error;

        uint128 newSpotPrice;

        uint128 newDelta;

        ( , uint128 protocolFeeMult, ) = IMetaFactory( factory ).getFactoryInfo();

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
            protocolFeeMult,
            tradeFee
            );

        require( error == CurveErrors.Error.OK );

        require( outputValue <= _maxEspectedOut );

        if( delta != newDelta ) delta = newDelta;

        if( spotPrice != newSpotPrice ) spotPrice = newSpotPrice;

    }

    function _getBuyNFTInfo( uint _numNFTs, uint _maxEspectedOut ) internal virtual returns ( 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        CurveErrors.Error error;

        uint128 newSpotPrice;

        uint128 newDelta;

        ( , uint128 protocolFeeMult, ) = IMetaFactory( factory ).getFactoryInfo();

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
            protocolFeeMult,
            tradeFee
            );

        require( error == CurveErrors.Error.OK );

        require( inputValue <= _maxEspectedOut );

        if( delta != newDelta ) delta = newDelta;

        if( spotPrice != newSpotPrice ) spotPrice = newSpotPrice;

    }

    function _sendTokensAndPayFee( uint _protocolFee, uint _amount, address _to ) private {

        (, ,address protocolFeeRecipient ) = IMetaFactory( factory ).getFactoryInfo();

        ( bool isFeeSended, ) = payable( protocolFeeRecipient ).call{ value: _protocolFee }( "" );

        ( bool isAmountSended, ) = payable( _to ).call{ value: _amount }( "" );

        require( isAmountSended && isFeeSended );

    }

    function _sendNFTsTo( address _from, address _to, uint[] calldata _tokenIDs ) internal virtual;

    function _sendAnyNFTsTo( address _to, uint _numNFTs ) internal virtual;

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

        if( _poolType == PoolTypes.PoolType.Token || _poolType == PoolTypes.PoolType.NFT ) {

            require( _fee == 0, "fees only available in trade pools");

            rewardsRecipent = _rewardsRecipent;

        } else {

            require( _rewardsRecipent == address(0), "trades pools can't use fees recipent");

            require( _fee <= MAX_TRADE_FEE, "fees exceeds max");

            tradeFee = _fee;

        }

        require( _curve.validateSpotPrice( _spotPrice ), "invalid spotPrice" );

        require( _curve.validateDelta( _delta ), "invalid delta" );

        curve = _curve;

        delta = _delta;

        spotPrice = _spotPrice;

        NFT = _NFT;

        currentPoolType = _poolType;

        factory = msg.sender;

    }

    function swapNFTsForToken( uint[] calldata _tokenIDs, uint _maxEspectedOut, address payable _recipient, address _sender ) public nonReentrant {

        require( currentPoolType == PoolTypes.PoolType.Token || currentPoolType == PoolTypes.PoolType.Trade );

        ( uint256 inputValue, uint256 protocolFee ) = _getSellNFTInfo( _tokenIDs.length, _maxEspectedOut );

        _sendNFTsTo(  _sender, address( this ), _tokenIDs );

        _sendTokensAndPayFee( protocolFee, inputValue, _recipient );

    }

    function swapTokenForNFT( uint[] calldata _tokenIDs, uint _maxEspectedOut, address payable _recipient, address _sender ) public payable {

        require( currentPoolType == PoolTypes.PoolType.NFT || currentPoolType == PoolTypes.PoolType.Trade );

        ( uint inputAmount, uint protocolFee ) = _getBuyNFTInfo( _tokenIDs.length, _maxEspectedOut );

        _sendTokensAndPayFee( protocolFee, inputAmount, _recipient );

        _sendNFTsTo( _sender, address( this ), _tokenIDs );
        
    }

    function swapTokenForAnyNFT( uint _numNFTs, uint _maxEspectedOut, address payable _recipient, address _sender ) public payable {

        require( currentPoolType == PoolTypes.PoolType.NFT || currentPoolType == PoolTypes.PoolType.Trade );

        ( uint inputAmount, uint protocolFee ) = _getBuyNFTInfo( _numNFTs, _maxEspectedOut );

        _sendTokensAndPayFee( protocolFee, inputAmount, _recipient );

        _sendAnyNFTsTo( _sender, _numNFTs );
        
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
