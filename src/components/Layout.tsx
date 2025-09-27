import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Menu, X, Wallet, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import logoImage from '@/assets/hedera-certchain-logo.png';
import { useWalletInterface } from '../services/wallets/useWalletInterface';
import { WalletSelectionDialog } from './WalletSelectionDialog';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component with responsive navigation and wallet integration
 * Provides consistent header across all pages with Hedera wallet connection
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const { accountId, walletInterface } = useWalletInterface();

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Issue Certificate', href: '/issue' },
    { name: 'Verify Certificate', href: '/verify' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img 
                src={logoImage} 
                alt="Hedera CertChain" 
                className="h-12 w-auto"
              />
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Button
                    variant="ghost"
                    asChild
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <a href={item.href}>{item.name}</a>
                  </Button>
                </motion.div>
              ))}
              
              {/* Wallet Connection Section */}
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant={accountId ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    if (accountId) {
                      walletInterface?.disconnect();
                    } else {
                      setWalletDialogOpen(true);
                    }
                  }}
                  className="flex items-center space-x-2"
                >
                  <Wallet className="h-4 w-4" />
                  <span>
                    {accountId 
                      ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}`
                      : 'Connect Wallet'
                    }
                  </span>
                </Button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-muted-foreground"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden py-4 border-t border-border"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col space-y-2">
                {navigationItems.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    asChild
                    className="justify-start text-muted-foreground hover:text-foreground"
                  >
                    <a href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                      {item.name}
                    </a>
                  </Button>
                ))}
                 <div className="flex flex-col space-y-2 pt-2 border-t border-border">
                   <Button
                     variant={accountId ? "outline" : "default"}
                     onClick={() => {
                       if (accountId) {
                         walletInterface?.disconnect();
                       } else {
                         setWalletDialogOpen(true);
                       }
                       setIsMobileMenuOpen(false);
                     }}
                     className="justify-start"
                   >
                     <Wallet className="h-4 w-4 mr-2" />
                     {accountId 
                       ? `${accountId.slice(0, 6)}...${accountId.slice(-4)}`
                       : 'Connect Wallet'
                     }
                   </Button>
                 </div>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <img 
                src={logoImage} 
                alt="Hedera CertChain" 
                className="h-6 w-auto opacity-80"
              />
              <span className="text-sm text-muted-foreground">
                Powered by Hedera Hashgraph
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Hedera CertChain. Secure certificate verification on blockchain.
            </div>
          </div>
        </div>
      </footer>

      {/* Wallet Connection Dialog */}
      <WalletSelectionDialog 
        open={walletDialogOpen}
        setOpen={setWalletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
      />
    </div>
  );
};