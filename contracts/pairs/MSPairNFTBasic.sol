// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MSPairBasic.sol";

contract MSPairNFTBasic is MSPairBasic {

    uint[] public TOKEN_IDS;

    function getNFTIds() public view override returns ( uint[] memory nftIds) {

        nftIds = TOKEN_IDS;

    }

}