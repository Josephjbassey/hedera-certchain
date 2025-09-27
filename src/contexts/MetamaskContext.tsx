import React, { createContext, useState, ReactNode } from 'react';

export interface MetamaskContextType {
  metamaskAccountAddress: string;
  setMetamaskAccountAddress: (address: string) => void;
}

export const MetamaskContext = createContext<MetamaskContextType>({
  metamaskAccountAddress: '',
  setMetamaskAccountAddress: () => {},
});

interface MetamaskContextProviderProps {
  children: ReactNode;
}

export const MetamaskContextProvider: React.FC<MetamaskContextProviderProps> = ({ children }) => {
  const [metamaskAccountAddress, setMetamaskAccountAddress] = useState<string>('');

  const value: MetamaskContextType = {
    metamaskAccountAddress,
    setMetamaskAccountAddress,
  };

  return (
    <MetamaskContext.Provider value={value}>
      {children}
    </MetamaskContext.Provider>
  );
};