import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { walletService } from '@/services/hedera/walletService';
import { setWalletConnected, setWalletDisconnected, setNetwork } from '@/store/slices/walletSlice';
import type { RootState } from '@/store';

export const WalletConnection: React.FC = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const wallet = useSelector((state: RootState) => state.wallet);
  const [isConnecting, setIsConnecting] = React.useState(false);

  useEffect(() => {
    walletService.setNetwork(wallet.network);
  }, [wallet.network]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // This opens the WalletConnect modal with all available wallets
      const connection = await walletService.connect();
      
      dispatch(setWalletConnected({
        accountId: connection.accountId,
        walletType: connection.walletType,
        publicKey: connection.publicKey,
        provider: connection.provider,
        signer: connection.signer,
      }));

      toast({
        title: "Wallet Connected",
        description: `Successfully connected: ${connection.accountId}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || 'Failed to connect wallet',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await walletService.disconnect();
      dispatch(setWalletDisconnected());

      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  if (wallet.connected && wallet.accountId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            Connected via Hedera Wallet Connect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account</span>
              <Badge variant="secondary" className="font-mono">
                {wallet.accountId}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <Badge variant={wallet.network === 'testnet' ? 'outline' : 'default'}>
                {wallet.network}
              </Badge>
            </div>
          </div>

          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Connect your Hedera wallet to manage blockchain certificates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Make sure you have a Hedera wallet installed (HashPack, Blade, etc.) and set to testnet mode
          </AlertDescription>
        </Alert>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            size="lg"
            className="w-full"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Opening Wallet Selection...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </>
            )}
          </Button>
        </motion.div>

        <p className="text-sm text-muted-foreground text-center">
          A wallet selection dialog will open. Choose your preferred Hedera wallet to continue.
        </p>
      </CardContent>
    </Card>
  );
};
