// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../pairs/MSPairBasic.sol";
import "../pairs/PoolTypes.sol";
import "./ICurve.sol";

interface IMetaFactory {

    function createPair( 
        address _nft, 
        uint[] memory _nftIds,
        uint128 _delta,
        uint128 _spotPrice,
        address _rewardsRecipent,
        uint128 _fee,
        ICurve _curve, 
        PoolTypes.PoolType _poolType
        ) external payable  returns(
            MSPairBasic pair
        );

    function getFactoryInfo() external view returns( uint128, uint128, address );

    function MAX_FEE_PERCENTAGE() external view returns( uint128);

    function PROTOCOL_FEE() external view returns( uint128);

    function PROTOCOL_FEE_RECIPIENT() external view returns( address );
    
}