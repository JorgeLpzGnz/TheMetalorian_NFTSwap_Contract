const hre = require("hardhat");

const linearAlgorithm = "0x41512d5690d55538F8A048B49552ED08Baba9eA6"

const exponentialAlgorithm = "0x24be99C04c6F51879F38621171448B34b65b919c"

const constantPAlgorithm = "0x1DBc68f11f8052CE020B4Bf7da81E079001468f8"

const metaFactory = "0xE6396bd4F68c0CFd0Ce0B6DfDf29c564B4948ec7"

const enumerableImplementation = "0x903133dC0D9c7FEFe19e70E745dd40dBcc6c2C98"

const notEnumerableImplementation = "0xF50CDEA3aC9259524e4F154281C8544bd6eb6338"

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