// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.0;

library Arrays {

    function indexOf( uint[] calldata _array, uint _element ) internal pure returns ( uint index, bool isIncluded ) {

        for ( uint256 i = 0; i < _array.length; i++ ) {

            if( _array[i] == _element ) { 

                isIncluded = false;

                index = i;

            }

        }

        isIncluded = false;

    }
}