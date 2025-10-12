import React, { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';
import type { SessionTypes } from '@walletconnect/types';

const WALLETCONNECT_PROJECT_ID = '0ba0b0f4c70a4f6a7f4a4e5b5c5a5d5e';

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
  session: SessionTypes.Struct | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// App metadata for WalletConnect
const APP_METADATA = {
  name: 'Hedera CertChain',
  description: 'Blockchain Certificate Management on Hedera',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://example.com',
  icons: ['https://avatars.githubusercontent.com/u/31002956'],
};

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
  const [session, setSession] = useState<SessionTypes.Struct | null>(null);

  // Initialize DAppConnector
  useEffect(() => {
    const initConnector = async () => {
      try {
        const ledgerId = network === 'testnet' ? LedgerId.TESTNET : LedgerId.MAINNET;
        
        const connector = new DAppConnector(
          APP_METADATA,
          ledgerId,
          WALLETCONNECT_PROJECT_ID,
          Object.values(HederaJsonRpcMethod),
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [HederaChainId.Mainnet, HederaChainId.Testnet],
        );

        await connector.init({ logger: 'error' });
        
        console.log('DAppConnector initialized');
        setDAppConnector(connector);

        // Check for existing sessions
        const sessions = connector.signers;
        if (sessions && sessions.length > 0) {
          const existingSession = sessions[0];
          const existingAccountId = existingSession.getAccountId();
          const existingPublicKey = existingSession.getAccountKey?.();
          
          if (existingAccountId) {
            setAccountId(existingAccountId.toString());
            setPublicKey(existingPublicKey?.toString() || null);
            setIsConnected(true);
            setSession(connector.walletConnectClient?.session.getAll()?.[0] || null);
            console.log('Restored session:', existingAccountId.toString());
          }
        }

        // Set up event listeners
        connector.onSessionIframeCreated = (session) => {
          console.log('Session created:', session);
        };

      } catch (error) {
        console.error('Failed to initialize DAppConnector:', error);
      }
    };

    initConnector();
  }, [network]);

  // Handle session events
  useEffect(() => {
    if (!dAppConnector) return;

    const handleSessionUpdate = () => {
      const sessions = dAppConnector.signers;
      if (sessions && sessions.length > 0) {
        const activeSession = sessions[0];
        const activeAccountId = activeSession.getAccountId();
        const activePublicKey = activeSession.getAccountKey?.();
        
        if (activeAccountId) {
          setAccountId(activeAccountId.toString());
          setPublicKey(activePublicKey?.toString() || null);
          setIsConnected(true);
        }
      } else {
        setAccountId(null);
        setPublicKey(null);
        setIsConnected(false);
      }
    };

    // Monitor for session changes
    const interval = setInterval(() => {
      handleSessionUpdate();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [dAppConnector]);

  const connect = useCallback(async () => {
    if (!dAppConnector) {
      throw new Error('DAppConnector not initialized');
    }

    setIsConnecting(true);
    try {
      // Open WalletConnect modal
      await dAppConnector.openModal();

      // Wait for session to be established
      const waitForSession = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 60000); // 60 second timeout

        const checkSession = setInterval(() => {
          const sessions = dAppConnector.signers;
          if (sessions && sessions.length > 0) {
            const newSession = sessions[0];
            const newAccountId = newSession.getAccountId();
            const newPublicKey = newSession.getAccountKey?.();
            
            if (newAccountId) {
              setAccountId(newAccountId.toString());
              setPublicKey(newPublicKey?.toString() || null);
              setIsConnected(true);
              setSession(dAppConnector.walletConnectClient?.session.getAll()?.[0] || null);
              
              clearInterval(checkSession);
              clearTimeout(timeout);
              resolve();
            }
          }
        }, 100);
      });

      await waitForSession;
      console.log('Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [dAppConnector]);

  const disconnect = useCallback(async () => {
    if (!dAppConnector) return;

    try {
      await dAppConnector.disconnectAll();
      setAccountId(null);
      setPublicKey(null);
      setIsConnected(false);
      setSession(null);
      console.log('Wallet disconnected');
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    }
  }, [dAppConnector]);

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
