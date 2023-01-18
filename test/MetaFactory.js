const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const NFT_ABI = require("../utils/nftABI")

async function mintNFT( NFT, amount ) {

  const mintCost = await NFT.mintCost()

  await NFT.mintTheMetalorianDAOSilver( 
     amount , 
    { value: mintCost.mul( amount ) }
  )

}

describe("MetaFactory", function () {

  async function deployMetaFactory() {

    const [owner, otherAccount] = await ethers.getSigners();

		const nft = new ethers.Contract(
			"0x5b8d95Bc5c45569216174b27f45DDf05A443Fd18",
			NFT_ABI,
			owner
		)

    const CPCurve = await hre.ethers.getContractFactory("CPCurve");
    const cPCurve = await CPCurve.deploy();

    const ExponencialCurve = await hre.ethers.getContractFactory("ExponencialCurve");
    const exponencialCurve = await ExponencialCurve.deploy();

    const LinearCurve = await hre.ethers.getContractFactory("LinearCurve");
    const linearCurve = await LinearCurve.deploy();


    const MetaFactory = await hre.ethers.getContractFactory("MetaFactory");
    const metaFactory = await MetaFactory.deploy( 
      exponencialCurve.address,
      linearCurve.address,
      cPCurve.address
    );

    return { metaFactory, owner, otherAccount, nft };

  }

  describe( "Creta a contract", () => {
    describe("Functionalities", () => {
      it("1. tests", async() => {
        const { metaFactory, nft } = await loadFixture( deployMetaFactory )

        await mintNFT( nft, 10 )

        await metaFactory.createPair( nft.address )

      })
    })
  })
});
