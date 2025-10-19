import { HashConnect, HashConnectConnectionState, SessionData } from 'hashconnect';
import { LedgerId } from '@hashgraph/sdk';

export type WalletType = 'hashpack' | 'blade' | 'metamask';

export interface WalletConnection {
  accountId: string;
  publicKey: string;
  walletType: WalletType;
  provider?: any;
  signer?: any;
}

// WalletConnect Project ID - get one from https://cloud.walletconnect.com/
const WALLETCONNECT_PROJECT_ID = 'cf5090df840ab6f63f0ebf6cb686c522';

class WalletService {
  private hashconnect: HashConnect | null = null;
  private state: HashConnectConnectionState = HashConnectConnectionState.Disconnected;
  private pairingData: SessionData | null = null;
  private network: LedgerId = LedgerId.TESTNET;
  private initialized: boolean = false;
  private appMetadata = {
    name: "Hedera CertChain",
    description: "Blockchain Certificate Management on Hedera",
    icons: ["https://avatars.githubusercontent.com/u/31002956"],
    url: window.location.origin,
  };

  async init() {
    if (this.initialized && this.hashconnect) {
      return this.hashconnect;
    }

    console.log('- Initializing HashConnect...');
    
    // Create the hashconnect instance
    this.hashconnect = new HashConnect(
      this.network,
      WALLETCONNECT_PROJECT_ID,
      this.appMetadata,
      true // debug mode
    );

    // Register events before initialization
    this.setupEvents();

    // Initialize HashConnect
    await this.hashconnect.init();
    
    this.initialized = true;
    console.log('- HashConnect initialized successfully');

    return this.hashconnect;
  }

  private setupEvents() {
    if (!this.hashconnect) return;

    this.hashconnect.pairingEvent.on((newPairing) => {
      console.log('- Pairing event:', newPairing);
      this.pairingData = newPairing;
    });

    this.hashconnect.disconnectionEvent.on((data) => {
      console.log('- Disconnection event:', data);
      this.pairingData = null;
    });

    this.hashconnect.connectionStatusChangeEvent.on((connectionStatus) => {
      console.log('- Connection state changed:', connectionStatus);
      this.state = connectionStatus;
    });
  }

  setNetwork(network: 'testnet' | 'mainnet') {
    this.network = network === 'testnet' ? LedgerId.TESTNET : LedgerId.MAINNET;
  }

  async connect(): Promise<WalletConnection> {
    try {
      console.log('- Connecting wallet...');
      
      const hashconnect = await this.init();

      // Open pairing modal
      hashconnect.openPairingModal();

      // Wait for pairing
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - please approve the connection in HashPack'));
        }, 120000); // 2 minute timeout

        const unsubscribe = hashconnect.pairingEvent.once((pairingData) => {
          clearTimeout(timeout);
          
          if (!pairingData.accountIds || pairingData.accountIds.length === 0) {
            reject(new Error('No accounts found in HashPack'));
            return;
          }

          const accountId = pairingData.accountIds[0];
          this.pairingData = pairingData;
          
          console.log('- HashPack wallet connected:', accountId);
          console.log('- All paired accounts:', pairingData.accountIds);

          resolve({
            accountId,
            publicKey: accountId,
            walletType: 'hashpack',
            provider: hashconnect,
            signer: pairingData,
          });
        });
      });
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('No extension')) {
          throw new Error('HashPack extension not found. Please install from https://www.hashpack.app/download');
        }
      }
      
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.hashconnect) {
        this.hashconnect.disconnect();
        this.pairingData = null;
        this.state = HashConnectConnectionState.Disconnected;
        console.log('- Wallet disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }

  getConnector(): HashConnect | null {
    return this.hashconnect;
  }

  getSession(): SessionData | null {
    return this.pairingData;
  }

  getConnectionState(): HashConnectConnectionState {
    return this.state;
  }

  getPairedAccounts(): string[] {
    return this.pairingData?.accountIds || [];
  }
}

export const walletService = new WalletService();
