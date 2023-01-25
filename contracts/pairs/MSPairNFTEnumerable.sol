// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./MSPairBasic.sol";

contract MSPairNFTEnumerable is MSPairBasic, IERC721Receiver {

    function getNFTIds() public view override returns ( uint[] memory nftIds) {

        ERC721Enumerable _NFT = ERC721Enumerable( NFT );

        uint lastIndex = _NFT.balanceOf( address( this ) ) - 1;

        uint[] memory _nftIds = new uint[](lastIndex);

        for (uint256 i = 0; i < lastIndex; i++) {
            
            _nftIds[i] = _NFT.tokenOfOwnerByIndex( address( this ), i);

        }

        nftIds = _nftIds;

    }

    function _sendNFTsTo( address _from, address _to, uint[] calldata _tokenIDs ) internal override {

        IERC721 _NFT = IERC721( NFT );

        for (uint256 i = 0; i < _tokenIDs.length; i++) {

            _NFT.safeTransferFrom(_from, _to, _tokenIDs[i]);

        }

    }

    function _sendAnyOutNFTs( address _to, uint _numNFTs ) internal override {

        IERC721 _NFT = IERC721( NFT );

        uint[] memory _tokenIds = getNFTIds();

        for (uint256 i = 0; i < _numNFTs - 1; i++) {

            _NFT.safeTransferFrom( address( this ), _to, _tokenIds[i]);

        }

    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {

        return IERC721Receiver.onERC721Received.selector;

    }

    function withdrawNFTs( IERC721 _nft, uint[] memory _nftIds ) external override onlyOwner {

        for (uint256 i = 0; i < _nftIds.length; i++) 
        
            _nft.safeTransferFrom( address( this ), owner(), _nftIds[i]);

    }
            

}