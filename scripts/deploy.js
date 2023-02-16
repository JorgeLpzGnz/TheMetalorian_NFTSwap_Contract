// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

    // linear Market Algorithm

    const LinearAlgorithm = await hre.ethers.getContractFactory("LinearAlgorithm");
    const linearAlgorithm = await LinearAlgorithm.deploy();

    await linearAlgorithm.deployed();

    console.log(`linearAlgorithm deployed at ${linearAlgorithm.address}`);


    // Exponential Market Algorithm

    const ExponentialAlgorithm = await hre.ethers.getContractFactory("ExponentialAlgorithm");
    const exponentialAlgorithm = await ExponentialAlgorithm.deploy();

    await exponentialAlgorithm.deployed();

    console.log(`ExponentialAlgorithm deployed at ${exponentialAlgorithm.address}`);


    // Constant Product Algorithm

    const CPAlgorithm = await hre.ethers.getContractFactory("CPAlgorithm");
    const cPAlgorithm = await CPAlgorithm.deploy();

    await cPAlgorithm.deployed();

    console.log(`CPAlgorithm deployed at ${cPAlgorithm.address}`);


    // Meta Factory

    const MetaFactory = await hre.ethers.getContractFactory("MetaFactory");
    const metaFactory = await MetaFactory.deploy(
        linearAlgorithm.address,
        exponentialAlgorithm.address,
        cPAlgorithm.address
    );

    await metaFactory.deployed();

    console.log(`Meta Factory deployed to ${metaFactory.address}`);

    console.log(`pool Enumerable Implementation deployed to ${ await metaFactory.poolEnumTemplate() }`);

    console.log(`pool Basic Implementation deployed to ${ await metaFactory.poolNotEnumTemplate() }`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
