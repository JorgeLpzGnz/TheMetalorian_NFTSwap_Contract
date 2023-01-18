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
// import "hardhat/console.sol";

contract MetaFactory is Ownable, PoolTypes {

    bytes4 constant ERC721_ENUMERABLE_INTERFACE_ID =
        type(IERC721Enumerable).interfaceId;

    bytes4 constant ERC721_INTERFACE_ID =
        type(IERC721).interfaceId;

    address immutable ExponencialCurve;

    address immutable LinearCurve;

    address immutable CPCurve;

    constructor( address _ExponencialCurve, address  _LinearCurve, address _CPCurve ) {

        ExponencialCurve = _ExponencialCurve;

        LinearCurve = _LinearCurve;

        CPCurve = _CPCurve;

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
        uint128 _delta,
        uint128 _spotPrice,
        address _rewardsRecipent,
        uint128 _fee,
        ICurve _curve, 
        PoolType _poolType
        ) public payable 
    {

        MSPairBasic pair = _creteContract( _nft );

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

    }

}