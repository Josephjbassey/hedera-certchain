import React, { useState, useEffect } from 'react';
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
    id: 'hashpack',
    name: 'HashPack',
    icon: '🔷',
    description: 'Native Hedera wallet (Recommended)',
    installUrl: 'https://www.hashpack.app/download'
  },
  {
    id: 'blade',
    name: 'Blade Wallet',
    icon: '⚔️',
    description: 'Hedera-focused wallet with advanced features',
    installUrl: 'https://bladewallet.io/'
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Popular wallet with Hedera EVM support',
    installUrl: 'https://metamask.io/download/'
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
  const [walletStates, setWalletStates] = useState<Record<string, boolean>>({});

  // Refresh wallet detection when popup opens
  useEffect(() => {
    if (isOpen) {
      console.log('Wallet popup opened, checking wallet availability...');
      
      const checkWallets = () => {
        const states: Record<string, boolean> = {};
        WALLET_OPTIONS.forEach(wallet => {
          states[wallet.id] = getWalletAvailability(wallet.id);
        });
        setWalletStates(states);
      };
      
      // Check immediately
      checkWallets();
      
      // Check again after a short delay in case wallets inject asynchronously
      const timeoutId = setTimeout(checkWallets, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Check if wallets are installed
  const getWalletAvailability = (walletId: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    switch (walletId) {
      case 'metamask':
        return !!(window as any).ethereum?.isMetaMask;
        
      case 'hashpack':
        // HashPack detection - check multiple possible injection points
        const hashpackProviders = [
          (window as any).hashpack,
          (window as any).HashPack,
          (window as any).ethereum?.isHashPack,
          (window as any).hederaWallets?.hashpack
        ];
        return hashpackProviders.some(provider => !!provider);
        
      case 'blade':
        return !!(window as any).blade || !!(window as any).Blade;
        
      case 'walletconnect':
        return true; // WalletConnect doesn't require installation check
        
      default:
        return false;
    }
  };

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    
    try {
      // For now, just call the onConnect function passed as prop
      // Each wallet type will be handled by the parent component
      await onConnect(walletId);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setSelectedWallet(null);
    }
  };

  const handleInstallWallet = (installUrl: string) => {
    window.open(installUrl, '_blank', 'noopener,noreferrer');
  };

  const refreshWalletDetection = () => {
    console.log('Manually refreshing wallet detection...');
    const states: Record<string, boolean> = {};
    WALLET_OPTIONS.forEach(wallet => {
      states[wallet.id] = getWalletAvailability(wallet.id);
    });
    setWalletStates(states);
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
                const isInstalled = walletStates[wallet.id] ?? getWalletAvailability(wallet.id);
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

          <div className="text-xs text-muted-foreground border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1">📱 <strong>New to crypto wallets?</strong></p>
                <p>We recommend starting with <strong>MetaMask</strong> - it's beginner-friendly and works great with Hedera.</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Don't see your wallet?</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshWalletDetection}
                className="text-xs h-auto py-1 px-2"
              >
                🔄 Refresh Detection
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
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