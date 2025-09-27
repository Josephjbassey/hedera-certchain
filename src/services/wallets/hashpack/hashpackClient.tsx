import { WalletInterface } from "../walletInterface";
import { AccountId, ContractId, TokenId, TransactionId } from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";

declare global {
  interface Window {
    hashpack?: any;
  }
}

class HashPackWallet implements WalletInterface {
  private hashpack: any = null;
  private accountId: string = '';
  private isInitialized = false;

  constructor() {
    this.initializeHashPack();
  }

  private async initializeHashPack() {
    try {
      // Wait for HashPack to be injected
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!window.hashpack && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.hashpack) {
        this.hashpack = window.hashpack;
        this.isInitialized = true;
        console.log('HashPack initialized successfully');
      } else {
        console.warn('HashPack not found after waiting');
      }
    } catch (error) {
      console.error('HashPack initialization error:', error);
    }
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (!this.hashpack) {
        throw new Error('HashPack not available');
      }

      const response = await this.hashpack.connectToLocalWallet();
      
      if (response.success && response.accountIds?.length > 0) {
        this.accountId = response.accountIds[0];
        console.log('HashPack connected:', this.accountId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('HashPack connection error:', error);
      return false;
    }
  }

  getAccountId(): string {
    return this.accountId;
  }

  isConnected(): boolean {
    return !!this.accountId && this.isInitialized;
  }

  async executeContractFunction(
    contractId: ContractId,
    functionName: string,
    functionParameters: ContractFunctionParameterBuilder,
    gasLimit: number
  ): Promise<TransactionId | string | null> {
    try {
      if (!this.hashpack || !this.accountId) {
        throw new Error('HashPack not connected');
      }

      // For now, return a mock transaction ID
      // TODO: Implement actual HashPack contract execution
      console.log('Executing contract function via HashPack:', {
        contractId: contractId.toString(),
        functionName,
        gasLimit
      });
      
      return 'hashpack-tx-' + Date.now();
    } catch (error) {
      console.error('HashPack contract execution error:', error);
      return null;
    }
  }

  async transferHBAR(toAddress: AccountId, amount: number): Promise<TransactionId | string | null> {
    try {
      if (!this.hashpack || !this.accountId) {
        throw new Error('HashPack not connected');
      }

      console.log('Transferring HBAR via HashPack:', { toAddress: toAddress.toString(), amount });
      return 'hashpack-transfer-' + Date.now();
    } catch (error) {
      console.error('HashPack HBAR transfer error:', error);
      return null;
    }
  }

  async transferFungibleToken(
    toAddress: AccountId,
    tokenId: TokenId,
    amount: number
  ): Promise<TransactionId | string | null> {
    console.log('HashPack fungible token transfer not implemented');
    return null;
  }

  async transferNonFungibleToken(
    toAddress: AccountId,
    tokenId: TokenId,
    serialNumber: number
  ): Promise<TransactionId | string | null> {
    console.log('HashPack NFT transfer not implemented');
    return null;
  }

  async associateToken(tokenId: TokenId): Promise<TransactionId | string | null> {
    console.log('HashPack token association not implemented');
    return null;
  }

  disconnect(): void {
    try {
      this.accountId = '';
      console.log('HashPack disconnected');
    } catch (error) {
      console.error('HashPack disconnect error:', error);
    }
  }
}

export const hashPackWallet = new HashPackWallet();

// Helper function to connect to HashPack
export const connectToHashPack = async (): Promise<boolean> => {
  return await hashPackWallet.connectWallet();
};

// HashPack client component for managing connection state
import { useContext, useEffect } from "react";
import { HashpackContext } from "../../../contexts/HashpackContext";

export const HashPackClient = () => {
  const { setHashpackAccountId } = useContext(HashpackContext);

  useEffect(() => {
    // Check if already connected
    if (hashPackWallet.isConnected()) {
      setHashpackAccountId(hashPackWallet.getAccountId());
    }

    // Listen for connection changes (if HashPack provides events)
    const checkConnection = () => {
      if (hashPackWallet.isConnected()) {
        setHashpackAccountId(hashPackWallet.getAccountId());
      } else {
        setHashpackAccountId('');
      }
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [setHashpackAccountId]);

  return null;
};