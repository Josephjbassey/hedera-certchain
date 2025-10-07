import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DIDState {
  did: string | null;
  didDocument: any | null;
  verifiableCredentials: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DIDState = {
  did: null,
  didDocument: null,
  verifiableCredentials: [],
  loading: false,
  error: null,
};

const didSlice = createSlice({
  name: 'did',
  initialState,
  reducers: {
    setDID: (state, action: PayloadAction<string>) => {
      state.did = action.payload;
    },
    setDIDDocument: (state, action: PayloadAction<any>) => {
      state.didDocument = action.payload;
    },
    addVerifiableCredential: (state, action: PayloadAction<any>) => {
      state.verifiableCredentials.push(action.payload);
    },
    clearDID: (state) => {
      state.did = null;
      state.didDocument = null;
      state.verifiableCredentials = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setDID,
  setDIDDocument,
  addVerifiableCredential,
  clearDID,
  setLoading,
  setError,
} = didSlice.actions;

export default didSlice.reducer;
