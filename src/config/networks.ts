/**
 * Network configuration for Hedera networks
 * Based on official Hedera tutorial patterns
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls: string[];
  mirrorNodeUrl: string;
}

export const HEDERA_NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: 'Hedera Testnet',
    chainId: 296,
    rpcUrls: ['https://testnet.hashio.io/api'],
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: ['https://hashscan.io/testnet'],
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com'
  },
  mainnet: {
    name: 'Hedera Mainnet',
    chainId: 295,
    rpcUrls: ['https://mainnet.hashio.io/api'],
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: ['https://hashscan.io/mainnet'],
    mirrorNodeUrl: 'https://mainnet.mirrornode.hedera.com'
  },
  previewnet: {
    name: 'Hedera Previewnet',
    chainId: 297,
    rpcUrls: ['https://previewnet.hashio.io/api'],
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: ['https://hashscan.io/previewnet'],
    mirrorNodeUrl: 'https://previewnet.mirrornode.hedera.com'
  }
};

// Application configuration following Hedera patterns
export interface AppConfig {
  networks: Record<string, NetworkConfig>;
  defaultNetwork: string;
}

export const appConfig: AppConfig = {
  networks: HEDERA_NETWORKS,
  defaultNetwork: import.meta.env.VITE_DEFAULT_NETWORK || 'testnet'
};

/**
 * Get the current network configuration
 */
export const getCurrentNetwork = (): NetworkConfig => {
  return appConfig.networks[appConfig.defaultNetwork];
};

/**
 * Get network by chain ID
 */
export const getNetworkByChainId = (chainId: number): NetworkConfig | null => {
  return Object.values(appConfig.networks).find(network => network.chainId === chainId) || null;
};