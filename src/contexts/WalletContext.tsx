/**
 * Wallet Connection Context
 * 
 * Provides comprehensive wallet management functionality including:
 * - Multi-wallet support (MetaMask, HashPack, Blade, WalletConnect)
 * - Connection state management and persistence
 * - Account switching and network detection
 * - Blockchain state synchronization
 * - Real-time updates and error handling
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { blockchainService, WalletType } from '@/services/blockchain/contractService';

// Types
export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType | null;
  address: string | null;
  balance: string | null;
  network: string | null;
  error: string | null;
  supportedWallets: WalletType[];
  lastConnectedWallet: WalletType | null;
}

export type WalletAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { walletType: WalletType; address: string; balance?: string; network?: string } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_BALANCE'; payload: string }
  | { type: 'UPDATE_NETWORK'; payload: string }
  | { type: 'SET_SUPPORTED_WALLETS'; payload: WalletType[] }
  | { type: 'SET_LAST_CONNECTED_WALLET'; payload: WalletType | null };

export interface WalletContextType {
  state: WalletState;
  connectWallet: (walletType: WalletType) => Promise<boolean>;
  disconnectWallet: () => Promise<void>;
  switchAccount: (address: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  refreshConnection: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: WalletState = {
  isConnected: false,
  isConnecting: false,
  walletType: null,
  address: null,
  balance: null,
  network: null,
  error: null,
  supportedWallets: [],
  lastConnectedWallet: null,
};

// Local storage keys
const STORAGE_KEYS = {
  LAST_WALLET: 'hedera-certchain-last-wallet',
  AUTO_CONNECT: 'hedera-certchain-auto-connect',
} as const;

// Reducer
function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: action.payload,
        error: action.payload ? null : state.error, // Clear error when starting connection
      };

    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
        walletType: action.payload.walletType,
        address: action.payload.address,
        balance: action.payload.balance || null,
        network: action.payload.network || null,
        error: null,
        lastConnectedWallet: action.payload.walletType,
      };

    case 'SET_DISCONNECTED':
      return {
        ...state,
        isConnected: false,
        isConnecting: false,
        walletType: null,
        address: null,
        balance: null,
        network: null,
        error: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        isConnecting: false,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_BALANCE':
      return {
        ...state,
        balance: action.payload,
      };

    case 'UPDATE_NETWORK':
      return {
        ...state,
        network: action.payload,
      };

    case 'SET_SUPPORTED_WALLETS':
      return {
        ...state,
        supportedWallets: action.payload,
      };

    case 'SET_LAST_CONNECTED_WALLET':
      return {
        ...state,
        lastConnectedWallet: action.payload,
      };

    default:
      return state;
  }
}

// Context creation
const WalletContext = createContext<WalletContextType | null>(null);

// Hook for using wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Provider component
interface WalletProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ 
  children, 
  autoConnect = true 
}) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // Check supported wallets
  const checkSupportedWallets = useCallback(async () => {
    try {
      const supported = await blockchainService.getSupportedWallets();
      dispatch({ type: 'SET_SUPPORTED_WALLETS', payload: supported });
    } catch (error) {
      console.warn('Failed to check supported wallets:', error);
      dispatch({ type: 'SET_SUPPORTED_WALLETS', payload: [] });
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async (walletType: WalletType): Promise<boolean> => {
    dispatch({ type: 'SET_CONNECTING', payload: true });
    
    try {
      console.log(`🔄 Connecting to ${walletType} wallet...`);
      
      const result = await blockchainService.connectWallet(walletType);
      
      if (result.success && result.address) {
        // Get additional wallet info
        let balance: string | undefined;
        let network: string | undefined;
        
        try {
          balance = await blockchainService.getBalance(result.address);
          network = await blockchainService.getNetwork();
        } catch (error) {
          console.warn('Failed to get wallet details:', error);
        }

        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            walletType,
            address: result.address,
            balance,
            network,
          },
        });

        // Store connection preference
        localStorage.setItem(STORAGE_KEYS.LAST_WALLET, walletType);
        localStorage.setItem(STORAGE_KEYS.AUTO_CONNECT, 'true');

        console.log(`✅ Successfully connected to ${walletType}:`, result.address);
        return true;
      } else {
        throw new Error(result.error || 'Connection failed');
      }
    } catch (error: any) {
      console.error(`❌ Failed to connect to ${walletType}:`, error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to connect wallet' });
      return false;
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async (): Promise<void> => {
    try {
      await blockchainService.disconnect();
      dispatch({ type: 'SET_DISCONNECTED' });
      
      // Clear connection preference
      localStorage.removeItem(STORAGE_KEYS.AUTO_CONNECT);
      
      console.log('🔌 Wallet disconnected');
    } catch (error: any) {
      console.error('❌ Failed to disconnect wallet:', error);
      // Force disconnect even if blockchain service fails
      dispatch({ type: 'SET_DISCONNECTED' });
    }
  }, []);

  // Switch account
  const switchAccount = useCallback(async (address: string): Promise<boolean> => {
    if (!state.walletType) {
      dispatch({ type: 'SET_ERROR', payload: 'No wallet connected' });
      return false;
    }

    try {
      const result = await blockchainService.switchAccount(address);
      
      if (result.success) {
        // Update balance for new account
        let balance: string | undefined;
        try {
          balance = await blockchainService.getBalance(address);
        } catch (error) {
          console.warn('Failed to get balance for new account:', error);
        }

        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            walletType: state.walletType,
            address,
            balance,
            network: state.network || undefined,
          },
        });

        console.log('🔄 Switched to account:', address);
        return true;
      } else {
        throw new Error(result.error || 'Account switch failed');
      }
    } catch (error: any) {
      console.error('❌ Failed to switch account:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to switch account' });
      return false;
    }
  }, [state.walletType, state.network]);

  // Refresh balance
  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!state.address) return;

    try {
      const balance = await blockchainService.getBalance(state.address);
      dispatch({ type: 'UPDATE_BALANCE', payload: balance });
    } catch (error: any) {
      console.error('❌ Failed to refresh balance:', error);
    }
  }, [state.address]);

  // Refresh connection
  const refreshConnection = useCallback(async (): Promise<void> => {
    if (!state.walletType) return;

    try {
      const isStillConnected = await blockchainService.isWalletConnected();
      
      if (!isStillConnected) {
        dispatch({ type: 'SET_DISCONNECTED' });
        console.log('🔌 Wallet connection lost');
        return;
      }

      // Refresh account and network info
      const currentAccount = await blockchainService.getCurrentAccount();
      const currentNetwork = await blockchainService.getNetwork();
      
      if (currentAccount !== state.address) {
        // Account changed
        const balance = await blockchainService.getBalance(currentAccount);
        dispatch({
          type: 'SET_CONNECTED',
          payload: {
            walletType: state.walletType,
            address: currentAccount,
            balance,
            network: currentNetwork,
          },
        });
      } else if (currentNetwork !== state.network) {
        // Network changed
        dispatch({ type: 'UPDATE_NETWORK', payload: currentNetwork });
      }
    } catch (error: any) {
      console.error('❌ Failed to refresh connection:', error);
      // Don't dispatch error for refresh failures
    }
  }, [state.walletType, state.address, state.network]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const initializeWallet = async () => {
      // Check supported wallets first
      await checkSupportedWallets();

      if (!autoConnect) return;

      const shouldAutoConnect = localStorage.getItem(STORAGE_KEYS.AUTO_CONNECT) === 'true';
      const lastWallet = localStorage.getItem(STORAGE_KEYS.LAST_WALLET) as WalletType | null;

      if (shouldAutoConnect && lastWallet) {
        console.log(`🔄 Auto-connecting to last wallet: ${lastWallet}`);
        
        // Set last connected wallet for UI
        dispatch({ type: 'SET_LAST_CONNECTED_WALLET', payload: lastWallet });
        
        // Try to reconnect
        try {
          await connectWallet(lastWallet);
        } catch (error) {
          console.log('ℹ️ Auto-connect failed, user will need to connect manually');
          // Clear auto-connect flag if it fails
          localStorage.removeItem(STORAGE_KEYS.AUTO_CONNECT);
        }
      }
    };

    initializeWallet();
  }, [autoConnect, checkSupportedWallets, connectWallet]);

  // Listen for wallet events
  useEffect(() => {
    if (!state.isConnected) return;

    const handleAccountChange = (newAccount: string) => {
      if (newAccount !== state.address) {
        console.log('👤 Account changed to:', newAccount);
        switchAccount(newAccount);
      }
    };

    const handleNetworkChange = (newNetwork: string) => {
      if (newNetwork !== state.network) {
        console.log('🌐 Network changed to:', newNetwork);
        dispatch({ type: 'UPDATE_NETWORK', payload: newNetwork });
      }
    };

    const handleDisconnect = () => {
      console.log('🔌 Wallet disconnected externally');
      dispatch({ type: 'SET_DISCONNECTED' });
    };

    // Set up event listeners through blockchain service
    try {
      blockchainService.onAccountChanged(handleAccountChange);
      blockchainService.onNetworkChanged(handleNetworkChange);
      blockchainService.onDisconnect(handleDisconnect);
    } catch (error) {
      console.warn('Failed to set up wallet event listeners:', error);
    }

    // Cleanup function
    return () => {
      try {
        blockchainService.removeAllListeners();
      } catch (error) {
        console.warn('Failed to remove wallet event listeners:', error);
      }
    };
  }, [state.isConnected, state.address, state.network, switchAccount]);

  // Periodic connection check
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(() => {
      refreshConnection();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [state.isConnected, refreshConnection]);

  // Context value
  const contextValue: WalletContextType = {
    state,
    connectWallet,
    disconnectWallet,
    switchAccount,
    refreshBalance,
    refreshConnection,
    clearError,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Wallet connection component for UI
interface WalletConnectionButtonProps {
  className?: string;
}

export const WalletConnectionButton: React.FC<WalletConnectionButtonProps> = ({ 
  className = '' 
}) => {
  const { state, connectWallet, disconnectWallet, clearError } = useWallet();

  const handleConnect = async (walletType: WalletType) => {
    clearError();
    await connectWallet(walletType);
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  if (state.isConnected && state.address) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-sm">
          <div className="font-medium">
            {state.address.slice(0, 6)}...{state.address.slice(-4)}
          </div>
          {state.balance && (
            <div className="text-xs text-muted-foreground">
              {parseFloat(state.balance).toFixed(4)} HBAR
            </div>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {state.error}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {state.supportedWallets.map((walletType) => (
          <button
            key={walletType}
            onClick={() => handleConnect(walletType)}
            disabled={state.isConnecting}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {state.isConnecting ? 'Connecting...' : `Connect ${walletType}`}
          </button>
        ))}
      </div>
    </div>
  );
};
