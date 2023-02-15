const hre = require("hardhat");

const linearAlgorithm = "0x6C1853391Ff957B6D5E19762fE244E080558909A"

const exponentialAlgorithm = "0x1c8487A9D48D5444f086D79AB0c14CBC205e06D2"

const constantPAlgorithm = "0x1d8e8CF0243402874bAB3f5872c77400206E3460"

const metaFactory = "0xC14c681f3e48Ee2c8c1D5982a36E9Dc7D41b000E"

const enumerableImplementation = "0xd2F689e665450ed5f3588aAABCae12ce9a58EeF5"

const notEnumerableImplementation = "0x7093bc67Ccd26ed23F70D25130F1Dac16088db9b"

async function verifyContracts() {

    // Linear Algorithm

    await hre.run( "verify:verify", {
        address: linearAlgorithm,
    } ).catch((error) => console.log( error ) )

    // Exponential Algorithm

    await hre.run( "verify:verify", {
        address: exponentialAlgorithm,
    } ).catch((error) => console.log( error ) )

    // Constant product Algorithm

    await hre.run( "verify:verify", {
        address: constantPAlgorithm,
    } ).catch((error) => console.log( error ) )

    // Meta Factory

    await hre.run( "verify:verify", {
        address: metaFactory,
        constructorArguments: [
            linearAlgorithm,
            exponentialAlgorithm,
            constantPAlgorithm
        ]
    } ).catch((error) => console.log( error ) )

    // Pair Enumerable Implementation

    await hre.run( "verify:verify", {
        address: enumerableImplementation,
    } ).catch((error) => console.log( error ) )

    // Pair Not Enumerable Implementation

    await hre.run( "verify:verify", {
        address: notEnumerableImplementation,
    } ).catch((error) => console.log( error ) )

}

verifyContracts()