// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/FixedPointMathLib.sol";
import "../interfaces/ICurve.sol";

contract ExponencialCurve is ICurve, CurveErrors {

    using FixedPointMathLib for uint256;

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
            bool isValid, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        if( _numItems == 0 ) return (false, 0, 0, 0, 0);

        uint deltaPow = uint( _delta ).fpow( _numItems, FixedPointMathLib.WAD );

        uint _newSpotPrice = uint( _spotPrice ).fmul( deltaPow, FixedPointMathLib.WAD);

        if( _newSpotPrice > type( uint128 ).max ) return ( false, 0, 0, 0, 0);

        newSpotPrice = uint128( _newSpotPrice );

        uint buyPrice = uint( _spotPrice ).fmul( _delta, FixedPointMathLib.WAD );

        inputValue = buyPrice.fmul( 
            ( deltaPow - FixedPointMathLib.WAD ).fdiv( 
                _delta - FixedPointMathLib.WAD, FixedPointMathLib.WAD
            ), FixedPointMathLib.WAD);

        // update ( Fees )

        uint poolFee = inputValue.fmul( _poolFee, FixedPointMathLib.WAD );

        protocolFee = inputValue.fmul( _protocolFee, FixedPointMathLib.WAD );

        inputValue += ( protocolFee + poolFee );

        newSpotPrice = uint128( _newSpotPrice );

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
        ) 
    {
        if( _numItems == 0 ) return (false, 0, 0, 0, 0);

        uint invDelta = FixedPointMathLib.WAD.fdiv( _delta, FixedPointMathLib.WAD );

        uint invDeltaPow = invDelta.fpow( _numItems, FixedPointMathLib.WAD );

        // update ( this is a percentage )

        newSpotPrice = uint128(
            uint256( _spotPrice ).fmul( invDeltaPow, FixedPointMathLib.WAD )
        );

        if( newSpotPrice < MIN_PRICE ) newSpotPrice = MIN_PRICE;

        outputValue = uint256( _spotPrice ).fmul(
            ( FixedPointMathLib.WAD - invDeltaPow ).fdiv(
                FixedPointMathLib.WAD - invDelta,
                FixedPointMathLib.WAD
            ),
            FixedPointMathLib.WAD
        );

        // update ( Fees )

        uint poolFee = outputValue.fmul( _poolFee, FixedPointMathLib.WAD );

        protocolFee = outputValue.fmul( _protocolFee, FixedPointMathLib.WAD );

        outputValue -= ( protocolFee + poolFee );

        newDelta = _delta;

        isValid = true;
        
    }
    
}