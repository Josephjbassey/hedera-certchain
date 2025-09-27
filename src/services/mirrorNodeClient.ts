import { AccountId } from '@hashgraph/sdk';

// Mirror Node API interfaces following Hedera tutorial patterns
export interface MirrorNodeAccountTokenBalance {
  balance: number;
  token_id: string;
}

export interface MirrorNodeTokenInfo {
  type: 'FUNGIBLE_COMMON' | 'NON_FUNGIBLE_UNIQUE';
  decimals: string;
  name: string;
  symbol: string;
  token_id: string;
}

export interface MirrorNodeNftInfo {
  token_id: string;
  serial_number: number;
  metadata?: string;
}

export interface MirrorNodeAccountTokenBalanceWithInfo extends MirrorNodeAccountTokenBalance {
  info: MirrorNodeTokenInfo;
  nftSerialNumbers?: number[];
}

/**
 * Mirror Node Client for querying Hedera network data
 * Based on official Hedera documentation patterns
 */
export class MirrorNodeClient {
  private url: string;

  constructor(networkUrl: string = 'https://testnet.mirrornode.hedera.com') {
    this.url = networkUrl;
  }

  /**
   * Get token balances for an account
   */
  async getAccountTokenBalances(accountId: AccountId | string): Promise<MirrorNodeAccountTokenBalance[]> {
    const accountIdStr = typeof accountId === 'string' ? accountId : accountId.toString();
    
    // Get token balances
    const tokenBalanceInfo = await fetch(`${this.url}/api/v1/accounts/${accountIdStr}/tokens?limit=100`, { 
      method: "GET" 
    });
    const tokenBalanceInfoJson = await tokenBalanceInfo.json();

    const tokenBalances = [...tokenBalanceInfoJson.tokens] as MirrorNodeAccountTokenBalance[];

    // Handle pagination - mirror node API paginates results
    let nextLink = tokenBalanceInfoJson.links.next;
    while (nextLink !== null) {
      const nextTokenBalanceInfo = await fetch(`${this.url}${nextLink}`, { method: "GET" });
      const nextTokenBalanceInfoJson = await nextTokenBalanceInfo.json();
      tokenBalances.push(...nextTokenBalanceInfoJson.tokens);
      nextLink = nextTokenBalanceInfoJson.links.next;
    }

    return tokenBalances;
  }

  /**
   * Get token information by token ID
   */
  async getTokenInfo(tokenId: string): Promise<MirrorNodeTokenInfo> {
    const tokenInfo = await fetch(`${this.url}/api/v1/tokens/${tokenId}`, { method: "GET" });
    const tokenInfoJson = await tokenInfo.json() as MirrorNodeTokenInfo;
    return tokenInfoJson;
  }

  /**
   * Get NFT information for an account
   */
  async getNftInfo(accountId: AccountId | string): Promise<MirrorNodeNftInfo[]> {
    const accountIdStr = typeof accountId === 'string' ? accountId : accountId.toString();
    
    const nftInfo = await fetch(`${this.url}/api/v1/accounts/${accountIdStr}/nfts?limit=100`, { 
      method: "GET" 
    });
    const nftInfoJson = await nftInfo.json();

    const nftInfos = [...nftInfoJson.nfts] as MirrorNodeNftInfo[];

    // Handle pagination
    let nextLink = nftInfoJson.links.next;
    while (nextLink !== null) {
      const nextNftInfo = await fetch(`${this.url}${nextLink}`, { method: "GET" });
      const nextNftInfoJson = await nextNftInfo.json();
      nftInfos.push(...nextNftInfoJson.nfts);
      nextLink = nextNftInfoJson.links.next;
    }
    
    return nftInfos;
  }

  /**
   * Get account token balances with token info aggregated
   */
  async getAccountTokenBalancesWithTokenInfo(accountId: AccountId | string): Promise<MirrorNodeAccountTokenBalanceWithInfo[]> {
    // 1. Retrieve all token balances in the account
    const tokens = await this.getAccountTokenBalances(accountId);
    
    // 2. Create a map of token IDs to token info and fetch token info for each token
    const tokenInfos = new Map<string, MirrorNodeTokenInfo>();
    for (const token of tokens) {
      const tokenInfo = await this.getTokenInfo(token.token_id);
      tokenInfos.set(tokenInfo.token_id, tokenInfo);
    }

    // 3. Fetch all NFT info in account
    const nftInfos = await this.getNftInfo(accountId);

    // 4. Create a map of token IDs to arrays of serial numbers
    const tokenIdToSerialNumbers = new Map<string, number[]>();
    for (const nftInfo of nftInfos) {
      const tokenId = nftInfo.token_id;
      const serialNumber = nftInfo.serial_number;

      // If we haven't seen this token_id before, create a new array with the serial number
      if (!tokenIdToSerialNumbers.has(tokenId)) {
        tokenIdToSerialNumbers.set(tokenId, [serialNumber]);
      } else {
        // If we have seen this token_id before, add the serial number to the array
        tokenIdToSerialNumbers.get(tokenId)!.push(serialNumber);
      }
    }

    // 5. Combine token balances, token info, and NFT info and return
    return tokens.map(token => {
      return {
        ...token,
        info: tokenInfos.get(token.token_id)!,
        nftSerialNumbers: tokenIdToSerialNumbers.get(token.token_id)
      };
    });
  }

  /**
   * Check if an account is associated with a token
   */
  async isAssociated(accountId: AccountId | string, tokenId: string): Promise<boolean> {
    const accountTokenBalance = await this.getAccountTokenBalances(accountId);
    return accountTokenBalance.some(token => token.token_id === tokenId);
  }

  /**
   * Get NFT metadata by token ID and serial number
   */
  async getNftMetadata(tokenId: string, serialNumber: number): Promise<any> {
    try {
      const response = await fetch(`${this.url}/api/v1/tokens/${tokenId}/nfts/${serialNumber}`, { 
        method: "GET" 
      });
      const nftData = await response.json();
      
      // If metadata is base64 encoded, decode it
      if (nftData.metadata) {
        try {
          const decodedMetadata = atob(nftData.metadata);
          return JSON.parse(decodedMetadata);
        } catch (error) {
          console.warn('Could not decode NFT metadata:', error);
          return nftData.metadata;
        }
      }
      
      return nftData;
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
      return null;
    }
  }

  /**
   * Get transaction details by transaction ID
   */
  async getTransaction(transactionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.url}/api/v1/transactions/${transactionId}`, { 
        method: "GET" 
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      return null;
    }
  }
}

// Network configurations following Hedera patterns
export const MIRROR_NODE_NETWORKS = {
  testnet: 'https://testnet.mirrornode.hedera.com',
  mainnet: 'https://mainnet.mirrornode.hedera.com',
  previewnet: 'https://previewnet.mirrornode.hedera.com'
};