import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

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
    // Hedera Testnet
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296,
      gasPrice: 10000000000, // 10 Gwei
    },
    // Hedera Mainnet
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 295,
      gasPrice: 10000000000, // 10 Gwei
    },
    // Local development
    hardhat: {
      chainId: 1337,
    },
  },
  etherscan: {
    // Hedera uses different block explorers
    apiKey: {
      hedera_testnet: "no-api-key-needed",
      hedera_mainnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "hedera_testnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.hashscan.io/api",
          browserURL: "https://hashscan.io/testnet",
        },
      },
      {
        network: "hedera_mainnet", 
        chainId: 295,
        urls: {
          apiURL: "https://mainnet.hashscan.io/api",
          browserURL: "https://hashscan.io/mainnet",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;