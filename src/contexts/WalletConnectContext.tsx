import React, { createContext, useState, ReactNode } from 'react';

export interface WalletConnectContextType {
  accountId: string;
  setAccountId: (accountId: string) => void;
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
}

export const WalletConnectContext = createContext<WalletConnectContextType>({
  accountId: '',
  setAccountId: () => {},
  isConnected: false,
  setIsConnected: () => {},
});

interface WalletConnectContextProviderProps {
  children: ReactNode;
}

export const WalletConnectContextProvider: React.FC<WalletConnectContextProviderProps> = ({ children }) => {
  const [accountId, setAccountId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const value: WalletConnectContextType = {
    accountId,
    setAccountId,
    isConnected,
    setIsConnected,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};