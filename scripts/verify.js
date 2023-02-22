const hre = require("hardhat");

const linearAlgorithm = "0x92D12B58ba934304bf718DCB06665E10cB2ae080"

const exponentialAlgorithm = "0x5EA20B72F74425D0b2E2fC14D087515650f6F3c0"

const constantPAlgorithm = "0x0F8765Bb98142410BB08881064a9a92baEFefF3A"

const metaFactory = "0x02eD126e05D9b18f96C23Ef489EBb45b03fCC226"

const enumerableImplementation = "0xa254c42b25B8cAa7a542c962B153B3dAb5e9b1A7"

const notEnumerableImplementation = "0x1Aa29aA48a22Af442dECc3Cd10374625A4dB99C8"

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