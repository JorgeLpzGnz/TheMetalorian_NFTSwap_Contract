// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./MSPairBasic.sol";

contract MSPairNFTEnumerable is MSPairBasic {

    function getNFTIds() public view override returns ( uint[] memory nftIds) {

        ERC721Enumerable _NFT = ERC721Enumerable( NFT );

        uint lastIndex = _NFT.balanceOf( address( this ) ) - 1;

        uint[] memory _nftIds = new uint[](lastIndex);

        for (uint256 i = 0; i < lastIndex; i++) {
            
            _nftIds[i] = _NFT.tokenOfOwnerByIndex( address( this ), i);

        }

        nftIds = _nftIds;

    }

}