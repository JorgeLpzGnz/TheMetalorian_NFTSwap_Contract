const hre = require("hardhat");

const feeRecipient = "0xeD41c898a7b7837aFd421cF081F6a558decbcE5f"

const linearAlgorithm = "0x26c44A6f8664b6CB7E4daC2b3eA47538B4d28b71"

const exponentialAlgorithm = "0xEB353c17C9899F28dBfefBd943CDd553C3Cc32af"

const constantPAlgorithm = "0xB2E93fBd399f74B4B73Ae5bD466c08EbaecbF726"

const metaFactory = "0x0407e161cd00B4C4eaA4187F1Cec0ef78DFBf7Cf"

const enumerableImplementation = "0x2d60237b0209c178715CF683a64201aFb4af7A36"

const notEnumerableImplementation = "0x6aF8B4d6c83f96B4A6630550d96C942b2F4E0368"

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