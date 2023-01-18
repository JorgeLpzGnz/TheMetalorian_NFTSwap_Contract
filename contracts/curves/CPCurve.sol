// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ICurve.sol";
import "./CurveErrors.sol";

contract CPCurve is ICurve, CurveErrors {

    function validateSpotPrice( uint ) external pure override returns( bool ) {

        return true;

    }

    function validateDelta( uint ) external pure override returns( bool ) {        

        return true;

    }

    function getBuyInfo( uint128 _delta, uint128 _spotPrice, uint _numItems ) external pure override 
        returns ( 
            Error error, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 inputValue, 
            uint256 protocolFee 
        ) 
    {

        if (_numItems == 0) return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint tokenBalance = _spotPrice;

        uint nftBalance = _delta;

        if ( _numItems >= nftBalance ) return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint inputWithoutFee = ( _numItems * tokenBalance ) / ( nftBalance - _numItems);

        // update ( Fees )

        inputValue = inputWithoutFee;

        newSpotPrice = uint128( _spotPrice + inputWithoutFee );

        newDelta = uint128( nftBalance - _numItems );

        error = Error.OK;

    }

    function getSellInfo( uint128 _delta, uint128 _spotPrice, uint _numItems ) external pure override 
        returns ( 
            Error error, 
            uint128 newSpotPrice, 
            uint128 newDelta, 
            uint256 outputValue, 
            uint256 protocolFee 
        ) 
    {
        if ( _numItems == 0) return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint tokenBalance = _spotPrice;

        uint nftBalance = _delta;

        if ( _numItems >= nftBalance ) return (Error.INVALID_NUMITEMS, 0, 0, 0, 0);

        uint outputWithoutFee = ( _numItems * tokenBalance ) / ( nftBalance + _numItems);

        // update ( Fees )

        outputValue = outputWithoutFee;

        newSpotPrice = uint128( _spotPrice - outputWithoutFee );

        newDelta = uint128( nftBalance + _numItems );

        error = Error.OK;

    }
    
}