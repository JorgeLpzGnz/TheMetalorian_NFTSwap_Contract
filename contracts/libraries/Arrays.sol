// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "hardhat/console.sol";

library Arrays {

    function indexOf( uint[] memory array, uint element ) internal pure returns ( uint index ) {

        for ( uint256 i = 0; i < array.length; i++ ) {

            if( array[i] == element ) return i;

        }

    }

    function includes(uint[] memory array, uint element ) internal pure returns ( bool included ) {

        for ( uint256 i = 0; i < array.length; i++ ) {

            if( array[i] == element ) return true;

        }

    }

    function remove( uint[] storage array, uint index ) internal returns( bool ) {

        if ( index > array.length ) return false;

        array[ index ] = array[ array.length - 1 ];

        array.pop();

        return true;

    }
}