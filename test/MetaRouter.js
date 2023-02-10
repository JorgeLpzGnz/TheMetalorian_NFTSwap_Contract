// const {
//     loadFixture,
// } = require("@nomicfoundation/hardhat-network-helpers");
// const {
//     getNumber,
//     getTokenInput,
//     deployMetaFactory,
//     getTokenOutput,
//     roundNumber,
//     createPair,
//     createTradePoolsTypeLinear,
//     poolType
// } = require("../utils/tools" )
// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const { utils } = ethers
// const { parseEther } = utils
// const provider = ethers.provider

// describe("Meta router", function () {

//     describe("get Buy Info", () => {

//         // describe(" - Errors", () => {

//         //     it("1. should return false if pass invalid num of Items", async () => {

//         //         const { metaRouter, metaFactory } = await loadFixture(deployMetaFactory)

//         //     })

//         // })

//         describe(" - Functionalities", () => {

//             it("1. should return a input value and isValid must be true", async () => {

//                 const { metaRouter, metaFactory, nft, linearAlgorithm } = await loadFixture(deployMetaFactory)

//                 const { sellInfo } = await createTradePoolsTypeLinear( 10, metaFactory, nft, linearAlgorithm )

//                 const timeStamp = (await provider.getBlock()).timestamp

//                 console.log(timeStamp)

//                 await metaRouter.swapNFTForSell( sellInfo, timeStamp + 2 * 6000 )
                


//             })

//         })

//     })

// });
