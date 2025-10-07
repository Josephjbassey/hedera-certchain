import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Certificate {
  certificateId: string;
  tokenId: string;
  serialNumber: number;
  recipientName: string;
  recipientAccountId: string;
  courseName: string;
  institutionName: string;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'revoked' | 'expired';
  ipfsCid: string;
  consensusTimestamp: string;
  transactionId: string;
  issuerAccountId: string;
  fileHash: string;
  metadata?: Record<string, any>;
}

interface CertificateState {
  certificates: Certificate[];
  loading: boolean;
  error: string | null;
  selectedCertificate: Certificate | null;
}

const initialState: CertificateState = {
  certificates: [],
  loading: false,
  error: null,
  selectedCertificate: null,
};

const certificateSlice = createSlice({
  name: 'certificate',
  initialState,
  reducers: {
    setCertificates: (state, action: PayloadAction<Certificate[]>) => {
      state.certificates = action.payload;
    },
    addCertificate: (state, action: PayloadAction<Certificate>) => {
      state.certificates.unshift(action.payload);
    },
    updateCertificate: (state, action: PayloadAction<Certificate>) => {
      const index = state.certificates.findIndex(
        cert => cert.certificateId === action.payload.certificateId
      );
      if (index !== -1) {
        state.certificates[index] = action.payload;
      }
    },
    removeCertificate: (state, action: PayloadAction<string>) => {
      state.certificates = state.certificates.filter(
        cert => cert.certificateId !== action.payload
      );
    },
    setSelectedCertificate: (state, action: PayloadAction<Certificate | null>) => {
      state.selectedCertificate = action.payload;
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
  setCertificates,
  addCertificate,
  updateCertificate,
  removeCertificate,
  setSelectedCertificate,
  setLoading,
  setError,
} = certificateSlice.actions;

export default certificateSlice.reducer;
