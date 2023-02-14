const hre = require("hardhat");

const linearAlgorithm = "0x08D9D4B684CcD49C3053C3c67645AE0De3A82c6d"

const exponentialAlgorithm = "0x929400323034DBb63890869B00f1ec18642c76A7"

const constantPAlgorithm = "0x478DaC98AcF190b0D6D82aE24Cb461000e9685bF"

const metaFactory = "0x1C03bC8068b0DE90905BdAfD720FcA88116Ae39E"

const enumerableImplementation = "0x357c2d844e39201047B0bE769d1c06314d7f2a08"

const notEnumerableImplementation = "0x0C07Ee9CCe874D2595B439d85CF23830Ac9b6165"

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