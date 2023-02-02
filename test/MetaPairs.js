const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const {
    poolType, 
    createPair, 
    getEventLog, 
    mintNFT, 
    sendBulkNfts,
    getNumber,
    getSellInput,
    deployMetaFactory,
    getNumberForBNArray,
    getSellOutput,
    roundNumber
} = require("../utils/tools" )
const { expect } = require("chai");
const { ethers } = require("hardhat");
const provider = ethers.provider
const { utils } = ethers
const { parseEther, formatEther } = utils

describe("MetaPairs", function () {

    describe("init", () => {

        describe(" - Errors", () => {

            it("1. should fail if is called after initialation", async () => {

                const { metaFactory, nft, linearAlgorithm, otherAccount } = await loadFixture(deployMetaFactory)

                const { pair } = await createPair( metaFactory, nft, 0, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)
                
                await expect( 
                    pair.init(
                    2,
                    40000,
                    otherAccount.address,
                    otherAccount.address,
                    nft.address,
                    500000,
                    linearAlgorithm.address,
                    poolType.token
                )).to.be.revertedWith( "it is already initialized" )

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

            it("2. check initial info for NFT pair", async() => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, 0)

                const nftBalance = await nft.balanceOf( pair.address )

                expect( nftBalance ).to.be.equal( 10 )

                // check multiplier 
                
                expect( await pair.multiplier() ).to.be.equal( ethers.utils.parseEther("0.5") )

                // check startPrice 
                
                expect( await pair.startPrice() ).to.be.equal( ethers.utils.parseEther("1") )

                // check trade fee
                
                expect( await pair.tradeFee() ).to.be.equal( 0 )

                // check rewards recipent
                
                expect( await pair.recipient() ).to.be.equal( owner.address )

                // check nft collection address
                
                expect( await pair.NFT() ).to.be.equal( nft.address )

                // check the pair factory
                
                expect( await pair.factory() ).to.be.equal( metaFactory.address )

                // check poolType
                
                expect( await pair.currentPoolType() ).to.be.equal( poolType.nft )

                // check the prices Algorithm
                
                expect( await pair.Algorithm() ).to.be.equal( linearAlgorithm.address )

            })

            it("3. check initial info for token pair", async() => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 0, 1, 1.5, exponentialAlgorithm, poolType.token, 0, 10)

                const tokenBalance = await provider.getBalance( pair.address )

                expect( tokenBalance ).to.be.equal( ethers.utils.parseEther("10") )

                // check multiplier 
                
                expect( await pair.multiplier() ).to.be.equal( ethers.utils.parseEther("1.5") )

                // check startPrice 
                
                expect( await pair.startPrice() ).to.be.equal( ethers.utils.parseEther("1") )

                // check trade fee
                
                expect( await pair.tradeFee() ).to.be.equal( 0 )

                // check rewards recipent
                
                expect( await pair.recipient() ).to.be.equal( owner.address )

                // check nft collection address
                
                expect( await pair.NFT() ).to.be.equal( NFTEnumerable.address )

                // check the pair factory
                
                expect( await pair.factory() ).to.be.equal( metaFactory.address )

                // check poolType
                
                expect( await pair.currentPoolType() ).to.be.equal( poolType.token )

                // check the prices Algorithm
                
                expect( await pair.Algorithm() ).to.be.equal( exponentialAlgorithm.address )


            })

            it("4. check initial info for trade pair", async() => {

                const { metaFactory, nft, cPAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, nft, 10, 1, 0.5, cPAlgorithm, poolType.trade, 0.1, 10 )

                const nftBalance = await nft.balanceOf( pair.address )

                const tokenBalance = await provider.getBalance( pair.address )

                expect( tokenBalance ).to.be.equal( ethers.utils.parseEther("10") )

                expect( nftBalance ).to.be.equal( 10 )

                // check multiplier 
                
                expect( await pair.multiplier() ).to.be.equal( ethers.utils.parseEther("0.5") )

                // check startPrice 
                
                expect( await pair.startPrice() ).to.be.equal( ethers.utils.parseEther("1") )

                // check trade fee
                
                expect( await pair.tradeFee() ).to.be.equal( ethers.utils.parseEther("0.1") )

                // check rewards recipent
                
                expect( await pair.recipient() ).to.be.equal( ethers.constants.AddressZero )

                // check nft collection address
                
                expect( await pair.NFT() ).to.be.equal( nft.address )

                // check the pair factory
                
                expect( await pair.factory() ).to.be.equal( metaFactory.address )

                // check poolType
                
                expect( await pair.currentPoolType() ).to.be.equal( poolType.trade )

                // check the prices Algorithm
                
                expect( await pair.Algorithm() ).to.be.equal( cPAlgorithm.address )


            })

            it("5. should create a new Enumerable pair", async() => {

                const { metaFactory, NFTEnumerable, linearAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair, tokenIds } = await createPair( metaFactory, NFTEnumerable, 10, 5, 0.5, linearAlgorithm, poolType.nft, 0, 0 )

                const nftIds = await pair.getNFTIds()

                // NFT address should be the passed nft Addres

                expect( await pair.NFT() ).to.be.equal( NFTEnumerable.address )

                // check than pool NFTs are the same that was sended to pool

                expect( getNumberForBNArray( nftIds ) ).to.deep.equal( tokenIds )

            })

        })

    })

    describe("swap NFTs For Sell", () => {

        describe(" - Errors", () => {

            it("1. should fail if pair is type NFT", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("2")

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapNFTsForSell( 
                        [ tokenIds[0] ],
                        minExpected,
                        owner.address
                    )
                ).to.be.revertedWith( "invalid pool Type" )

            })

            it("2. should fail if pass cero items", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pair } = await createPair( metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 0)
                
                await expect( 
                    pair.swapNFTsForSell( 
                        [],
                        minExpected,
                        owner.address
                    )
                ).to.be.reverted

            })

            it("3. should fail if exceeds max expecteed", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)
                
                await expect( 
                    pair.swapNFTsForSell( 
                        [ tokenIds[0] ],
                        minExpected,
                        owner.address
                    )
                ).to.be.revertedWith( "output amount is les than min expected" )

            })

            it("3. should fail if user doesn't have the nft", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const minExpected = ethers.utils.parseEther("1")

                const { pair } = await createPair( metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)
                
                await expect( 
                    pair.swapNFTsForSell( 
                        [ 1 ],
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

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, 1, 0.5, linearAlgorithm, poolType.token, 0, 10)

                const recipient = await pair.getAssetsRecipient()

                const idsBefore = await pair.getNFTIds()

                // in not trade pairs all input assets will be sent to pair owner

                expect( recipient ).to.be.equal( owner.address )

                expect( idsBefore.length ).to.be.equal( 0 )

                const ownerBalanceBefore = await owner.getBalance()
                
                const tx = await pair.swapNFTsForSell( [ tokenIds[0] ], minExpected, owner.address )

                const ownerBalanceAfter = await owner.getBalance()

                const { amountOut } = await getEventLog( tx, "SellLog")

                const nftOwner = await nft.ownerOf( tokenIds[0] )

                expect( 
                    Math.floor( 
                        getNumber(ownerBalanceBefore.add( amountOut ))) 
                    ).to.be.equal( 
                        Math.floor( getNumber(ownerBalanceAfter))
                        )

                expect( nftOwner ).to.be.equal( recipient )

            })

        })

    })

    describe("swap token For especific NFTs", () => {

        describe(" - Errors", () => {

            it("1. should fail if poolType is token", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.token, 0, 0)
                
                await expect( 
                    pair.swapSellForNFT(
                        [ tokenIds[0] ],
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("invalid pool Type")

            })

            it("2. should fail if in Algorithm error", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const { pair } = await createPair( metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapSellForNFT(
                        [],
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Algorithm Error")

            })

            it("3. should fail if output amount is less than expected", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("1.5")

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapSellForNFT(
                        [ tokenIds[0] ],
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("output amount is less than min expected")


            })

            it("4. should fail if pass less amount of ETH than needed", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("1.6")

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, 1, 1.5, exponentialAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapSellForNFT(
                        [ tokenIds[0] ],
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

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getSellInput("exponentialAlgorithm", startPrice, multiplier, 1)

                const poolFee = getNumber(await metaFactory.PROTOCOL_FEE())

                const ownerBalanceBefore = await owner.getBalance()

                const pairBalanceBefore = await provider.getBalance( pair.address )

                expect( pairBalanceBefore ).to.be.equal( 0 )

                const tx = await pair.connect( otherAccount ).swapSellForNFT(
                    [ tokenIds[0] ],
                    maxExpected,
                    owner.address,
                    { value: maxExpected }
                )

                const ownerBalanceAfer = await owner.getBalance()

                const pairBalanceAfter = await provider.getBalance( pair.address )

                const { amountIn } = await getEventLog( tx, "BuyLog")

                // check than after pair swap in not trade pairs the pool dont keep any asset

                expect( pairBalanceAfter ).to.be.equal( 0 )

                // check if the amount that came out is equal to what was expected

                expect( getNumber( amountIn ) ).to.be.equal( expectedInput + ( expectedInput * poolFee) )

                // verify if assets were send to the owner

                expect( 
                    Math.floor( getNumber( ownerBalanceBefore.add(amountIn) ) ) 
                ).to.be.equal(
                    Math.floor( getNumber( ownerBalanceAfer ) )
                 )

            })

            it("2. should should pay a fee", async () => {

                const { metaFactory, nft, owner, cPAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("3")

                const nftAmount = 10

                const startPrice = nftAmount + 1 // token balance ( nftAmount + 1)

                const multiplier = nftAmount * 1   // nft balance ( nftAmount * startPrice )

                const { pair, tokenIds } = await createPair( metaFactory, nft, nftAmount, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getSellInput( "cPAlgorithm", startPrice, multiplier, 2 )

                const fee = getNumber( await metaFactory.PROTOCOL_FEE() )

                const feeRecipient = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                const recipientBalanceBefore = getNumber( await provider.getBalance( feeRecipient ))

                await pair.swapSellForNFT(
                    [ tokenIds[0], tokenIds[1] ],
                    maxExpected,
                    owner.address,
                    { value: maxExpected }
                )

                const recipientBalanceAfter = getNumber( await provider.getBalance( feeRecipient ))

                expect( expectedInput * fee ).to.be.equal( recipientBalanceAfter - recipientBalanceBefore )

            })

        })

    })

    describe("swap token For any NFTs", () => {

        describe(" - Errors", () => {
            
            it("1. should fail if poolType is token", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const startPrice = 1

                const multiplier = 0.5

                const { pair } = await createPair( metaFactory, nft, 10, startPrice, multiplier, linearAlgorithm, poolType.token, 0, 0)
                
                await expect( 
                    pair.swapSellForAnyNFT(
                        3,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("invalid pool Type")

            })

            it("2. should fail if in Algorithm error", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const startPrice = 1

                const multiplier = 1.5

                const { pair } = await createPair( metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapSellForAnyNFT(
                        0,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("Algorithm Error")

            })

            it("3. should fail if output amount is less than expected", async () => {

                const { metaFactory, nft, cPAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("2.7")

                const numItem = 10

                const startPrice = numItem + 1

                const multiplier = numItem * 1

                const { pair } = await createPair( metaFactory, nft, numItem, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapSellForAnyNFT(
                        2,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("output amount is less than min expected")


            })

            it("4. should fail if pass less amount of ETH than needed", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const startPrice = 1

                const multiplier = 1.5

                const { pair } = await createPair( metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapSellForAnyNFT(
                        2,
                        maxExpected,
                        owner.address
                    )
                ).to.be.revertedWith("insufficient amount of ETH")

            })

            it("5. should fail if tries to buy more than owns", async () => {

                const { metaFactory, nft, cPAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("10")

                const numItem = 10

                const startPrice = numItem + 1

                const multiplier = numItem * 1

                const { pair } = await createPair( metaFactory, nft, numItem, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)
                
                await expect( 
                    pair.swapSellForAnyNFT(
                        11,
                        maxExpected,
                        owner.address,
                        { value: maxExpected.mul( 10 ) }
                    )
                ).to.be.revertedWith( "Algorithm Error" )

            })

        })

        describe(" - Functionalities", () => {

            it("1. should swap a amount of tokens ", async () => {

                const { metaFactory, nft, owner, otherAccount, exponentialAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("1.6")

                const startPrice = 1

                const multiplier = 1.5

                const { pair } = await createPair( metaFactory, nft, 10, startPrice, multiplier, exponentialAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getSellInput("exponentialAlgorithm", startPrice, multiplier, 1)

                const ownerBalanceBefore = await owner.getBalance()

                const assetRecipiet = await pair.getAssetsRecipient()

                const recipientBalanceBefore = getNumber(await provider.getBalance( assetRecipiet ))

                // check than pair have balance 0

                expect( await provider.getBalance( pair.address ) ).to.be.equal( 0 )

                const tx = await pair.connect( otherAccount ).swapSellForAnyNFT(
                    1,
                    maxExpected,
                    otherAccount.address,
                    { value: maxExpected }
                )

                // check than pair keeps balance 0

                expect( await provider.getBalance( pair.address ) ).to.be.equal( 0 )

                const ownerBalanceAfer = await owner.getBalance()

                const recipientBalanceAfter = getNumber(await provider.getBalance( assetRecipiet ))

                const { amountIn } = await getEventLog( tx, "BuyLog")

                const protocolFee = getNumber(await metaFactory.PROTOCOL_FEE())

                // check if input amount was sended to assets repient ( only in not trade pools )

                expect( expectedInput ).to.be.equal( recipientBalanceAfter - recipientBalanceBefore )

                // check if the amount that came out is equal to what was expected

                expect( getNumber( amountIn ) ).to.be.equal( expectedInput + ( expectedInput * protocolFee ) )

                // check if amount In was sended to pool assets recipient ( only for not trade pools )

                expect( 
                    Math.floor( getNumber( ownerBalanceBefore.add( amountIn ) ) ) 
                ).to.be.equal(
                    Math.floor( getNumber( ownerBalanceAfer ) )
                 )

            })

            it("2. should should pay a protocol fee", async () => {

                const { metaFactory, nft, owner, cPAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("3")

                const nftAmount = 10

                const startPrice = nftAmount + 1 // token balance ( nftAmount + 1)

                const multiplier = nftAmount * 1   // nft balance ( nftAmount * startPrice )

                const { pair } = await createPair( metaFactory, nft, nftAmount, startPrice, multiplier, cPAlgorithm, poolType.nft, 0, 0)

                const expectedInput = getSellInput( "cPAlgorithm", startPrice, multiplier, 2 )

                const fee = getNumber( await metaFactory.PROTOCOL_FEE() )

                const feeRecipient = await metaFactory.PROTOCOL_FEE_RECIPIENT()

                const recipientBalanceBefore = getNumber( await provider.getBalance( feeRecipient ))


                await pair.swapSellForAnyNFT(
                    2,
                    maxExpected,
                    owner.address,
                    { value: maxExpected }
                )

                const recipientBalanceAfter = getNumber( await provider.getBalance( feeRecipient ))

                // check if was sended to pool owner

                expect( recipientBalanceAfter - recipientBalanceBefore ).to.be.equal( expectedInput * fee )

            })

            it("3. should should pay a pair fee", async () => {

                const { metaFactory, nft, owner, cPAlgorithm } = await loadFixture(deployMetaFactory)

                const maxExpected = ethers.utils.parseEther("3.0525")

                const nftAmount = 10

                const startPrice = nftAmount + 1 // token balance ( nftAmount + 1)

                const multiplier = nftAmount * 1   // nft balance ( nftAmount * startPrice )

                const { pair } = await createPair( metaFactory, nft, nftAmount, startPrice, multiplier, cPAlgorithm, poolType.trade, 0.1, 10)

                const expectedInput = getSellInput( "cPAlgorithm", startPrice, multiplier, 2 )

                const feeRecipient = await pair.getAssetsRecipient()

                const tradeFee = getNumber( await pair.tradeFee() )

                // in trade pool assents recipient should be the same address than the pool

                expect( feeRecipient ).to.be.equal( pair.address )

                const recipientBalanceBefore = getNumber( await provider.getBalance( feeRecipient ))

                await pair.swapSellForAnyNFT(
                    2,
                    maxExpected,
                    owner.address,
                    { value: maxExpected }
                )

                const recipientBalanceAfter = getNumber( await provider.getBalance( feeRecipient ))

                // check if current balance is equal to the amount puls trade fee

                // is multiplied by 1000 to handle javaScript precition errors and the divided

                expect( 
                    ((recipientBalanceAfter * 1000 ) - ( recipientBalanceBefore * 1000 )) / 1000
                ).to.be.equal(
                    expectedInput + ( expectedInput * tradeFee) 
                )

            })

        })

    })

    // update ( make proves of each poolType )

    describe( "get NFT IDs", () => {

        describe(" - Functionalities", () => {

            it("1. prove Not NFT Enumerable IDs array updating", async () => {

                const { metaFactory, nft, linearAlgorithm, owner } = await loadFixture(deployMetaFactory)

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getSellOutput("linearAlgorithm", startPrice, multiplier, numItems )

                const { pair, tokenIds } = await createPair( metaFactory, nft, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, 0.1, tokenAmount)

                const ownerNFTs = await mintNFT(nft, 5, pair )

                expect( 
                    getNumberForBNArray( await pair.getNFTIds() ) 
                ).to.deep.equal(
                    tokenIds
                )

                await pair.swapNFTsForSell( 
                    ownerNFTs,
                    0,
                    owner.address
                    )

                // check that poolNFTs is equal to initial NFTs + swap NFTs

                expect( getNumberForBNArray( await pair.getNFTIds() ) ).to.deep.equal( tokenIds.concat(ownerNFTs) )

                await pair.swapSellForNFT( 
                    tokenIds,
                    parseEther("100"),
                    owner.address, 
                    { value: parseEther("100")}
                    )

                // check that poolNFTs are equal to current NFTs - swap NFTs
    
                expect( getNumberForBNArray( await pair.getNFTIds() ).sort() ).to.deep.equal( ownerNFTs )

            } )

            it("1. prove NFT Enumerable IDs array updating", async () => {

                const { metaFactory, NFTEnumerable, linearAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const startPrice = 5

                const multiplier = 0.3

                const numItems = 10

                const tokenAmount = getSellOutput("linearAlgorithm", startPrice, multiplier, numItems )

                const { pair, tokenIds } = await createPair( metaFactory, NFTEnumerable, numItems, startPrice, multiplier, linearAlgorithm, poolType.trade, 0.1, tokenAmount)

                const ownerNFTs = await mintNFT(NFTEnumerable, 5, pair )

                expect( 
                    getNumberForBNArray( await pair.getNFTIds() ) 
                ).to.deep.equal(
                    tokenIds
                )

                await pair.swapNFTsForSell( 
                    ownerNFTs,
                    0,
                    owner.address
                    )

                // check that poolNFTs is equal to initial NFTs + swap NFTs

                expect( getNumberForBNArray( await pair.getNFTIds() ) ).to.deep.equal( tokenIds.concat(ownerNFTs) )

                await pair.swapSellForNFT( 
                    tokenIds,
                    parseEther("100"),
                    owner.address, 
                    { value: parseEther("100")}
                    )

                // check that poolNFTs are equal to current NFTs - swap NFTs
    
                expect( getNumberForBNArray( await pair.getNFTIds() ).sort() ).to.deep.equal( ownerNFTs )

            } )
            
        })

    })

    describe( "get Assets Recipient", () => {

        describe(" - Functionalities", () => {

            it("1. Should return an address in Sell pool", async () => {

                const { metaFactory, NFTEnumerable, linearAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 0.1, linearAlgorithm, poolType.token, 0, 0 )

                expect( await pair.getAssetsRecipient() ).to.be.equal( owner.address )

            } )

            it("2. Should return an address in NFT pool", async () => {

                const { metaFactory, NFTEnumerable, cPAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 0.1, cPAlgorithm, poolType.nft, 0, 0 )

                expect( await pair.getAssetsRecipient() ).to.be.equal( owner.address )

            } )

            it("3. Should return the pool address in trade pool", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, 0.1, 10 )

                expect( await pair.getAssetsRecipient() ).to.be.equal( pair.address )

            } )
            
        })

    })

    describe( "set Assets Recipient", () => {

        describe(" - Errors", () => {

            it("1. should fail if a not owner try to call", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, 0, 0 )

                await expect( 
                    pair.connect(otherAccount).setAssetsRecipient( otherAccount.address )
                ).to.be.rejected
            
            } )

            it("2. should fail if try to set on trade pool", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.trade, 0, 0 )

                await expect( 
                    pair.setAssetsRecipient( owner.address )
                ).to.be.rejectedWith( "Recipient not supported in trade pools" )
            
            } )

            it("3. should fail if try to set the same address than the current", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                await expect( 
                    pair.setAssetsRecipient( owner.address )
                ).to.be.rejectedWith( "New recipient is equal than current" )
            
            } )
            
        })

        describe(" - Functionalities", () => {

            it("1. should set a new recipient", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                // check that the recipient is equal to the owner

                expect( await pair.getAssetsRecipient() ).to.be.equal( owner.address )

                await pair.setAssetsRecipient( otherAccount.address )

                // verify that it sets the new recipient

                expect( await pair.getAssetsRecipient() ).to.be.equal( otherAccount.address )
            
            } )
            
        })

    })

    describe( "set StartPrice", () => {

        describe(" - Errors", () => {

            it("1. should fail when not owner try to set new spot price", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                await expect( pair.connect( otherAccount ).setStartPrice( 0 ) ).to.be.reverted

            } )

            it("2. should fail if new start Price is equal than current", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                const startPrice = await pair.startPrice()

                await expect( pair.setStartPrice( startPrice ) ).to.be.revertedWith( "new price is equal than current" )

            } )

            it("3. should fail when new spot price is invalid for the Algorithm", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                // min spot price = 1 gwei = 1e9

                const startPrice = 1e7

                await expect( pair.setStartPrice( startPrice ) ).to.be.revertedWith( "invalid Start Price" )

            } )
            
        })

        describe(" - Functionalities", () => {

            it("1. should set a new spot price", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const startPrice = 5

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, startPrice, 1.5, exponentialAlgorithm, poolType.nft, 0, 0 )

                // current spot price is the same as initial

                expect( getNumber(await pair.startPrice()) ).to.be.equal( startPrice )

                const newStartPrice = parseEther("7")

                await pair.setStartPrice( newStartPrice )

                expect( await pair.startPrice() ).to.be.equal( newStartPrice )
            
            } )
            
        })

    })

    describe( "set Delta", () => {

        describe(" - Errors", () => {

            it("1. should fail when not owner try to set new multiplier", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                await expect( pair.connect( otherAccount ).setDelta( 0 ) ).to.be.reverted

            } )

            it("2. should fail if new multiplier is equal than current", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                const multiplier = await pair.multiplier()

                await expect( pair.setDelta( multiplier ) ).to.be.revertedWith( "multiplier is equal than current" )

            } )

            it("3. should fail when new spot price is invalid for the Algorithm", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                // Min multiplier = 1e18

                const multiplier = 1e7

                await expect( pair.setDelta( multiplier ) ).to.be.revertedWith( "invalid multiplier" )

            } )
            
        })

        describe(" - Functionalities", () => {

            it("1. should set a new multiplier", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const multiplier = 1.1

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, multiplier, exponentialAlgorithm, poolType.nft, 0, 0 )

                expect( getNumber( await pair.multiplier() ) ).to.be.equal( multiplier )

                const newDelta = parseEther( "1.5" )

                await pair.setDelta( newDelta ) 

                expect( await pair.multiplier() ).to.be.equal( newDelta)
            
            } )
            
        })

    })

    describe( "withdraw Sell", () => {

        describe(" - Errors", () => {

            it("1. should fail when not owner try to withdraw", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.token, 0, 10 )

                await expect( pair.connect( otherAccount ).withdrawSell() ).to.be.reverted
            
            } )

            it("2. should fail if contract have insufficient founds", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                await expect( pair.withdrawSell() ).to.be.revertedWith( "insufficient balance")
            
            } )
            
        })

        describe(" - Functionalities", () => {

            it("1. should withdraw contract balance", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.token, 0, 10 )

                const currentBalance = getNumber(await provider.getBalance( pair.address ))

                const ownerBalanceBefore = getNumber(await owner.getBalance())

                // check than current balance is not cero

                expect( currentBalance ).to.be.greaterThan( 0 )

                await pair.withdrawSell()

                const ownerBalanceAfter = getNumber(await owner.getBalance())

                // check that contract balance was sended to owner
                // is rounded to hamdle gas cost

                expect( Math.floor( ownerBalanceBefore + currentBalance ) ).to.be.equal( Math.floor( ownerBalanceAfter ))

                // chack that the contract balance is 0

                expect( await provider.getBalance( pair.address ) ).to.be.equal( 0 )
            
            } )
            
        })

    })

    describe( "withdraw NFTs", () => {

        describe(" - Errors", () => {

            it("1. should fail if a not owner tries to withdraw", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, otherAccount } = await loadFixture( deployMetaFactory )

                const { pair, tokenIds } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                expect( pair.connect( otherAccount ).withdrawNFTs( NFTEnumerable.address, tokenIds) ).to.be.reverted

            } )

            it("2. should fail if pair doesn't have the NFTs", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm } = await loadFixture( deployMetaFactory )

                // the pool is type token so in the initial time it doesn't have NFTs

                const { pair, tokenIds } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.token, 0, 0 )

                expect( pair.withdrawNFTs( NFTEnumerable.address, tokenIds) ).to.be.reverted

            } )
            
        })

        describe(" - Functionalities", () => {

            it("1. should withdraw Not Enumerable NFT and update Pool NFT IDs", async () => {

                const { metaFactory, nft, exponentialAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair, tokenIds } = await createPair( metaFactory, nft, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                // check stored NFT IDs and current NFT Balance

                expect( await pair.getNFTIds() ).to.deep.equal( tokenIds )

                expect( await nft.balanceOf( pair.address ) ).to.be.equal( tokenIds.length )

                // check that owner don't have NFTs before withdrown

                expect( await nft.balanceOf( owner.address ) ).to.be.equal( 0 )


                await pair.withdrawNFTs( nft.address, tokenIds )

                // after withdrawn NFT Balance must be 0

                expect( await nft.balanceOf( pair.address ) ).to.be.equal( 0 )

                // check pair owner NFT balance

                expect( await nft.balanceOf( owner.address ) ).to.be.equal( tokenIds.length )

                // check the stored NFT IDs array

                expect( await pair.getNFTIds() ).to.deep.equal( [] )
            
            } )

            it("2. should withdraw Enumerable NFTs", async () => {

                const { metaFactory, NFTEnumerable, exponentialAlgorithm, owner } = await loadFixture( deployMetaFactory )

                const { pair, tokenIds } = await createPair( metaFactory, NFTEnumerable, 10, 4, 1.1, exponentialAlgorithm, poolType.nft, 0, 0 )

                // check stored NFT IDs and current NFT Balance

                expect( await pair.getNFTIds() ).to.deep.equal( tokenIds )

                expect( await NFTEnumerable.balanceOf( pair.address ) ).to.be.equal( tokenIds.length )

                // check that owner don't have NFTs before withdrown

                expect( await NFTEnumerable.balanceOf( owner.address ) ).to.be.equal( 0 )


                await pair.withdrawNFTs( NFTEnumerable.address, tokenIds )

                // after withdrawn NFT Balance must be 0

                expect( await NFTEnumerable.balanceOf( pair.address ) ).to.be.equal( 0 )

                // check pair owner NFT balance

                expect( await NFTEnumerable.balanceOf( owner.address ) ).to.be.equal( tokenIds.length )

                // check the stored NFT IDs array

                expect( await pair.getNFTIds() ).to.deep.equal( [] )
            
            } )
            
        })

    })

});
