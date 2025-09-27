import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletContractDeployment } from '@/services/wallet-deployment';
import { AccountId } from '@hashgraph/sdk';

export interface WalletUser {
  accountId: string;
  address: string;
  network: string;
  walletType: string;
  publicKey?: string;
}

interface WalletContextType {
  isConnected: boolean;
  user: WalletUser | null;
  accountId: string | null;
  deploymentService: WalletContractDeployment | null;
  connectWallet: (walletType?: string) => Promise<WalletUser>;
  disconnectWallet: () => void;
  signMessage?: (message: string) => Promise<string>;
  isConnecting: boolean;
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<WalletUser | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [deploymentService, setDeploymentService] = useState<WalletContractDeployment | null>(null);

  useEffect(() => {
    loadSavedSession();
  }, []);

  const loadSavedSession = () => {
    const savedSession = localStorage.getItem('hedera-certchain-session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUser(session.user);
        setAccountId(session.user?.accountId || null);
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

  const connectWallet = async (walletType: string = 'metamask'): Promise<WalletUser> => {
    setIsConnecting(true);
    
    try {
      let connectionResult;
      
      switch (walletType) {
        case 'metamask':
          connectionResult = await connectMetaMask();
          break;
        case 'hashpack':
          connectionResult = await connectHashPack();
          break;
        case 'walletconnect':
          connectionResult = await connectWalletConnect();
          break;
        case 'blade':
          connectionResult = await connectBlade();
          break;
        case 'kabila':
          connectionResult = await connectKabila();
          break;
        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }
      
      const walletUser: WalletUser = {
        accountId: connectionResult.address,
        address: connectionResult.address,
        network: connectionResult.network,
        walletType: walletType
      };
      
      // Initialize services
      const deployment = new WalletContractDeployment();
      
      setUser(walletUser);
      setAccountId(walletUser.accountId);
      setIsConnected(true);
      setDeploymentService(deployment);
      
      saveSession(walletUser);
      
      console.log('Wallet connected:', walletUser);
      return walletUser;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Individual wallet connection methods
  const connectMetaMask = async () => {
    if (!window.ethereum?.isMetaMask) {
      throw new Error('MetaMask is not installed');
    }
    
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const network = await getNetworkInfo();
    
    return { address: accounts[0], network };
  };
  
  const connectHashPack = async () => {
    // HashPack integration would go here
    throw new Error('HashPack integration not implemented yet');
  };
  
  const connectWalletConnect = async () => {
    // WalletConnect integration would go here
    throw new Error('WalletConnect integration not implemented yet');
  };
  
  const connectBlade = async () => {
    // Blade wallet integration would go here
    throw new Error('Blade wallet integration not implemented yet');
  };
  
  const connectKabila = async () => {
    // Kabila wallet integration would go here
    throw new Error('Kabila wallet integration not implemented yet');
  };
  
  const getNetworkInfo = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNumber = parseInt(chainId, 16);
      
      switch (chainIdNumber) {
        case 296:
          return 'Hedera Testnet';
        case 295:
          return 'Hedera Mainnet';
        case 297:
          return 'Hedera Previewnet';
        default:
          return `Unknown Network (${chainIdNumber})`;
      }
    }
    return 'Unknown Network';
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setUser(null);
    setAccountId(null);
    setDeploymentService(null);
    
    localStorage.removeItem('hedera-certchain-session');
    console.log('Wallet disconnected');
  };

  const value: WalletContextType = {
    isConnected,
    user,
    accountId,
    deploymentService,
    connectWallet,
    disconnectWallet,
    isConnecting
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletProvider;