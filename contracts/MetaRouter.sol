// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "./interfaces/IMSPair.sol";
import "hardhat/console.sol";

contract MetaRouter {

    struct SellNFTInfo {
        IMSPair pair;
        uint[] tokenIDs;
    }

    struct BuyNFTInfo {
        IMSPair pair;
        uint[] tokenIDs;
    }

    struct BuyAnyNFTInfo {
        IMSPair pair;
        uint numNFTs;
    }

    struct SwapNFTToNFT {
        SellNFTInfo[] sellInfo;
        BuyNFTInfo[] buyInfo;
    }

    struct SwapNFTToAnyNFT {
        SellNFTInfo[] sellInfo;
        BuyAnyNFTInfo[] buyInfo;
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

    function swapNFTForSell( SellNFTInfo[] memory _swaps, uint _deadLine ) public payable checkDeadLine( _deadLine ) {

        _swapNFTForSell(_swaps);

    }

    function swapSellForNFT( BuyNFTInfo[] memory _swaps, uint _deadLine ) public payable checkDeadLine( _deadLine ) {

        _swapSellForNFT(_swaps, msg.value);

    }

    function swapSellForAnyNFT( BuyAnyNFTInfo[] memory _swaps, uint _deadLine ) public payable checkDeadLine( _deadLine ) {

        _swapSellForAnyNFT( _swaps, msg.value );
        
    }

    function swapNFTforNFT( SwapNFTToNFT memory _swaps, uint _deadLine ) public payable checkDeadLine( _deadLine ) {

        uint totalOutput = _swapNFTForSell( _swaps.sellInfo );

        totalOutput += msg.value;

        _swapSellForNFT( _swaps.buyInfo, totalOutput );

    }

    function _swapNFTForSell( SellNFTInfo[] memory _swaps ) private returns ( uint totalOutput ) {

        for (uint256 i = 0; i < _swaps.length; i++) {

            // ( , , , uint outputValue, ) = _swaps[i].pair.getPoolSellInfo( _swaps[i].tokenIDs.length );

            // update ( minimum expected )

            totalOutput += _swaps[i].pair.swapNFTsForSell( _swaps[i].tokenIDs, 0, msg.sender );

        }

    }

    function _swapSellForNFT( BuyNFTInfo[] memory _swaps, uint _inputValue ) private returns ( uint inputValue ) {

        uint reminingAmount = _inputValue;

        for (uint256 i = 0; i < _swaps.length; i++) {

            ( , , , inputValue, ) = _swaps[i].pair.getPoolBuyInfo( _swaps[i].tokenIDs.length );

            // update ( maximum expected )

            reminingAmount -= _swaps[i].pair.swapSellForNFT{ value: inputValue }( _swaps[i].tokenIDs, reminingAmount , msg.sender );

        }

        if( reminingAmount > 0) require( payable( msg.sender ).send( reminingAmount ));
        
    }

    function _swapSellForAnyNFT( BuyAnyNFTInfo[] memory _swaps, uint _inputValue ) private returns ( uint inputValue ) {

        uint reminingAmount = _inputValue;

        for (uint256 i = 0; i < _swaps.length; i++) {

            ( , , , inputValue, ) = _swaps[i].pair.getPoolBuyInfo( _swaps[i].numNFTs );

            // update ( maximum expected )

            reminingAmount -= _swaps[i].pair.swapSellForAnyNFT{ value: inputValue }( _swaps[i].numNFTs, reminingAmount , msg.sender );

        }

        if( reminingAmount > 0) require( payable( msg.sender ).send( reminingAmount ));
        
    }

}