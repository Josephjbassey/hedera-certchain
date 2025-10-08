import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { walletService, type WalletType } from '@/services/hedera/walletService';
import { setWalletConnected, setWalletDisconnected, setNetwork } from '@/store/slices/walletSlice';
import type { RootState } from '@/store';

const WALLET_OPTIONS: Array<{
  type: WalletType;
  name: string;
  description: string;
  isPrimary?: boolean;
}> = [
  {
    type: 'hashpack',
    name: 'HashPack',
    description: 'Primary Hedera wallet - Recommended',
    isPrimary: true,
  },
  {
    type: 'blade',
    name: 'Blade Wallet',
    description: 'Hedera wallet alternative',
  },
  {
    type: 'metamask',
    name: 'MetaMask',
    description: 'EVM compatibility layer',
  },
];

export const WalletConnection: React.FC = () => {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const wallet = useSelector((state: RootState) => state.wallet);
  const [connecting, setConnecting] = React.useState<WalletType | null>(null);

  useEffect(() => {
    walletService.setNetwork(wallet.network);
  }, [wallet.network]);

  const handleConnect = async (walletType: WalletType) => {
    setConnecting(walletType);
    try {
      const connection = await walletService.connect(walletType);
      
      dispatch(setWalletConnected({
        accountId: connection.accountId,
        walletType: connection.walletType,
        publicKey: connection.publicKey,
        provider: connection.provider,
        signer: connection.signer,
      }));

      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletType}`,
      });
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || `Failed to connect to ${walletType}`,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    if (!wallet.walletType) return;

    try {
      await walletService.disconnect(wallet.walletType);
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
            {WALLET_OPTIONS.find(w => w.type === wallet.walletType)?.name || wallet.walletType}
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
    <div className="space-y-4">
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertDescription>
          Connect your Hedera wallet to access all features. HashPack is recommended for the best experience.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4">
        {WALLET_OPTIONS.map((option) => (
          <motion.div
            key={option.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className={option.isPrimary ? 'border-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{option.name}</h3>
                      {option.isPrimary && (
                        <Badge variant="default">Recommended</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleConnect(option.type)}
                    disabled={connecting !== null}
                    className="min-w-[120px]"
                  >
                    {connecting === option.type ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
