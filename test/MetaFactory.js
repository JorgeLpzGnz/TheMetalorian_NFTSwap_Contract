const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const NFT_ABI = require("../utils/nftABI")
const PAIR_NFT_BASIC = require("../artifacts/contracts/pairs/MSPairNFTBasic.sol/MSPairNFTBasic.json")
const PAIR_NFT_ENUMERABLE = require("../artifacts/contracts/pairs/MSPairNFTEnumerable.sol/MSPairNFTEnumerable.json")


const poolType = {
    token: 0,
    nft: 1,
    trade: 2
}

async function createPair( metaFactory, nftAddress, amountOfNFTs, _spotPrice, _delta, curve, poolType, _fee ) {

    let nftIds

    if ( poolType == 1 || poolType == 2 ) nftIds = await mintNFT(nft, amountOfNFTs, metaFactory)

    else {

        nftIds = []

        nftAddress = ethers.constants.AddressZero

    }

    const delta = ethers.utils.parseEther(`${ _delta }`)

    const spotPrice = ethers.utils.parseEther(`${_spotPrice}`)

    const [ owner ] = await ethers.getSigners();

    let fee = 0

    let rewardRecipient = owner.address

    if( poolType == 2 ) {

        fee = ethers.utils.parseEther( `${ _fee }` )

        rewardRecipient = ethers.constants.AddressZero

    }

    const tx = await metaFactory.createPair(
        nftAddress,     // colection
        nftIds,         // token IDs of the NFTs
        delta,          // delta
        spotPrice,      // spotprice
        rewardRecipient,// rewardRecipient
        fee,            // trade fees
        curve.address,  // curve
        poolType        // the type of the pool
    )


    const { pair } = await getEventLog( tx, "NewPair" )

    return new ethers.Contract(
        pair,
        PAIR_NFT_BASIC.abi,
        owner
    )

}

async function getEventLog( _tx, _event ) {

    const receipt = await _tx.wait()

    let log

    for (let i = 0; i < receipt.events.length; i++) {

        const e = receipt.events[i];

        if( e.event ) {

            if( e.event == _event ) log = e.args

        }
        
    }

    return log

}

async function mintNFT(NFT, amount, metaFactory) {

    const tokenIds = []

    const mintCost = await NFT.mintCost()

    const firsToken = (await NFT.tokenIdCounter()).toNumber()

    await NFT.mintTheMetalorianDAOSilver(
        amount,
        { value: mintCost.mul(amount) }
    )

    await NFT.setApprovalForAll( metaFactory.address, true )

    for (let i = firsToken; i < firsToken + amount; i++)
        tokenIds.push( i )

    return tokenIds

}

describe("MetaPairs", function () {

    async function deployMetaFactory() {

        const [owner, otherAccount] = await ethers.getSigners();

        const nft = new ethers.Contract(
            "0x5b8d95Bc5c45569216174b27f45DDf05A443Fd18",
            NFT_ABI,
            owner
        )

        const LinearCurve = await hre.ethers.getContractFactory("LinearCurve");
        const linearCurve = await LinearCurve.deploy();

        const ExponencialCurve = await hre.ethers.getContractFactory("ExponencialCurve");
        const exponencialCurve = await ExponencialCurve.deploy();


        const CPCurve = await hre.ethers.getContractFactory("CPCurve");
        const cPCurve = await CPCurve.deploy();

        const MetaFactory = await hre.ethers.getContractFactory("MetaFactory");
        const metaFactory = await MetaFactory.deploy(
            linearCurve.address,
            exponencialCurve.address,
            cPCurve.address
        );

        return { metaFactory, owner, otherAccount, nft, cPCurve, exponencialCurve, linearCurve };

    }

    describe("Create new NFT basic / ETH pair", () => {

        describe("Functionalities", () => {

            it("1. factory should create a new pair type NFT", async () => {

                const { metaFactory, nft, owner, linearCurve } = await loadFixture(deployMetaFactory)

                const nftIds = await mintNFT(nft, 10, metaFactory)

                const spotPrice = ethers.utils.parseEther("1")

                const tx = await metaFactory.createPair(
                    nft.address,
                    nftIds,
                    spotPrice.div(2),
                    spotPrice,
                    owner.address,
                    0,
                    linearCurve.address,
                    poolType.nft
                )


                const newPairInfo = await getEventLog( tx, "NewPair" )

                expect( ethers.utils.isAddress( newPairInfo.pair ) ).to.be.true
                expect( newPairInfo.owner ).to.be.equal( owner.address )

            })

            it("2. check initial info for NFT pair", async() => {

                const { metaFactory, nft, linearCurve } = await loadFixture( deployMetaFactory )

                const pair = await createPair( metaFactory, nft, 10, 1, 0.5, linearCurve, poolType.nft, 0)

                const spotPrice = await pair.spotPrice()

                const delta = await pair.delta()

                console.log( spotPrice, delta )

            })
        })
    })
});
