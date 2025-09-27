import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HederaContractService } from '@/services/hedera-contract';

interface WalletUser {
  address: string;
  network: string;
}

interface WalletContextType {
  isConnected: boolean;
  user: WalletUser | null;
  contractService: HederaContractService | null;
  connectWallet: () => Promise<WalletUser>;
  disconnectWallet: () => void;
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
  const [user, setUser] = useState<WalletUser | null>(null);
  const [contractService, setContractService] = useState<HederaContractService | null>(null);

  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = () => {
    const savedSession = localStorage.getItem('hedera-certchain-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUser(session.user);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to load saved session:', error);
        localStorage.removeItem('hedera-certchain-session');
      }
    }
  };

  const saveSession = (user: WalletUser) => {
    const session = { user, timestamp: Date.now() };
    localStorage.setItem('hedera-certchain-session', JSON.stringify(session));
  };

  const connectWallet = async (): Promise<WalletUser> => {
    try {
      // Use default contract address for connection (will be updated when we have actual deployment)
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
      const service = new HederaContractService(contractAddress);
      
      const connectionResult = await service.connectWallet();
      
      setUser(connectionResult);
      setIsConnected(true);
      setContractService(service);
      
      saveSession(connectionResult);
      
      console.log('Wallet connected:', connectionResult);
      return connectionResult;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setUser(null);
    setContractService(null);
    
    localStorage.removeItem('hedera-certchain-session');
    console.log('Wallet disconnected');
  };

  const value: WalletContextType = {
    isConnected,
    user,
    contractService,
    connectWallet,
    disconnectWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;