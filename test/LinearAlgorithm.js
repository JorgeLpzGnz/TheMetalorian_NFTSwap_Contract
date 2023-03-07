const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
    getNumber,
    getTokenInput,
    deployMetaFactory,
    getTokenOutput,
    roundNumber
} = require("../utils/tools" )
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { utils } = ethers
const { parseEther } = utils

describe("Linear Algorithm", function () {

    describe("name", () => {

        describe(" - Functionalities", () => {

            it("1. should return algorithm name", async () => {

                const { linearAlgorithm } = await loadFixture(deployMetaFactory)

                expect( await linearAlgorithm.name() ).to.be.equal( "Linear" )

            })

        })

    })

    describe("validate Start Price", () => {

        describe(" - Functionalities", () => {

            it("1. should always return true", async () => {

                const { linearAlgorithm } = await loadFixture(deployMetaFactory)

                // all values are valid

                expect( await linearAlgorithm.validateStartPrice(
                    parseEther(`${ Math.round( Math.random() * 100)}`)
                ) ).to.be.true

            })

        })

    })

    describe("validate Multiplier", () => {

        describe(" - Functionalities", () => {

            it("1. should always return true", async () => {

                const { linearAlgorithm } = await loadFixture(deployMetaFactory)

                // all values are valid

                expect( await linearAlgorithm.validateMultiplier(
                    parseEther(`${ Math.round( Math.random() * 100)}`))
                ).to.be.true

            })

        })

    })

    describe("get Buy Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = parseEther( `3` )

                const multiplier = parseEther( `1.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await linearAlgorithm.getBuyInfo(
                    multiplier,
                    startPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

            it("2. should return false when new start price is more than uint128 limit", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = parseEther("340282366920938463467")

                const startPrice = parseEther( `100` )

                const multiplier = parseEther( `5` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await linearAlgorithm.getBuyInfo(
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

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = parseEther( `3` )

                const multiplier = parseEther( `0.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , inputValue ] = await linearAlgorithm.getBuyInfo(
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

                const { linearAlgorithm } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 2

                const multiplier = 1.5

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , inputValue ] = await linearAlgorithm.getBuyInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const expectedInput = getTokenInput( "linearAlgorithm", startPrice, multiplier, numItems )

                // check that input value is equals to expected value

                expect( getNumber( inputValue ) ).to.be.equal( expectedInput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 1.5

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , inputValue, protocolFee ] = await linearAlgorithm.getBuyInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const expectedInput = getTokenInput( "linearAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedInput *  protocolFeeMult

                const poolFee = expectedInput * protocolFeeMult

                // input value should be equal to expected value plus fees

                expect( getNumber(inputValue) ).to.be.greaterThan( expectedInput + ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

            })

            it("4. test new start price and new multiplier", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 3

                const multiplier = 1.7

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newStartPrice, newMultiplier, , ] = await linearAlgorithm.getBuyInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                // new Start Price must be startPrice + ( multiplier * numItems )

                expect( 
                    getNumber( newStartPrice ),
                ).to.be.equal(
                    startPrice + ( multiplier * numItems ),
                )

                // newMultiplier should be the same than previous

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

        })

    })

    describe("get Sell Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = parseEther( `1` )

                const multiplier = parseEther( `1.3` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await linearAlgorithm.getSellInfo(
                    multiplier,
                    startPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

        })

        /*
          In all of these tests, the number of items can be subtracted by any
          number because there is a limit to the number of items that can be 
          sold based on the multiplier and start price. 
        */

        describe(" - Functionalities", () => {

            it("1. should return a input value and is Valid must be true", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = parseEther( `5` )

                const multiplier = parseEther( `0.1` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , outputValue ] = await linearAlgorithm.getSellInfo(
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

                const { linearAlgorithm } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 0.2

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , outputValue ] = await linearAlgorithm.getSellInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const expectedOutput = getTokenOutput( "linearAlgorithm", startPrice, multiplier, numItems )

                // check that input value is equals to expected value

                expect( getNumber(outputValue) ).to.be.equal( expectedOutput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 0.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , outputValue, protocolFee ] = await linearAlgorithm.getSellInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const expectedOutput = getTokenOutput( "linearAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedOutput * protocolFeeMult

                const poolFee = expectedOutput * poolFeeMul

                // output value should be equal to expected value plus fees

                expect(
                    roundNumber( getNumber(outputValue), 1000 )
                ).to.be.equal(
                    roundNumber( expectedOutput - ( protocolFeeEspct + poolFee ), 1000)
                )

                // raturnal protocol fee should be the same than expected

                expect( roundNumber( getNumber( protocolFee ), 1000 ) ).to.be.equal( roundNumber( protocolFeeEspct, 1000 ) )

            })

            it("4. test new Start Price and new multiplier", async () => {

                const { linearAlgorithm, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 0.2

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newStartPrice, newMultiplier, ,  ] = await linearAlgorithm.getSellInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const decrease = multiplier * numItems

                // new start price should be: current Start Price - Decrease

                expect(
                    getNumber(newStartPrice)
                ).to.be.equal(
                    startPrice - decrease
                )

                // keep multiplier the same

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

            // in linear Algorithm the new start price for sell is start price - decrease
            // so when the decrease is grater than start price this will throw an 
            // UnderFlow error so to handle this theres a limit in the items
            // that pool can sell

            it("4. test when decrease is greater then start Price", async () => {

                const { linearAlgorithm } = await loadFixture(deployMetaFactory)

                // try to sell 10 NFTs

                const numItems = 10

                const startPrice = 1

                const multiplier = 0.5

                const protocolFeeMult = 0

                const poolFeeMul = 0

                const [ , newStartPrice, newMultiplier, outputValue,  ] = await linearAlgorithm.getSellInfo(
                    parseEther( `${ multiplier }` ),
                    parseEther( `${ startPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                // in this start price and multiplier the max of items that the pool
                // can sell is 2 because 0.5 * 2 is 1 ( the current start price )

                const expectedOutput = getTokenOutput("linearAlgorithm", startPrice, multiplier, 2)

                const decrease = multiplier * 2

                // check that output is the same than expected

                expect( getNumber( outputValue ) ).to.be.equal( expectedOutput )

                // check the decrease in the new start price

                expect(
                    getNumber(newStartPrice)
                ).to.be.equal(
                    startPrice - decrease
                )

                // keep multiplier the same

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

        })

    })

});