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
const { parseEther, parseUnits } = utils

describe("Exponential Curve", function () {

    describe("validate Spot Price", () => {

        describe(" - Functionalities", () => {

            it("1. should return true when pass correct value", async () => {

                const { exponencialCurve } = await loadFixture(deployMetaFactory)

                expect( await exponencialCurve.validateSpotPrice(
                    parseEther(`1`)
                ) ).to.be.true

            })

            it("2. should return false when pass less than 1 gwei", async () => {

                const { exponencialCurve } = await loadFixture(deployMetaFactory)

                expect( await exponencialCurve.validateSpotPrice(
                    parseUnits(`1`, 8)
                ) ).to.be.false

            })

        })

    })

    describe("validate Delta", () => {

        describe(" - Functionalities", () => {

            it("1. should return true when passed value is greater than 1e18", async () => {

                const { exponencialCurve } = await loadFixture(deployMetaFactory)

                expect( await exponencialCurve.validateDelta(  parseEther(`1.1`)) ).to.be.true

            })

            it("2. should return false when passed value is less than 1e18", async () => {

                const { exponencialCurve } = await loadFixture(deployMetaFactory)

                expect( await exponencialCurve.validateDelta(  parseEther(`0.9`)) ).to.be.false

            })

        })

    })

    describe("get Buy Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const spotPrice = parseEther( `3` )

                const delta = parseEther( `1.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await exponencialCurve.getBuyInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

            it("2. should return false when new spot price is more than uint128 limit", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 50

                const spotPrice = parseEther( `100` )

                const delta = parseEther( `5` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await exponencialCurve.getBuyInfo(
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

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = parseEther( `3` )

                const delta = parseEther( `1.2` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , inputValue ] = await exponencialCurve.getBuyInfo(
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

                const { exponencialCurve } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 2

                const delta = 1.5

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , inputValue ] = await exponencialCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const espectedInput = getTokenInput( "exponencialCurve", spotPrice, delta, numItems )

                // check that input value is equals to espected value

                expect( getNumber( inputValue ) ).to.be.equal( espectedInput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 5

                const delta = 1.5

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , inputValue, protocolFee ] = await exponencialCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedInput = getTokenInput( "exponencialCurve", spotPrice, delta, numItems )

                const protocolFeeEspct = espectedInput *  protocolFeeMult 

                const poolFee = espectedInput * protocolFeeMult

                // input value should be equal to espected value plus fees

                expect( getNumber(inputValue) ).to.be.greaterThan( espectedInput + ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

            })

            it("4. test new spot price and new delta", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 3

                const delta = 1.7

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newSpotPrice, newDelta, , ] = await exponencialCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const deltaPow = delta ** numItems

                const newEspectedSpotPrice = spotPrice * deltaPow

                // input value should be equal to espected value plus fees

                expect( roundNumber( getNumber( newSpotPrice ), 1000 ) ).to.be.equal( roundNumber( newEspectedSpotPrice, 1000 ) )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( newDelta ) ).to.be.equal( delta )

            })

        })

    })

    describe("get Sell Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const spotPrice = parseEther( `1` )

                const delta = parseEther( `1.3` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await exponencialCurve.getSellInfo(
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

            it("1. should return a input value and is Valid must be true", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = parseEther( `1` )

                const delta = parseEther( `1.3` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , outputValue ] = await exponencialCurve.getSellInfo(
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

                const { exponencialCurve } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 2

                const delta = 1.5

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , outputValue ] = await exponencialCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const espectedOutput = getTokenOutput( "exponencialCurve", spotPrice, delta, numItems )

                // check that input value is equals to espected value

                expect( roundNumber(getNumber(outputValue), 1000) ).to.be.equal( roundNumber(espectedOutput, 1000) )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 4

                const delta = 1.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , outputValue, protocolFee ] = await exponencialCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedOutput = getTokenOutput( "exponencialCurve", spotPrice, delta, numItems )

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

            it("3. test new Spot Price and new delta", async () => {

                const { exponencialCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const spotPrice = 4

                const delta = 1.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newSpotPrice, newDelta, ,  ] = await exponencialCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const invDelta = 1 / delta

                const invDeltaPow = invDelta ** numItems

                const espectedNewSpotPrice = spotPrice * invDeltaPow

                // input value should be equal to espected value plus fees

                expect( 
                    roundNumber( getNumber( newSpotPrice ), 1000 ) 
                ).to.be.equal( 
                    roundNumber( espectedNewSpotPrice, 1000 )
                )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( newDelta ) ).to.be.equal( delta )

            })

        })

    })

});