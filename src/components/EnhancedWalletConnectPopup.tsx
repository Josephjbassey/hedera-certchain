import React, { useState, useEffect, useContext } from 'react';
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
import { useWalletInterface } from '@/services/wallets/useWalletInterface';
import { MetamaskContext } from '@/contexts/MetamaskContext';
import { WalletConnectContext } from '@/contexts/WalletConnectContext';
import { connectToMetamask } from '@/services/wallets/metamask/metamaskClient';
import { openWalletConnectModal } from '@/services/wallets/walletconnect/walletConnectClient';

export interface EnhancedWalletConnectPopupProps {
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
  connectFn?: () => Promise<void>;
}

export const EnhancedWalletConnectPopup: React.FC<EnhancedWalletConnectPopupProps> = ({
  isOpen,
  onClose,
  onConnect,
  isConnecting = false
}) => {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletStates, setWalletStates] = useState<Record<string, boolean>>({});
  
  const { accountId, walletInterface } = useWalletInterface();
  const { setMetamaskAccountAddress } = useContext(MetamaskContext);
  const { setAccountId: setWalletConnectAccountId } = useContext(WalletConnectContext);

  const WALLET_OPTIONS: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Most popular Ethereum wallet',
      installUrl: 'https://metamask.io/download/',
      connectFn: async () => {
        const accounts = await connectToMetamask();
        if (accounts.length > 0) {
          setMetamaskAccountAddress(accounts[0]);
          await onConnect('metamask');
        }
      }
    },
    {
      id: 'hashpack',
      name: 'HashPack',
      icon: '🔷',
      description: 'Native Hedera wallet',
      installUrl: 'https://www.hashpack.app/download'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect with mobile wallets via QR code',
      connectFn: async () => {
        await openWalletConnectModal();
        await onConnect('walletconnect');
      }
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
      icon: '🔮',
      description: 'Multi-chain wallet with Hedera support',
      installUrl: 'https://kabila.app/'
    }
  ];

  // Enhanced wallet detection
  const getWalletAvailability = (walletId: string): boolean => {
    if (typeof window === 'undefined') return false;
    
    console.log('Checking wallet availability for:', walletId);
    
    switch (walletId) {
      case 'metamask':
        const hasMetaMask = !!(window as any).ethereum?.isMetaMask;
        console.log('MetaMask detected:', hasMetaMask);
        return hasMetaMask;
        
      case 'hashpack':
        // Enhanced HashPack detection
        const hashpackProviders = [
          (window as any).hashpack,
          (window as any).HashPack,
          (window as any).ethereum?.isHashPack,
          (window as any).hederaWallets?.hashpack
        ];
        
        const hasHashPack = hashpackProviders.some(provider => !!provider);
        console.log('HashPack detection results:', {
          hashpack: (window as any).hashpack,
          HashPack: (window as any).HashPack,
          ethereumHashPack: (window as any).ethereum?.isHashPack,
          hederaWallets: (window as any).hederaWallets,
          final: hasHashPack
        });
        
        return hasHashPack;
        
      case 'blade':
        const hasBlade = !!(window as any).blade || !!(window as any).Blade;
        console.log('Blade detected:', hasBlade);
        return hasBlade;
        
      case 'kabila':
        const hasKabila = !!(window as any).kabila || !!(window as any).Kabila;
        console.log('Kabila detected:', hasKabila);
        return hasKabila;
        
      case 'walletconnect':
        return true; // WalletConnect doesn't require installation check
        
      default:
        return false;
    }
  };

  // Refresh wallet detection when popup opens
  useEffect(() => {
    if (isOpen) {
      console.log('Enhanced wallet popup opened, checking availability...');
      
      const checkWallets = () => {
        const states: Record<string, boolean> = {};
        WALLET_OPTIONS.forEach(wallet => {
          states[wallet.id] = getWalletAvailability(wallet.id);
        });
        setWalletStates(states);
      };
      
      // Check immediately
      checkWallets();
      
      // Check again after a short delay for async wallet injections
      const timeoutId = setTimeout(checkWallets, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const handleWalletSelect = async (walletId: string) => {
    setSelectedWallet(walletId);
    
    try {
      const wallet = WALLET_OPTIONS.find(w => w.id === walletId);
      
      if (wallet?.connectFn) {
        // Use the enhanced connection function
        await wallet.connectFn();
      } else {
        // Fallback to the original onConnect
        await onConnect(walletId);
      }
      
      onClose();
    } catch (error) {
      console.error('Enhanced wallet connection failed:', error);
      setSelectedWallet(null);
    }
  };

  const handleInstallWallet = (installUrl: string) => {
    window.open(installUrl, '_blank', 'noopener,noreferrer');
  };

  const refreshWalletDetection = () => {
    console.log('Manually refreshing enhanced wallet detection...');
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
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Your Wallet
          </DialogTitle>
        </DialogHeader>

        {accountId && walletInterface && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Connected via enhanced interface: {accountId.slice(0, 8)}...{accountId.slice(-6)}
            </p>
          </div>
        )}

        <div className="grid gap-3 py-4">
          <AnimatePresence>
            {WALLET_OPTIONS.map((wallet) => {
              const isAvailable = walletStates[wallet.id];
              const isSelected = selectedWallet === wallet.id;
              const isCurrentlyConnecting = isConnecting && isSelected;

              return (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  } ${!isAvailable ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-2xl">{wallet.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                            <p className="text-sm text-gray-600">{wallet.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isAvailable ? (
                            <Button
                              onClick={() => handleWalletSelect(wallet.id)}
                              disabled={isCurrentlyConnecting || isConnecting}
                              className="px-4 py-2"
                            >
                              {isCurrentlyConnecting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                'Connect'
                              )}
                            </Button>
                          ) : wallet.installUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInstallWallet(wallet.installUrl!)}
                              className="px-3 py-1"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Install
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-500">Not Available</span>
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
      </DialogContent>
    </Dialog>
  );
};