// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "../pairs/PoolTypes.sol";
import "./ICurve.sol";

interface IMSPair {
    
    function getNFTIds() external view returns ( uint[] memory nftIds);

    function getPoolBuyInfo( uint _numNFTs) external view returns( bool isValid, uint128 newSpotPrice, uint128 newDelta, uint inputValue, uint protocolFee );

    function getPoolSellInfo( uint _numNFTs) external view returns( bool isValid, uint128 newSpotPrice, uint128 newDelta, uint outputValue, uint protocolFee );

    function getAssetsRecipient() external view returns ( address _assetsRecipient );

    function init(
        uint128 _delta, 
        uint128 _spotPrice, 
        address _assetsRecipient, 
        address _owner, 
        address _NFT, 
        uint128 _fee, 
        ICurve _curve, 
        PoolTypes.PoolType _poolType 
        ) external payable;

    function swapNFTsForToken( uint[] memory _tokenIDs, uint _minExpected, address _user ) external returns( uint256 outputAmount );

    function swapTokenForNFT( uint[] memory _tokenIDs, uint _maxEspectedIn, address _user ) external payable returns( uint256 inputAmount );

    function swapTokenForAnyNFT( uint _numNFTs, uint _maxEspectedIn, address _user ) external payable returns( uint256 inputAmount );

}