// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../libraries/Arrays.sol";
import "./MSPoolBasic.sol";

/// @title MSPoolNFTBasic A basic ERC-721 pool template implementation
/// @author JorgeLpzGnz & CarlosMario714
/// @notice implementation based on IEP-1167
contract MSPoolNFTBasic is MSPoolBasic, IERC721Receiver {

    /// @notice a library to implement some array methods
    using Arrays for uint[];

    /// @notice An array to store the token IDs of the Pair NFTs
    uint[] private _TOKEN_IDS;

    /// @notice send NFTs to the given address
    /// @param _to address to send the NFTs
    /// @param _tokenIDs NFTs to send
    function _sendOutputNFTs( address _to, uint[] memory _tokenIDs ) internal override {

        IERC721 _NFT = IERC721( NFT );

        uint balanceBefore = _NFT.balanceOf( _to );

        for (uint256 i = 0; i < _tokenIDs.length; i++) {

            _NFT.safeTransferFrom( address( this ), _to, _tokenIDs[i]);

            uint tokenIndex = _TOKEN_IDS.indexOf( _tokenIDs[i] );

            _TOKEN_IDS.remove( tokenIndex );

        }

        uint balanceAfter = _NFT.balanceOf( _to );

        require(
            balanceBefore + _tokenIDs.length == balanceAfter,
            "NFTs not sended"
        );

    }

    /// @notice send NFTs from the pool to the given address
    /// @param _to address to send the NFTs
    /// @param _numNFTs the number of NFTs to send
    function _sendAnyOutNFTs( address _to, uint _numNFTs ) internal override {

        IERC721 _NFT = IERC721( NFT );

        uint[] memory NFTs = getNFTIds();

        uint balanceBefore = _NFT.balanceOf( _to );

        for (uint256 i = 0; i < _numNFTs; i++) {

            _NFT.safeTransferFrom( address( this ), _to, NFTs[i]);

            uint index = _TOKEN_IDS.indexOf( NFTs[i] );

            _TOKEN_IDS.remove( index );

        }

        uint balanceAfter = _NFT.balanceOf( _to );

        require(
            balanceBefore + _numNFTs == balanceAfter,
            "NFTs not sended"
        );

    }

    /// @notice ERC-721 Receiver implementation
    function onERC721Received(address, address, uint256 id, bytes calldata) external override returns (bytes4) {

        if( NFT == msg.sender ) _TOKEN_IDS.push(id);

        emit NFTDeposit( msg.sender, id );

        return IERC721Receiver.onERC721Received.selector;

    }

    /// @notice it returns the NFTs hold by the pool 
    function getNFTIds() public override view returns ( uint[] memory nftIds) {

        nftIds = _TOKEN_IDS;

    }

    /// @notice withdraw the balance NFTs
    /// @param _nft NFT collection to withdraw
    /// @param _nftIds NFTs to withdraw
    function withdrawNFTs( IERC721 _nft, uint[] memory _nftIds ) external override onlyOwner {

        IERC721 poolNFT = IERC721( NFT );

        if( _nft == poolNFT ){

            for (uint256 i = 0; i < _nftIds.length; i++) {

                poolNFT.safeTransferFrom( address( this ), owner(), _nftIds[i]);

                _TOKEN_IDS.remove( _TOKEN_IDS.indexOf(_nftIds[i]) );

            }

        } else {

            for (uint256 i = 0; i < _nftIds.length; i++) 

                _nft.safeTransferFrom( address( this ), owner(), _nftIds[i]);

        }

        emit NFTWithdrawal( owner(), _nftIds.length );

    }

}