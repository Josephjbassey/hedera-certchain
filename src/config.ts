export interface NetworkConfig {
  network: string;
  chainId: string;
  jsonRpcUrl: string;
  mirrorNodeUrl: string;
}

export interface AppConfig {
  networks: {
    testnet: NetworkConfig;
    mainnet: NetworkConfig;
  };
  constants: {
    METAMASK_GAS_LIMIT_TRANSFER_FT: number;
    METAMASK_GAS_LIMIT_TRANSFER_NFT: number;
    METAMASK_GAS_LIMIT_ASSOCIATE: number;
  };
}

export const appConfig: AppConfig = {
  networks: {
    testnet: {
      network: 'testnet',
      chainId: '0x128', // Hedera testnet chain ID (296 in decimal)
      jsonRpcUrl: 'https://testnet.hashio.io/api',
      mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    },
    mainnet: {
      network: 'mainnet',
      chainId: '0x127', // Hedera mainnet chain ID (295 in decimal)
      jsonRpcUrl: 'https://mainnet.hashio.io/api',
      mirrorNodeUrl: 'https://mainnet.mirrornode.hedera.com',
    },
  },
  constants: {
    METAMASK_GAS_LIMIT_TRANSFER_FT: 400000,
    METAMASK_GAS_LIMIT_TRANSFER_NFT: 500000,
    METAMASK_GAS_LIMIT_ASSOCIATE: 300000,
  },
};