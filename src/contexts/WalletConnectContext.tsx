import React, { createContext, useState, ReactNode } from 'react';

export interface WalletConnectContextType {
  accountId: string;
  setAccountId: (accountId: string) => void;
}

export const WalletConnectContext = createContext<WalletConnectContextType>({
  accountId: '',
  setAccountId: () => {},
});

interface WalletConnectContextProviderProps {
  children: ReactNode;
}

export const WalletConnectContextProvider: React.FC<WalletConnectContextProviderProps> = ({ children }) => {
  const [accountId, setAccountId] = useState<string>('');

  const value: WalletConnectContextType = {
    accountId,
    setAccountId,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};