import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WalletType = 'hashpack' | 'blade' | 'metamask' | null;

interface WalletState {
  connected: boolean;
  accountId: string | null;
  walletType: WalletType;
  publicKey: string | null;
  network: 'testnet' | 'mainnet';
  balance: string | null;
  provider: any;
  signer: any;
}

const initialState: WalletState = {
  connected: false,
  accountId: null,
  walletType: null,
  publicKey: null,
  network: 'testnet',
  balance: null,
  provider: null,
  signer: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletConnected: (state, action: PayloadAction<{
      accountId: string;
      walletType: WalletType;
      publicKey: string;
      provider?: any;
      signer?: any;
    }>) => {
      state.connected = true;
      state.accountId = action.payload.accountId;
      state.walletType = action.payload.walletType;
      state.publicKey = action.payload.publicKey;
      state.provider = action.payload.provider;
      state.signer = action.payload.signer;
    },
    setWalletDisconnected: (state) => {
      state.connected = false;
      state.accountId = null;
      state.walletType = null;
      state.publicKey = null;
      state.balance = null;
      state.provider = null;
      state.signer = null;
    },
    setWalletBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload;
    },
    setNetwork: (state, action: PayloadAction<'testnet' | 'mainnet'>) => {
      state.network = action.payload;
    },
    setProvider: (state, action: PayloadAction<any>) => {
      state.provider = action.payload;
    },
    setSigner: (state, action: PayloadAction<any>) => {
      state.signer = action.payload;
    },
  },
});

export const {
  setWalletConnected,
  setWalletDisconnected,
  setWalletBalance,
  setNetwork,
  setProvider,
  setSigner,
} = walletSlice.actions;

export default walletSlice.reducer;
