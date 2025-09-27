export type NetworkName = "testnet" | "mainnet";
export type ChainId = '0x128' | '0x129';

export type NetworkConfig = {
  network: NetworkName,
  jsonRpcUrl: string,
  mirrorNodeUrl: string,
  chainId: ChainId,
}

export type NetworkConfigs = {
  [key in NetworkName]: {
    network: NetworkName,
    jsonRpcUrl: string,
    mirrorNodeUrl: string,
    chainId: ChainId,
  }
};

export type AppConfig = {
  networks: NetworkConfigs,
  constants: {
    METAMASK_GAS_LIMIT_ASSOCIATE: number;
    METAMASK_GAS_LIMIT_TRANSFER_FT: number;
    METAMASK_GAS_LIMIT_TRANSFER_NFT: number;
  }
}