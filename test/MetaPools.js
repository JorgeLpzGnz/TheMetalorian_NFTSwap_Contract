const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
    poolType,
    createPool,
    getEventLog,
    mintNFT,
    getNumber,
    getTokenInput,
    deployMetaFactory,
    getNumberForBNArray,
    getTokenOutput,
    roundNumber
} = require("../utils/tools")
const { expect } = require("chai");
const { ethers } = require("hardhat");
const provider = ethers.provider
const { parseEther } = ethers.utils

describe("MetaPools", function () {

    describe("set Assets Recipient", () => {

        describe(" - Errors", () => {

            it("1. should fail if a not owner try to call", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.connect(otherAccount).setAssetsRecipient(otherAccount.address)
                ).to.be.rejected

            })

            it("2. should fail if try to set on trade pool", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, 0, 0)

                await expect(
                    pool.setAssetsRecipient(owner.address)
                ).to.be.rejectedWith("Recipient not supported in trade pools")

            })

            it("3. should fail if try to set the same address than the current", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                // in create pool function sets the caller as recipient

                await expect(
                    pool.setAssetsRecipient(owner.address)
                ).to.be.rejectedWith("New recipient is equal than current")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a new recipient", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                // check that the recipient is equal to the owner

                expect(
                    await pool.getAssetsRecipient()
                ).to.be.equal(
                    owner.address
                )

                await pool.setAssetsRecipient(otherAccount.address)

                // verify that it sets the new recipient

                expect( 
                    await pool.getAssetsRecipient()
                ).to.be.equal(
                    otherAccount.address
                )

            })

        })

    })

    describe("set Trade Fee", () => {

        describe(" - Errors", () => {

            it("1. should fail if a not owner try to call", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, 0, 0)

                const newFee = 0

                await expect(
                    pool.connect(otherAccount).setTradeFee( newFee )
                ).to.be.rejected

            })

            it("2. should fail if try to set on non-trade pool", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const p1 = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                const p2 = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.token, 0, 0)

                const newFee = 0

                await expect(
                    p1.pool.setTradeFee( newFee )
                ).to.be.rejectedWith("fee available only on trade pools")

                await expect(
                    p2.pool.setTradeFee( newFee )
                ).to.be.rejectedWith("fee available only on trade pools")

            })

            it("3. should fail if try to set the same fee than the current", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, 0.5, 0)

                const newFee = parseEther( "0.5")

                await expect(
                    pool.setTradeFee( newFee )
                ).to.be.rejectedWith("New fee is equal than current")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a new recipient", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount, owner } = await loadFixture(deployMetaFactory)

                const initialFee = 0.01

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, initialFee, 0)

                const newFee = parseEther("0.05")

                // check that the fee is equal to the inital

                expect(await pool.tradeFee()).to.be.equal(parseEther( `${initialFee}` ))

                await pool.setTradeFee(newFee)

                // verify that it sets the new fee

                expect(await pool.tradeFee()).to.be.equal(newFee)

            })

        })

    })

    describe("set StartPrice", () => {

        describe(" - Errors", () => {

            it("1. should fail when not owner try to set new spot price", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(pool.connect(otherAccount).setStartPrice(0)).to.be.reverted

            })

            it("2. should fail if new start Price is equal than current", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                const startPrice = await pool.startPrice()

                await expect(pool.setStartPrice(startPrice)).to.be.revertedWith("new price is equal than current")

            })

            it("3. should fail when new spot price is invalid for the Algorithm", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                // min spot price = 1 gwei = 1e9

                const startPrice = 1e7

                await expect(pool.setStartPrice(startPrice)).to.be.revertedWith("invalid Start Price")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a new spot price", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, startPrice, 1.5, exponentialAlgorithm, poolType.nft, 0, 0)

                // current spot price is the same as initial

                expect(getNumber(await pool.startPrice())).to.be.equal(startPrice)

                const newStartPrice = parseEther("7")

                await pool.setStartPrice(newStartPrice)

                // check if it was set it

                expect(await pool.startPrice()).to.be.equal(newStartPrice)

            })

        })

    })

    describe("set Multiplier", () => {

        describe(" - Errors", () => {

            it("1. should fail when not owner try to set new multiplier", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(pool.connect(otherAccount).setMultiplier(0)).to.be.reverted

            })

            it("2. should fail if new multiplier is equal than current", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                const multiplier = await pool.multiplier()

                await expect(pool.setMultiplier(multiplier)).to.be.revertedWith("multiplier is equal than current")

            })

            it("3. should fail when new spot price is invalid for the Algorithm", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                // Min multiplier = 1e18

                const multiplier = 1e7

                await expect(pool.setMultiplier(multiplier)).to.be.revertedWith("invalid multiplier")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a new multiplier", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const multiplier = 1.1

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                expect(getNumber(await pool.multiplier())).to.be.equal(multiplier)

                const newMultiplier = parseEther("1.5")

                await pool.setMultiplier(newMultiplier)

                expect(await pool.multiplier()).to.be.equal(newMultiplier)

            })

        })

    })

    // get Tradde Info in CP Algorithm

    describe("get Buy Info CP algorithm", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const [isValid] = await pool.getPoolBuyInfo(
                    numItems,
                )

                expect(isValid).to.be.false

            })

            it("2. should return false if number of Items is greatest than NFTbalance", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const [isValid] = await pool.getPoolBuyInfo( numItems + 1 )

                expect(isValid).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const [isValid, , , inputValue] = await pool.getPoolBuyInfo( numItems )

                // check that input value is greater than 0

                expect(inputValue).to.be.greaterThan(0)

                // check than params return a valid return ( true )

                expect(isValid).to.be.true

            })

            it("2. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const protocolFeeMult = getNumber(await metaFactory.PROTOCOL_FEE())

                const [, , , inputValue, protocolFee] = await pool.getPoolBuyInfo( numItems )

                const expectedInput = getTokenInput("cPAlgorithm", startPrice, multiplier, numItems)

                const protocolFeeEspct = expectedInput * protocolFeeMult

                // input value should be equal to expected value plus fees

                expect( getNumber(inputValue) ).to.be.equal( expectedInput + protocolFeeEspct )

                // raturnal protocol fee should be the same than expected

                expect(getNumber(protocolFee)).to.be.equal(protocolFeeEspct)

            })

            it("3. should return a valid new start Price and new Multiplier", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.trade, poolFeeMul, 100)

                const protocolFeeMult = getNumber(await metaFactory.PROTOCOL_FEE())

                const [, newStartPrice, newMultiplier ] = await pool.getPoolBuyInfo( numItems )

                const expectedInputWithoufee = getTokenInput("cPAlgorithm", startPrice, multiplier, numItems)

                const protocolFeeEspct = expectedInputWithoufee * protocolFeeMult

                const poolFee = expectedInputWithoufee * poolFeeMul

                const expectedInput = expectedInputWithoufee + protocolFeeEspct + poolFee

                // tokenBalance ( startPrice ) must be current balance + input

                expect(getNumber(newStartPrice)).to.be.equal(startPrice + expectedInput)

                // NFTBalance ( multiplier ) must be current balance - number Of Items

                expect(getNumber(newMultiplier)).to.be.equal(multiplier - numItems)

            })

        })

    })

    describe("get Sell Info CP algorithm", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 100)

                const [ isValid ] = await pool.getPoolSellInfo( numItems )

                expect( isValid ).to.be.false

            })

            it("2. should return false if number of Items is greatest than NFTbalance", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 100)

                const [ isValid ] = await pool.getPoolSellInfo( numItems + 1 )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 100)

                const [ isValid, , , outputValue ] = await pool.getPoolSellInfo( numItems )

                // check that input value is greater than 0

                expect( outputValue ).to.be.greaterThan( 0 )

                // valid params should return true

                expect( isValid ).to.be.true

            })

            it("2. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , , , outputValue, protocolFee ] = await pool.getPoolSellInfo( numItems )

                const expectedOutput = getTokenOutput( "cPAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedOutput * protocolFeeMult 

                const poolFee = expectedOutput * poolFeeMul

                // input value should be equal to expected value plus fees

                expect( getNumber(outputValue) ).to.be.equal( expectedOutput - ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than expected

                expect( roundNumber( getNumber( protocolFee ), 1000 ) ).to.be.equal( roundNumber( protocolFeeEspct, 1000 ) )

            })

            it("4. test new start Price and new multiplier", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , newStartPrice, newMultiplier, , ] = await pool.getPoolSellInfo( numItems )

                const expectedOutputWithoutFee = getTokenOutput( "cPAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedOutputWithoutFee * protocolFeeMult 

                const poolFee = expectedOutputWithoutFee * poolFeeMul

                const expectedOutput = expectedOutputWithoutFee - ( protocolFeeEspct + poolFee )

                // input value should be equal to expected value plus fees

                expect( getNumber( newStartPrice ) ).to.be.equal( startPrice - expectedOutput )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( newMultiplier )  ).to.be.equal( multiplier + numItems )

            })

        })

    })

    // get Tradde Info in Exponential Algorithm

    describe("get Buy Info Exponential algorithm", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = 3

                const multiplier = 1.2

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 100)

                const [ isValid ] = await pool.getPoolBuyInfo( numItems )

                expect( isValid ).to.be.false

            })

            it("2. should return false when new spot price is more than uint128 limit", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 50

                const startPrice = 100

                const multiplier = 5

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 100)

                const [ isValid ] = await pool.getPoolBuyInfo( numItems )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 3

                const multiplier = 1.2

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 100)

                const [ isValid, , , inputValue ] = await pool.getPoolBuyInfo( numItems )

                // check that input value is greater than 0

                expect( inputValue ).to.be.greaterThan( 0 )

                // check that is returning true in the first element

                expect( isValid ).to.be.true

            })

            it("2. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 1.5

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , , , inputValue, protocolFee ] = await pool.getPoolBuyInfo( numItems )

                const expectedInput = getTokenInput( "exponentialAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedInput *  protocolFeeMult 

                const poolFee = expectedInput * protocolFeeMult

                // input value should be equal to expected value plus fees

                expect( getNumber(inputValue) ).to.be.greaterThan( expectedInput + ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

            })

            it("4. test new spot price and new multiplier", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 3

                const multiplier = 1.7

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , newStartPrice, newMultiplier, , ] = await pool.getPoolBuyInfo( numItems )

                const multiplierPow = multiplier ** numItems

                const newExpectedStartPrice = startPrice * multiplierPow

                // input value should be equal to expected value plus fees

                expect( roundNumber( getNumber( newStartPrice ), 1000 ) ).to.be.equal( roundNumber( newExpectedStartPrice, 1000 ) )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

        })

    })

    describe("get Sell Info Exponential algorithm", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = parseEther( `1` )

                const multiplier = parseEther( `1.3` )

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 100)

                const [ isValid ] = await pool.getPoolSellInfo( numItems )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and is Valid must be true", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 1

                const multiplier = 1.3

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                const [ isValid, , , outputValue ] = await pool.getPoolSellInfo( numItems )

                // check that input value is greater than 0

                expect( outputValue ).to.be.greaterThan( 0 )

                // check if isValid value is equal to true

                expect( isValid ).to.be.true

            })

            it("2. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 4

                const multiplier = 1.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1
                
                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , , , outputValue, protocolFee ] = await pool.getPoolSellInfo( numItems )

                const expectedOutput = getTokenOutput( "exponentialAlgorithm", startPrice, multiplier, numItems )

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

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 4

                const multiplier = 1.4

                const poolFeeMul = 0.1
                
                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , newStartPrice, newMultiplier, ,  ] = await pool.getPoolSellInfo( numItems )

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

    // get Tradde Info in Linear Algorithm

    describe("get Buy Info Linear algorithm", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = 3

                const multiplier = 1.2

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.nft, 0, 100)

                const [ isValid ] = await pool.getPoolBuyInfo( numItems )

                expect( isValid ).to.be.false

            })

        })

        describe(" - Functionalities", () => {

            it("1. should return a input value and isValid must be true", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 3

                const multiplier = 0.2

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.nft, 0, 100)

                const [ isValid, , , inputValue ] = await pool.getPoolBuyInfo( numItems )

                // check that input value is greater than 0

                expect( inputValue ).to.be.greaterThan( 0 )

                // check that is returning true in the first element

                expect( isValid ).to.be.true

            })

            it("2. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 1.5

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , , , inputValue, protocolFee ] = await pool.getPoolBuyInfo( numItems )

                const expectedInput = getTokenInput( "linearAlgorithm", startPrice, multiplier, numItems )

                const protocolFeeEspct = expectedInput *  protocolFeeMult

                const poolFee = expectedInput * protocolFeeMult

                // input value should be equal to expected value plus fees

                expect( getNumber(inputValue) ).to.be.greaterThan( expectedInput + ( protocolFeeEspct + poolFee ) )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( protocolFee ) ).to.be.equal( protocolFeeEspct )

            })

            it("3. test new spot price and new multiplier", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 3

                const multiplier = 1.7

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , newStartPrice, newMultiplier, , ] = await pool.getPoolBuyInfo( numItems )

                // input value should be equal to expected value plus fees

                expect( 
                    getNumber( newStartPrice ),
                ).to.be.equal(
                    startPrice + ( multiplier * numItems ),
                )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

        })

    })

    describe("get Sell Info Linear algorithm", () => {

        describe(" - Errors", () => {

            it("1. should return false if pass invalid num of Items", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 0

                const startPrice = 1

                const multiplier = 1.3

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.nft, 0, 100)

                const [ isValid ] = await pool.getPoolSellInfo( numItems )

                expect( isValid ).to.be.false

            })

        })

        // in all this tests the num of items could substract by any number
        // becouse there are a limit of items that can be sell depending of
        // multiplier and spot price

        describe(" - Functionalities", () => {

            it("1. should return a input value and is Valid must be true", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.nft, 0, 100)

                const [ isValid, , , outputValue ] = await pool.getPoolSellInfo( numItems )

                // check that input value is greater than 0

                expect( outputValue ).to.be.greaterThan( 0 )

                // check if isValid value is equal to true

                expect( isValid ).to.be.true

            })

            it("3. test input Value with fees and returnal protocol Fee Amount", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 0.4

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , , , outputValue, protocolFee ] = await pool.getPoolSellInfo( numItems )

                const expectedOutput = getTokenOutput( "linearAlgorithm", startPrice, multiplier, numItems )

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

            it("4. test new Start Price and new multiplier", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 5

                const multiplier = 0.2

                const poolFeeMul = 0.1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, poolFeeMul, 100)

                const [ , newStartPrice, newMultiplier, ,  ] = await pool.getPoolSellInfo( numItems )

                const decrease = multiplier * numItems

                // input value should be equal to expected value plus fees

                expect(
                    getNumber(newStartPrice)
                ).to.be.equal(
                    startPrice - decrease
                )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

            // in liniar Algorithm the new spot price for sell is spot price - decrease
            // so when the drease is grater than spot price this will throw an 
            // UnderFlow erro so to handle this theres a limit in the items
            // that pool can sell

            it("4. test when decrease is greater then start Price", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                // try to sell 10 NFTs

                const numItems = 10

                const startPrice = 1

                const multiplier = 0.5

                const poolFeeMul = 0

                const protocolFeeMult = getNumber( await metaFactory.PROTOCOL_FEE() )

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.nft, poolFeeMul, 100)

                const [ , newStartPrice, newMultiplier, outputValue,  ] = await pool.getPoolSellInfo( numItems )

                // in this spot price and multiplier the max of items that the pool
                // can sell is 2 becouse 0.5 * 2 is 1 ( the current spot price )

                const expectedOutputWithOutFee = getTokenOutput("linearAlgorithm", startPrice, multiplier, 2)

                const amountOut = expectedOutputWithOutFee - ( expectedOutputWithOutFee * protocolFeeMult )

                const decrease = multiplier * 2

                // check that output is the same than expected

                expect( getNumber( outputValue ) ).to.be.equal( amountOut )

                // input value should be equal to expected value plus fees

                expect(
                    getNumber(newStartPrice)
                ).to.be.equal(
                    startPrice - decrease
                )

                // raturnal protocol fee should be the same than expected

                expect( getNumber( newMultiplier ) ).to.be.equal( multiplier )

            })

        })

    })

    describe("get NFT IDs", () => {

        describe(" - Functionalities", () => {

            it("1. prove Not NFT Enumerable IDs array updating", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getTokenOutput("linearAlgorithm", startPrice, multiplier, numItems)

                const { pool, tokenIds } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, 0.1, tokenAmount)

                const ownerNFTs = await mintNFT(nft, 5, pool)
                
                
                // update ( use getNumberForBNArray ? for BN Array )

                // the pool must have the initial NFTs
                
                expect(
                    await pool.getNFTIds()
                ).to.deep.equal(
                    tokenIds
                )

                await pool.swapNFTsForToken(
                    ownerNFTs,
                    0,
                    owner.address
                )

                // check that poolNFTs is equal to initial NFTs + swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds())).to.deep.equal(tokenIds.concat(ownerNFTs))

                await pool.swapTokenForNFT(
                    tokenIds,
                    parseEther("100"),
                    owner.address,
                    { value: parseEther("100") }
                )

                // check that poolNFTs are equal to current NFTs - swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds()).sort()).to.deep.equal(ownerNFTs)

            })

            it("2. prove NFT Enumerable IDs array updating", async () => {

                const { metaFactory, NFTEnumerable, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getTokenOutput("linearAlgorithm", startPrice, multiplier, numItems)

                const { pool, tokenIds } = await createPool(metaFactory, NFTEnumerable, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, 0.1, tokenAmount)

                const ownerNFTs = await mintNFT(NFTEnumerable, 5, pool)

                // pool must have the initial NFTs

                expect(
                    getNumberForBNArray(await pool.getNFTIds())
                ).to.deep.equal(
                    tokenIds
                )

                await pool.swapNFTsForToken(
                    ownerNFTs,
                    0,
                    owner.address
                )

                // check that poolNFTs is equal to initial NFTs + swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds())).to.deep.equal(tokenIds.concat(ownerNFTs))

                await pool.swapTokenForNFT(
                    tokenIds,
                    parseEther("100"),
                    owner.address,
                    { value: parseEther("100") }
                )

                // check that poolNFTs are equal to current NFTs - swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds()).sort()).to.deep.equal(ownerNFTs)

            })

            it("3. Should return an empty array when pool doesn't have NFTs ( Enumerable Test )", async () => {

                const { metaFactory, NFTEnumerable, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getTokenOutput("linearAlgorithm", startPrice, multiplier, numItems)

                // in pool type Sell the contract has no NFTs

                const { pool } = await createPool(metaFactory, NFTEnumerable, numItems, startPrice, multiplier, linearAlgorithm, poolType.token, 0, tokenAmount)

                // returnal value should be and empty Array

                expect( await pool.getNFTIds() ).to.deep.equal( [] )

            })

            it("4. Should return an empty array when pool doesn't have NFTs ( NFT basic Test )", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getTokenOutput("linearAlgorithm", startPrice, multiplier, numItems)

                // in pool type Sell the contract has no NFTs

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.token, 0, tokenAmount)

                // returnal value should be and empty Array

                expect( await pool.getNFTIds() ).to.deep.equal( [] )

            })

            it("5. prove Not NFT Enumerable IDs array updating ( IN ANY NFT SWAP )", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getTokenOutput("linearAlgorithm", startPrice, multiplier, numItems)

                const { pool, tokenIds } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, 0.1, tokenAmount)

                const ownerNFTs = await mintNFT(nft, 5, pool)

                // pool must have the initial NFTs

                expect(
                    getNumberForBNArray(await pool.getNFTIds())
                ).to.deep.equal(
                    tokenIds
                )

                await pool.swapNFTsForToken(
                    ownerNFTs,
                    0,
                    owner.address
                )

                // check that poolNFTs is equal to initial NFTs + swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds())).to.deep.equal(tokenIds.concat(ownerNFTs))

                await pool.swapTokenForAnyNFT(
                    tokenIds.length,
                    parseEther("100"),
                    owner.address,
                    { value: parseEther("100") }
                )

                // check that poolNFTs are equal to current NFTs - swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds()).sort()).to.deep.equal(ownerNFTs)

            })

            it("6. prove NFT Enumerable IDs array updating ( IN ANY NFT SWAP )", async () => {

                const { metaFactory, NFTEnumerable, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getTokenOutput("linearAlgorithm", startPrice, multiplier, numItems)

                const { pool, tokenIds } = await createPool(metaFactory, NFTEnumerable, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, 0.1, tokenAmount)

                const ownerNFTs = await mintNFT(NFTEnumerable, 5, pool)

                // pool must have 

                expect(
                    getNumberForBNArray(await pool.getNFTIds())
                ).to.deep.equal(
                    tokenIds
                )

                await pool.swapNFTsForToken(
                    ownerNFTs,
                    0,
                    owner.address
                )

                // check that poolNFTs is equal to initial NFTs + swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds())).to.deep.equal(tokenIds.concat(ownerNFTs))

                await pool.swapTokenForAnyNFT(
                    tokenIds.length,
                    parseEther("100"),
                    owner.address,
                    { value: parseEther("100") }
                )

                // check that poolNFTs are equal to current NFTs - swap NFTs

                expect(getNumberForBNArray(await pool.getNFTIds() ).sort()).to.deep.equal(ownerNFTs)

            })

        })

    })

    describe("get Assets Recipient", () => {

        describe(" - Functionalities", () => {

            it("1. Should return an address in Sell pool", async () => {

                const { metaFactory, NFTEnumerable, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 0.1, linearAlgorithm, poolType.token, 0, 0)

                expect(await pool.getAssetsRecipient()).to.be.equal(owner.address)

            })

            it("2. Should return an address in Buy pool", async () => {

                const { metaFactory, NFTEnumerable, cPAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 0.1, cPAlgorithm, poolType.nft, 0, 0)

                expect(await pool.getAssetsRecipient()).to.be.equal(owner.address)

            })

            it("3. Should return the pool address in trade pool", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, 0.1, 10)

                expect(await pool.getAssetsRecipient()).to.be.equal(pool.address)

            })

        })

    })

    describe("get Algorithm", () => {

        describe(" - Functionalities", () => {

            it("1. should return 'Constant product' info, in a pool with this algorithm", async () => {

                const { cPAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const initialPrice = 5

                const startPrice = numItems * initialPrice

                const multiplier = numItems + 1

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const [ algorithm, algorithmName ] = await pool.getAlgorithmInfo()

                expect( algorithm ).to.be.equal( cPAlgorithm.address )

                expect( algorithmName ).to.be.equal( "Constant Product" )
                
            })

            it("2. should return 'Exponential' info, in a pool with this algorithm", async () => {

                const { exponentialAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 1

                const multiplier = 1.5

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                const [ algorithm, algorithmName ] = await pool.getAlgorithmInfo()

                expect( algorithm ).to.be.equal( exponentialAlgorithm.address )

                expect( algorithmName ).to.be.equal( "Exponential" )
                
            })

            it("3. should return 'Linear' info, in a pool with this algorithm", async () => {

                const { linearAlgorithm, metaFactory, nft } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const startPrice = 1

                const multiplier = 1.5

                const { pool } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.nft, 0, 0)

                const [ algorithm, algorithmName ] = await pool.getAlgorithmInfo()

                expect( algorithm ).to.be.equal( linearAlgorithm.address )

                expect( algorithmName ).to.be.equal( "Linear" )
                
            })
        })
        
    })

    describe("get Pool Info", () => {

        describe(" - Functionalities", () => {

            it("1. should return the pool info", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const multiplier = 1.5

                const startPrice = 5

                const tradeFee = 0.1

                const { pool, tokenIds } = await createPool(metaFactory, NFTEnumerable, 10, startPrice, multiplier, exponentialAlgorithm, poolType.trade, tradeFee, 10)

                const [
                    poolMultiplier,
                    poolStartPrice,
                    poolTradeFee,
                    poolNft,
                    poolNFTs,
                    poolAlgorithm,
                    poolAlgorithmName,
                    poolPoolType,
                ] = await pool.getPoolInfo()

                // check returnal values are the correct

                expect( getNumber( poolMultiplier )).to.be.equal( multiplier )

                expect( getNumber( poolStartPrice )).to.be.equal( startPrice )

                expect( getNumber( poolTradeFee )).to.be.equal( tradeFee )

                expect( poolNft ).to.be.equal( NFTEnumerable.address )

                expect( poolNFTs ).to.deep.equal( tokenIds )

                expect( poolAlgorithm ).to.be.equal( exponentialAlgorithm.address )

                expect( poolAlgorithmName ).to.be.equal( "Exponential" )

                expect( poolPoolType ).to.be.equal( poolType.trade )

            })

        })
    
    })

    describe("init", () => {

        describe(" - Errors", () => {

            it("1. should fail if is called after initialation", async () => {

                const { metaFactory, nft, linearAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, nft, 0, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                await expect(
                    pool.init(
                        2,
                        40000,
                        otherAccount.address,
                        otherAccount.address,
                        nft.address,
                        500000,
                        linearAlgorithm.address,
                        poolType.token
                    )).to.be.revertedWith("Pool it's already initialized")

            })

        })

        describe(" - Functionalities", () => {

            it("1. factory should create a new pool type Buy", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                const tx = await metaFactory.createPool(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    owner.address,
                    0,
                    linearAlgorithm.address,
                    poolType.nft
                )


                const newPoolInfo = await getEventLog(tx, "NewPool")

                expect(ethers.utils.isAddress(newPoolInfo.pool)).to.be.true
                expect(newPoolInfo.owner).to.be.equal(owner.address)

            })

            it("2. check initial info for Buy pool", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const initialNFTs = 10

                const { pool } = await createPool(metaFactory, nft, initialNFTs, 1, 0.5, linearAlgorithm, poolType.nft, 0, 0)

                const nftBalance = await nft.balanceOf(pool.address)

                // check NFT balance

                expect(nftBalance).to.be.equal( initialNFTs )

                // check multiplier 

                expect(await pool.multiplier()).to.be.equal(ethers.utils.parseEther("0.5"))

                // check startPrice 

                expect(await pool.startPrice()).to.be.equal(ethers.utils.parseEther("1"))

                // check trade fee

                expect(await pool.tradeFee()).to.be.equal(0)

                // check rewards recipent

                expect(await pool.recipient()).to.be.equal(owner.address)

                // check nft collection address

                expect(await pool.NFT()).to.be.equal(nft.address)

                // check the pool factory

                expect(await pool.factory()).to.be.equal(metaFactory.address)

                // check poolType

                expect(await pool.currentPoolType()).to.be.equal(poolType.nft)

                // check the prices Algorithm

                expect(await pool.Algorithm()).to.be.equal(linearAlgorithm.address)

            })

            it("3. check initial info for token pool", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 0, 1, 1.5, exponentialAlgorithm, poolType.token, 0, 10)

                const tokenBalance = await provider.getBalance(pool.address)

                expect(tokenBalance).to.be.equal(ethers.utils.parseEther("10"))

                // check multiplier 

                expect(await pool.multiplier()).to.be.equal(ethers.utils.parseEther("1.5"))

                // check startPrice 

                expect(await pool.startPrice()).to.be.equal(ethers.utils.parseEther("1"))

                // check trade fee

                expect(await pool.tradeFee()).to.be.equal(0)

                // check rewards recipent

                expect(await pool.recipient()).to.be.equal(owner.address)

                // check nft collection address

                expect(await pool.NFT()).to.be.equal(NFTEnumerable.address)

                // check the pool factory

                expect(await pool.factory()).to.be.equal(metaFactory.address)

                // check poolType

                expect(await pool.currentPoolType()).to.be.equal(poolType.token)

                // check the prices Algorithm

                expect(await pool.Algorithm()).to.be.equal(exponentialAlgorithm.address)


            })

            it("4. check initial info for trade pool", async () => {

                const { metaFactory, nft, cPAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, cPAlgorithm, poolType.trade, 0.1, 10)

                const nftBalance = await nft.balanceOf(pool.address)

                const tokenBalance = await provider.getBalance(pool.address)

                expect(tokenBalance).to.be.equal(ethers.utils.parseEther("10"))

                expect(nftBalance).to.be.equal(10)

                // check multiplier 

                expect(await pool.multiplier()).to.be.equal(ethers.utils.parseEther("0.5"))

                // check startPrice 

                expect(await pool.startPrice()).to.be.equal(ethers.utils.parseEther("1"))

                // check trade fee

                expect(await pool.tradeFee()).to.be.equal(ethers.utils.parseEther("0.1"))

                // check rewards recipent

                expect(await pool.recipient()).to.be.equal(ethers.constants.AddressZero)

                // check nft collection address

                expect(await pool.NFT()).to.be.equal(nft.address)

                // check the pool factory

                expect(await pool.factory()).to.be.equal(metaFactory.address)

                // check poolType

                expect(await pool.currentPoolType()).to.be.equal(poolType.trade)

                // check the prices Algorithm

                expect(await pool.Algorithm()).to.be.equal(cPAlgorithm.address)


            })

            it("5. should create a new Enumerable pool", async () => {

                const { metaFactory, NFTEnumerable, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool, tokenIds } = await createPool(metaFactory, NFTEnumerable, 10, 5, 0.5, linearAlgorithm, poolType.nft, 0, 0)

                const nftIds = await pool.getNFTIds()

                // NFT address should be the passed nft Addres

                expect(await pool.NFT()).to.be.equal(NFTEnumerable.address)

                // check than pool NFTs are the same that was sended to pool

                expect(getNumberForBNArray(nftIds)).to.deep.equal(tokenIds)

            })

        })

    })

    describe("swap NFTs For Token", () => {

        describe(" - Errors", () => {

            it("1. should fail if pool is type Buy", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("2")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.swapNFTsForToken(
                        [tokenIds[0]],
                        minExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Cannot sell on buy-type pool")

            })

            it("2. should fail if pool have insufficient ETH founds", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 0)

                await expect(
                    pool.swapNFTsForToken(
                        [1],
                        minExpected,
                        owner.address
                    )
                ).to.be.revertedWith("insufficient token balance")

            })

            it("3. should fail if pass cero items", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 0)

                await expect(
                    pool.swapNFTsForToken(
                        [],
                        minExpected,
                        owner.address
                    )
                ).to.be.reverted

            })

            it("4. should fail if output is less than min expected", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                await expect(
                    pool.swapNFTsForToken(
                        [tokenIds[0]],
                        minExpected,
                        owner.address
                    )
                ).to.be.revertedWith("output amount is les than min expected")

            })

            it("5. should fail if user doesn't have the nft", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                await expect(
                    pool.swapNFTsForToken(
                        [1],
                        minExpected,
                        owner.address
                    )
                ).to.be.reverted

            })

        })

        describe(" - Functionalities", () => {

            it("1. should swap NFTs to token", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("0.9")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                const recipient = await pool.getAssetsRecipient()

                const idsBefore = await pool.getNFTIds()

                const expectedOutput = getTokenOutput( "linearAlgorithm", 1, 0.5, 1 )

                const protocolFee = getNumber(await metaFactory.PROTOCOL_FEE())
                
                const feeCharged = parseEther( `${ expectedOutput * protocolFee }`)
                
                // in not trade pools all input assets will be sent to pool owner

                expect(recipient).to.be.equal(owner.address)

                expect(idsBefore.length).to.be.equal(0)

                const ownerBalanceBefore = await owner.getBalance()

                const tx = await pool.swapNFTsForToken([tokenIds[0]], minExpected, owner.address)

                const reciept = await tx.wait()

                const gasUsed = reciept.gasUsed.mul( reciept.effectiveGasPrice )

                const ownerBalanceAfter = await owner.getBalance()

                const { amountOut } = await getEventLog(tx, "SellLog")

                const nftOwner = await nft.ownerOf(tokenIds[0])

                // the balance after should be the amount out ( the amount out generated by de event
                // is the amount out + protocol fee ) so we subtract it 
                // also in the balance before we add the gas used in tx for more precition

                expect(
                    ownerBalanceAfter.add(gasUsed)
                ).to.be.equal(
                    ownerBalanceBefore.add(amountOut.sub( feeCharged ))
                )

                expect(nftOwner).to.be.equal(recipient)

                // check if the fee was sended to the protocol recipient

            })

            it("2. should pay the protocol fee", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("0.9")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                const expectedOutput = getTokenOutput( "linearAlgorithm", 1, 0.5, 1 )

                const protocolFee = getNumber(await metaFactory.PROTOCOL_FEE())
                
                const feeCharged = parseEther( `${ expectedOutput * protocolFee }`)
                
                // in not trade pools all input assets will be sent to pool owner

                const idsBefore = await pool.getNFTIds()

                expect(idsBefore.length).to.be.equal(0)

                const facotryBalanceBefore = await provider.getBalance( 
                    await metaFactory.PROTOCOL_FEE_RECIPIENT() 
                    )

                await pool.swapNFTsForToken([tokenIds[0]], minExpected, owner.address)

                const facotryBalanceAfter = await provider.getBalance( 
                    await metaFactory.PROTOCOL_FEE_RECIPIENT() 
                    )

                // check if the fee was sended to the protocol recipient

                expect( 
                    facotryBalanceBefore.add( feeCharged ) 
                ).to.be.equal(
                    facotryBalanceAfter
                )

            })

        })

    })

    describe("swap token For specific NFTs", () => {

        describe(" - Errors", () => {

            it("1. should fail if poolType is token", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.token, 0, 0)

                await expect(
                    pool.swapTokenForNFT(
                        [tokenIds[0]],
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Cannot sell on sell-type pool")

            })

            it("2. should fail if pool doesn't have the sufficient NFT balance", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, 0)

                // the pair has 10 NFTs we add 1 more to generate the error

                tokenIds.push( tokenIds[ tokenIds.length - 1] + 1)

                await expect(
                    pool.swapTokenForNFT(
                        tokenIds,
                        minExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Insufficient NFT balance")

            })

            it("3. should fail when algorithm can calculate the price", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const { pool } = await createPool(metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.swapTokenForNFT(
                        [],
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Algorithm Error")

            })

            it("4. should fail if input amount is greater than expected", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("1.5")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.swapTokenForNFT(
                        [tokenIds[0]],
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("input amount is greater than max expected")


            })

            it("5. should fail if pass less amount of ETH than needed", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("1.6")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.swapTokenForNFT(
                        [tokenIds[0]],
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("insufficient amount of ETH")


            })

        })

        describe(" - Functionalities", () => {

            it("1. should swap a amount of tokens ", async () => {

                const { metaFactory, nft, owner, otherAccount, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("1.6")

                const startPrice = 1

                const multiplier = 1.5

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getTokenInput("exponentialAlgorithm", startPrice, multiplier, 1)

                const poolFee = getNumber(await metaFactory.PROTOCOL_FEE())

                const ownerBalanceBefore = await owner.getBalance()

                const poolBalanceBefore = await provider.getBalance(pool.address)

                expect(poolBalanceBefore).to.be.equal(0)

                const tx = await pool.connect(otherAccount).swapTokenForNFT(
                    [tokenIds[0]],
                    maxExpected,
                    otherAccount.address,
                    { value: maxExpected }
                )

                const ownerBalanceAfer = await owner.getBalance()

                const poolBalanceAfter = await provider.getBalance(pool.address)

                const { amountIn } = await getEventLog(tx, "BuyLog")

                const feeCharged = parseEther( `${ expectedInput * poolFee }`)

                // check than after pool swap in not trade pools the pool dont keep any asset

                expect(poolBalanceAfter).to.be.equal(0)

                // check if the amount that came out is equal to what was expected

                expect(getNumber(amountIn)).to.be.equal(expectedInput + (expectedInput * poolFee))

                // verify if assets were send to the owne

                expect(
                    ownerBalanceBefore.add(amountIn.sub( feeCharged ))
                ).to.be.equal(
                    ownerBalanceAfer
                )

            })

            it("2. should should pay a fee", async () => {

                const { metaFactory, nft, owner, cPAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("3")

                const nftAmount = 10

                const startPrice = nftAmount + 1 // token balance ( nftAmount + 1)

                const multiplier = nftAmount * 1   // nft balance ( nftAmount * startPrice )

                const { pool, tokenIds } = await createPool(metaFactory, nft, nftAmount, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getTokenInput("cPAlgorithm", startPrice, multiplier, 2)

                const fee = getNumber(await metaFactory.PROTOCOL_FEE())

                const feeRecipient = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                const recipientBalanceBefore = getNumber(await provider.getBalance(feeRecipient))

                await pool.swapTokenForNFT(
                    [tokenIds[0], tokenIds[1]],
                    maxExpected,
                    owner.address,
                    { value: maxExpected }
                )

                const recipientBalanceAfter = getNumber(await provider.getBalance(feeRecipient))

                expect(expectedInput * fee).to.be.equal(recipientBalanceAfter - recipientBalanceBefore)

            })

        })

    })

    describe("swap token For any NFTs", () => {

        describe(" - Errors", () => {

            it("1. should fail if poolType is sell", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const startPrice = 1

                const multiplier = 0.5

                const { pool } = await createPool(metaFactory, nft, 10, startPrice, multiplier, linearAlgorithm, poolType.token, 0, 0)

                await expect(
                    pool.swapTokenForAnyNFT(
                        3,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Cannot sell on sell-type pool")

            })

            it("2. should fail if pool doesn't have the sufficient NFT balance", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, 0)

                // the pair has 10 NFTs we add 1 more to generate the error

                await expect(
                    pool.swapTokenForAnyNFT(
                        11, // try to buy 11 NFTs
                        minExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Insufficient NFT balance")

            })

            it("3. should fail if in Algorithm error", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const startPrice = 1

                const multiplier = 1.5

                const { pool } = await createPool(metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.swapTokenForAnyNFT(
                        0,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Algorithm Error")

            })

            it("4. should fail if input amount is greater than expected", async () => {

                const { metaFactory, nft, cPAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("2.7")

                const numItem = 10

                const startPrice = numItem + 1

                const multiplier = numItem * 1

                const { pool } = await createPool(metaFactory, nft, numItem, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.swapTokenForAnyNFT(
                        2,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("input amount is greater than max expected")


            })

            it("5. should fail if pass less amount of ETH than needed", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const startPrice = 1

                const multiplier = 1.5

                const { pool } = await createPool(metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(
                    pool.swapTokenForAnyNFT(
                        2,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("insufficient amount of ETH")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should swap a amount of tokens ", async () => {

                const { metaFactory, nft, owner, otherAccount, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("1.6")

                const startPrice = 1

                const multiplier = 1.5

                const { pool } = await createPool(metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getTokenInput("exponentialAlgorithm", startPrice, multiplier, 1)

                const ownerBalanceBefore = await owner.getBalance()

                const assetRecipiet = await pool.getAssetsRecipient()

                const recipientBalanceBefore = getNumber(await provider.getBalance(assetRecipiet))

                // check than pool have balance 0

                expect(await provider.getBalance(pool.address)).to.be.equal(0)

                const tx = await pool.connect(otherAccount).swapTokenForAnyNFT(
                    1,
                    maxExpected,
                    otherAccount.address,
                    { value: maxExpected }
                )

                // check than pool keeps balance 0

                expect(await provider.getBalance(pool.address)).to.be.equal(0)

                const ownerBalanceAfer = await owner.getBalance()

                const recipientBalanceAfter = getNumber(await provider.getBalance(assetRecipiet))

                const { amountIn } = await getEventLog(tx, "BuyLog")

                const protocolFee = getNumber(await metaFactory.PROTOCOL_FEE())

                const feeCharged = parseEther( `${ expectedInput * protocolFee }`)

                // check if input amount was sended to assets repient ( only in not trade pools )

                expect(expectedInput).to.be.equal(recipientBalanceAfter - recipientBalanceBefore)

                // check if the amount that came out is equal to what was expected

                expect(getNumber(amountIn)).to.be.equal(expectedInput + (expectedInput * protocolFee))

                // check if amount In was sended to pool assets recipient ( only for not trade pools )

                // in the amount in rest the protocol fee

                expect(
                    ownerBalanceBefore.add(amountIn.sub( feeCharged ))
                ).to.be.equal(
                    ownerBalanceAfer
                )

            })

            it("2. should pay a protocol fee", async () => {

                const { metaFactory, nft, owner, cPAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("3")

                const nftAmount = 10

                const startPrice = nftAmount + 1 // token balance ( nftAmount + 1)

                const multiplier = nftAmount * 1   // nft balance ( nftAmount * startPrice )

                const { pool } = await createPool(metaFactory, nft, nftAmount, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getTokenInput("cPAlgorithm", startPrice, multiplier, 2)

                const fee = getNumber(await metaFactory.PROTOCOL_FEE())

                const feeRecipient = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                const recipientBalanceBefore = getNumber(await provider.getBalance(feeRecipient))


                await pool.swapTokenForAnyNFT(
                    2,
                    maxExpected,
                    owner.address,
                    { value: maxExpected }
                )

                const recipientBalanceAfter = getNumber(await provider.getBalance(feeRecipient))

                // check if was sended to pool owner

                expect(recipientBalanceAfter - recipientBalanceBefore).to.be.equal(expectedInput * fee)

            })

            it("3. should should pay a pool fee", async () => {

                const { metaFactory, nft, owner, cPAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("3.0525")

                const nftAmount = 10

                const startPrice = nftAmount + 1 // token balance ( nftAmount + 1)

                const multiplier = nftAmount * 1   // nft balance ( nftAmount * startPrice )

                const { pool } = await createPool(metaFactory, nft, nftAmount, startPrice, multiplier, cPAlgorithm, poolType.trade, 0.1, 10)

                const expectedInput = getTokenInput("cPAlgorithm", startPrice, multiplier, 2)

                const feeRecipient = await pool.getAssetsRecipient()

                const tradeFee = getNumber(await pool.tradeFee())

                // in trade pool assents recipient should be the same address than the pool

                expect(feeRecipient).to.be.equal(pool.address)

                const recipientBalanceBefore = getNumber(await provider.getBalance(feeRecipient))

                await pool.swapTokenForAnyNFT(
                    2,
                    maxExpected,
                    owner.address,
                    { value: maxExpected }
                )

                const recipientBalanceAfter = getNumber(await provider.getBalance(feeRecipient))

                // check if current balance is equal to the amount puls trade fee

                // is multiplied by 1000 to handle javaScript precition errors and the divided

                expect(
                    ((recipientBalanceAfter * 1000) - (recipientBalanceBefore * 1000)) / 1000
                ).to.be.equal(
                    expectedInput + (expectedInput * tradeFee)
                )

            })

        })

    })

    describe("withdraw Token", () => {

        describe(" - Errors", () => {

            it("1. should fail when not owner try to withdraw", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.token, 0, 10)

                await expect(pool.connect(otherAccount).withdrawTokens()).to.be.reverted

            })

            it("2. should fail if contract have insufficient founds", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                await expect(pool.withdrawTokens()).to.be.revertedWith("insufficient balance")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should withdraw contract balance", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.token, 0, 10)

                const currentBalance = await provider.getBalance(pool.address)

                const ownerBalanceBefore = await owner.getBalance()

                // check than current balance is not cero

                expect(currentBalance).to.be.greaterThan(0)

                const tx = await pool.withdrawTokens()

                const receipt = await tx.wait()

                const gasUsed = receipt.gasUsed.mul( receipt.effectiveGasPrice )

                const ownerBalanceAfter = await owner.getBalance()

                // check that contract balance was sended to owner
                // is rounded to hamdle gas cost

                expect(ownerBalanceBefore.add(currentBalance)).to.be.equal(ownerBalanceAfter.add(gasUsed))

                // chack that the contract balance is 0

                expect(await provider.getBalance(pool.address)).to.be.equal(0)

            })

        })

    })

    describe("withdraw NFTs", () => {

        describe(" - Errors", () => {

            it("1. should fail if a not owner tries to withdraw", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pool, tokenIds } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                expect(pool.connect(otherAccount).withdrawNFTs(NFTEnumerable.address, tokenIds)).to.be.reverted

            })

            it("2. should fail if pool doesn't have the NFTs", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                // the pool is type token so in the initial time it doesn't have NFTs

                const { pool, tokenIds } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.token, 0, 0)

                expect(pool.withdrawNFTs(NFTEnumerable.address, tokenIds)).to.be.reverted

            })

        })

        describe(" - Functionalities", () => {

            it("1. should withdraw Not Enumerable NFT and update Pool NFT IDs", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                // check stored NFT IDs and current NFT Balance

                expect(await pool.getNFTIds()).to.deep.equal(tokenIds)

                expect(await nft.balanceOf(pool.address)).to.be.equal(tokenIds.length)

                // check that owner don't have NFTs before withdrown

                expect(await nft.balanceOf(owner.address)).to.be.equal(0)


                await pool.withdrawNFTs(nft.address, tokenIds)

                // after withdrawn NFT Balance must be 0

                expect(await nft.balanceOf(pool.address)).to.be.equal(0)

                // check pool owner NFT balance

                expect(await nft.balanceOf(owner.address)).to.be.equal(tokenIds.length)

                // check the stored NFT IDs array

                expect(await pool.getNFTIds()).to.deep.equal([])

            })

            it("2. should withdraw Enumerable NFTs", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool, tokenIds } = await createPool(metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0)

                // check stored NFT IDs and current NFT Balance

                expect(await pool.getNFTIds()).to.deep.equal(tokenIds)

                expect(await NFTEnumerable.balanceOf(pool.address)).to.be.equal(tokenIds.length)

                // check that owner don't have NFTs before withdrown

                expect(await NFTEnumerable.balanceOf(owner.address)).to.be.equal(0)


                await pool.withdrawNFTs(NFTEnumerable.address, tokenIds)

                // after withdrawn NFT Balance must be 0

                expect(await NFTEnumerable.balanceOf(pool.address)).to.be.equal(0)

                // check pool owner NFT balance

                expect(await NFTEnumerable.balanceOf(owner.address)).to.be.equal(tokenIds.length)

                // check the stored NFT IDs array

                expect(await pool.getNFTIds()).to.deep.equal([])

            })

        })

    })

    describe("Events", () => {

        describe(" - Functionalities", () => {

            it("SellLog", async () => {

                const { metaFactory, owner, nft, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("0.9")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 10, 0.5, linearAlgorithm, poolType.token, 0, 77.5)

                const expectedOutputWithoutFee = getTokenOutput("linearAlgorithm", 10, 0.5, 10)

                const protocolFee = getNumber(await metaFactory.PROTOCOL_FEE())

                const expextedOut = expectedOutputWithoutFee - (expectedOutputWithoutFee * protocolFee)

                await expect(
                    pool.swapNFTsForToken(
                        tokenIds,
                        minExpected,
                        owner.address
                    )
                ).to.emit(pool, "SellLog")
                    .withArgs(owner.address, tokenIds.length, parseEther(`${expextedOut}`))

            })

            it("BuyLog", async () => {

                const { metaFactory, owner, nft, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("100")

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, 10)

                const inputWithoutFee = getTokenInput("linearAlgorithm", 1, 0.5, 10)

                const protocolFee = getNumber(await metaFactory.PROTOCOL_FEE())

                const amountIn = inputWithoutFee + (inputWithoutFee * protocolFee)

                await expect(
                    pool.swapTokenForNFT(
                        tokenIds,
                        maxExpected,
                        owner.address,
                        { value: parseEther(`${amountIn}`) }
                    )
                ).to.emit(pool, "BuyLog")
                    .withArgs(owner.address, parseEther(`${amountIn}`), tokenIds.length)

            })

            it("NewStartPrice", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                const newStartPrice = parseEther("0.5")

                await expect(
                    pool.setStartPrice(
                        newStartPrice,
                    )
                ).to.emit(pool, "NewStartPrice")
                    .withArgs(newStartPrice)

                // in a sell in linear algorithm should change the start price

                await expect(
                    pool.swapNFTsForToken(
                        [tokenIds[0]],
                        0,
                        owner.address
                    )
                ).to.emit(pool, "NewStartPrice")

            })

            it("NewMultiplier", async () => {

                const { metaFactory, nft, cPAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const numItems = 10

                const multiplier = numItems + 1

                const startPrice = numItems * 1

                const { pool, tokenIds } = await createPool(metaFactory, nft, numItems, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 10)

                const inputWithoutFee = getTokenInput("linearAlgorithm", 1, 0.5, 10)

                const protocolFee = getNumber(await metaFactory.PROTOCOL_FEE())

                const amountIn = inputWithoutFee + (inputWithoutFee * protocolFee)

                const newMultiplier = parseEther("0.2")

                await expect(
                    pool.swapTokenForNFT(
                        [tokenIds[0]],
                        parseEther("100"),
                        owner.address,
                        { value: parseEther(`${ amountIn }`) }
                    )
                ).to.emit(pool, "NewMultiplier")

                await expect(
                    pool.setMultiplier(
                        newMultiplier,
                    )
                ).to.emit(pool, "NewMultiplier")
                    .withArgs(newMultiplier)

            })

            it("NewAssetsRecipient", async () => {

                const { metaFactory, otherAccount, nft, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                await expect(
                    pool.setAssetsRecipient(
                        otherAccount.address,
                    )
                ).to.emit(pool, "NewAssetsRecipient")
                    .withArgs(otherAccount.address)

            })

            it("NewTradeFee", async () => {

                const { metaFactory, nft, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.trade, 0, 10)

                const newFee = parseEther("0.5")

                await expect(
                    pool.setTradeFee(
                        newFee,
                    )
                ).to.emit(pool, "NewTradeFee")
                    .withArgs(newFee)

            })

            it("TokenWithdrawal", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const amountOfETH = 10

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, amountOfETH)

                await expect(
                    pool.withdrawTokens()
                ).to.emit(pool, "TokenWithdrawal")
                    .withArgs(owner.address, parseEther(`${amountOfETH}`))

            })

            it("NFTWithdrawal", async () => {

                const { metaFactory, nft, NFTEnumerable, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const amountOfETH = 10

                const poolBasic = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, amountOfETH)

                const poolEnum = await createPool(metaFactory, NFTEnumerable, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, amountOfETH)

                await expect(
                    poolBasic.pool.withdrawNFTs(
                        nft.address,
                        poolBasic.tokenIds
                    )
                ).to.emit(poolBasic.pool, "NFTWithdrawal")
                    .withArgs(owner.address, poolBasic.tokenIds.length)

                await expect(
                    poolEnum.pool.withdrawNFTs(
                        NFTEnumerable.address,
                        poolEnum.tokenIds
                    )
                ).to.emit(poolEnum.pool, "NFTWithdrawal")
                    .withArgs(owner.address, poolEnum.tokenIds.length)

            })

            it("TokenDeposit", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const amountOfETH = 10

                const { pool } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, amountOfETH)

                await expect(
                    owner.sendTransaction({
                        to: pool.address,
                        value: amountOfETH
                    })
                ).to.emit(pool, "TokenDeposit")
                    .withArgs(amountOfETH)

            })

            it("NFTDeposit", async () => {

                const { metaFactory, nft, NFTEnumerable, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const amountOfETH = 10

                const { pool, tokenIds } = await createPool(metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, amountOfETH)

                await expect(
                    nft.functions['safeTransferFrom(address,address,uint256)'](
                        owner.address,
                        pool.address,
                        tokenIds[0]
                    )
                ).to.emit(pool, "NFTDeposit")
                    .withArgs(nft.address, tokenIds[0])

                const enumerable = await createPool(metaFactory, NFTEnumerable, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, amountOfETH)

                await expect(
                    NFTEnumerable.functions['safeTransferFrom(address,address,uint256)'](
                        owner.address,
                        enumerable.pool.address,
                        enumerable.tokenIds[0]
                    )
                ).to.emit(enumerable.pool, "NFTDeposit")
                    .withArgs(NFTEnumerable.address, enumerable.tokenIds[0])

            })

        })

    })

});
