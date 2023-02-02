const { ethers } = require("hardhat")
const PAIR_NFT_BASIC = require("../artifacts/contracts/pairs/MSPairNFTBasic.sol/MSPairNFTBasic.json")
const PAIR_NFT_ENUMERABLE = require("../artifacts/contracts/pairs/MSPairNFTEnumerable.sol/MSPairNFTEnumerable.json")
const NFT_ABI = require("../utils/nftABI")
const { utils } = ethers
const { parseEther, formatEther } = utils

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

    const NFTEnumerable = await (await hre.ethers.getContractFactory("NFTEnumerable")).deploy()

    const LinearAlgorithm = await hre.ethers.getContractFactory("LinearAlgorithm");
    const linearAlgorithm = await LinearAlgorithm.deploy();

    const ExponentialAlgorithm = await hre.ethers.getContractFactory("ExponentialAlgorithm");
    const exponentialAlgorithm = await ExponentialAlgorithm.deploy();


    const CPAlgorithm = await hre.ethers.getContractFactory("CPAlgorithm");
    const cPAlgorithm = await CPAlgorithm.deploy();

    const MetaFactory = await hre.ethers.getContractFactory("MetaFactory");
    const metaFactory = await MetaFactory.deploy(
        linearAlgorithm.address,
        exponentialAlgorithm.address,
        cPAlgorithm.address
    );

    return { metaFactory, owner, otherAccount, nft, cPAlgorithm, exponentialAlgorithm, linearAlgorithm, NFTEnumerable };

}

async function createPair( metaFactory, nft, amountOfNFTs, _startPrice, _multiplier, Algorithm, poolType, _fee, _tokenAmount ) {

    const tokenIds = await mintNFT(nft, amountOfNFTs, metaFactory)

    let nftIds = tokenIds

    if ( poolType == 0 ) nftIds = []

    const multiplier = parseEther(`${ _multiplier }`)

    const startPrice = parseEther(`${_startPrice}`)

    const [ owner ] = await ethers.getSigners();

    const fee = parseEther( `${ _fee }` )

    let rewardRecipient = owner.address

    if( poolType == 2 ) rewardRecipient = ethers.constants.AddressZero

    const tokenAmount = parseEther( `${_tokenAmount}` )

    const tx = await metaFactory.createPair( 
        nft.address,    // colection
        nftIds,         // token IDs of the NFTs
        multiplier,          // multiplier
        startPrice,      // spotprice
        rewardRecipient,// rewardRecipient
        fee,            // trade fees
        Algorithm.address,  // Algorithm
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

async function mintNFT(NFT, amount, contractToApprove, _account ) {

    let [ account ] = await ethers.getSigners() 

    if ( _account ) account = _account

    const tokenIds = []

    NFT.connect( account )

    const mintCost = await NFT.mintCost()

    const firsSell = (await NFT.tokenIdCounter()).toNumber()

    if( NFT.address == "0x5b8d95Bc5c45569216174b27f45DDf05A443Fd18" ) 
        await NFT.mintTheMetalorianDAOSilver(
            amount,
            { value: mintCost.mul(amount) }
        )

    else await NFT.safeMint( amount )

    await NFT.setApprovalForAll( contractToApprove.address, true )

    for (let i = firsSell; i < firsSell + amount; i++)
        tokenIds.push( i )

    return tokenIds

}

async function sendBulkNfts( nft, tokenIds, to ) {

    for (let i = 0; i < tokenIds.length; i++) 

        await nft.transferFrom( nft.signer.address, to, tokenIds[i])
        
}

function getNumber( bignumber ) {

    return Number( formatEther( bignumber ))

}

function getSellInput( Algorithm, startPrice, multiplier, numItems ) {

    let buyPrice

    switch ( Algorithm ) {

        case "linearAlgorithm":

            buyPrice = startPrice + multiplier

            return numItems * buyPrice + ( numItems * ( numItems - 1) * multiplier ) / 2;

        case "exponentialAlgorithm":

            const multiplierPow = multiplier ** numItems

            buyPrice = startPrice * multiplier

            return buyPrice * ( multiplierPow - 1 ) / ( multiplier - 1 )

        case "cPAlgorithm":

            const tokenBalance = startPrice

            const nftBalance = multiplier

            return ( tokenBalance * numItems ) / ( nftBalance - numItems)

    }

}

function getSellOutput( Algorithm, startPrice, multiplier, numItems ) {

    switch ( Algorithm ) {

        case "linearAlgorithm":

            return numItems * startPrice - ( numItems * ( numItems - 1) * multiplier ) / 2;

        case "exponentialAlgorithm":

            const invDelta = 1 / multiplier

            const invDeltaPow = invDelta ** numItems

            return startPrice * ( 1 - invDeltaPow ) / ( 1 - invDelta )

        case "cPAlgorithm":

            const tokenBalance = startPrice

            const nftBalance = multiplier

            return ( tokenBalance * numItems ) / ( nftBalance + numItems)

    }

}

// This function assumes that the BigNumber is smaller than javascript limit

function getNumberForBNArray( BNArray ) {

    const numbers = []

    for (let i = 0; i < BNArray.length; i++) {

        numbers.push( BNArray[i].toNumber() );
        
    }

    return numbers

}

function roundNumber( x, base ) { return ( Math.round( x * base ) ) / base } 

module.exports = {
    poolType, 
    createPair, 
    getEventLog, 
    mintNFT, 
    sendBulkNfts,
    getNumber,
    getSellInput,
    deployMetaFactory,
    getSellOutput,
    roundNumber,
    getNumberForBNArray
}