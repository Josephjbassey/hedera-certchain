/// <reference types="vite/client" />

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      removeAllListeners?: (event: string) => void;
      isMetaMask?: boolean;
      isPhantom?: boolean;
    };
    hashpack?: {
      isPaired: () => Promise<boolean>;
      pair: (metadata: {
        name: string;
        description: string;
        icons: string[];
        url: string;
      }) => Promise<{
        accountIds: string[];
        network: string;
        topic: string;
      }>;
      sendTransaction: (transaction: any) => Promise<any>;
      disconnect: () => Promise<void>;
    };
    bladeAPI?: any;
    bladeConnector?: any;
  }
}

export {};
