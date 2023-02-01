// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

    // linear Market curve

    const LinearCurve = await hre.ethers.getContractFactory("LinearCurve");
    const linearCurve = await LinearCurve.deploy();

    await linearCurve.deployed();

    console.log(`linearCurve deployed at ${linearCurve.address}`);


    // Exponencial Market curve

    const ExponencialCurve = await hre.ethers.getContractFactory("ExponencialCurve");
    const exponencialCurve = await ExponencialCurve.deploy();

    await exponencialCurve.deployed();

    console.log(`ExponencialCurve deployed at ${exponencialCurve.address}`);


    // Constant Product curve

    const CPCurve = await hre.ethers.getContractFactory("CPCurve");
    const cPCurve = await CPCurve.deploy();

    await cPCurve.deployed();

    console.log(`CPCurve deployed at ${cPCurve.address}`);


    // Meta Factory

    const MetaFactory = await hre.ethers.getContractFactory("MetaFactory");
    const metaFactory = await MetaFactory.deploy(
        linearCurve.address,
        exponencialCurve.address,
        cPCurve.address
    );

    await metaFactory.deployed();

    console.log(`Meta Factory deployed to ${metaFactory.address}`);

    console.log(`pair Enumerable Implementation deployed to ${ await metaFactory.pairEnumTemplate() }`);

    console.log(`pair Basic Implementation deployed to ${ await metaFactory.pairNotEnumTemplate() }`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
