const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
    getNumber,
    getSellInput,
    deployMetaFactory,
    getSellOutput,
    roundNumber
} = require("../utils/tools" )
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers
const { parseEther, parseUnits } = utils

describe("Exponential Algorithm", function () {

    describe("validate Start Price", () => {

        describe(" - Functionalities", () => {

            it("1. should return true when pass correct value", async () => {

                const { exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                expect( await exponentialAlgorithm.validateStartPrice(
                    parseEther(`1`)
                ) ).to.be.true

            })

            it("2. should return false when pass less than 1 gwei", async () => {

                const { exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                expect( await exponentialAlgorithm.validateStartPrice(
                    parseUnits(`1`, 8)
                ) ).to.be.false

            })

        })

    })

    describe("validate Multiplier", () => {

        describe(" - Functionalities", () => {

            it("1. should return true when passed value is greater than 1e18", async () => {

                const { exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                expect( await exponentialAlgorithm.validateMultiplier(  parseEther(`1.1`)) ).to.be.true

            })

            it("2. should return false when passed value is less than 1e18", async () => {

                const { exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                expect( await exponentialAlgorithm.validateMultiplier(  parseEther(`0.9`)) ).to.be.false

            })

        })

    })

    describe("get Buy Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = parseEther( `3` )

                const multiplier = parseEther( `1.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await exponentialAlgorithm.getBuyInfo(
                    multiplier,
                    startPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

            it("2. should return false when new spot price is more than uint128 limit", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 50

                const startPrice = parseEther( `100` )

                const multiplier = parseEther( `5` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await exponentialAlgorithm.getBuyInfo(
                    multiplier,
                    startPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = parseEther( `3` )

                const multiplier = parseEther( `1.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , inputValue ] = await exponentialAlgorithm.getBuyInfo(
                    multiplier,
                    startPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                // check that input value is greater than 0

                expect( inputValue ).to.be.greaterThan( 0 )

                // check that is returning true in the first element

                expect( isValid ).to.be.true

            })

            it("2. test input Value without fees", async () => {

                const { exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 2

                const multiplier = 1.5

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , inputValue ] = await exponentialAlgorithm.getBuyInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const expectedInput = getSellInput( "exponentialAlgorithm", startPrice, multiplier, numItems )

                // check that input value is equals to expected value

                expect( getNumber( inputValue ) ).to.be.equal( expectedInput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 1.5

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , inputValue, protocolFee ] = await exponentialAlgorithm.getBuyInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const expectedInput = getSellInput( "exponentialAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedInput *  protocolFeeMult 

                const poolFee = expectedInput * protocolFeeMult

                // input value should be equal to expected value plus fees

                expect( getNumber(inputValue) ).to.be.greaterThan( expectedInput + ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

            })

            it("4. test new spot price and new multiplier", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 3

                const multiplier = 1.7

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newStartPrice, newMultiplier, , ] = await exponentialAlgorithm.getBuyInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const multiplierPow = multiplier ** numItems

                const newExpectedStartPrice = startPrice * multiplierPow

                // input value should be equal to expected value plus fees

                expect( roundNumber( getNumber( newStartPrice ), 1000 ) ).to.be.equal( roundNumber( newExpectedStartPrice, 1000 ) )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

        })

    })

    describe("get Sell Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = parseEther( `1` )

                const multiplier = parseEther( `1.3` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await exponentialAlgorithm.getSellInfo(
                    multiplier,
                    startPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and is Valid must be true", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = parseEther( `1` )

                const multiplier = parseEther( `1.3` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , outputValue ] = await exponentialAlgorithm.getSellInfo(
                    multiplier,
                    startPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                // check that input value is greater than 0

                expect( outputValue ).to.be.greaterThan( 0 )

                // check if isValid value is equal to true

                expect( isValid ).to.be.true

            })

            it("2. test input Value without fees", async () => {

                const { exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 2

                const multiplier = 1.5

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , outputValue ] = await exponentialAlgorithm.getSellInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const expectedOutput = getSellOutput( "exponentialAlgorithm", startPrice, multiplier, numItems )

                // check that input value is equals to expected value

                expect( roundNumber(getNumber(outputValue), 1000) ).to.be.equal( roundNumber(expectedOutput, 1000) )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 4

                const multiplier = 1.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , outputValue, protocolFee ] = await exponentialAlgorithm.getSellInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const expectedOutput = getSellOutput( "exponentialAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedOutput * protocolFeeMult 

                const poolFee = expectedOutput * poolFeeMul

                // input value should be equal to expected value plus fees

                expect( 
                    roundNumber( getNumber(outputValue), 1000 ) 
                ).to.be.equal( 
                    roundNumber( expectedOutput - ( protocolFeeEspct + poolFee ), 1000) 
                )

                // raturnal protocol fee should be the same than expected

                expect( roundNumber( getNumber( protocolFee ), 1000 ) ).to.be.equal( roundNumber( protocolFeeEspct, 1000 ) )

            })

            it("3. test new Start Price and new multiplier", async () => {

                const { exponentialAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 4

                const multiplier = 1.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newStartPrice, newMultiplier, ,  ] = await exponentialAlgorithm.getSellInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const invMultiplier = 1 / multiplier

                const invMultiplierPow = invMultiplier ** numItems

                const expectedNewStartPrice = startPrice * invMultiplierPow

                // input value should be equal to expected value plus fees

                expect( 
                    roundNumber( getNumber( newStartPrice ), 1000 ) 
                ).to.be.equal( 
                    roundNumber( expectedNewStartPrice, 1000 )
                )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

        })

    })

});