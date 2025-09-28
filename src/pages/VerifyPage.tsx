import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CertificateVerifier } from '@/components/certificates/CertificateVerifier';
import { WalletProvider } from '@/contexts/WalletContext';

/**
 * Certificate Verification Page
 * 
 * Updated to use the new blockchain-based CertificateVerifier component
 * Supports QR code scanning, token ID verification, and hash validation
 */
export const VerifyPage: React.FC = () => {
  // Check URL parameters for auto-verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenId = urlParams.get('tokenId') || urlParams.get('id');
    const hash = urlParams.get('hash') || urlParams.get('cid');
    
    if (tokenId || hash) {
      // Pre-populate the search input with URL parameter
      const timer = setTimeout(() => {
        const searchInput = document.querySelector('input[placeholder*="token ID"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.value = tokenId || hash || '';
          // Trigger verification
          const verifyButton = searchInput.closest('div')?.querySelector('button') as HTMLButtonElement;
          if (verifyButton && verifyButton.textContent?.includes('Verify')) {
            verifyButton.click();
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">
                Verify Certificate
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Authenticate the validity of blockchain-issued certificates using our secure verification system
            </p>
          </motion.div>

          {/* Features Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <Card>
              <CardHeader className="text-center">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Blockchain Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  All certificates are verified against the Hedera blockchain for authenticity
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Instant Results</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Get immediate verification results with detailed certificate information
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">QR Code Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Scan QR codes directly from certificates for quick verification
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Verification Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CertificateVerifier className="max-w-4xl mx-auto" />
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>How to verify:</strong> Enter a certificate token ID (e.g., 12345) or 
                certificate hash (64-character string), or use the QR scanner to scan a certificate QR code.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>
    </WalletProvider>
  );
};

export default VerifyPage;