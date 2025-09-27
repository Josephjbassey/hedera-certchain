import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Wallet, ExternalLink, Loader2 } from 'lucide-react';

export interface WalletConnectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletType: string) => Promise<void>;
  isConnecting?: boolean;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  installUrl?: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Most popular Ethereum wallet',
    installUrl: 'https://metamask.io/download/'
  },
  {
    id: 'hashpack',
    name: 'HashPack',
    icon: '🔷',
    description: 'Native Hedera wallet',
    installUrl: 'https://www.hashpack.app/download'
  },
  {
    id: 'blade',
    name: 'Blade Wallet',
    icon: '⚔️',
    description: 'Hedera-focused wallet',
    installUrl: 'https://bladewallet.io/'
  },
  {
    id: 'kabila',
    name: 'Kabila Wallet',
    icon: '🏛️',
    description: 'Professional Hedera wallet',
    installUrl: 'https://kabila.app/'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect with mobile wallets via QR code'
  }
];

export const WalletConnectPopup: React.FC<WalletConnectPopupProps> = ({
  isOpen,
  onClose,
  onConnect,
  isConnecting = false
}) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Check if wallets are installed
  const getWalletAvailability = (walletId: string): boolean => {
    switch (walletId) {
      case 'metamask':
        return typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask;
      case 'hashpack':
        return typeof window !== 'undefined' && !!(window as any).hashpack;
      case 'blade':
        return typeof window !== 'undefined' && !!(window as any).blade;
      case 'kabila':
        return typeof window !== 'undefined' && !!(window as any).kabila;
      default:
        return true; // WalletConnect doesn't require installation check
    }
  };

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    
    try {
      await onConnect(walletId);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setSelectedWallet(null);
    }
  };

  const handleInstallWallet = (installUrl: string) => {
    window.open(installUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wallet className="w-6 h-6 text-primary" />
            Connect Your Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a wallet to connect to the Hedera network and start issuing certificates.
          </p>

          <div className="space-y-3">
            <AnimatePresence>
              {WALLET_OPTIONS.map((wallet) => {
                const isInstalled = getWalletAvailability(wallet.id);
                const isSelected = selectedWallet === wallet.id;
                const isCurrentlyConnecting = isConnecting && isSelected;

                return (
                  <motion.div
                    key={wallet.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${
                        !isInstalled ? 'opacity-60' : ''
                      }`}
                      onClick={() => {
                        if (isInstalled && !isConnecting) {
                          handleWalletSelect(wallet.id);
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{wallet.icon}</div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {wallet.name}
                                {isCurrentlyConnecting && (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {wallet.description}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!isInstalled && wallet.installUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInstallWallet(wallet.installUrl!);
                                }}
                                className="text-xs"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Install
                              </Button>
                            )}
                            
                            {isInstalled && (
                              <div className="text-xs text-green-600 font-medium">
                                ✓ Installed
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-4">
            <p className="mb-2">📱 <strong>New to crypto wallets?</strong></p>
            <p>
              We recommend starting with <strong>MetaMask</strong> - it's beginner-friendly and works great with Hedera.
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} disabled={isConnecting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectPopup;