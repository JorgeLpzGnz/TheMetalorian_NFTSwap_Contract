// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./pairs/MSPairBasic.sol";
import "./pairs/MSPairNFTEnumerable.sol";
import "./pairs/MSPairNFTBasic.sol";
import "./pairs/PoolTypes.sol";


/// @title MetaFactory a contract factory for NFT / ETH liquidity Pools
/// @notice Factory that creates minimal proxies based on the IEP-1167
/// @dev All the used in this protocol is on base 18 ( 1e18 )
contract MetaFactory is Ownable {

    /// @notice Using Clones library from Openzeppelin
    using Clones for address;

    /// @notice ERC721 Enumerable interface ID
    bytes4 constant ERC721_ENUMERABLE_INTERFACE_ID =
        type(IERC721Enumerable).interfaceId;

    /// @notice ERC721 interface ID
    bytes4 constant ERC721_INTERFACE_ID =
        type(IERC721).interfaceId;

    /// @notice Maximum percentage allowed for fees
    uint128 public constant MAX_FEE_PERCENTAGE = 0.9e18;

    /// @notice The fee charged per swap in the protocol
    uint128 public PROTOCOL_FEE = 0.01e18;

    /// @notice recipient that receives the fees
    address public PROTOCOL_FEE_RECIPIENT;

    /// @dev Templates used to create the clone pairs

    /// @notice Pair Template using ERC-721 Enumerable 
    MSPairNFTEnumerable public pairEnumTemplate;

    /// @notice Pair Template using ERC-721
    MSPairNFTBasic public pairNotEnumTemplate;

    /// @notice Algorithms allowed to calculate pair prices
    mapping( address => bool ) isMSAlgorithm;

    /// @notice Routers allowed
    mapping( address => bool ) isMSRouter;

    /*************************************************************************/
    /******************************* EVENTS **********************************/

    /// @param pair New pair created
    /// @param owner Owner of the respective pair
    event NewPair( address pair, address indexed owner);

    /// @param newFee New fee charged per swap 
    event NewProtocolFee( uint128 newFee );

    /// @param newRecipient Address that receives the protocol fees
    event NewFeeRecipient( address newRecipient );

    /// @param owner Protocol Owner
    /// @param withdrawAmount Amount to withdraw
    event TokenWithdrawal( address indexed owner, uint withdrawAmount );

    /// @param owner Protocol Owner
    /// @param AmountOfNFTs Amount of NFTs withdrawal
    event NFTWithdrawal( address indexed owner, uint AmountOfNFTs );

    /// @param amount Amount of ETH deposit
    event TokenDeposit( uint amount );

    /// @param nft NFT collection address
    /// @param tokenID ID of the deposited NFT
    event NFTDeposit( address nft, uint tokenID );

    /// @param algorithm algorithm to establish approval 
    /// @param approval algorithm approval 
    event AlgorithmApproval( address algorithm, bool approval );

    /*************************************************************************/
    /**************************** CONSTRUCTOR ********************************/

    /// @notice Params are the initial allowed price Algorithms
    constructor( address  _LinearAlgorithm, address _ExponentialAlgorithm, address _CPAlgorithm ) {

        isMSAlgorithm[_LinearAlgorithm] = true;

        isMSAlgorithm[_ExponentialAlgorithm] = true;

        isMSAlgorithm[_CPAlgorithm] = true;

        PROTOCOL_FEE_RECIPIENT = address( this );

        /// deploy Clone Templates

        pairEnumTemplate = new MSPairNFTEnumerable();

        pairNotEnumTemplate = new MSPairNFTBasic();

    }

    /*************************************************************************/
    /*************************** CREATION UTILS ******************************/

    /// @notice function used to create the new pairs
    /// @notice the NFT must be a ERC-721 or ERC-721 Enumerable
    /// @param _nft the NFT to init the pool ( this can not be changed after init )
    function _creteContract( address _nft ) private returns( MSPairBasic _newPair ) {

        bool isEnumerable =
            IERC165( _nft )
            .supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID);

        bool isBasic =
            IERC165( _nft )
            .supportsInterface(ERC721_INTERFACE_ID);

        require( isEnumerable || isBasic );

        address implementation = isEnumerable
            ? address( pairEnumTemplate )
            : address( pairNotEnumTemplate );

        _newPair = MSPairBasic( payable( implementation.clone() ) );

    }

    /// @notice verifies that the initialization parameters are correct
    /// @param _poolType The pool type of the new Pair
    /// @param _fee The fees charged per swap on that pool ( available only on trade pools )
    /// @param _poolType The pool type of the new Pair
    /// @param _recipient The recipient of the swap assets ( not available on trade pools )
    /// @param _startPrice the start price of the Pool ( depending of the algorithm this will take at different ways )
    /// @param _multiplier The price multiplier ( depending of the algorithm this will take at different ways )
    /// @param _Algorithm algorithm that determines the prices
    function checkInitParams( PoolTypes.PoolType _poolType, uint128 _fee, address _recipient, uint128 _startPrice, uint128 _multiplier, IMetaAlgorithm _Algorithm ) public pure returns( bool ) {

        if( _poolType == PoolTypes.PoolType.Sell || _poolType == PoolTypes.PoolType.Buy ) {

            if ( _fee != 0 ) return false;

        } else {

            if ( _recipient != address(0) || _fee > MAX_FEE_PERCENTAGE ) return false;

        }

        if ( !_Algorithm.validateStartPrice( _startPrice ) || !_Algorithm.validateMultiplier( _multiplier ) ) return false;

        return true;
        
    }

    /*************************************************************************/
    /*************************** CREATE FUNCTION *****************************/


    /// @notice verifies that the initialization parameters are correct
    /// @param _nft the NFT to init the pool ( this can not be changed after init )
    /// @param _nftIds The NFTs to pull in the pair ( in case of sell pool this must be empty )
    /// @param _multiplier The price multiplier ( depending of the algorithm this will take at different ways )
    /// @param _startPrice the start price of the Pool ( depending of the algorithm this will take at different ways )
    /// @param _recipient The recipient of the swap assets ( not available on trade pools )
    /// @param _fee The fees charged per swap on that pool ( available only on trade pools )
    /// @param _Algorithm algorithm that determines the prices
    /// @param _poolType The pool type of the new Pair
    function createPair( 
        address _nft, 
        uint[] calldata _nftIds,
        uint128 _multiplier,
        uint128 _startPrice,
        address _recipient,
        uint128 _fee,
        IMetaAlgorithm _Algorithm, 
        PoolTypes.PoolType _poolType
        ) public payable  returns(
            MSPairBasic pair
        )
    {

        require( isMSAlgorithm[ address(_Algorithm) ], "invalid Algorithm");

        require( checkInitParams( _poolType, _fee, _recipient, _startPrice, _multiplier, _Algorithm ), "invalid init params" );

        pair = _creteContract( _nft );

        pair.init(
            _multiplier, 
            _startPrice, 
            _recipient,
            msg.sender, 
            _nft, 
            _fee, 
            _Algorithm, 
            _poolType
        );

        // Transfer ETH To the pool 

        if( _poolType == PoolTypes.PoolType.Trade || _poolType == PoolTypes.PoolType.Sell ) {

            ( bool isSended, ) = payable( address( pair ) ).call{ value: msg.value }("");

            require( isSended );
            
        }

        // Transfer NFTs To the pool 

        if( _poolType == PoolTypes.PoolType.Trade || _poolType == PoolTypes.PoolType.Buy ) {

            for (uint256 i = 0; i < _nftIds.length; i++) {

                IERC721( _nft ).safeTransferFrom( msg.sender, address( pair ), _nftIds[i]);

            }
            
        }

        emit NewPair( address( pair ), msg.sender );

    }

    /// @notice Get current pool info
    /// @return MAX_FEE_PERCENTAGE The maximum percentage fee per swap
    /// @return PROTOCOL_FEE Current protocol fee charged per swap
    /// @return PROTOCOL_FEE_RECIPIENT The recipient of the fees
    function getFactoryInfo() public view returns( uint128, uint128, address ) {

        return ( MAX_FEE_PERCENTAGE, PROTOCOL_FEE, PROTOCOL_FEE_RECIPIENT );

    }

    /// @notice Set a new protocol Fee
    /// @param _newProtocolFee A new protocol Fee
    function setProtocolFee( uint128 _newProtocolFee ) public onlyOwner {

        require( _newProtocolFee < MAX_FEE_PERCENTAGE, "new Fee exceeds limit" );

        require( PROTOCOL_FEE != _newProtocolFee, "new fee cannot be the same as the previous one" );

        PROTOCOL_FEE = _newProtocolFee;

        emit NewProtocolFee( _newProtocolFee );

    }

    /// @notice Set a new protocol Recipient
    /// @param _newRecipient A new protocol Fee
    function setProtocolFeeRecipient( address _newRecipient ) public onlyOwner {

        require( PROTOCOL_FEE_RECIPIENT != _newRecipient, "new fee cannot be the same as the previous one" );

        PROTOCOL_FEE_RECIPIENT = _newRecipient;

        emit NewFeeRecipient( _newRecipient );

    }

    /// @notice Set approval for a price Algorithm
    /// @param _algorithm Algorithm to set approval
    /// @param _approval Approval to set
    function setAlgorithmApproval( address _algorithm, bool _approval) external onlyOwner {

        isMSAlgorithm[ _algorithm ] = _approval;

        emit AlgorithmApproval( _algorithm, _approval);

    }

    /// @notice Allows the contract to receive ETH ( the swap fees )
    receive() external payable  {

        emit TokenDeposit( msg.value );

    }

    /// @notice withdraw the ETH balance of the contract
    function withdrawETH() external onlyOwner {

        uint balance = address( this ).balance;

        require( balance > 0, "insufficient balance" );

        ( bool isSended, ) = owner().call{ value: balance }("");

        require( isSended, "transaction not sended" );

        emit TokenWithdrawal( owner(), balance );

    }

    /// @notice withdraw deposited NFTs
    /// @param _nft address of the collection to withdraw
    /// @param _nftIds the NFTs to withdraw
    function withdrawNFTs( address _nft, uint[] memory _nftIds ) external onlyOwner {

        for (uint256 i = 0; i < _nftIds.length; i++) {
            
            IERC721(_nft).safeTransferFrom( address( this ), owner(), _nftIds[ i ] );

        }

        emit NFTWithdrawal( owner(), _nftIds.length );

    }

}