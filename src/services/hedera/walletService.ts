import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';

export type WalletType = 'hashpack' | 'blade' | 'metamask';

export interface WalletConnection {
  accountId: string;
  publicKey: string;
  walletType: WalletType;
  provider?: any;
  signer?: any;
}

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '0ba0b0f4c70a4f6a7f4a4e5b5c5a5d5e';

class WalletService {
  private dAppConnector: DAppConnector | null = null;
  private network: LedgerId = LedgerId.TESTNET;
  private initialized: boolean = false;

  async init() {
    if (this.initialized && this.dAppConnector) {
      return this.dAppConnector;
    }

    const metadata = {
      name: 'Hedera CertChain',
      description: 'Blockchain Certificate Management on Hedera',
      url: window.location.origin,
      icons: ['https://avatars.githubusercontent.com/u/31002956'],
    };

    this.dAppConnector = new DAppConnector(
      metadata,
      this.network,
      WALLETCONNECT_PROJECT_ID,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [HederaChainId.Mainnet, HederaChainId.Testnet],
    );

    await this.dAppConnector.init({ logger: 'error' });
    this.initialized = true;

    console.log('DAppConnector initialized');
    return this.dAppConnector;
  }

  setNetwork(network: 'testnet' | 'mainnet') {
    this.network = network === 'testnet' ? LedgerId.TESTNET : LedgerId.MAINNET;
  }

  // Connect to wallet using WalletConnect modal
  async connectHashPack(): Promise<WalletConnection> {
    try {
      console.log('Connecting to HashPack via WalletConnect...');
      
      const connector = await this.init();
      
      // Open WalletConnect modal
      await connector.openModal();

      // Wait for session to be established
      const session = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 60000); // 60 second timeout

        const checkSession = setInterval(() => {
          const sessions = connector.signers;
          if (sessions && sessions.length > 0) {
            clearInterval(checkSession);
            clearTimeout(timeout);
            resolve(sessions[0]);
          }
        }, 500);
      });

      if (!session || !session.getAccountId()) {
        throw new Error('No account connected');
      }

      const accountId = session.getAccountId().toString();
      console.log('HashPack connected:', accountId);

      return {
        accountId,
        publicKey: accountId,
        walletType: 'hashpack',
        provider: connector,
        signer: session,
      };
    } catch (error) {
      console.error('HashPack connection error:', error);
      throw error;
    }
  }

  // Blade Wallet Connection
  async connectBlade(): Promise<WalletConnection> {
    try {
      if (!window.bladeConnector) {
        throw new Error('Blade wallet not found. Please install Blade wallet extension.');
      }

      const blade = window.bladeConnector;
      const result = await blade.createSession();

      if (!result || !result.accountId) {
        throw new Error('Failed to connect to Blade wallet');
      }

      console.log('Blade connected:', result.accountId);

      return {
        accountId: result.accountId,
        publicKey: result.publicKey || '',
        walletType: 'blade',
        provider: blade,
      };
    } catch (error) {
      console.error('Blade connection error:', error);
      throw error;
    }
  }

  // MetaMask Connection (for EVM compatibility)
  async connectMetaMask(): Promise<WalletConnection> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }

      const ethereum = window.ethereum as any;
      
      // Verify it's actually MetaMask and not Phantom or another wallet
      if (!ethereum.isMetaMask) {
        throw new Error('MetaMask not detected. Found another wallet provider instead.');
      }

      // Additional check to exclude Phantom
      if (ethereum.isPhantom) {
        throw new Error('Phantom wallet detected. Please use MetaMask for this connection.');
      }
      
      // Request account access
      const accounts = await ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No MetaMask accounts found');
      }

      const evmAddress = accounts[0];
      
      console.log('MetaMask connected:', evmAddress);

      return {
        accountId: evmAddress, // EVM address
        publicKey: evmAddress,
        walletType: 'metamask',
        provider: ethereum,
      };
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw error;
    }
  }

  // Generic connect function
  async connect(walletType: WalletType): Promise<WalletConnection> {
    switch (walletType) {
      case 'hashpack':
        return this.connectHashPack();
      case 'blade':
        return this.connectBlade();
      case 'metamask':
        return this.connectMetaMask();
      default:
        throw new Error(`Unsupported wallet type: ${walletType}`);
    }
  }

  // Disconnect wallet
  async disconnect(walletType: WalletType): Promise<void> {
    try {
      switch (walletType) {
        case 'hashpack':
          if (this.dAppConnector) {
            await this.dAppConnector.disconnectAll();
          }
          break;
        case 'blade':
          if (window.bladeConnector) {
            await window.bladeConnector.killSession();
          }
          break;
        case 'metamask':
          console.log('MetaMask disconnect (manual)');
          break;
      }
      console.log(`${walletType} disconnected`);
    } catch (error) {
      console.error(`Error disconnecting ${walletType}:`, error);
      throw error;
    }
  }

  // Get the DAppConnector instance
  getConnector(): DAppConnector | null {
    return this.dAppConnector;
  }

}

declare global {
  interface Window {
    bladeConnector?: any;
    ethereum?: any;
  }
}

export const walletService = new WalletService();
