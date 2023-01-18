// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PoolTypes.sol";
import "../curves/ICurve.sol";
import "../curves/CurveErrors.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

abstract contract MSPairBasic is ReentrancyGuard, Ownable, CurveErrors, PoolTypes {

    uint128 public delta;

    uint128 public spotPrice;

    uint128 public tradeFee;

    uint128 public MAX_TRADE_FEE;

    address public rewardsRecipent;

    address public NFT;

    address public factory;

    PoolType currentPoolType;

    ICurve curve;

    function _getSellNFTInfo( uint _numNFTs, uint _maxEspectedOut ) internal virtual returns ( 
            uint256 outputValue, 
            uint256 protocolFee 
        ) 
    {

        Error error;

        uint128 newSpotPrice;

        uint128 newDelta;

        (
            error, 
            newSpotPrice, 
            newDelta, 
            outputValue, 
            protocolFee 
        ) = curve.getSellInfo( delta, spotPrice, _numNFTs);

        require( error == Error.OK );

        require( outputValue <= _maxEspectedOut );

        if( delta != newDelta ) delta = newDelta;

        if( spotPrice != newSpotPrice ) spotPrice = newSpotPrice;

    }

    function _getBuyNFTInfo( uint _numNFTs, uint _maxEspectedOut ) internal virtual returns ( 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        Error error;

        uint128 newSpotPrice;

        uint128 newDelta;

        (
            error, 
            newSpotPrice, 
            newDelta, 
            inputValue, 
            protocolFee 
        ) = curve.getBuyInfo( delta, spotPrice, _numNFTs);

        require( error == Error.OK );

        require( inputValue <= _maxEspectedOut );

        if( delta != newDelta ) delta = newDelta;

        if( spotPrice != newSpotPrice ) spotPrice = newSpotPrice;

    }

    function _sendTokensToRecipientAndPayFee( uint _protocolFee, uint _amount, address _to ) private {

        require( payable( factory ).send( _protocolFee ) );

        require( payable( _to ).send( _amount ) );

    }

    function _sendNFTsTo( address _from, address _to, uint[] memory _tokenIDs ) private {

        IERC721 _NFT = IERC721( NFT );

        for (uint256 i = 0; i < _tokenIDs.length; i++) {

            _NFT.safeTransferFrom(_from, _to, _tokenIDs[i]);

        }

    }

    function _sendAnyNFTsTo( address _to, uint _numNFTs ) private {

        IERC721 _NFT = IERC721( NFT );

        uint[] memory _tokenIds = getNFTIds();

        for (uint256 i = 0; i < _numNFTs - 1; i++) {

            _NFT.safeTransferFrom( address( this ), _to, _tokenIds[i]);

        }

    }

    function getNFTIds() public virtual view returns ( uint[] memory nftIds);

    function initialize(
        uint128 _delta, 
        uint128 _spotPrice, 
        address _rewardsRecipent, 
        address _owner, 
        uint128 _fee, 
        ICurve _curve, 
        address _NFT, 
        PoolType _poolType 
        ) public payable 
    {

        transferOwnership( _owner );

        if( _poolType == PoolType.Token || _poolType == PoolType.NFT ) {

            require( _fee == 0 );

            rewardsRecipent = _rewardsRecipent;

        } else {

            require( _rewardsRecipent == address(0));

            require( _fee <= MAX_TRADE_FEE);

            MAX_TRADE_FEE = _fee;

        }

        require( _curve.validateSpotPrice( _spotPrice ) );

        require( _curve.validateDelta( _delta ) );

        curve = _curve;

        delta = _delta;

        spotPrice = _spotPrice;

        NFT = _NFT;

        currentPoolType = _poolType;

        factory = msg.sender;

    }

    function swapNFTsForToken( uint[] memory _tokenIDs, uint _maxEspectedOut, address payable _recipient, address _sender ) public nonReentrant {

        require( currentPoolType == PoolType.Token || currentPoolType == PoolType.Trade );

        ( 
            uint256 inputValue, 
            // uint256 protocolFee 
        )  = _getSellNFTInfo( _tokenIDs.length, _maxEspectedOut );

        _sendNFTsTo(  _sender, address( this ), _tokenIDs );

        _sendTokensToRecipientAndPayFee( _maxEspectedOut, inputValue, _recipient );

    }

    function swapTokenForNFT( uint[] memory _tokenIDs, uint _maxEspectedOut, address payable _recipient, address _sender ) public payable {

        require( currentPoolType == PoolType.NFT || currentPoolType == PoolType.Trade );

        ( uint inputAmount, uint protocolFee ) = _getBuyNFTInfo( _tokenIDs.length, _maxEspectedOut );

        _sendTokensToRecipientAndPayFee( protocolFee, inputAmount, _recipient );

        _sendNFTsTo( _sender, address( this ), _tokenIDs );
        
    }

    function swapTokenForAnyNFT( uint _numNFTs, uint _maxEspectedOut, address payable _recipient, address _sender ) public payable {

        require( currentPoolType == PoolType.NFT || currentPoolType == PoolType.Trade );

        ( uint inputAmount, uint protocolFee ) = _getBuyNFTInfo( _numNFTs, _maxEspectedOut );

        _sendTokensToRecipientAndPayFee( protocolFee, inputAmount, _recipient );

        _sendAnyNFTsTo( _sender, _numNFTs );
        
    }

}
