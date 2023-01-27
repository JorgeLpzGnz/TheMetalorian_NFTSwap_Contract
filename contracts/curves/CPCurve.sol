// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/FixedPointMathLib.sol";
import "../interfaces/ICurve.sol";
import "hardhat/console.sol";

contract CPCurve is ICurve, CurveErrors {

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
        ) 
    {
        // num Items should be > 0

        if (_numItems == 0) return ( false, 0, 0, 0, 0);

        uint tokenBalance = _spotPrice;

        uint nftBalance = _delta;

        uint numItems = _numItems * 1e18;

        // num Items should be < NFT balance ( delta = numItems  initial Price )

        if ( numItems >= nftBalance ) return ( false, 0, 0, 0, 0);

        // input value = ( tokenBalance * numItems ) / ( nftBalance - numItems )

        inputValue = tokenBalance.fmul( numItems, FixedPointMathLib.WAD ).fdiv( nftBalance - numItems , FixedPointMathLib.WAD );

        // update ( Fees )

        uint poolFee = inputValue.fmul( _poolFee, FixedPointMathLib.WAD );

        protocolFee = inputValue.fmul( _protocolFee, FixedPointMathLib.WAD );

        inputValue += ( protocolFee + poolFee );

        newSpotPrice = uint128( _spotPrice + inputValue );

        newDelta = uint128( nftBalance - numItems );

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
        if ( _numItems == 0) return (false, 0, 0, 0, 0);

        uint tokenBalance = _spotPrice;

        uint nftBalance = _delta;

        uint numItems = _numItems * 1e18;

        if ( numItems >= nftBalance ) return (false, 0, 0, 0, 0);

        outputValue = ( tokenBalance.fmul( numItems, FixedPointMathLib.WAD ) ).fdiv( nftBalance + numItems, FixedPointMathLib.WAD );

        // update ( Fees )

        uint poolFee = outputValue.fmul( _poolFee, FixedPointMathLib.WAD );

        protocolFee = outputValue.fmul( _protocolFee, FixedPointMathLib.WAD );

        outputValue -=  ( protocolFee + poolFee );

        newSpotPrice = uint128( _spotPrice - outputValue );

        newDelta = uint128( nftBalance + _numItems );

        isValid = true;

    }
    
}