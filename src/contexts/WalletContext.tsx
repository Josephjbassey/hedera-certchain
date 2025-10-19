import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { walletService } from '@/services/hedera/walletService';
import type { DAppConnector } from '@hashgraph/hedera-wallet-connect';

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
  
  // DApp connector instance
  dAppConnector: DAppConnector | null;
  
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
  const [dAppConnector, setDAppConnector] = useState<DAppConnector | null>(null);
  const [session, setSession] = useState<any | null>(null);

  // Initialize DAppConnector
  useEffect(() => {
    const initConnector = async () => {
      try {
        walletService.setNetwork(network);
        const connector = await walletService.init();
        setDAppConnector(connector);
        
        // Try to restore existing session
        const existingSession = walletService.getSession();
        if (existingSession) {
          const existingAccountId = existingSession.getAccountId?.();
          const existingPublicKey = existingSession.getAccountKey?.();
          
          if (existingAccountId) {
            setAccountId(existingAccountId.toString());
            setPublicKey(existingPublicKey?.toString() || existingAccountId.toString());
            setIsConnected(true);
            setSession(existingSession);
            console.log('Restored wallet session:', existingAccountId.toString());
          }
        }
      } catch (error) {
        console.error('Failed to initialize wallet connector:', error);
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
