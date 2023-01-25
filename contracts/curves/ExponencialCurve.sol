// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICurve.sol";
import "./CurveErrors.sol";
import "hardhat/console.sol";

contract ExponencialCurve is ICurve, CurveErrors {

    uint32 public constant MIN_PRICE = 1 gwei; 

    uint public constant MIN_DELTA = 1e18; 

    function validateSpotPrice( uint _spotPrice ) external pure override returns( bool ) {

        return _spotPrice >= MIN_PRICE;

    }

    function validateDelta( uint _delta ) external pure override returns( bool ) {

        return _delta > MIN_DELTA;

    }

    function getBuyInfo( uint128 _delta, uint128 _spotPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure override
        returns ( 
            Error error, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        if( _numItems == 0 ) return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint deltaPow = uint( _delta ) ** _numItems;

        uint _newSpotPrice = uint( _spotPrice ) * deltaPow;

        if( _newSpotPrice > type( uint128 ).max )
            return (Error.SPOT_PRICE_OVERFLOW, 0, 0, 0, 0);

        newSpotPrice = uint128( _newSpotPrice );

        uint buyPrice = ( uint( _spotPrice ) * _delta ) / 1e18;

        inputValue = buyPrice * ( deltaPow - 1e18 ) / ( _delta - 1e18);

        // update ( Fees )

        uint poolFee = ( inputValue * _poolFee ) / 1e18;

        protocolFee = (inputValue * _protocolFee) / 1e18;

        inputValue += ( protocolFee + poolFee );

        newSpotPrice = uint128( _newSpotPrice );

        newDelta = _delta;

        error = Error.OK;

    }

    function getSellInfo( uint128 _delta, uint128 _spotPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure override 
        returns ( 
            Error error, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 outputValue, 
            uint256 protocolFee 
        ) 
    {
        if( _numItems == 0 ) return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint invDelta = 1e18 /  _delta;

        uint invDeltaPow = invDelta ** _numItems;

        // update ( this is a percentage )

        newSpotPrice = uint128( _spotPrice * invDeltaPow );

        if( newSpotPrice < MIN_PRICE ) newSpotPrice = MIN_PRICE;

        outputValue = 
            uint( _spotPrice ) * 
            ( 1e18 / invDeltaPow ) / 
            ( 1e18 / _delta );

        // update ( Fees )

        uint poolFee = outputValue * _poolFee;

        protocolFee = outputValue * _protocolFee;

        outputValue -= ( protocolFee + poolFee );

        newDelta = _delta;

        error = Error.OK;
        
    }
    
}