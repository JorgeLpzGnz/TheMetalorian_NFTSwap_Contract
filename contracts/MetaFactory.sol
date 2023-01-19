// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./pairs/MSPairBasic.sol";
import "./pairs/MSPairNFTEnumerable.sol";
import "./pairs/MSPairNFTBasic.sol";
import "./pairs/PoolTypes.sol";

contract MetaFactory is Ownable {

    bytes4 constant ERC721_ENUMERABLE_INTERFACE_ID =
        type(IERC721Enumerable).interfaceId;

    bytes4 constant ERC721_INTERFACE_ID =
        type(IERC721).interfaceId;

    uint128 public MAX_FEE_PERCENTAGE = 0.9e18;

    uint128 public PROTOCOL_FEE = 0.01e18;

    address public PROTOCOL_FEE_RECIPIENT;

    mapping( address => bool ) isMSCurve;

    event NewPair( address pair, address owner);

    constructor( address  _LinearCurve, address _ExponencialCurve, address _CPCurve ) {

        isMSCurve[_LinearCurve] = true;

        isMSCurve[_ExponencialCurve] = true;

        isMSCurve[_CPCurve] = true;

        PROTOCOL_FEE_RECIPIENT = address( this );

    }

    function _creteContract( address _nft ) private returns( MSPairBasic _newPair ) {

        bool isEnumerable =
            IERC165( _nft )
            .supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID);

        bool isBasic =
            IERC165( _nft )
            .supportsInterface(ERC721_INTERFACE_ID);

        require( isEnumerable || isBasic );

        if( isEnumerable ) _newPair = MSPairBasic( new MSPairNFTEnumerable());

        if( isBasic ) _newPair = MSPairBasic( new MSPairNFTBasic());

    }

    function createPair( 
        address _nft, 
        uint[] calldata _nftIds,
        uint128 _delta,
        uint128 _spotPrice,
        address _rewardsRecipent,
        uint128 _fee,
        ICurve _curve, 
        PoolTypes.PoolType _poolType
        ) public payable  returns(
            MSPairBasic pair
        )
    {

        require( isMSCurve[ address(_curve) ], "invalid curve");

        pair = _creteContract( _nft );

        pair.initialize(
            _delta, 
            _spotPrice, 
            _rewardsRecipent, 
            msg.sender, 
            _fee, 
            _curve, 
            _nft, 
            _poolType
        );

        if( _poolType == PoolTypes.PoolType.Trade || _poolType == PoolTypes.PoolType.Token ) {

            ( bool isSended, ) = payable( address( pair ) ).call{ value: msg.value }("");

            require( isSended );
        }
        

        if( _poolType == PoolTypes.PoolType.Trade || _poolType == PoolTypes.PoolType.NFT ) {

            for (uint256 i = 0; i < _nftIds.length; i++) {

                IERC721( _nft ).safeTransferFrom( msg.sender, address( pair ), _nftIds[i]);

            }
            
        }

        emit NewPair( address( pair ), msg.sender );

    }

    function setProtocolFee( uint128 _newProtocolFee ) public onlyOwner {

        require( _newProtocolFee < MAX_FEE_PERCENTAGE );

        PROTOCOL_FEE = _newProtocolFee;

    }

    function setProtocolFeeRecipient( address _newRecipient ) public onlyOwner {

        PROTOCOL_FEE_RECIPIENT = _newRecipient;

    }

    function withdrawETH() external onlyOwner {

        uint balance = address( this ).balance;

        require( balance > 0, "insufficent balance" );

        ( bool isSended, ) = owner().call{ value: balance }("");

        require( isSended, "transaction not sended" );

    }

    function withdrawNFTs( address _nft, uint[] memory _nftIds ) external onlyOwner {

        for (uint256 i = 0; i < _nftIds.length; i++) {
            
            IERC721(_nft).safeTransferFrom( address( this ), owner(), _nftIds[ i ] );

        }

    }

    function getFactoryInfo() public view returns( uint128, uint128, address ) {

        return ( MAX_FEE_PERCENTAGE, PROTOCOL_FEE, PROTOCOL_FEE_RECIPIENT );

    }

    receive() external payable  {}

}