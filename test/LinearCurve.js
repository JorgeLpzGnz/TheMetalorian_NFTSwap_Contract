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

describe("Linear Curve", function () {

    describe("validate Spot Price", () => {

        describe(" - Functionalities", () => {

            it("1. should always return true", async () => {

                const { linearCurve } = await loadFixture(deployMetaFactory)

                expect( await linearCurve.validateSpotPrice(
                    parseEther(`${ Math.round( Math.random() * 100)}`)
                ) ).to.be.true

            })

        })

    })

    describe("validate Delta", () => {

        describe(" - Functionalities", () => {

            it("1. should always return true", async () => {

                const { linearCurve } = await loadFixture(deployMetaFactory)

                expect( await linearCurve.validateDelta(
                    parseEther(`${ Math.round( Math.random() * 100)}`))
                ).to.be.true

            })

        })

    })

    describe("get Buy Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const spotPrice = parseEther( `3` )

                const delta = parseEther( `1.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await linearCurve.getBuyInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

            it("2. should return false when new spot price is more than uint128 limit", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = parseEther("340282366920938463467")

                const spotPrice = parseEther( `100` )

                const delta = parseEther( `5` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await linearCurve.getBuyInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = parseEther( `3` )

                const delta = parseEther( `0.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , inputValue ] = await linearCurve.getBuyInfo(
                    delta,
                    spotPrice,
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

                const { linearCurve } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 2

                const delta = 1.5

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , inputValue ] = await linearCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const espectedInput = getTokenInput( "linearCurve", spotPrice, delta, numItems )

                // check that input value is equals to espected value

                expect( getNumber( inputValue ) ).to.be.equal( espectedInput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 5

                const delta = 1.5

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , inputValue, protocolFee ] = await linearCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedInput = getTokenInput( "linearCurve", spotPrice, delta, numItems )

                const protocolFeeEspct = espectedInput *  protocolFeeMult

                const poolFee = espectedInput * protocolFeeMult

                // input value should be equal to espected value plus fees

                expect( getNumber(inputValue) ).to.be.greaterThan( espectedInput + ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

            })

            it("4. test new spot price and new delta", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 3

                const delta = 1.7

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newSpotPrice, newDelta, , ] = await linearCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                // input value should be equal to espected value plus fees

                expect( 
                    getNumber( newSpotPrice ),
                ).to.be.equal(
                    spotPrice + ( delta * numItems ),
                )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( newDelta ) ).to.be.equal( delta )

            })

        })

    })

    describe("get Sell Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const spotPrice = parseEther( `1` )

                const delta = parseEther( `1.3` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await linearCurve.getSellInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

        })

        // in all this tests the num of items could substract by any number
        // becouse there are a limit of items that can be sell depending of
        // delta and spot price

        describe(" - Functionalities", () => {

            it("1. should return a input value and is Valid must be true", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = parseEther( `5` )

                const delta = parseEther( `0.1` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , outputValue ] = await linearCurve.getSellInfo(
                    delta,
                    spotPrice,
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

                const { linearCurve } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 5

                const delta = 0.2

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , outputValue ] = await linearCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const espectedOutput = getTokenOutput( "linearCurve", spotPrice, delta, numItems )

                // check that input value is equals to espected value

                expect( getNumber(outputValue) ).to.be.equal( espectedOutput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 5

                const delta = 0.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , outputValue, protocolFee ] = await linearCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedOutput = getTokenOutput( "linearCurve", spotPrice, delta, numItems )

                const protocolFeeEspct = espectedOutput * protocolFeeMult

                const poolFee = espectedOutput * poolFeeMul

                // input value should be equal to espected value plus fees

                expect(
                    roundNumber( getNumber(outputValue), 1000 )
                ).to.be.equal(
                    roundNumber( espectedOutput - ( protocolFeeEspct + poolFee ), 1000)
                )

                // raturnal protocol fee should be the same than espected

                expect( roundNumber( getNumber( protocolFee ), 1000 ) ).to.be.equal( roundNumber( protocolFeeEspct, 1000 ) )

            })

            it("4. test new Spot Price and new delta", async () => {

                const { linearCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 5

                const delta = 0.2

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newSpotPrice, newDelta, ,  ] = await linearCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const decrease = delta * numItems

                // input value should be equal to espected value plus fees

                expect(
                    getNumber(newSpotPrice)
                ).to.be.equal(
                    spotPrice - decrease
                )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( newDelta ) ).to.be.equal( delta )

            })

            // in liniar curve the new spot price for sell is spot price - decrease
            // so when the drease is grater than spot price this will throw an 
            // UnderFlow erro so to handle this theres a limit in the items
            // that pool can sell

            it("4. test when decrease is greater then spot Price", async () => {

                const { linearCurve } = await loadFixture(deployMetaFactory)

                // try to sell 10 NFTs

                const numItems = 10

                const spotPrice = 1

                const delta = 0.5

                const protocolFeeMult = 0

                const poolFeeMul = 0

                const [ , newSpotPrice, newDelta, outputValue,  ] = await linearCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                // in this spot price and delta the max of items that the pool
                // can sell is 2 becouse 0.5 * 2 is 1 ( the current spot price )

                const espectedOutput = getTokenOutput("linearCurve", spotPrice, delta, 2)

                const decrease = delta * 2

                // check that output is the same than espected

                expect( getNumber( outputValue ) ).to.be.equal( espectedOutput )

                // input value should be equal to espected value plus fees

                expect(
                    getNumber(newSpotPrice)
                ).to.be.equal(
                    spotPrice - decrease
                )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( newDelta ) ).to.be.equal( delta )

            })

        })

    })

});