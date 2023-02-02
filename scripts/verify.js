const hre = require("hardhat");

const linearAlgorithm = "0x710c2B94AbeA7959FE5e4eE49A766210972DbCa4"

const exponentialAlgorithm = "0x51dF3Ef70124bFE72BFD6bC4f022B6a3B856484d"

const constantPAlgorithm = "0x9bFbfFeFd44797609cfb5d9426aE9051b705CBBE"

const metaFactory = "0xE9a6f72426ef5B48085435807F5c6bE522755D88"

const enumerableImplementation = "0x77df81612700B8EAeF8ee78ADcbB146dF6Ff8601"

const notEnumerableImplementation = "0x81169202898eB02F1F05feb62E7B44DE8F25A0DD"

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