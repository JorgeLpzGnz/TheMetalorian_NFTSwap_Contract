// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CurveErrors {
    enum Error {
        OK, // No error
        INVALID_NUMITEMS, // The numItem value is 0
        SPOT_PRICE_OVERFLOW // The updated spot price doesn't fit into 128 bits
    }
}