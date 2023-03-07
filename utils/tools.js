const { ethers } = require("hardhat")
const PAIR_NFT_BASIC = require("../artifacts/contracts/pools/MSPoolNFTBasic.sol/MSPoolNFTBasic.json")
const PAIR_NFT_ENUMERABLE = require("../artifacts/contracts/pools/MSPoolNFTEnumerable.sol/MSPoolNFTEnumerable.json")
const NFT_ABI = require("../utils/nftABI")
const { utils } = ethers
const { parseEther, formatEther } = utils

const poolType = {
    sell: 0,
    buy: 1,
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
        cPAlgorithm.address,
        owner.address
    );

    return { metaFactory, owner, otherAccount, nft, cPAlgorithm, exponentialAlgorithm, linearAlgorithm, NFTEnumerable };

}

async function createPool( metaFactory, nft, amountOfNFTs, _startPrice, _multiplier, Algorithm, poolType, _fee, _tokenAmount ) {

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

    const tx = await metaFactory.createPool( 
        nft.address,            // colection
        nftIds,                 // token IDs of the NFTs
        multiplier,             // multiplier
        startPrice,             // startPrice
        rewardRecipient,        // rewardRecipient
        fee,                    // trade fees
        Algorithm.address,      // Algorithm
        poolType,               // the type of the pool
        { value: tokenAmount }, // the amount of ETH to init the pool
    )


    const { pool } = await getEventLog( tx, "NewPool" )

    await nft.setApprovalForAll( pool, true)

    return { 
        pool: new ethers.Contract(
            pool,
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

    const mintCost = await NFT.mintCost()

    const firsSell = (await NFT.tokenIdCounter()).toNumber()

    if( NFT.address == "0x5b8d95Bc5c45569216174b27f45DDf05A443Fd18" ) 
        await NFT.connect( account ).mintTheMetalorianDAOSilver(
            amount,
            { value: mintCost.mul(amount) }
        )

    else await NFT.connect( account ).safeMint( amount )

    await NFT.connect( account ).setApprovalForAll( contractToApprove.address, true )

    for (let i = firsSell; i < firsSell + amount; i++)
        tokenIds.push( i )

    return tokenIds

}

async function sendBulkNfts( nft, tokenIds, to ) {

    for (let i = 0; i < tokenIds.length; i++) 

        await nft.transferFrom( nft.signer.address, to, tokenIds[i])
        
}

function getNumber( bigNumber ) {

    return Number( formatEther( bigNumber ))

}

function getTokenInput( Algorithm, startPrice, multiplier, numItems ) {

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

function getTokenOutput( Algorithm, startPrice, multiplier, numItems ) {

    switch ( Algorithm ) {

        case "linearAlgorithm":

            return numItems * startPrice - ( numItems * ( numItems - 1) * multiplier ) / 2;

        case "exponentialAlgorithm":

            const invMultiplier = 1 / multiplier

            const invMultiplierPow = invMultiplier ** numItems

            return startPrice * ( 1 - invMultiplierPow ) / ( 1 - invMultiplier )

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

function pow(_x, power) {

  let total = _x;

  const base = parseEther("1");

  for (let i = 1; i < power; i++) {

    total = total.mul( _x ).div( base );

  }

  return total;

}

function roundNumber( x, base ) { return ( Math.round( x * base ) ) / base } 

module.exports = {
    poolType, 
    createPool, 
    getEventLog, 
    mintNFT, 
    sendBulkNfts,
    getNumber,
    getTokenInput,
    deployMetaFactory,
    getTokenOutput,
    roundNumber,
    getNumberForBNArray,
    pow
}