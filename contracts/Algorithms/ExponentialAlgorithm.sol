// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/FixedPointMathLib.sol";
import "../interfaces/IMetaAlgorithm.sol";

contract ExponentialAlgorithm is IMetaAlgorithm, AlgorithmErrors {

    using FixedPointMathLib for uint256;

    uint32 public constant MIN_PRICE = 1 gwei; 

    uint public constant MIN_DELTA = 1e18; 

    function validateStartPrice( uint _startPrice ) external pure override returns( bool ) {

        return _startPrice >= MIN_PRICE;

    }

    function validateDelta( uint _multiplier ) external pure override returns( bool ) {

        return _multiplier > MIN_DELTA;

    }

    function getBuyInfo( uint128 _multiplier, uint128 _startPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure override
        returns ( 
            bool isValid, 
            uint128 newStartPrice, 
            uint128 newDelta, 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        if( _numItems == 0 ) return (false, 0, 0, 0, 0);

        uint multiplierPow = uint( _multiplier ).fpow( _numItems, FixedPointMathLib.WAD );

        uint _newStartPrice = uint( _startPrice ).fmul( multiplierPow, FixedPointMathLib.WAD);

        if( _newStartPrice > type( uint128 ).max ) return ( false, 0, 0, 0, 0);

        newStartPrice = uint128( _newStartPrice );

        uint buyPrice = uint( _startPrice ).fmul( _multiplier, FixedPointMathLib.WAD );

        inputValue = buyPrice.fmul( 
            ( multiplierPow - FixedPointMathLib.WAD ).fdiv( 
                _multiplier - FixedPointMathLib.WAD, FixedPointMathLib.WAD
            ), FixedPointMathLib.WAD);

        // update ( Fees )

        uint poolFee = inputValue.fmul( _poolFee, FixedPointMathLib.WAD );

        protocolFee = inputValue.fmul( _protocolFee, FixedPointMathLib.WAD );

        inputValue += ( protocolFee + poolFee );

        newStartPrice = uint128( _newStartPrice );

        newDelta = _multiplier;

        isValid = true;

    }

    function getSellInfo( uint128 _multiplier, uint128 _startPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure override 
        returns ( 
            bool isValid, 
            uint128 newStartPrice, 
            uint128 newDelta, 
            uint256 outputValue, 
            uint256 protocolFee 
        ) 
    {
        if( _numItems == 0 ) return (false, 0, 0, 0, 0);

        uint invDelta = FixedPointMathLib.WAD.fdiv( _multiplier, FixedPointMathLib.WAD );

        uint invDeltaPow = invDelta.fpow( _numItems, FixedPointMathLib.WAD );

        // update ( this is a percentage )

        newStartPrice = uint128(
            uint256( _startPrice ).fmul( invDeltaPow, FixedPointMathLib.WAD )
        );

        if( newStartPrice < MIN_PRICE ) newStartPrice = MIN_PRICE;

        outputValue = uint256( _startPrice ).fmul(
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

        newDelta = _multiplier;

        isValid = true;
        
    }
    
}