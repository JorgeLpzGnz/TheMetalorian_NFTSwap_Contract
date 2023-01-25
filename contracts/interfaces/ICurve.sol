// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../curves/CurveErrors.sol";

interface ICurve {

    function validateSpotPrice( uint _spotPrice ) external pure returns( bool );

    function validateDelta( uint _delta ) external pure returns( bool );

    function getBuyInfo( uint128 _delta, uint128 _spotPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure 
        returns ( 
            CurveErrors.Error error, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 inputValue, 
            uint256 protocolFee 
        );

    function getSellInfo( uint128 _delta, uint128 _spotPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external pure
        returns ( 
            CurveErrors.Error error, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 outputValue, 
            uint256 protocolFee 
        );

}