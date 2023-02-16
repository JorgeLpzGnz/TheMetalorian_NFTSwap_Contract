// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../pools/MSPoolBasic.sol";
import "../pools/PoolTypes.sol";
import "./IMetaAlgorithm.sol";

interface IMetaFactory {

    function createPool( 
        address _nft, 
        uint[] memory _nftIds,
        uint128 _multiplier,
        uint128 _startPrice,
        address _recipient,
        uint128 _fee,
        IMetaAlgorithm _Algorithm, 
        PoolTypes.PoolType _poolType
        ) external payable  returns(
            MSPoolBasic pool
        );

    function getFactoryInfo() external view returns( uint128, uint128, address );

    function MAX_FEE_PERCENTAGE() external view returns( uint128);

    function PROTOCOL_FEE() external view returns( uint128);

    function PROTOCOL_FEE_RECIPIENT() external view returns( address );
    
}