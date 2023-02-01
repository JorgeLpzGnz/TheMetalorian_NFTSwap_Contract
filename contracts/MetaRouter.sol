// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./interfaces/IMSPair.sol";
import "hardhat/console.sol";

contract MetaRouter {

    struct SellNFTInfo {
        IMSPair pair;
        uint[] tokenIDs;
        uint minExpected;
    }

    struct BuyNFTInfo {
        IMSPair pair;
        uint[] tokenIDs;
        uint maxEspected;
    }

    struct BuyAnyNFTInfo {
        IMSPair pair;
        uint numNFTs;
        uint maxEspected;
    }

    // struct BulkSellNFTInfo {
    //     SellNFTInfo[] sellInfo;
    // }

    // struct BulkBuyNFTInfo {
    //     BuyNFTInfo[] buyInfo;
    // }

    // struct BulkBuyAnyNFTInfo {
    //     BuyAnyNFTInfo[] buyInfo;
    // }

    modifier checkDeadLine( uint _deadLine ) {

        require( _deadLine <= block.timestamp );

        _;

    }

    function swapNFTForToken( SellNFTInfo[] memory _swaps, uint _deadLine ) public payable checkDeadLine( _deadLine ) {

        _swapNFTForToken(_swaps);

    }

    function swapTokenForNFT( BuyNFTInfo[] memory _swaps, uint _deadLine ) public payable checkDeadLine( _deadLine ) {

        _swapTokenForNFT(_swaps);

    }

    function swapTokenForAnyNFT( BuyAnyNFTInfo[] memory _swaps, uint _deadLine ) public payable checkDeadLine( _deadLine ) {

        _swapTokenForAnyNFT(_swaps);
        
    }

    function _swapNFTForToken( SellNFTInfo[] memory _swaps ) private {

        for (uint256 i = 0; i < _swaps.length; i++) {

            // ( , , , uint outputValue, ) = _swaps[i].pair.getPoolSellInfo( _swaps[i].tokenIDs.length );

            // update ( minimum expected )

            _swaps[i].pair.swapNFTsForToken( _swaps[i].tokenIDs, _swaps[i].minExpected, msg.sender );

        }

    }

    function _swapTokenForNFT( BuyNFTInfo[] memory _swaps ) private {

        for (uint256 i = 0; i < _swaps.length; i++) {

            ( , , , uint inputValue, ) = _swaps[i].pair.getPoolBuyInfo( _swaps[i].tokenIDs.length );

            // update ( maximum expected )

            _swaps[i].pair.swapTokenForNFT{ value: inputValue }( _swaps[i].tokenIDs, _swaps[i].maxEspected , msg.sender );

        }
        
    }

    function _swapTokenForAnyNFT( BuyAnyNFTInfo[] memory _swaps ) private {

        for (uint256 i = 0; i < _swaps.length; i++) {

            ( , , , uint inputValue, ) = _swaps[i].pair.getPoolBuyInfo( _swaps[i].numNFTs );

            // update ( maximum expected )

            _swaps[i].pair.swapTokenForAnyNFT{ value: inputValue }( _swaps[i].numNFTs, _swaps[i].maxEspected , msg.sender );

        }
        
    }

}