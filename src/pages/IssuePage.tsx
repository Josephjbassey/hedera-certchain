import React from 'react';
import { motion } from 'framer-motion';
import { Award, Shield, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CertificateMinter } from '@/components/certificates/CertificateMinter';

/**
 * Certificate Issuance Page
 * 
 * Updated to use the new blockchain-based CertificateMinter component
 * Supports IPFS integration, batch minting, and Hedera NFT issuance
 */
export const IssuePage: React.FC = () => {
  return (
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
              <Award className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">
                Issue Certificate
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create and issue blockchain-secured certificates using our NFT-based certificate system
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
                <CardTitle className="text-lg">Blockchain Secured</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Certificates are minted as NFTs on the Hedera blockchain for immutable proof
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <CardTitle className="text-lg">IPFS Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Certificate data is stored on IPFS for decentralized and persistent access
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <CardTitle className="text-lg">Batch Minting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Issue multiple certificates at once for efficient batch operations
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Minting Component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <CertificateMinter 
              className="max-w-4xl mx-auto"
              onMintSuccess={(result) => {
                console.log('Certificate minted successfully:', result);
              }}
              onMintError={(error) => {
                console.error('Certificate minting failed:', error);
              }}
            />
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
                <strong>How to issue:</strong> Connect your wallet, fill in the certificate details, 
                and click mint to create a blockchain-secured NFT certificate. Recipients can verify 
                their certificates using the token ID or certificate hash.
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>
  );
};

export default IssuePage;