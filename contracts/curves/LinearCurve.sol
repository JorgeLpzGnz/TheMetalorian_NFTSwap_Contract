// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "../libraries/FixedPointMathLib.sol";
import "../interfaces/ICurve.sol";

contract LinearCurve is ICurve, CurveErrors {

    using FixedPointMathLib for uint256;

    function validateSpotPrice( uint ) external pure override returns( bool ) {

        return true;

    }

    function validateDelta( uint ) external pure override returns( bool ) {

        return true;

    }

    function getBuyInfo( uint128 _delta, uint128 _spotPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure override 
        returns ( 
            bool isValid, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 inputValue, 
            uint256 protocolFee 
        ) {

        if ( _numItems == 0 ) 
            return (false, 0, 0, 0, 0);

        uint _newSpotPrice = uint( _spotPrice + _delta ).fmul( _numItems, FixedPointMathLib.WAD );

        if( _newSpotPrice > type( uint128 ).max )
            return ( false, 0, 0, 0, 0);

        uint256 buyPrice = _spotPrice + _delta;

        inputValue = 
            _numItems * buyPrice + ( _numItems * ( _numItems - 1 ) * _delta ) / 2;

        // update ( Fees )

        uint poolFee = inputValue.fmul( _poolFee, FixedPointMathLib.WAD);

        protocolFee = inputValue.fmul( _protocolFee, FixedPointMathLib.WAD);

        inputValue += ( protocolFee + poolFee );

        newSpotPrice = uint128(_newSpotPrice);

        newDelta = _delta;

        isValid = true;

    }

    function getSellInfo( uint128 _delta, uint128 _spotPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure override
        returns ( 
            bool isValid, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 outputValue, 
            uint256 protocolFee 
        ) {

        if ( _numItems == 0 ) 
            return (false, 0, 0, 0, 0);

        uint decrease = _delta * _numItems;

        if( _spotPrice < decrease ){

            newSpotPrice = 0;

            _numItems = _spotPrice / _delta + 1;

        }

        else newSpotPrice = _spotPrice - uint128( decrease );

        outputValue = _numItems * _spotPrice - ( _numItems * ( _numItems - 1 ) * _delta ) / 2;

        // update ( Fees )

        uint poolFee = outputValue.fmul( _poolFee, FixedPointMathLib.WAD);

        protocolFee = outputValue.fmul( _protocolFee, FixedPointMathLib.WAD);

        outputValue -= ( protocolFee + poolFee );

        newDelta = _delta;

        isValid = true;

    }
    
}