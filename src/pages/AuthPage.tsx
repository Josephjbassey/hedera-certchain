import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Shield, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { HederaContractService } from '@/services/hedera-contract';

export const AuthPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [network, setNetwork] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletInstalled, setWalletInstalled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if MetaMask or compatible wallet is installed
    setWalletInstalled(typeof window.ethereum !== 'undefined');

    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            // Auto-redirect if already connected
            navigate('/');
          }
        } catch (error) {
          console.log('Not connected to wallet');
        }
      }
    };

    checkConnection();
  }, [navigate]);

  const handleWalletConnect = async () => {
    if (!walletInstalled) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or a compatible Web3 wallet to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Create service instance (we'll get the contract address from env later)
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS_TESTNET || '';
      const service = new HederaContractService(contractAddress, 'testnet');

      const result = await service.connectWallet();
      
      setWalletAddress(result.address);
      setNetwork(result.network);

      toast({
        title: "Wallet Connected!",
        description: `Connected to ${result.network} with address ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
      });

      // Store connection info in localStorage
      localStorage.setItem('walletAddress', result.address);
      localStorage.setItem('networkName', result.network);

      // Redirect to main app
      setTimeout(() => navigate('/'), 1000);

    } catch (error) {
      console.error('Wallet connection failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress('');
    setNetwork('');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('networkName');
    toast({
      title: "Wallet Disconnected",
      description: "You have been successfully disconnected.",
    });
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
                {walletAddress ? 'Wallet Connected' : 'Connect Wallet'}
              </CardTitle>
              <CardDescription>
                {walletAddress 
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

              {walletAddress ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Connected Successfully</span>
                    </div>
                    <div className="mt-2 text-sm space-y-1">
                      <p><strong>Address:</strong> {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</p>
                      <p><strong>Network:</strong> {network}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate('/')} 
                      className="flex-1"
                    >
                      Continue to App
                    </Button>
                    <Button 
                      onClick={handleDisconnect} 
                      variant="outline"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleWalletConnect}
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