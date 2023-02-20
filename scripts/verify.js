const hre = require("hardhat");

const linearAlgorithm = "0x78fbefCcce23Bd65fb8e89c65a475C64B027C7E3"

const exponentialAlgorithm = "0x9E0eF38Fc467325441C42b96f3602B968DC0E34E"

const constantPAlgorithm = "0x72Ac8eE7eb63a0a2d6867C66907a7542042E5Ab3"

const metaFactory = "0x1bc0178529c8e1810F124565F0d7d27000195999"

const enumerableImplementation = "0x5a645EFC84858B60AeCa9dcB881b69f51e1bBFfb"

const notEnumerableImplementation = "0xCCCeF34e40413798B0CeD76d83FE92FaB88F9dA6"

async function verifyContracts() {

    // Linear Algorithm

    await hre.run( "verify:verify", {
        address: linearAlgorithm,
    } ).catch((error) => console.error( error ) )

    // Exponential Algorithm

    await hre.run( "verify:verify", {
        address: exponentialAlgorithm,
    } ).catch((error) => console.error( error ) )

    // Constant product Algorithm

    await hre.run( "verify:verify", {
        address: constantPAlgorithm,
    } ).catch((error) => console.error( error ) )

    // Meta Factory

    await hre.run( "verify:verify", {
        address: metaFactory,
        constructorArguments: [
            linearAlgorithm,
            exponentialAlgorithm,
            constantPAlgorithm
        ]
    } ).catch((error) => console.error( error ) )

    // Pool Enumerable Implementation

    await hre.run( "verify:verify", {
        address: enumerableImplementation,
    } ).catch((error) => console.error( error ) )

    // Pool Not Enumerable Implementation

    await hre.run( "verify:verify", {
        address: notEnumerableImplementation,
    } ).catch((error) => console.error( error ) )

}

verifyContracts()