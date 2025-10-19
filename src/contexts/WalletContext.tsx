import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { walletService } from '@/services/hedera/walletService';
import type { HashConnect } from 'hashconnect';

// Context type definition
interface WalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  accountId: string | null;
  publicKey: string | null;
  network: 'testnet' | 'mainnet';
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // HashConnect instance
  dAppConnector: HashConnect | null;
  
  // Active session
  session: any | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  network?: 'testnet' | 'mainnet';
}

export function WalletProvider({ children, network = 'testnet' }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [dAppConnector, setDAppConnector] = useState<HashConnect | null>(null);
  const [session, setSession] = useState<any | null>(null);

  // Initialize HashConnect
  useEffect(() => {
    const initConnector = async () => {
      try {
        walletService.setNetwork(network);
        const connector = await walletService.init();
        setDAppConnector(connector);
        
        // Try to restore existing session
        const existingSession = walletService.getSession();
        const pairedAccounts = walletService.getPairedAccounts();
        
        if (existingSession && pairedAccounts.length > 0) {
          const restoredAccountId = pairedAccounts[0];
          
          setAccountId(restoredAccountId);
          setPublicKey(restoredAccountId);
          setIsConnected(true);
          setSession(existingSession);
          console.log('- Restored wallet session:', restoredAccountId);
        }
      } catch (error) {
        console.error('Failed to initialize HashConnect:', error);
      }
    };

    initConnector();
  }, [network]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const connection = await walletService.connect();
      
      setAccountId(connection.accountId);
      setPublicKey(connection.publicKey);
      setIsConnected(true);
      setSession(connection.signer);
      
      console.log('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletService.disconnect();
      setAccountId(null);
      setPublicKey(null);
      setIsConnected(false);
      setSession(null);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, []);

  const value: WalletContextType = {
    isConnected,
    isConnecting,
    accountId,
    publicKey,
    network,
    connect,
    disconnect,
    dAppConnector,
    session,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
