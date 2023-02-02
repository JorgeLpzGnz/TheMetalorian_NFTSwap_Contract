// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

contract PoolTypes {

    enum PoolType {
        Sell, // you can sell NFTs and get tokens
        Buy,   // you can buy NFTs with tokens
        Trade  // A pool that make both
    }
    
}