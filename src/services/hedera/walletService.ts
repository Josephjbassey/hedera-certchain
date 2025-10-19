export type WalletType = 'hashpack' | 'blade' | 'metamask';

export interface WalletConnection {
  accountId: string;
  publicKey: string;
  walletType: WalletType;
  provider?: any;
  signer?: any;
}

declare global {
  interface Window {
    hashpack?: {
      isPaired: () => Promise<boolean>;
      pair: (metadata: any) => Promise<any>;
      sendTransaction: (transaction: any) => Promise<any>;
      disconnect: () => Promise<void>;
    };
  }
}

class WalletService {
  private network: 'testnet' | 'mainnet' = 'testnet';
  private pairingData: any = null;

  setNetwork(network: 'testnet' | 'mainnet') {
    this.network = network;
  }

  async init() {
    // Check if HashPack extension is installed
    if (!window.hashpack) {
      throw new Error('HashPack wallet extension not detected. Please install HashPack from https://www.hashpack.app/');
    }
    console.log('HashPack detected');
  }

  async connect(): Promise<WalletConnection> {
    try {
      console.log('Connecting to HashPack wallet...');
      
      await this.init();

      if (!window.hashpack) {
        throw new Error('HashPack not available');
      }

      // Check if already paired
      const isPaired = await window.hashpack.isPaired();
      
      if (!isPaired) {
        // Pair with HashPack
        const appMetadata = {
          name: 'Hedera CertChain',
          description: 'Blockchain Certificate Management on Hedera',
          icons: ['https://avatars.githubusercontent.com/u/31002956'],
          url: window.location.origin,
        };

        this.pairingData = await window.hashpack.pair(appMetadata);
      } else {
        console.log('Already paired with HashPack');
      }

      // Get account info from HashPack
      const accountId = this.pairingData?.accountIds?.[0] || 'Connected';
      
      console.log('HashPack wallet connected:', accountId);

      return {
        accountId,
        publicKey: accountId,
        walletType: 'hashpack',
        provider: window.hashpack,
        signer: this.pairingData,
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      if (error instanceof Error && error.message.includes('not detected')) {
        throw new Error('Please install HashPack wallet extension from https://www.hashpack.app/download');
      }
      
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (window.hashpack) {
        await window.hashpack.disconnect();
        this.pairingData = null;
        console.log('Wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  getSession() {
    return this.pairingData;
  }
}

export const walletService = new WalletService();
