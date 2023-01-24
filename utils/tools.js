
const PAIR_NFT_BASIC = require("../artifacts/contracts/pairs/MSPairNFTBasic.sol/MSPairNFTBasic.json")
const PAIR_NFT_ENUMERABLE = require("../artifacts/contracts/pairs/MSPairNFTEnumerable.sol/MSPairNFTEnumerable.json")

const poolType = {
    token: 0,
    nft: 1,
    trade: 2
}

async function createPair( metaFactory, nft, amountOfNFTs, _spotPrice, _delta, curve, poolType, _fee, _tokenAmount ) {

    let nftIds

    if ( poolType == 1 || poolType == 2 ) nftIds = await mintNFT(nft, amountOfNFTs, metaFactory)

    else nftIds = []

    const delta = ethers.utils.parseEther(`${ _delta }`)

    const spotPrice = ethers.utils.parseEther(`${_spotPrice}`)

    const [ owner ] = await ethers.getSigners();

    const fee = ethers.utils.parseEther( `${ _fee }` )

    let rewardRecipient = owner.address

    const tokenAmount = ethers.utils.parseEther( `${_tokenAmount}` )

    if( poolType == 2 ) rewardRecipient = ethers.constants.AddressZero

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

async function sendBulkNfts( nft, tokenIds, to ) {

    for (let i = 0; i < tokenIds.length; i++) 

        await nft.transferFrom( nft.signer.address, to, tokenIds[i])
        
}

module.exports = {
    poolType, 
    createPair, 
    getEventLog, 
    mintNFT, 
    sendBulkNfts
}