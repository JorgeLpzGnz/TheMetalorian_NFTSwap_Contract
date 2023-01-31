// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// import "hardhat/console.sol";

contract NFTEnumerable is ERC721, ERC721Enumerable {

    using Counters for Counters.Counter;

    Counters.Counter public tokenIdCounter;

    uint public mintCost = 0;

    constructor() ERC721("NFTEnumerable", "NFTE") {

        tokenIdCounter.increment();
            
    }

    function safeMint( uint _numItems ) public {

        for (uint256 i = 0; i < _numItems; i++) {

            uint256 tokenId = tokenIdCounter.current();

            _safeMint( msg.sender, tokenId);

            tokenIdCounter.increment();
            
        }
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}