import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HashConnect, HashConnectTypes, MessageTypes } from 'hashconnect';

interface WalletContextType {
  isConnected: boolean;
  accountId: string | null;
  publicKey: string | null;
  network: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  hashConnect: HashConnect | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [hashConnect, setHashConnect] = useState<HashConnect | null>(null);
  const [network] = useState('testnet'); // Change to 'mainnet' for production

  useEffect(() => {
    initializeHashConnect();
    loadSavedSession();
  }, []);

  const initializeHashConnect = async () => {
    try {
      const hc = new HashConnect(true); // true for debug mode
      
      const appMetadata: HashConnectTypes.AppMetadata = {
        name: 'Hedera CertChain',
        description: 'Decentralized Certificate Verification on Hedera Blockchain',
        icon: window.location.origin + '/favicon.ico',
        url: window.location.origin
      };

      // Initialize HashConnect
      await hc.init(appMetadata, network as HashConnectTypes.NetworkName);
      
      // Set up event listeners
      hc.pairingEvent.on((data) => {
        console.log('Pairing event:', data);
      });

      hc.connectionStatusChangeEvent.on((state) => {
        console.log('Connection status change:', state);
        setIsConnected(state === HashConnectTypes.ConnectionState.Paired);
      });

      hc.acknowledgeMessageEvent.on((data) => {
        console.log('Message acknowledged:', data);
      });

      setHashConnect(hc);
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
    }
  };

  const loadSavedSession = () => {
    const savedSession = localStorage.getItem('hedera-certchain-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setAccountId(session.accountId);
        setPublicKey(session.publicKey);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to load saved session:', error);
        localStorage.removeItem('hedera-certchain-session');
      }
    }
  };

  const saveSession = (accountId: string, publicKey: string) => {
    const session = { accountId, publicKey, timestamp: Date.now() };
    localStorage.setItem('hedera-certchain-session', JSON.stringify(session));
  };

  const connectWallet = async () => {
    if (!hashConnect) {
      throw new Error('HashConnect not initialized');
    }

    try {
      // Request pairing
      await hashConnect.connectToLocalWallet();
      
      // Get pairing data
      const pairingData = hashConnect.hcData.pairingData[0];
      
      if (pairingData?.accountIds && pairingData.accountIds.length > 0) {
        const connectedAccountId = pairingData.accountIds[0];
        const connectedPublicKey = pairingData.publicKey || '';
        
        setAccountId(connectedAccountId);
        setPublicKey(connectedPublicKey);
        setIsConnected(true);
        
        saveSession(connectedAccountId, connectedPublicKey);
        
        console.log('Wallet connected:', {
          accountId: connectedAccountId,
          network
        });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    if (hashConnect) {
      hashConnect.disconnect();
    }
    
    setIsConnected(false);
    setAccountId(null);
    setPublicKey(null);
    
    localStorage.removeItem('hedera-certchain-session');
    console.log('Wallet disconnected');
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!hashConnect || !isConnected || !accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const messageToSign: MessageTypes.Transaction = {
        topic: hashConnect.hcData.topic || '',
        byteArray: new TextEncoder().encode(message),
        metadata: {
          accountToSign: accountId,
          returnTransaction: false
        }
      };

      const response = await hashConnect.sendTransaction(messageToSign);
      return response.signedTransaction || '';
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    isConnected,
    accountId,
    publicKey,
    network,
    connectWallet,
    disconnectWallet,
    signMessage,
    hashConnect
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;