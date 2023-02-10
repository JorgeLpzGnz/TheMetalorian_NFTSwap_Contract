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


contract MetaFactory is Ownable {

    using Clones for address;

    bytes4 constant ERC721_ENUMERABLE_INTERFACE_ID =
        type(IERC721Enumerable).interfaceId;

    bytes4 constant ERC721_INTERFACE_ID =
        type(IERC721).interfaceId;

    uint128 public MAX_FEE_PERCENTAGE = 0.9e18;

    uint128 public PROTOCOL_FEE = 0.01e18;

    address public PROTOCOL_FEE_RECIPIENT;

    MSPairNFTEnumerable public pairEnumTemplate;

    MSPairNFTBasic public pairNotEnumTemplate;

    mapping( address => bool ) isMSAlgorithm;

    event NewPair( address pair, address owner);

    event NewProtocolFee( uint128 newFee );

    event NewFeeRecipient( address newRecipient );

    event TokenWithdrawal( address owner, uint withdrawAmount );

    event NFTWithdrawal( address owner, uint AmountOfNFTs );

    event TokenDeposit( uint amount );

    event NFTDeposit( address nft, uint tokenID );

    event AlgorithmApproval( address algorithm, bool approval );

    constructor( address  _LinearAlgorithm, address _ExponentialAlgorithm, address _CPAlgorithm ) {

        isMSAlgorithm[_LinearAlgorithm] = true;

        isMSAlgorithm[_ExponentialAlgorithm] = true;

        isMSAlgorithm[_CPAlgorithm] = true;

        PROTOCOL_FEE_RECIPIENT = address( this );

        pairEnumTemplate = new MSPairNFTEnumerable();

        pairNotEnumTemplate = new MSPairNFTBasic();

    }

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

    function checkInitParams( PoolTypes.PoolType _poolType, uint128 _fee, address _recipient, uint128 _startPrice, uint128 _multiplier, IMetaAlgorithm _Algorithm ) public view returns( bool ) {

        if( _poolType == PoolTypes.PoolType.Sell || _poolType == PoolTypes.PoolType.Buy ) {

            if ( _fee != 0 ) return false;

        } else {

            if ( _recipient != address(0) || _fee > MAX_FEE_PERCENTAGE ) return false;

        }

        if ( !_Algorithm.validateStartPrice( _startPrice ) || !_Algorithm.validateMultiplier( _multiplier ) ) return false;

        return true;
        
    }

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

        if( _poolType == PoolTypes.PoolType.Trade || _poolType == PoolTypes.PoolType.Sell ) {

            ( bool isSended, ) = payable( address( pair ) ).call{ value: msg.value }("");

            require( isSended );
            
        }
        

        if( _poolType == PoolTypes.PoolType.Trade || _poolType == PoolTypes.PoolType.Buy ) {

            for (uint256 i = 0; i < _nftIds.length; i++) {

                IERC721( _nft ).safeTransferFrom( msg.sender, address( pair ), _nftIds[i]);

            }
            
        }

        emit NewPair( address( pair ), msg.sender );

    }

    function getFactoryInfo() public view returns( uint128, uint128, address ) {

        return ( MAX_FEE_PERCENTAGE, PROTOCOL_FEE, PROTOCOL_FEE_RECIPIENT );

    }

    function setProtocolFee( uint128 _newProtocolFee ) public onlyOwner {

        require( _newProtocolFee < MAX_FEE_PERCENTAGE, "new Fee exceeds limit" );

        require( PROTOCOL_FEE != _newProtocolFee, "new Fee can't be iqual than current" );

        PROTOCOL_FEE = _newProtocolFee;

        emit NewProtocolFee( _newProtocolFee );

    }

    function setProtocolFeeRecipient( address _newRecipient ) public onlyOwner {

        require( PROTOCOL_FEE_RECIPIENT != _newRecipient, "new recipient can't be iqual than current" );

        PROTOCOL_FEE_RECIPIENT = _newRecipient;

        emit NewFeeRecipient( _newRecipient );

    }

    function setAlgorithmApproval( address _algorithm, bool _approval) external onlyOwner {

        isMSAlgorithm[ _algorithm ] = _approval;

        emit AlgorithmApproval( _algorithm, _approval);

    }

    receive() external payable  {

        emit TokenDeposit( msg.value );

    }

    function withdrawETH() external onlyOwner {

        uint balance = address( this ).balance;

        require( balance > 0, "insufficient balance" );

        ( bool isSended, ) = owner().call{ value: balance }("");

        require( isSended, "transaction not sended" );

        emit TokenWithdrawal( owner(), balance );

    }

    function withdrawNFTs( address _nft, uint[] memory _nftIds ) external onlyOwner {

        for (uint256 i = 0; i < _nftIds.length; i++) {
            
            IERC721(_nft).safeTransferFrom( address( this ), owner(), _nftIds[ i ] );

        }

        emit NFTWithdrawal( owner(), _nftIds.length );

    }

}