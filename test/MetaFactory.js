const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
    poolType, 
    getEventLog, 
    mintNFT, 
    sendBulkNfts,
    deployMetaFactory
} = require("../utils/tools" )
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const NFT_ABI = require("../utils/nftABI")
const { parseEther } = ethers.utils
const provider = ethers.provider

describe("MetaFactory", function () {

    describe("Create pair", () => {

        describe(" - Errors", () => {

            it("1. should fail if passed Algorithm isn't alowed", async () => {

                const { metaFactory, nft, owner } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    owner.address,
                    0,
                    owner.address,
                    poolType.nft
                )).to.be.revertedWith( "invalid Algorithm" )

            })

            it("2. should fail if not trade fee pass a not cero fee", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    owner.address,
                    10000,
                    linearAlgorithm.address,
                    poolType.nft
                )).to.be.revertedWith( "invalid init params" )
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    owner.address,
                    10000,
                    linearAlgorithm.address,
                    poolType.token
                )).to.be.revertedWith( "invalid init params" )

            })

            it("3. should fail if trade fee pass recipient and fee exceeds max", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                const fee = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    ethers.constants.AddressZero,
                    fee,
                    linearAlgorithm.address,
                    poolType.trade
                )).to.be.revertedWith( "invalid init params" )
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    owner.address,
                    100000,
                    linearAlgorithm.address,
                    poolType.trade
                )).to.be.revertedWith( "invalid init params" )
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    owner.address,
                    fee,
                    linearAlgorithm.address,
                    poolType.trade
                )).to.be.revertedWith( "invalid init params" )

            })

            it("4. should fail if exponential Algorithm pass invalid multiplier and startPrice", async () => {

                const { metaFactory, nft, owner, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    0,
                    startPrice,
                    owner.address,
                    10000,
                    exponentialAlgorithm.address,
                    poolType.nft
                )).to.be.revertedWith( "invalid init params" )
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    0,
                    owner.address,
                    10000,
                    exponentialAlgorithm.address,
                    poolType.token
                )).to.be.revertedWith( "invalid init params" )
                
                await expect( 
                    metaFactory.createPair(
                    nft.address,
                    nftIds,
                    0,
                    0,
                    owner.address,
                    10000,
                    exponentialAlgorithm.address,
                    poolType.token
                )).to.be.revertedWith( "invalid init params" )

            })

        })

        describe(" - Functionalities", () => {

            it("1. factory should create a new pair type NFT", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                const tx = await metaFactory.createPair(
                    nft.address,
                    nftIds,
                    startPrice.div(2),
                    startPrice,
                    owner.address,
                    0,
                    linearAlgorithm.address,
                    poolType.nft
                )


                const newPairInfo = await getEventLog( tx, "NewPair" )

                expect( ethers.utils.isAddress( newPairInfo.pair ) ).to.be.true
                expect( newPairInfo.owner ).to.be.equal( owner.address )

            })

        })

    })

    describe("get factory info", () => {

        describe(" - Functionalities", () => {

            it("1. should set a new protocol fee", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)

                const [ maxfee, fee, feeRecipient ] = await metaFactory.getFactoryInfo()

                expect( maxfee ).to.be.any

                expect( fee ).to.be.any

                expect( feeRecipient ).to.be.any

            })

        })

    })

    describe("set Protocol Fee", () => {

        describe(" - Errors", () => {

            it("1. should fail if caller is nor the owner", async () => {

                const { metaFactory, otherAccount } = await loadFixture(deployMetaFactory)

                const newFee = ethers.utils.parseEther("0.1")
                
                await expect( 
                    metaFactory.connect( otherAccount ).setProtocolFee( newFee )
                    ).to.be.reverted

            })

            it("2. should fail if new fee is biggest than limit", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)

                const newFee = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.setProtocolFee( newFee )
                    ).to.be.revertedWith("new Fee exceeds limit")

            })

            it("3. should fail if new fee is equal to the old fee", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)

                const newFee = ethers.utils.parseEther("0.01")
                
                await expect( 
                    metaFactory.setProtocolFee( newFee )
                    ).to.be.revertedWith("new Fee can't be iqual than current")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a new protocol fee", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)

                const feeBefore = await metaFactory.PROTOCOL_FEE()

                const newFee = ethers.utils.parseEther("0.05")

                await metaFactory.setProtocolFee( newFee )

                const feeAfter = await metaFactory.PROTOCOL_FEE()

                expect( newFee ).to.be.greaterThan( feeBefore )

                expect( newFee ).to.be.equal( feeAfter )

            })

        })

    })

    describe("set Protocol Fee recipient", () => {

        describe(" - Errors", () => {

            it("1. should fail if caller is nor the owner", async () => {

                const { metaFactory, otherAccount } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.connect( otherAccount ).setProtocolFeeRecipient( otherAccount.address )
                    ).to.be.reverted

            })

            it("2. should fail if new recipient is the same than current", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.setProtocolFeeRecipient( metaFactory.address )
                    ).to.be.revertedWith("new recipient can't be iqual than current")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a new protocol fee recipient", async () => {

                const { metaFactory, owner } = await loadFixture( deployMetaFactory )

                const recipientBefore = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                await metaFactory.setProtocolFeeRecipient( owner.address )

                const recipientAfter = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                expect( recipientBefore ).to.be.equal( metaFactory.address )

                expect( recipientAfter ).to.be.equal( owner.address )

            })

        })

    })

    describe("withdraw ETH", () => {

        describe(" - Errors", () => {

            it("1. should fail if caller is nor the owner", async () => {

                const { metaFactory, otherAccount } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.connect( otherAccount ).withdrawETH()
                    ).to.be.reverted

            })

            it("2. should fail if contract has insufficient founds", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.withdrawETH()
                    ).to.be.revertedWith("insufficient balance")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should withdraw ETH balance", async () => {

                const { metaFactory, owner, otherAccount } = await loadFixture( deployMetaFactory )

                const sendAmount = ethers.utils.parseEther("10")

                await otherAccount.sendTransaction({
                    to: metaFactory.address,
                    value: sendAmount
                })

                const ownerBalanceBefore = await owner.getBalance()

                const balanceBefore = await ethers.provider.getBalance( metaFactory.address )

                expect( balanceBefore ).to.be.equal( sendAmount )

                await metaFactory.withdrawETH()

                const ownerBalanceAfter = await owner.getBalance()

                const balanceAfter = await ethers.provider.getBalance( metaFactory.address )

                expect( balanceAfter ).to.be.equal( 0 )

                // rauded to handle withdraw gas cost

                expect( 
                    Math.floor(Number(ethers.utils.formatEther(
                        ownerBalanceBefore.add( sendAmount )
                        )))
                    ).to.be.equal( 
                        Math.floor(Number(
                            ethers.utils.formatEther(ownerBalanceAfter )
                        )))

            })

        })

    })

    describe("withdraw NFTs", () => {

        describe(" - Errors", () => {

            it("1. should fail if caller is nor the owner", async () => {

                const { metaFactory, otherAccount, nft } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.connect( otherAccount ).withdrawNFTs( nft.address, [ 42, 43, 44] )
                    ).to.be.reverted

            })

            it("2. should fail if contract has insufficient NFT founds", async () => {

                const { metaFactory, nft } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.withdrawNFTs( nft.address, [ 42, 43, 44] )
                    ).to.be.reverted

            })

        })

        describe(" - Functionalities", () => {

            it("1. should withdraw NFT", async () => {

                const { metaFactory, owner, nft } = await loadFixture( deployMetaFactory )

                const nftIds = await mintNFT( nft, 10, metaFactory )

                await sendBulkNfts( nft, nftIds, metaFactory.address )

                const ownerBalanceBefore = await nft.balanceOf( owner.address )

                const balanceBefore = await nft.balanceOf( metaFactory.address )

                expect( balanceBefore ).to.be.equal( nftIds.length )

                expect( ownerBalanceBefore ).to.be.equal( 0 )

                await metaFactory.withdrawNFTs( nft.address, nftIds)

                const ownerBalanceAfter = await nft.balanceOf( owner.address )

                const balanceAfter = await nft.balanceOf( metaFactory.address )

                expect( balanceAfter ).to.be.equal( 0 )

                // rauded to handle withdraw gas cost

                expect( ownerBalanceAfter ).to.be.equal( nftIds.length )

            })

        })

    })

    describe("Events", () => {

        describe(" - Functionalities", () => {

            it( "NewPair", async () => {

                const { metaFactory, owner, nft, linearAlgorithm } = await loadFixture( deployMetaFactory )

				await expect(
                    metaFactory.createPair(
                        nft.address,
                        [],
                        parseEther("5"),
                        parseEther("0.1"),
                        owner.address,
                        0,
                        linearAlgorithm.address,
                        poolType.token
                    )
				).to.emit( metaFactory, "NewPair" )

            })

            it( "NewProtocolFee", async () => {

                const { metaFactory } = await loadFixture( deployMetaFactory )

                const newFee = parseEther("0.1")

				await expect( metaFactory.setProtocolFee( newFee ) )
                    .to.emit( metaFactory, "NewProtocolFee" )
                    .withArgs( newFee )

            })

            it( "NewFeeRecipient", async () => {

                const { metaFactory, owner } = await loadFixture( deployMetaFactory )

				await expect( 
                    metaFactory.setProtocolFeeRecipient( owner.address ) 
                ).to.emit( metaFactory, "NewFeeRecipient" )
                .withArgs( owner.address )

            })

            it( "AlgorithmApproval", async () => {

                const { metaFactory, owner, cPAlgorithm } = await loadFixture( deployMetaFactory )

				await expect( 
                    metaFactory.setAlgorithmApproval( 
                        cPAlgorithm.address,
                        false
                    ) 
                ).to.emit( metaFactory, "AlgorithmApproval" )
                .withArgs( cPAlgorithm.address, false )

            })

            it( "TokenDeposit", async () => {

                const { metaFactory, owner } = await loadFixture( deployMetaFactory )

                const amountOfETH = parseEther("1")

				await expect( 
                    owner.sendTransaction({
                        to: metaFactory.address,
                        value: amountOfETH
                    })
                ).to.emit( metaFactory, "TokenDeposit" )
                .withArgs( amountOfETH )

            })

            it( "TokenWithdrawal", async () => {

                const { metaFactory, owner } = await loadFixture( deployMetaFactory )

                const amount = parseEther("1")

                await owner.sendTransaction({
                    to: metaFactory.address,
                    value: amount
                })

				await expect( 
                    metaFactory.withdrawETH()
                ).to.emit( metaFactory, "TokenWithdrawal" )
                .withArgs( owner.address, amount )

            })

            it( "NFTWithdrawal", async () => {

                const { metaFactory, owner, nft } = await loadFixture( deployMetaFactory )

                const tokenIDs = await mintNFT( nft, 2, metaFactory )

                await nft.transferFrom( 
                    owner.address,
                    metaFactory.address,
                    tokenIDs[ 0 ]
                )

                await nft.transferFrom( 
                    owner.address,
                    metaFactory.address,
                    tokenIDs[ 1 ]
                )

				await expect( 
                    metaFactory.withdrawNFTs( nft.address, tokenIDs )
                ).to.emit( metaFactory, "NFTWithdrawal" )
                .withArgs( owner.address, tokenIDs.length )

            })

        })

    })

});
