require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	solidity: {
		compilers: [
		  {
			version: "0.8.17",
			settings: {
			  optimizer: {
				enabled: true,
				runs: 200,
			  },
			},
		  },
		]
	}, networks: {
		mainnet: {
			url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_MAINNET_KEY}`,
			accounts: [`0x${process.env.PRIVATE_KEY}`],
		},
		goerli: {
			url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_GOERLI_KEY}`,
			accounts: [`0x${process.env.PRIVATE_KEY}`],
		},
		hardhat: {
			forking: {
				url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_MAINNET_KEY}`
			}
		}
	},
	etherscan: {
		apiKey: {
			mainnet: `${process.env.ETHERSCAN_API_KEY}`,
			goerli: `${process.env.ETHERSCAN_API_KEY}`
		}
	}
};
