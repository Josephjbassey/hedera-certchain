import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Shield, Zap, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletConnection } from '@/components/certificates/WalletConnection';

const WalletPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <Wallet className="h-10 w-10 text-primary" />
          Connect Your Wallet
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect your Hedera wallet to issue, verify, and manage blockchain certificates
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Secure Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Your wallet keys never leave your device. All transactions are signed locally.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Fast & Efficient</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Hedera's hashgraph consensus provides fast finality and low transaction costs.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Lock className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Privacy Protected</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              We don't store your private keys or have access to your wallet funds.
            </CardDescription>
          </CardContent>
        </Card>
      </motion.div>

      {/* Wallet Connection Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <WalletConnection />
      </motion.div>
    </div>
  );
};

export default WalletPage;
