const {
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

describe("Constant Product Curve", function () {

    describe("validate Spot Price", () => {

        describe(" - Functionalities", () => {

            it("1. should always return true", async () => {

                const { cPCurve } = await loadFixture(deployMetaFactory)

                expect( await cPCurve.validateSpotPrice(
                    parseEther(
                        `${Math.round( Math.random() * 1000 )}`
                    )
                ) ).to.be.true

            })

        })

    })

    describe("validate Delta", () => {

        describe(" - Functionalities", () => {

            it("1. should always return true", async () => {

                const { cPCurve } = await loadFixture(deployMetaFactory)

                expect( await cPCurve.validateDelta(
                    parseEther(
                        `${Math.round( Math.random() * 1000 )}`
                    )
                ) ).to.be.true

            })

        })

    })

    describe("get Buy Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const initialPrice = 5

                const spotPrice = parseEther( `${ numItems * initialPrice }` )

                const delta = parseEther( `${ numItems + 1 }` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await cPCurve.getBuyInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

            it("2. should return false if number of Items is greatest than NFTbalance", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = parseEther( `${ numItems * initialPrice }` )

                const delta = parseEther( `${ numItems + 1 }` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await cPCurve.getBuyInfo(
                    delta,
                    spotPrice,
                    numItems + 1,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = parseEther( `${ numItems * initialPrice }` )

                const delta = parseEther( `${ numItems + 1 }` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , inputValue ] = await cPCurve.getBuyInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                // check that input value is greater than 0

                expect( inputValue ).to.be.greaterThan( 0 )

                // check than params return a valid return ( true )

                expect( isValid ).to.be.true

            })

            it("2. test input Value without fees", async () => {

                const { cPCurve } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = numItems * initialPrice

                const delta = numItems + 1

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , inputValue ] = await cPCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const espectedInput = getTokenInput( "cPCurve", spotPrice, delta, numItems )

                // check that input value is equals to espected value

                expect( getNumber( inputValue ) ).to.be.equal( espectedInput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = numItems * initialPrice

                const delta = numItems + 1

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , inputValue, protocolFee ] = await cPCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedInput = getTokenInput( "cPCurve", spotPrice, delta, numItems )

                const protocolFeeEspct = espectedInput *  protocolFeeMult 

                const poolFee = espectedInput * protocolFeeMult

                // input value should be equal to espected value plus fees

                expect( inputValue ).to.be.greaterThan( espectedInput + ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

            })

            it("4. should return a valid new spot Price and new Delta", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = numItems * initialPrice 

                const delta = numItems + 1

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newSpotPrice, newDelta, input ] = await cPCurve.getBuyInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedInputWithoufee = getTokenInput( "cPCurve", spotPrice, delta, numItems )

                const protocolFeeEspct = espectedInputWithoufee *  protocolFeeMult

                const poolFee = espectedInputWithoufee * poolFeeMul

                const espectedInput = espectedInputWithoufee + protocolFeeEspct + poolFee

                // tokenBalance ( spotPrice ) must be current balance + input

                expect( getNumber( newSpotPrice ) ).to.be.equal( spotPrice + espectedInput )

                // NFTBalance ( delta ) must be current balance - number Of Items

                expect( getNumber( newDelta )  ).to.be.equal( delta - numItems)

            })

        })

    })

    describe("get Sell Info", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const initialPrice = 5

                const spotPrice = parseEther( `${ numItems * initialPrice }` )

                const delta = parseEther( `${ numItems + 1 }` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await cPCurve.getSellInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

            it("2. should return false if number of Items is greatest than NFTbalance", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = parseEther( `${ numItems * initialPrice }` )

                const delta = parseEther( `${ numItems + 1 }` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid ] = await cPCurve.getSellInfo(
                    delta,
                    spotPrice,
                    numItems + 1,
                    protocolFee,
                    poolFee0
                )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = parseEther( `${ numItems * initialPrice }` )

                const delta = parseEther( `${ numItems + 1 }` )

                const protocolFee = await metaFactory.PROTOCOL_FEE()

                const poolFee0 = 0

                const [ isValid, , , outputValue ] = await cPCurve.getSellInfo(
                    delta,
                    spotPrice,
                    numItems,
                    protocolFee,
                    poolFee0
                )

                // check that input value is greater than 0

                expect( outputValue ).to.be.greaterThan( 0 )

                // valid params should return true

                expect( isValid ).to.be.true

            })

            it("2. test input Value without fees", async () => {

                const { cPCurve } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = numItems * initialPrice

                const delta = numItems + 1

                const protocolFee = 0

                const poolFee0 = 0

                const [ , , , outputValue ] = await cPCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    protocolFee,
                    poolFee0
                )

                const espectedOutput = getTokenOutput( "cPCurve", spotPrice, delta, numItems )

                // check that input value is equals to espected value

                expect( getNumber(outputValue) ).to.be.equal( espectedOutput )

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = numItems * initialPrice

                const delta = numItems + 1

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , , , outputValue, protocolFee ] = await cPCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedOutput = getTokenOutput( "cPCurve", spotPrice, delta, numItems )

                const protocolFeeEspct = espectedOutput * protocolFeeMult 

                const poolFee = espectedOutput * poolFeeMul

                // input value should be equal to espected value plus fees

                expect( getNumber(outputValue) ).to.be.equal( espectedOutput - ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than espected

                expect( roundNumber( getNumber( protocolFee ), 1000 ) ).to.be.equal( roundNumber( protocolFeeEspct, 1000 ) )

            })

            it("4. test new spot Price and new delta", async () => {

                const { cPCurve, metaFactory } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const spotPrice = numItems * initialPrice

                const delta = numItems + 1

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const [ , newSpotPrice, newDelta, , ] = await cPCurve.getSellInfo(
                    parseEther( `${ delta }` ),
                    parseEther( `${ spotPrice }` ),
                    numItems,
                    parseEther( `${ protocolFeeMult }` ),
                    parseEther( `${ poolFeeMul }` )
                )

                const espectedOutputWithoutFee = getTokenOutput( "cPCurve", spotPrice, delta, numItems )

                const protocolFeeEspct = espectedOutputWithoutFee * protocolFeeMult 

                const poolFee = espectedOutputWithoutFee * poolFeeMul

                const espectedOutput = espectedOutputWithoutFee - ( protocolFeeEspct + poolFee )

                // input value should be equal to espected value plus fees

                expect( getNumber( newSpotPrice ) ).to.be.equal( spotPrice - espectedOutput )

                // raturnal protocol fee should be the same than espected

                expect( getNumber( newDelta )  ).to.be.equal( delta + numItems )

            })

        })

    })

});
