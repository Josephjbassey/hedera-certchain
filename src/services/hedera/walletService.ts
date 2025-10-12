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

const WALLETCONNECT_PROJECT_ID = '0ba0b0f4c70a4f6a7f4a4e5b5c5a5d5e';

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

  // Connect using WalletConnect modal - supports all Hedera wallets
  async connect(): Promise<WalletConnection> {
    try {
      console.log('Opening WalletConnect modal...');
      
      const connector = await this.init();
      
      // Open WalletConnect modal - this will show all available wallets
      await connector.openModal();

      // Wait for session to be established
      const session = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - please try again'));
        }, 60000); // 60 second timeout

        const checkSession = setInterval(() => {
          const sessions = connector.signers;
          if (sessions && sessions.length > 0) {
            clearInterval(checkSession);
            clearTimeout(timeout);
            resolve(sessions[0]);
          }
        }, 100);
      });

      if (!session || !session.getAccountId()) {
        throw new Error('No account connected');
      }

      const accountId = session.getAccountId().toString();
      const publicKey = session.getAccountKey?.().toString() || accountId;
      
      console.log('Wallet connected:', accountId);

      return {
        accountId,
        publicKey,
        walletType: 'hashpack', // Default to hashpack for compatibility
        provider: connector,
        signer: session,
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    try {
      if (this.dAppConnector) {
        await this.dAppConnector.disconnectAll();
        console.log('Wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  // Get the DAppConnector instance
  getConnector(): DAppConnector | null {
    return this.dAppConnector;
  }

  // Get connected session
  getSession() {
    if (!this.dAppConnector) return null;
    const sessions = this.dAppConnector.signers;
    return sessions && sessions.length > 0 ? sessions[0] : null;
  }
}

export const walletService = new WalletService();
