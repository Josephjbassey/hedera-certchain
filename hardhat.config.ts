import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hedera Testnet configuration
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.VITE_HEDERA_PRIVATE_KEY ? [process.env.VITE_HEDERA_PRIVATE_KEY] : [],
      chainId: 296,
    },
    // Hedera Mainnet configuration
    hederaMainnet: {
      url: "https://mainnet.hashio.io/api", 
      accounts: process.env.HEDERA_MAINNET_PRIVATE_KEY ? [process.env.HEDERA_MAINNET_PRIVATE_KEY] : [],
      chainId: 295,
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};

export default config;
