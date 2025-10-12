import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { WalletProvider } from '@/contexts/WalletContext';
import { store } from './store';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <WalletProvider network="testnet">
        <App />
      </WalletProvider>
    </Provider>
  </StrictMode>
);
