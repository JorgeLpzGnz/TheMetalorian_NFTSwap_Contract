// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../Algorithms/AlgorithmErrors.sol";

interface IMetaAlgorithm {

    function name() external pure returns( string memory );

    function validateStartPrice( uint _startPrice ) external pure returns( bool );

    function validateMultiplier( uint _multiplier ) external pure returns( bool );

    function getBuyInfo( uint128 _multiplier, uint128 _startPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external view 
        returns ( 
            bool isValid, 
            uint128 newStartPrice, 
            uint128 newMultiplier, 
            uint256 inputValue, 
            uint256 protocolFee 
        );

    function getSellInfo( uint128 _multiplier, uint128 _startPrice, uint _numItems, uint128 _protocolFee, uint128 _poolFee ) external view
        returns ( 
            bool isValid, 
            uint128 newStartPrice, 
            uint128 newMultiplier, 
            uint256 outputValue, 
            uint256 protocolFee 
        );

}