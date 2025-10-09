import { AccountId, LedgerId } from '@hashgraph/sdk';

declare global {
  interface Window {
    bladeConnector?: any;
    hashconnect?: any;
  }
}

// Store pairing data
let hashpackPairing: any = null;

export type WalletType = 'hashpack' | 'blade' | 'metamask';

export interface WalletConnection {
  accountId: string;
  publicKey: string;
  walletType: WalletType;
  provider?: any;
  signer?: any;
}

class WalletService {
  private network: LedgerId = LedgerId.TESTNET;

  setNetwork(network: 'testnet' | 'mainnet') {
    this.network = network === 'testnet' ? LedgerId.TESTNET : LedgerId.MAINNET;
  }

  // HashPack Connection (Primary Wallet)
  async connectHashPack(): Promise<WalletConnection> {
    try {
      // Wait for HashPack extension to inject into window
      const waitForHashPack = () => {
        return new Promise<void>((resolve, reject) => {
          const maxAttempts = 10;
          let attempts = 0;

          const checkInterval = setInterval(() => {
            attempts++;
            
            // Check multiple possible injection methods
            if (window.hashconnect || (window as any).hashpack) {
              clearInterval(checkInterval);
              resolve();
              return;
            }

            if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              reject(new Error('HashPack extension not detected. Please ensure it is installed and enabled.'));
            }
          }, 300);
        });
      };

      // Wait for extension to be available
      await waitForHashPack();

      // Get HashConnect instance from window
      const hashconnect = window.hashconnect || (window as any).hashpack;
      
      if (!hashconnect) {
        throw new Error('HashPack extension failed to initialize');
      }

      // Return cached pairing if available
      if (hashpackPairing && hashpackPairing.accountIds && hashpackPairing.accountIds.length > 0) {
        console.log('Using cached HashPack connection:', hashpackPairing.accountIds[0]);
        return {
          accountId: hashpackPairing.accountIds[0],
          publicKey: hashpackPairing.accountIds[0],
          walletType: 'hashpack',
          provider: hashconnect,
        };
      }

      // Connect to local wallet
      const pairingData = await hashconnect.connectToLocalWallet();
      
      if (!pairingData || !pairingData.accountIds || pairingData.accountIds.length === 0) {
        throw new Error('Failed to pair with HashPack wallet. Please try again.');
      }

      // Cache the pairing
      hashpackPairing = pairingData;
      
      const accountId = pairingData.accountIds[0];
      console.log('HashPack connected:', accountId);

      return {
        accountId,
        publicKey: accountId,
        walletType: 'hashpack',
        provider: hashconnect,
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

      const ethereum = window.ethereum;
      
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
          hashpackPairing = null;
          const hashconnect = window.hashconnect || (window as any).hashpack;
          if (hashconnect && hashconnect.disconnect) {
            await hashconnect.disconnect();
          }
          break;
        case 'blade':
          if (window.bladeConnector) {
            await window.bladeConnector.killSession();
          }
          break;
        case 'metamask':
          // MetaMask doesn't have a programmatic disconnect
          console.log('MetaMask disconnect (manual)');
          break;
      }
      console.log(`${walletType} disconnected`);
    } catch (error) {
      console.error(`Error disconnecting ${walletType}:`, error);
      throw error;
    }
  }

  // Get account balance
  async getAccountBalance(accountId: string): Promise<string> {
    try {
      // This will be implemented with Hedera SDK client
      // For now, return placeholder
      return '0';
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  // Validate Hedera Account ID format
  isValidAccountId(accountId: string): boolean {
    try {
      AccountId.fromString(accountId);
      return true;
    } catch {
      return false;
    }
  }
}

export const walletService = new WalletService();
