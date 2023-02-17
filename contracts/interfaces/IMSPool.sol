// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "../pools/PoolTypes.sol";
import "./IMetaAlgorithm.sol";

/// @title IMSPool a interface to call pool functions
/// @dev Pools are a IEP-1167 implementation ( minimal proxies - clones )
interface IMSPool {
    
    /// @notice returns the the NFT IDs of the pool
    /// @dev in the buy pools this will be empty because the NFTs are pull
    /// on the recipient indicated for the user
    function getNFTIds() external view returns ( uint[] memory nftIds);

    /// @notice returns the current Buy info
    /// @param _numNFTs Number of NFTs to buy
    /// @return isValid true if trade is operable
    /// @return newStartPrice new Start price that will be set 
    /// @return newMultiplier new multiplier that will be set 
    /// @return inputValue Amount of tokens to send to the pool 
    /// @return protocolFee Amount charged for the trade
    function getPoolBuyInfo( uint _numNFTs) external view returns( bool isValid, uint128 newStartPrice, uint128 newMultiplier, uint inputValue, uint protocolFee );

    /// @notice returns the current Sell info
    /// @param _numNFTs Number of NFTs to buy
    /// @return isValid true if trade is operable
    /// @return newStartPrice new Start price that will be set 
    /// @return newMultiplier new multiplier that will be set 
    /// @return outputValue Amount that will be send to the user
    /// @return protocolFee Amount charged for the trade
    function getPoolSellInfo( uint _numNFTs) external view returns( bool isValid, uint128 newStartPrice, uint128 newMultiplier, uint outputValue, uint protocolFee );

    /// @return _recipient Recipient of the input assets
    function getAssetsRecipient() external view returns ( address _recipient );

    /// @return algorithmName Name of the algorithm used to calculate trade prices
    function getAlgorithm() external view returns( string memory );

    /// @notice returns the pool info
    /// @return poolMultiplier Current multiplier
    /// @return poolStartPrice Current start price 
    /// @return poolTradeFee Trade fee multiplier 
    /// @return poolNft NFT trade collection
    /// @return poolPoolType The type of the pool
    /// @return poolAlgorithm Name of the algorithm
    /// @return poolNFTs NFTs of the pool
    function getPoolInfo() external view returns( 
        uint128 poolMultiplier,
        uint128 poolStartPrice,
        uint128 poolTradeFee,
        address poolNft,
        PoolTypes.PoolType poolPoolType,
        string memory poolAlgorithm,
        uint[] memory poolNFTs);

    /// @notice Function called when the pool is created
    /// @param _multiplier Multiplier to calculate the price
    /// @param _startPrice Start price to calculate the price 
    /// @param _recipient Recipient od the input assets ( not available on trade pools )
    /// @param _owner Owner of the pool 
    /// @param _NFT NFT trade collection
    /// @param _fee Fee multiplier to calculate pool fees ( available on trade pool )
    /// @param _Algorithm Address of the algorithm 
    /// @param _poolType Type of the pool
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

    /// @notice Sell NFTs and get Tokens
    /// @param _tokenIDs NFTs to trade
    /// @param _minExpected Minimum expected to return to the user
    /// @param _user Address to send the tokens
    function swapNFTsForToken( uint[] memory _tokenIDs, uint _minExpected, address _user ) external returns( uint256 outputAmount );

    /// @notice Buy NFTs and deposit tokens
    /// @param _tokenIDs NFTs to trade
    /// @param _maxExpectedIn maximum expected cost to buy the NFTs
    /// @param _user Address to send the tokens
    function swapTokenForNFT( uint[] memory _tokenIDs, uint _maxExpectedIn, address _user ) external payable returns( uint256 inputAmount );

    /// @notice Buy NFTs and deposit tokens ( used when doesn't care NFTs to send to the user )
    /// @param _numNFTs Number of NFTs to buy
    /// @param _maxExpectedIn maximum expected cost to buy the NFTs
    /// @param _user Address to send the tokens
    function swapTokenForAnyNFT( uint _numNFTs, uint _maxExpectedIn, address _user ) external payable returns( uint256 inputAmount );

}