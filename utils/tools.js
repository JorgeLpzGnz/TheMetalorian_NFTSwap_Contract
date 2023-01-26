const { ethers } = require("hardhat")
const PAIR_NFT_BASIC = require("../artifacts/contracts/pairs/MSPairNFTBasic.sol/MSPairNFTBasic.json")
const PAIR_NFT_ENUMERABLE = require("../artifacts/contracts/pairs/MSPairNFTEnumerable.sol/MSPairNFTEnumerable.json")
const NFT_ABI = require("../utils/nftABI")

const poolType = {
    token: 0,
    nft: 1,
    trade: 2
}

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

async function createPair( metaFactory, nft, amountOfNFTs, _spotPrice, _delta, curve, poolType, _fee, _tokenAmount ) {

    const tokenIds = await mintNFT(nft, amountOfNFTs, metaFactory)

    let nftIds = tokenIds

    if ( poolType == 0 ) nftIds = []

    const delta = ethers.utils.parseEther(`${ _delta }`)

    const spotPrice = ethers.utils.parseEther(`${_spotPrice}`)

    const [ owner ] = await ethers.getSigners();

    const fee = ethers.utils.parseEther( `${ _fee }` )

    let rewardRecipient = owner.address

    if( poolType == 2 ) rewardRecipient = ethers.constants.AddressZero

    const tokenAmount = ethers.utils.parseEther( `${_tokenAmount}` )

    const tx = await metaFactory.createPair( 
        nft.address,    // colection
        nftIds,         // token IDs of the NFTs
        delta,          // delta
        spotPrice,      // spotprice
        rewardRecipient,// rewardRecipient
        fee,            // trade fees
        curve.address,  // curve
        poolType,       // the type of the pool
        { value: tokenAmount }, // the amount of ETH to init the pair
    )


    const { pair } = await getEventLog( tx, "NewPair" )

    await nft.setApprovalForAll( pair, true)

    return { 
        pair: new ethers.Contract(
            pair,
            PAIR_NFT_BASIC.abi,
            owner
        ), tokenIds }

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

async function sendBulkNfts( nft, tokenIds, to ) {

    for (let i = 0; i < tokenIds.length; i++) 

        await nft.transferFrom( nft.signer.address, to, tokenIds[i])
        
}

function getNumber( bignumber ) {

    return Number( ethers.utils.formatEther( bignumber ))

}

function getTokenInput( curve, spotPrice, delta, numItems ) {

    let buyPrice

    switch ( curve ) {

        case "linearCurve":

            buyPrice = spotPrice + delta

            return numItems * buyPrice + ( numItems * ( numItems - 1) * delta ) / 2;

        case "exponencialCurve":

            const deltaPow = delta ** numItems

            buyPrice = spotPrice * delta

            return buyPrice * ( deltaPow - 1 ) / ( delta - 1 )

        case "cPCurve":

            const tokenBalance = spotPrice

            const nftBalance = delta

            return ( numItems * tokenBalance ) / ( nftBalance - numItems)

    }

}

module.exports = {
    poolType, 
    createPair, 
    getEventLog, 
    mintNFT, 
    sendBulkNfts,
    getNumber,
    getTokenInput,
    deployMetaFactory
}