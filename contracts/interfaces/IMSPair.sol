// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "../pairs/PoolTypes.sol";
import "./IMetaAlgorithm.sol";

interface IMSPair {
    
    function getNFTIds() external view returns ( uint[] memory nftIds);

    function getPoolBuyInfo( uint _numNFTs) external view returns( bool isValid, uint128 newStartPrice, uint128 newMultiplier, uint inputValue, uint protocolFee );

    function getPoolSellInfo( uint _numNFTs) external view returns( bool isValid, uint128 newStartPrice, uint128 newMultiplier, uint outputValue, uint protocolFee );

    function getAssetsRecipient() external view returns ( address _recipient );

    function init(
        uint128 _multiplier, 
        uint128 _startPrice, 
        address _recipient, 
        address _owner, 
        address _NFT, 
        uint128 _fee, 
        IMetaAlgorithm _Algorithm, 
        PoolTypes.PoolType _poolType 
        ) external payable;

    function swapNFTsForSell( uint[] memory _tokenIDs, uint _minExpected, address _user ) external returns( uint256 outputAmount );

    function swapSellForNFT( uint[] memory _tokenIDs, uint _maxExpectedIn, address _user ) external payable returns( uint256 inputAmount );

    function swapSellForAnyNFT( uint _numNFTs, uint _maxExpectedIn, address _user ) external payable returns( uint256 inputAmount );

}