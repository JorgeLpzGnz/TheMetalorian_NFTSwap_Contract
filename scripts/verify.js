const hre = require("hardhat");

const linearAlgorithm = "0x4cbf1e91de7fBd70C5A4A2959e9C26D04Fb6801A"

const exponentialAlgorithm = "0xA1A5b2E64189CF158A3D5A09EF596b8b19D08b47"

const constantPAlgorithm = "0x1b061f214FE4190E973F873d02b3625b0703c4D7"

const metaFactory = "0x1f20f9aCC5B65D25e378a95eB03c64A839079044"

const enumerableImplementation = "0x86D92d9a6be5D689523B7366552DDE119A910999"

const notEnumerableImplementation = "0x1E6cDd64dd9dC7B139537e7fE436BCf001351CA0"

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