const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
    poolType, 
    getEventLog, 
    mintNFT, 
    sendBulkNfts,
    deployMetaFactory,
    getNumber
} = require("../utils/tools" )
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const NFT_ABI = require("../utils/nftABI")
const { parseEther } = ethers.utils
const provider = ethers.provider

describe("MetaFactory", function () {

    describe("check Init Params", () => {

        describe( " - functinalities", () => {

            it("1. should fail if in a non-commercial pool try to put a non-zero value", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                // it should fail when try to set it on Sell or Buy pool

                // Buy pool
                
                await expect( 
                    metaFactory.checkInitParams(
                    startPrice.div(2),       // multiplier
                    startPrice,              // startPrice
                    owner.address,           // recipient
                    10000,                   // fee
                    linearAlgorithm.address, // algorithm
                    poolType.buy             // pool type
                )).to.be.revertedWith( "Fee available only on trade pools" )

                // Sell pool
                
                await expect( 
                    metaFactory.checkInitParams(
                    startPrice.div(2),       // multiplier
                    startPrice,              // startPrice
                    owner.address,           // recipient
                    10000,                   // fee
                    linearAlgorithm.address, // algorithm
                    poolType.sell           // pool type
                )).to.be.revertedWith( "Fee available only on trade pools" )

            })

            it("2. should fail if in trade pool try to pass a recipient", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.checkInitParams(
                    startPrice.div(2),        // multiplier
                    startPrice,               // startPrice
                    owner.address,            // recipient
                    0,                        // fee
                    linearAlgorithm.address,  // algorithm
                    poolType.trade            // pool type
                )).to.be.revertedWith( "Recipient not available on trade pool" )

            })

            it("3. should fail if trade fee is greater than limit", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                const fee = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.checkInitParams(
                    startPrice.div(2),           // multiplier
                    startPrice,                  // startPrice
                    ethers.constants.AddressZero,// recipientZero
                    fee,                         // fee
                    linearAlgorithm.address,     // algorithm
                    poolType.trade               // pool type
                )).to.be.revertedWith( "Pool Fee exceeds the maximum" )

            })

            it("4. should fail if exponential Algorithm pass invalid multiplier and startPrice", async () => {

                const { metaFactory, nft, owner, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                /*
                  At the moment to create this protocol the only algorithm that needs to validate the multiplier and the start price is the 
                  exponential, in the anotherones all values are valid 
                */

                // test multiplier
                
                await expect( 
                    metaFactory.checkInitParams(
                    0,                            // multiplier
                    startPrice,                   // startPrice
                    owner.address,                // recipient
                    0,                            // fee
                    exponentialAlgorithm.address, // algorithm
                    poolType.buy                  // pool type
                )).to.be.revertedWith( "Invalid multiplier or start price" )

                // test start price
                
                await expect( 
                    metaFactory.checkInitParams(
                    startPrice.div(2),            // multiplier
                    0,                            // startPrice
                    owner.address,                // recipient
                    0,                            // fee
                    exponentialAlgorithm.address, // algorithm
                    poolType.sell                // pool type
                )).to.be.revertedWith( "Invalid multiplier or start price" )

                // test both
                
                await expect( 
                    metaFactory.checkInitParams(
                    0,                              // multiplier
                    0,                              // startPrice
                    ethers.constants.AddressZero,   // recipient
                    10000,                          // fee
                    exponentialAlgorithm.address,   // algorithm
                    poolType.trade                  // pool type
                )).to.be.revertedWith( "Invalid multiplier or start price" )

            })
        })
        
    })

    describe("set Router Approval", () => {

        describe(" - Errors", () => {

            it("1. should fail if caller is not the owner", async () => {

                const { metaFactory, otherAccount } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.connect( otherAccount ).setRouterApproval( 
                        otherAccount.address,
                        true
                    )
                ).to.be.reverted

            })

            it("2. should fail when approval is the same than previous", async () => {

                const { metaFactory, owner } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.setRouterApproval( 
                        owner.address,
                        false 
                        )
                ).to.be.revertedWith("Approval is the same than previous")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a router approval", async () => {

                const { metaFactory, owner } = await loadFixture(deployMetaFactory)

                const approvalBefore = await metaFactory.isMSRouter( owner.address )

                // initial value must be false

                expect( approvalBefore ).to.be.false

                await metaFactory.setRouterApproval( 
                    owner.address,
                    true 
                )

                const approvalAfter = await await metaFactory.isMSRouter( owner.address )

                // new value must be true

                expect( approvalAfter ).to.be.true

            })

        })

    })

    describe("set Algorithm Approval", () => {

        describe(" - Errors", () => {

            it("1. should fail if caller is nor the owner", async () => {

                const { metaFactory, otherAccount } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.connect( otherAccount ).setAlgorithmApproval( 
                        otherAccount.address,
                        true
                    )
                ).to.be.reverted

            })

            it("2. should fail when approval is the same than previous", async () => {

                const { metaFactory, owner } = await loadFixture(deployMetaFactory)
                
                await expect( 
                    metaFactory.setAlgorithmApproval( 
                        owner.address,
                        false 
                        )
                ).to.be.revertedWith("Approval is the same than previous")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a router approval", async () => {

                const { metaFactory, owner } = await loadFixture(deployMetaFactory)

                const approvalBefore = await metaFactory.isMSAlgorithm( owner.address )

                // initial value must be false

                expect( approvalBefore ).to.be.false

                await metaFactory.setAlgorithmApproval( 
                    owner.address,
                    true 
                )

                const approvalAfter = await await metaFactory.isMSAlgorithm( owner.address )

                // new value must be true

                expect( approvalAfter ).to.be.true

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

                // max is the 90% of the amounts 90 % = 0.9
                // so set new fee to 1 to generate the error 

                const newFee = ethers.utils.parseEther("1")
                
                await expect( 
                    metaFactory.setProtocolFee( newFee )
                    ).to.be.revertedWith("new Fee exceeds limit")

            })

            it("3. should fail if new fee is equal to the old fee", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)

                // 0.01 is the default fee

                const newFee = ethers.utils.parseEther("0.0005")
                
                await expect( 
                    metaFactory.setProtocolFee( newFee )
                    ).to.be.revertedWith("new fee cannot be the same as the previous one")

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
                    ).to.be.revertedWith("new fee cannot be the same as the previous one")

            })

        })

        describe(" - Functionalities", () => {

            it("1. should set a new protocol fee recipient", async () => {

                const { metaFactory, owner } = await loadFixture( deployMetaFactory )

                const recipientBefore = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                await metaFactory.setProtocolFeeRecipient( owner.address )

                const recipientAfter = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                // defaul recipient must be the address of the factory

                expect( recipientBefore ).to.be.equal( metaFactory.address )

                expect( recipientAfter ).to.be.equal( owner.address )

            })

        })

    })

    describe("get factory info", () => {

        describe(" - Functionalities", () => {

            it("1. should set a new protocol fee", async () => {

                const { metaFactory } = await loadFixture(deployMetaFactory)

                const currentMaxFee = await metaFactory.MAX_FEE_PERCENTAGE()

                const currentFee = await metaFactory.PROTOCOL_FEE()

                const currentFeeRecipient = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                const [ maxfee, fee, feeRecipient ] = await metaFactory.getFactoryInfo()

                // compare with the respective storage variable

                expect( maxfee ).to.be.equal( currentMaxFee )

                expect( fee ).to.be.equal( currentFee )

                expect( feeRecipient ).to.be.equal( currentFeeRecipient )

            })

        })

    })
    
    describe("Create pool", () => {

        describe(" - Errors", () => {

            it("1. should fail if passed Algorithm isn't alowed", async () => {

                const { metaFactory, nft, owner } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                // passing a no allowded address in the algorithm to genarate the error
                
                await expect( 
                    metaFactory.createPool(
                        nft.address,       // colection
                        nftIds,            // initial NFTs
                        startPrice.div(2), // multiplier
                        startPrice,        // startPrice
                        owner.address,     // recipient
                        0,                 // fee
                        owner.address,     // algorithm 
                        poolType.buy       // pool type
                        )
                ).to.be.revertedWith( "Algorithm is not Approved" )

            })

            it("2. should fail if initial params are not valid", async () => {

                const { metaFactory, nft, owner, linearAlgorithm } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const startPrice = ethers.utils.parseEther("1")

                // it should fail when try to set a fee on Sell or Buy pool

                // Buy pool
                
                await expect( 
                    metaFactory.createPool(
                    nft.address,             // collection
                    nftIds,                  // initial NFTs
                    startPrice.div(2),       // multiplier
                    startPrice,              // startPrice
                    owner.address,           // recipient
                    10000,                   // fee
                    linearAlgorithm.address, // algorithm
                    poolType.buy             // pool type
                )).to.be.revertedWith( "Fee available only on trade pools" )

                // Sell pool
                
                await expect( 
                    metaFactory.createPool(
                    nft.address,             // collection
                    nftIds,                  // initial NFTs
                    startPrice.div(2),       // multiplier
                    startPrice,              // startPrice
                    owner.address,           // recipient
                    10000,                   // fee
                    linearAlgorithm.address, // algorithm
                    poolType.sell           // pool type
                )).to.be.revertedWith( "Fee available only on trade pools" )

            })

        })

        describe(" - Functionalities", () => {

            it("1. factory should create a new pool type NFT", async () => {

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
                    poolType.buy
                )


                const newPoolInfo = await getEventLog( tx, "NewPool" )

                expect( ethers.utils.isAddress( newPoolInfo.pool ) ).to.be.true
                expect( newPoolInfo.owner ).to.be.equal( owner.address )

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

                const sendAmount = parseEther("10")

                // send ETH to the factory

                await otherAccount.sendTransaction({
                    to: metaFactory.address,
                    value: sendAmount
                })

                const ownerBalanceBefore = await owner.getBalance()

                const balanceBefore = await provider.getBalance( metaFactory.address )

                // check balances before withdrawal

                expect( balanceBefore ).to.be.equal( sendAmount )

                const tx = await metaFactory.withdrawETH()

                const receipt = await tx.wait()

                const gasUsed = receipt.gasUsed.mul( receipt.effectiveGasPrice )

                const ownerBalanceAfter = await owner.getBalance()

                const balanceAfter = await provider.getBalance( metaFactory.address )

                expect( balanceAfter ).to.be.equal( 0 )

                // adding the gas used for more precition

                expect( 
                    ownerBalanceBefore.add( sendAmount )
                ).to.be.equal( 
                    ownerBalanceAfter.add( gasUsed )
                )

            })

        })

    })

    describe("withdraw NFTs", () => {

        describe(" - Errors", () => {

            it("1. should fail if caller is not the owner", async () => {

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

                // mint and send the NFTs to the factory

                const nftIds = await mintNFT( nft, 10, metaFactory )

                await sendBulkNfts( nft, nftIds, metaFactory.address )

                // chacking balances 

                const ownerBalanceBefore = await nft.balanceOf( owner.address )

                const balanceBefore = await nft.balanceOf( metaFactory.address )

                expect( balanceBefore ).to.be.equal( nftIds.length )

                expect( ownerBalanceBefore ).to.be.equal( 0 )

                // withdraw and check balances

                await metaFactory.withdrawNFTs( nft.address, nftIds)

                const ownerBalanceAfter = await nft.balanceOf( owner.address )

                const balanceAfter = await nft.balanceOf( metaFactory.address )

                expect( balanceAfter ).to.be.equal( 0 )

                expect( ownerBalanceAfter ).to.be.equal( nftIds.length )

            })

        })

    })

    describe("Events", () => {

        describe(" - Functionalities", () => {

            it( "NewPool", async () => {

                const { metaFactory, owner, nft, linearAlgorithm } = await loadFixture( deployMetaFactory )

				await expect(
                    metaFactory.createPool(
                        nft.address,
                        [],
                        parseEther("5"),
                        parseEther("0.1"),
                        owner.address,
                        0,
                        linearAlgorithm.address,
                        poolType.sell
                    )
				).to.emit( metaFactory, "NewPool" )

            })

            it( "RouterApproval", async () => {

                const { metaFactory, owner } = await loadFixture( deployMetaFactory )

				await expect( 
                    metaFactory.setRouterApproval( 
                        owner.address,
                        true
                    ) 
                ).to.emit( metaFactory, "RouterApproval" )
                .withArgs( owner.address, true )

            })

            it( "AlgorithmApproval", async () => {

                const { metaFactory, cPAlgorithm } = await loadFixture( deployMetaFactory )

				await expect( 
                    metaFactory.setAlgorithmApproval( 
                        cPAlgorithm.address,
                        false
                    ) 
                ).to.emit( metaFactory, "AlgorithmApproval" )
                .withArgs( cPAlgorithm.address, false )

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

            it("NFTDeposit", async () => {

                const { metaFactory, nft, NFTEnumerable, owner } = await loadFixture(deployMetaFactory)

                const nftIDs = await mintNFT( nft, 1, metaFactory)

                const nftIDs2 = await mintNFT( NFTEnumerable, 1, metaFactory)

                await expect(
                    nft.functions['safeTransferFrom(address,address,uint256)'](
                        owner.address,
                        metaFactory.address,
                        nftIDs[0]
                    )
                ).to.emit(metaFactory, "NFTDeposit")
                    .withArgs(nft.address, nftIDs[0])

                await expect(
                    NFTEnumerable.functions['safeTransferFrom(address,address,uint256)'](
                        owner.address,
                        metaFactory.address,
                        nftIDs2[0]
                    )
                ).to.emit(metaFactory, "NFTDeposit")
                    .withArgs(NFTEnumerable.address, nftIDs2[0])

            })

        })

    })

});
