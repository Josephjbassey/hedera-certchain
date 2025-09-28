/**
 * Wallet Selection Dialog Component
 * 
 * This component provides a sophisticated, animated interface for connecting to different
 * types of Hedera-compatible wallets. It features wallet detection, installation prompts,
 * and a card-based layout with smooth animations.
 * 
 * Features:
 * - Animated wallet cards with hover effects
 * - Real-time wallet availability detection
 * - Installation prompts for missing wallets
 * - Beginner-friendly recommendations
 * - Refresh functionality for wallet detection
 * 
 * Supported Wallets:
 * - HashPack: Native Hedera wallet (recommended for best compatibility)
 * - Blade: Hedera-focused wallet with advanced features
 * - MetaMask: Popular Ethereum wallet with Hedera EVM support
 * - WalletConnect: Mobile and cross-platform wallet connections
 * 
 * Uses official Hedera WalletConnect implementation for backend functionality.
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { connectToMetamask } from "../services/wallets/metamask/metamaskClient";
import { openWalletConnectModal } from "../services/wallets/walletconnect/walletConnectClient";
import { connectToHashPack } from "../services/wallets/hashpack/hashpackClient";
import { connectToBlade } from "../services/wallets/blade/bladeClient";

/**
 * Configuration for supported wallet options
 * Each wallet includes connection details, branding, and installation information
 */
const WALLET_OPTIONS = [
  {
    id: 'hashpack',
    name: 'HashPack',
    description: 'Native Hedera wallet - Best for beginners',
    icon: 'H',
    gradient: 'from-purple-600 to-blue-600',
    installUrl: 'https://www.hashpack.app/',
    detectFunction: () => !!(window as any).hashpack,
    recommended: true,
  },
  {
    id: 'blade',
    name: 'Blade Wallet',
    description: 'Advanced Hedera features',
    icon: '⚔️',
    gradient: 'from-gray-700 to-gray-900',
    installUrl: 'https://bladewallet.io/',
    detectFunction: () => !!(window as any).bladeAPI,
    recommended: false,
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Popular multi-chain wallet',
    icon: '🦊',
    gradient: 'from-orange-500 to-orange-600',
    installUrl: 'https://metamask.io/',
    detectFunction: () => !!(window as any).ethereum && (window as any).ethereum.isMetaMask,
    recommended: false,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Mobile & other Hedera wallets',
    icon: 'WC',
    gradient: 'from-blue-500 to-blue-600',
    installUrl: null, // No direct install - it's a protocol
    detectFunction: () => true, // Always available as it's a protocol
    recommended: false,
  },
];

/**
 * Props for the WalletSelectionDialog component
 */
interface WalletSelectionDialogProps {
  /** Whether the dialog is currently open */
  open: boolean;
  /** Function to control dialog open/close state */
  setOpen: (value: boolean) => void;
  /** Callback function called when dialog is closed */
  onClose: () => void;
}

/**
 * Interface for wallet availability status
 */
interface WalletAvailability {
  [key: string]: boolean;
}

/**
 * Enhanced wallet selection dialog component with sophisticated UI and animations
 * 
 * Features:
 * - Real-time wallet availability detection
 * - Animated card-based wallet selection
 * - Installation prompts for missing wallets
 * - Beginner-friendly recommendations and guidance
 * - Official Hedera WalletConnect backend implementation
 * 
 * @param props - Component props for controlling dialog state
 * @returns JSX element containing the enhanced wallet selection dialog
 */
export const WalletSelectionDialog = (props: WalletSelectionDialogProps) => {
  const { onClose, open, setOpen } = props;
  
  // State for wallet availability and connection status
  const [walletAvailability, setWalletAvailability] = useState<WalletAvailability>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  /**
   * Detects which wallets are currently installed and available
   * This runs on component mount and when the refresh button is clicked
   * 
   * @returns Object mapping wallet IDs to their availability status
   */
  const getWalletAvailability = (): WalletAvailability => {
    const availability: WalletAvailability = {};
    
    WALLET_OPTIONS.forEach(wallet => {
      try {
        // Use the wallet's custom detection function
        availability[wallet.id] = wallet.detectFunction();
      } catch (error) {
        console.warn(`Error detecting ${wallet.name}:`, error);
        availability[wallet.id] = false;
      }
    });
    
    return availability;
  };

  /**
   * Updates wallet availability detection
   * Useful when wallets are installed after the dialog is opened
   */
  const refreshWalletDetection = () => {
    console.log('🔄 Refreshing wallet detection...');
    const newAvailability = getWalletAvailability();
    setWalletAvailability(newAvailability);
    
    const detectedCount = Object.values(newAvailability).filter(Boolean).length;
    console.log(`✅ Detected ${detectedCount} available wallets`);
  };

  /**
   * Handles opening wallet installation pages
   * Opens the wallet's official website for download/installation
   * 
   * @param installUrl - URL to the wallet's installation page
   */
  const handleInstallWallet = (installUrl: string) => {
    console.log('📱 Opening wallet installation page:', installUrl);
    window.open(installUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * Enhanced wallet connection handler with loading states and error handling
   * Uses the official Hedera WalletConnect implementation for backend functionality
   * 
   * @param walletType - The type of wallet to connect to
   */
  const handleWalletConnect = async (walletType: string) => {
    if (isConnecting) return; // Prevent multiple simultaneous connection attempts
    
    setIsConnecting(true);
    setConnectingWallet(walletType);
    
    try {
      console.log(`🔗 Attempting to connect to ${walletType} wallet...`);
      let success = false;
      
      switch (walletType) {
        case 'hashpack':
          success = await connectToHashPack();
          break;
          
        case 'blade':
          success = await connectToBlade();
          break;
          
        case 'metamask':
          await connectToMetamask();
          success = true; // MetaMask throws error on failure, so reaching here means success
          break;
          
        case 'walletconnect':
          await openWalletConnectModal();
          success = true; // WalletConnect throws error on failure, so reaching here means success
          break;
          
        default:
          console.error('❌ Unknown wallet type:', walletType);
          return; // Exit early for unknown wallet types
      }
      
      // Close dialog only if connection was successful
      if (success) {
        console.log(`✅ Successfully connected to ${walletType}`);
        setOpen(false);
      } else {
        console.warn(`⚠️ Failed to connect to ${walletType}`);
      }
    } catch (error) {
      console.error(`❌ ${walletType} connection error:`, error);
      // Keep dialog open so user can try again or choose different wallet
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  /**
   * Effect to detect wallet availability when dialog opens
   * Runs whenever the dialog open state changes
   */
  useEffect(() => {
    if (open) {
      // Small delay to ensure proper detection after dialog animation
      const timer = setTimeout(() => {
        refreshWalletDetection();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Connect Your Wallet</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a wallet to connect to Hedera CertChain and start managing your certificates
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Animated Wallet Cards Grid */}
          <div className="grid gap-3">
            <AnimatePresence>
              {WALLET_OPTIONS.map((wallet, index) => {
                const isInstalled = walletAvailability[wallet.id] || false;
                const isCurrentlyConnecting = connectingWallet === wallet.id;
                
                return (
                  <motion.div
                    key={wallet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                        isInstalled 
                          ? 'border-green-200 hover:border-green-300 bg-green-50/30' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${
                        wallet.recommended ? 'ring-2 ring-blue-100' : ''
                      } ${
                        isCurrentlyConnecting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                      onClick={() => {
                        if (!isCurrentlyConnecting) {
                          if (isInstalled) {
                            handleWalletConnect(wallet.id);
                          } else if (wallet.installUrl) {
                            handleInstallWallet(wallet.installUrl);
                          }
                        }
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Wallet Icon */}
                            <div className={`w-12 h-12 bg-gradient-to-r ${wallet.gradient} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                              {wallet.icon}
                            </div>
                            
                            {/* Wallet Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-base">{wallet.name}</h3>
                                {wallet.recommended && (
                                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                    Recommended
                                  </span>
                                )}
                                {isCurrentlyConnecting && (
                                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                    Connecting...
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {wallet.description}
                              </p>
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
                                disabled={isConnecting}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Install
                              </Button>
                            )}
                            
                            {isInstalled && (
                              <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Ready
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

          {/* Beginner Guidance and Utilities */}
          <div className="text-xs text-muted-foreground border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1">📱 <strong>New to crypto wallets?</strong></p>
                <p>We recommend starting with <strong>HashPack</strong> - it's designed specifically for Hedera and perfect for beginners.</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span>Don't see your wallet detected?</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={refreshWalletDetection}
                disabled={isConnecting}
                className="text-xs h-auto py-1 px-2"
              >
                🔄 Refresh Detection
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isConnecting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};