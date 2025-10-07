import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './slices/walletSlice';
import certificateReducer from './slices/certificateSlice';
import didReducer from './slices/didSlice';

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    certificate: certificateReducer,
    did: didReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['wallet/setProvider', 'wallet/setSigner'],
        ignoredPaths: ['wallet.provider', 'wallet.signer'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
