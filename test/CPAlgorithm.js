// const {
//     loadFixture,
// } = require("@nomicfoundation/hardhat-network-helpers");
// const {
//     getNumber,
//     getTokenInput,
//     deployMetaFactory,
//     getTokenOutput,
//     roundNumber
// } = require("../utils/tools" )
// const { expect } = require("chai");
// const { ethers } = require("hardhat");
// const { utils } = ethers
// const { parseEther } = utils

// describe("Constant Product Algorithm", function () {

//     describe("name", () => {

//         describe(" - Functionalities", () => {

//             it("1. should return algorithm name", async () => {

//                 const { cPAlgorithm } = await loadFixture(deployMetaFactory)

//                 expect( await cPAlgorithm.name() ).to.be.equal( "Constant Product" )

//             })

//         })

//     })

//     describe("validate Start Price", () => {

//         describe(" - Functionalities", () => {

//             it("1. should always return true", async () => {

//                 const { cPAlgorithm } = await loadFixture(deployMetaFactory)

//                 // all values are valid

//                 expect( await cPAlgorithm.validateStartPrice(
//                     parseEther(
//                         `${Math.round( Math.random() * 1000 )}`
//                     )
//                 ) ).to.be.true

//             })

//         })

//     })

//     describe("validate Multiplier", () => {

//         describe(" - Functionalities", () => {

//             it("1. should always return true", async () => {

//                 const { cPAlgorithm } = await loadFixture(deployMetaFactory)

//                 // all values are valid

//                 expect( await cPAlgorithm.validateMultiplier(
//                     parseEther(
//                         `${Math.round( Math.random() * 1000 )}`
//                     )
//                 ) ).to.be.true

//             })

//         })

//     })

//     describe("get Buy Info", () => {

//         describe(" - Errors", () => {

//             it("1. should return false if pass invalid num of Items", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 0

//                 const initialPrice = 5

//                 const startPrice = parseEther( `${ numItems * initialPrice }` )

//                 const multiplier = parseEther( `${ numItems + 1 }` )

//                 const protocolFee = await metaFactory.PROTOCOL_FEE()

//                 const poolFee0 = 0

//                 const [ isValid ] = await cPAlgorithm.getBuyInfo(
//                     multiplier,
//                     startPrice,
//                     numItems,
//                     protocolFee,
//                     poolFee0
//                 )

//                 expect( isValid ).to.be.false

//             })

//             it("2. should return false if number of Items is greatest than NFTbalance", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = parseEther( `${ numItems * initialPrice }` )

//                 const multiplier = parseEther( `${ numItems + 1 }` )

//                 const protocolFee = await metaFactory.PROTOCOL_FEE()

//                 const poolFee0 = 0

//                 const [ isValid ] = await cPAlgorithm.getBuyInfo(
//                     multiplier,
//                     startPrice,
//                     numItems + 1,
//                     protocolFee,
//                     poolFee0
//                 )

//                 expect( isValid ).to.be.false

//             })

//         })

//         describe(" - Functionalities", () => {

//             it("1. should return a input value and isValid must be true", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = parseEther( `${ numItems * initialPrice }` )

//                 const multiplier = parseEther( `${ numItems + 1 }` )

//                 const protocolFee = await metaFactory.PROTOCOL_FEE()

//                 const poolFee0 = 0

//                 const [ isValid, , , inputValue ] = await cPAlgorithm.getBuyInfo(
//                     multiplier,
//                     startPrice,
//                     numItems,
//                     protocolFee,
//                     poolFee0
//                 )

//                 // check that input value is greater than 0

//                 expect( inputValue ).to.be.greaterThan( 0 )

//                 // check than params return a valid return ( true )

//                 expect( isValid ).to.be.true

//             })

//             it("2. test input Value without fees", async () => {

//                 const { cPAlgorithm } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = numItems * initialPrice

//                 const multiplier = numItems + 1

//                 const protocolFee = 0

//                 const poolFee0 = 0

//                 const [ , , , inputValue ] = await cPAlgorithm.getBuyInfo(
//                     parseEther( `${ multiplier }` ),
//                     parseEther( `${ startPrice }` ),
//                     numItems,
//                     protocolFee,
//                     poolFee0
//                 )

//                 const expectedInput = getTokenInput( "cPAlgorithm", startPrice, multiplier, numItems )

//                 // check that input value is equals to expected value

//                 expect( getNumber( inputValue ) ).to.be.equal( expectedInput )

//             })

//             it("3. test input Value with fees and the protocol Fee Amount", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = numItems * initialPrice

//                 const multiplier = numItems + 1

//                 const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

//                 const poolFeeMul = 0.1

//                 const [ , , , inputValue, protocolFee ] = await cPAlgorithm.getBuyInfo(
//                     parseEther( `${ multiplier }` ),
//                     parseEther( `${ startPrice }` ),
//                     numItems,
//                     parseEther( `${ protocolFeeMult }` ),
//                     parseEther( `${ poolFeeMul }` )
//                 )

//                 const expectedInput = getTokenInput( "cPAlgorithm", startPrice, multiplier, numItems )

//                 const protocolFeeEspct = expectedInput *  protocolFeeMult 

//                 const poolFee = expectedInput * protocolFeeMult

//                 // input value should be equal to expected value plus fees

//                 expect( getNumber(inputValue) ).to.be.greaterThan( expectedInput + ( protocolFeeEspct + poolFee ) )

//                 // protocol fee should be the same than expected

//                 expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

//             })

//             it("4. should return a valid new start Price and new Multiplier", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = numItems * initialPrice 

//                 const multiplier = numItems + 1

//                 const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

//                 const poolFeeMul = 0.1

//                 const [ , newStartPrice, newMultiplier, input ] = await cPAlgorithm.getBuyInfo(
//                     parseEther( `${ multiplier }` ),
//                     parseEther( `${ startPrice }` ),
//                     numItems,
//                     parseEther( `${ protocolFeeMult }` ),
//                     parseEther( `${ poolFeeMul }` )
//                 )

//                 const expectedInputWithoutFee = getTokenInput( "cPAlgorithm", startPrice, multiplier, numItems )

//                 // tokenBalance ( startPrice ) must be current balance + input

//                 expect( getNumber( newStartPrice ) ).to.be.equal( startPrice + expectedInputWithoutFee )

//                 // NFTBalance ( multiplier ) must be current balance - number Of Items

//                 expect( getNumber( newMultiplier )  ).to.be.equal( multiplier - numItems)

//             })

//         })

//     })

//     describe("get Sell Info", () => {

//         describe(" - Errors", () => {

//             it("1. should return false if pass invalid num of Items", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 0

//                 const initialPrice = 5

//                 const startPrice = parseEther( `${ numItems * initialPrice }` )

//                 const multiplier = parseEther( `${ numItems + 1 }` )

//                 const protocolFee = await metaFactory.PROTOCOL_FEE()

//                 const poolFee0 = 0

//                 const [ isValid ] = await cPAlgorithm.getSellInfo(
//                     multiplier,
//                     startPrice,
//                     numItems,
//                     protocolFee,
//                     poolFee0
//                 )

//                 expect( isValid ).to.be.false

//             })

//             it("2. should return false if number of Items is greatest than NFTbalance", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = parseEther( `${ numItems * initialPrice }` )

//                 const multiplier = parseEther( `${ numItems + 1 }` )

//                 const protocolFee = await metaFactory.PROTOCOL_FEE()

//                 const poolFee0 = 0

//                 const [ isValid ] = await cPAlgorithm.getSellInfo(
//                     multiplier,
//                     startPrice,
//                     numItems + 1,
//                     protocolFee,
//                     poolFee0
//                 )

//                 expect( isValid ).to.be.false

//             })

//         })

//         describe(" - Functionalities", () => {

//             it("1. should return a input value and isValid must be true", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = parseEther( `${ numItems * initialPrice }` )

//                 const multiplier = parseEther( `${ numItems + 1 }` )

//                 const protocolFee = await metaFactory.PROTOCOL_FEE()

//                 const poolFee0 = 0

//                 const [ isValid, , , outputValue ] = await cPAlgorithm.getSellInfo(
//                     multiplier,
//                     startPrice,
//                     numItems,
//                     protocolFee,
//                     poolFee0
//                 )

//                 // check that output value is greater than 0

//                 expect( outputValue ).to.be.greaterThan( 0 )

//                 // valid params should return true

//                 expect( isValid ).to.be.true

//             })

//             it("2. test input Value without fees", async () => {

//                 const { cPAlgorithm } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = numItems * initialPrice

//                 const multiplier = numItems + 1

//                 const protocolFee = 0

//                 const poolFee0 = 0

//                 const [ , , , outputValue ] = await cPAlgorithm.getSellInfo(
//                     parseEther( `${ multiplier }` ),
//                     parseEther( `${ startPrice }` ),
//                     numItems,
//                     protocolFee,
//                     poolFee0
//                 )

//                 const expectedOutput = getTokenOutput( "cPAlgorithm", startPrice, multiplier, numItems )

//                 // check that output value is equals to expected value

//                 expect( getNumber(outputValue) ).to.be.equal( expectedOutput )

//             })

//             it("3. test input Value with fees and protocol Fee Amount", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = numItems * initialPrice

//                 const multiplier = numItems + 1

//                 const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

//                 const poolFeeMul = 0.1

//                 const [ , , , outputValue, protocolFee ] = await cPAlgorithm.getSellInfo(
//                     parseEther( `${ multiplier }` ),
//                     parseEther( `${ startPrice }` ),
//                     numItems,
//                     parseEther( `${ protocolFeeMult }` ),
//                     parseEther( `${ poolFeeMul }` )
//                 )

//                 const expectedOutput = getTokenOutput( "cPAlgorithm", startPrice, multiplier, numItems )

//                 const protocolFeeEspct = expectedOutput * protocolFeeMult 

//                 const poolFee = expectedOutput * poolFeeMul

//                 // output value should be equal to expected value plus fees

//                 expect( getNumber(outputValue) ).to.be.equal( expectedOutput - ( protocolFeeEspct + poolFee ) )

//                 // protocol fee should be the same than expected

//                 expect( roundNumber( getNumber( protocolFee ), 1000 ) ).to.be.equal( roundNumber( protocolFeeEspct, 1000 ) )

//             })

//             it("4. test new start Price and new multiplier", async () => {

//                 const { cPAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

//                 const numItems = 10

//                 const initialPrice = 5

//                 const startPrice = numItems * initialPrice

//                 const multiplier = numItems + 1

//                 const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

//                 const poolFeeMul = 0.1

//                 const [ , newStartPrice, newMultiplier, , ] = await cPAlgorithm.getSellInfo(
//                     parseEther( `${ multiplier }` ),
//                     parseEther( `${ startPrice }` ),
//                     numItems,
//                     parseEther( `${ protocolFeeMult }` ),
//                     parseEther( `${ poolFeeMul }` )
//                 )

//                 const expectedOutputWithoutFee = getTokenOutput( "cPAlgorithm", startPrice, multiplier, numItems )

//                 // tokenBalance ( startPrice ) must be current balance - input

//                 expect( getNumber( newStartPrice ) ).to.be.equal( startPrice - expectedOutputWithoutFee )

//                 // NFTBalance ( multiplier ) must be current balance + number Of Items

//                 expect( getNumber( newMultiplier )  ).to.be.equal( multiplier + numItems )

//             })

//         })

//     })

// });
