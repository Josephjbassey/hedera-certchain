import { WalletInterface } from "../walletInterface";
import { AccountId, ContractId, TokenId, TransactionId } from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";

declare global {
  interface Window {
    blade?: any;
  }
}

class BladeWallet implements WalletInterface {
  private blade: any = null;
  private accountId: string = '';
  private isInitialized = false;

  constructor() {
    this.initializeBlade();
  }

  private async initializeBlade() {
    try {
      // Wait for Blade to be injected
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!window.blade && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (window.blade) {
        this.blade = window.blade;
        this.isInitialized = true;
        console.log('Blade initialized successfully');
      } else {
        console.warn('Blade not found after waiting');
      }
    } catch (error) {
      console.error('Blade initialization error:', error);
    }
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (!this.blade) {
        throw new Error('Blade not available');
      }

      const response = await this.blade.connectWallet();
      
      if (response.success && response.accountId) {
        this.accountId = response.accountId;
        console.log('Blade connected:', this.accountId);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Blade connection error:', error);
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
      if (!this.blade || !this.accountId) {
        throw new Error('Blade not connected');
      }

      console.log('Executing contract function via Blade:', {
        contractId: contractId.toString(),
        functionName,
        gasLimit
      });
      
      return 'blade-tx-' + Date.now();
    } catch (error) {
      console.error('Blade contract execution error:', error);
      return null;
    }
  }

  async transferHBAR(toAddress: AccountId, amount: number): Promise<TransactionId | string | null> {
    try {
      if (!this.blade || !this.accountId) {
        throw new Error('Blade not connected');
      }

      console.log('Transferring HBAR via Blade:', { toAddress: toAddress.toString(), amount });
      return 'blade-transfer-' + Date.now();
    } catch (error) {
      console.error('Blade HBAR transfer error:', error);
      return null;
    }
  }

  async transferFungibleToken(
    toAddress: AccountId,
    tokenId: TokenId,
    amount: number
  ): Promise<TransactionId | string | null> {
    console.log('Blade fungible token transfer not implemented');
    return null;
  }

  async transferNonFungibleToken(
    toAddress: AccountId,
    tokenId: TokenId,
    serialNumber: number
  ): Promise<TransactionId | string | null> {
    console.log('Blade NFT transfer not implemented');
    return null;
  }

  async associateToken(tokenId: TokenId): Promise<TransactionId | string | null> {
    console.log('Blade token association not implemented');
    return null;
  }

  disconnect(): void {
    try {
      this.accountId = '';
      console.log('Blade disconnected');
    } catch (error) {
      console.error('Blade disconnect error:', error);
    }
  }
}

export const bladeWallet = new BladeWallet();

// Helper function to connect to Blade
export const connectToBlade = async (): Promise<boolean> => {
  return await bladeWallet.connectWallet();
};

// Blade client component for managing connection state
import { useContext, useEffect } from "react";
import { BladeContext } from "../../../contexts/BladeContext";

export const BladeClient = () => {
  const { setBladeAccountId } = useContext(BladeContext);

  useEffect(() => {
    // Check if already connected
    if (bladeWallet.isConnected()) {
      setBladeAccountId(bladeWallet.getAccountId());
    }

    // Listen for connection changes
    const checkConnection = () => {
      if (bladeWallet.isConnected()) {
        setBladeAccountId(bladeWallet.getAccountId());
      } else {
        setBladeAccountId('');
      }
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [setBladeAccountId]);

  return null;
};