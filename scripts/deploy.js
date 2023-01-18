// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  const LinearCurve = await hre.ethers.getContractFactory("LinearCurve");
  const linearCurve = await LinearCurve.deploy();

  await linearCurve.deployed();

  const ExponencialCurve = await hre.ethers.getContractFactory("ExponencialCurve");
  const exponencialCurve = await ExponencialCurve.deploy();

  await exponencialCurve.deployed();

  const CPCurve = await hre.ethers.getContractFactory("CPCurve");
  const cPCurve = await CPCurve.deploy();

  await cPCurve.deployed();

  const MetaFactory = await hre.ethers.getContractFactory("MetaFactory");
  const metaFactory = await MetaFactory.deploy( 
    exponencialCurve.address,
    linearCurve.address,
    cPCurve.address
  );

  await metaFactory.deployed();

  console.log(`
    linearCurve deployed at ${linearCurve.address}
    exponencialCurve deployed at ${exponencialCurve.address}
    CPCurve deployed at ${cPCurve.address}
    MSPairBasic deployed to ${metaFactory.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
