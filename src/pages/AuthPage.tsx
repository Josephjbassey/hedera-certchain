import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';

export const AuthPage: React.FC = () => {
  const { isConnected, user, connectWallet, isConnecting } = useWallet();
  const [walletInstalled, setWalletInstalled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if MetaMask or compatible wallet is installed
    if (typeof window.ethereum !== 'undefined') {
      setWalletInstalled(true);
    }
  }, []);

  const handleConnect = async () => {
    if (!window.ethereum) {
      toast({
        title: "No Wallet Found",
        description: "Please install MetaMask or another compatible wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      await connectWallet('metamask');

      toast({
        title: "Wallet Connected!",
        description: `Connected to ${user?.network || 'Hedera'} with address ${user?.address.slice(0, 6)}...${user?.address.slice(-4)}`,
      });
      
      // Navigate to issue page after successful connection
      setTimeout(() => {
        navigate('/issue');
      }, 1500);

    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to wallet",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="flex justify-center">
            <div className="relative">
              <Shield className="w-16 h-16 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Hedera CertChain</h1>
          <p className="text-gray-600">Connect your wallet to access decentralized certificates</p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-gray-900">
                {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? 'Your wallet is connected and ready to use'
                  : 'Connect your Web3 wallet to start issuing and verifying certificates'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {!walletInstalled && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No Web3 wallet detected. Please install{' '}
                    <a 
                      href="https://metamask.io/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      MetaMask
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {' '}or a compatible wallet.
                  </AlertDescription>
                </Alert>
              )}

              {isConnected && user ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Connected Successfully</span>
                    </div>
                    <div className="mt-2 text-sm space-y-1">
                      <p><strong>Address:</strong> {user.address.slice(0, 8)}...{user.address.slice(-8)}</p>
                      <p><strong>Network:</strong> {user.network}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate('/issue')} 
                      className="flex-1"
                    >
                      Continue to App
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting || !walletInstalled}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  size="lg"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}

              {/* Security Notice */}
              <div className="text-center text-sm text-gray-600 space-y-2">
                <p className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  🔒 Your wallet connection is secure and decentralized
                </p>
                <p className="text-xs">
                  We never store your private keys. All transactions are signed locally in your wallet.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 text-center"
        >
          <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
            <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Secure</h3>
            <p className="text-sm text-gray-600">Blockchain verified certificates</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Verifiable</h3>
            <p className="text-sm text-gray-600">Instantly verify authenticity</p>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Powered by Hedera Network</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;