import {
  DAppConnector,
  HederaJsonRpcMethod,
  HederaSessionEvent,
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

// Use a more reliable WalletConnect project ID
const WALLETCONNECT_PROJECT_ID = 'cf5090df840ab6f63f0ebf6cb686c522';

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
      [HederaChainId.Testnet],
    );

    try {
      await this.dAppConnector.init({ logger: 'error' });
      this.initialized = true;
      console.log('DAppConnector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DAppConnector:', error);
      throw new Error('Please ensure HashPack wallet is installed and try again');
    }

    return this.dAppConnector;
  }

  setNetwork(network: 'testnet' | 'mainnet') {
    this.network = network === 'testnet' ? LedgerId.TESTNET : LedgerId.MAINNET;
  }

  async connect(): Promise<WalletConnection> {
    try {
      console.log('Opening wallet connection modal...');
      
      const connector = await this.init();
      
      // Open WalletConnect modal
      await connector.openModal();

      // Wait for session to be established
      const session = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - please approve the connection in your wallet'));
        }, 120000); // 2 minute timeout

        const checkSession = setInterval(() => {
          const sessions = connector.signers;
          if (sessions && sessions.length > 0) {
            clearInterval(checkSession);
            clearTimeout(timeout);
            resolve(sessions[0]);
          }
        }, 500); // Check every 500ms instead of 100ms
      });

      if (!session || !session.getAccountId()) {
        throw new Error('No account connected - please try again');
      }

      const accountId = session.getAccountId().toString();
      const publicKey = session.getAccountKey?.().toString() || accountId;
      
      console.log('Wallet connected successfully:', accountId);

      return {
        accountId,
        publicKey,
        walletType: 'hashpack',
        provider: connector,
        signer: session,
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          throw new Error('Connection rejected - please try again and approve in your wallet');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Connection timeout - please ensure HashPack is running and try again');
        }
      }
      
      throw error;
    }
  }

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

  getConnector(): DAppConnector | null {
    return this.dAppConnector;
  }

  getSession() {
    if (!this.dAppConnector) return null;
    const sessions = this.dAppConnector.signers;
    return sessions && sessions.length > 0 ? sessions[0] : null;
  }
}

export const walletService = new WalletService();
