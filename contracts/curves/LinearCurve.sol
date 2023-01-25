// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICurve.sol";
import "./CurveErrors.sol";
import "hardhat/console.sol";

contract LinearCurve is ICurve, CurveErrors {

    function validateSpotPrice( uint ) external pure override returns( bool ) {

        return true;

    }

    function validateDelta( uint ) external pure override returns( bool ) {

        return true;

    }

    function getBuyInfo( uint128 _delta, uint128 _spotPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure override 
        returns ( 
            Error error, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 inputValue, 
            uint256 protocolFee 
        ) {

        if ( _numItems == 0 ) 
            return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint _newSpotPrice = _spotPrice + _delta * _numItems;

        if( _newSpotPrice > type( uint128 ).max )
            return (Error.SPOT_PRICE_OVERFLOW, 0, 0, 0, 0);

        uint256 buyPrice = _spotPrice + _delta;

        inputValue = 
            _numItems * buyPrice + ( _numItems * ( _numItems - 1 ) * _delta ) / 2;

        // update ( Fees )

        uint poolFee = inputValue * _poolFee;

        protocolFee = inputValue * _protocolFee;

        inputValue += ( protocolFee + poolFee );

        newSpotPrice = uint128(_newSpotPrice);

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
        ) {

        if ( _numItems == 0 ) 
            return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint decrease = _delta * _numItems;

        if( _spotPrice < decrease ){

            newSpotPrice = 0;

            _numItems = _spotPrice / _delta + 1;

        }

        else newSpotPrice = _spotPrice - uint128( decrease );

        outputValue = _numItems * _spotPrice - ( _numItems * ( _numItems - 1 ) * _delta ) / 2;

        // update ( Fees )

        uint poolFee = ( outputValue * _poolFee ) / 1e18;

        protocolFee = ( outputValue * _protocolFee ) / 1e18;

        outputValue -= ( protocolFee + poolFee );

        newDelta = _delta;

        error = Error.OK;

    }
    
}