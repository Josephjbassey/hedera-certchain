import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import logoImage from '@/assets/hedera-certchain-logo.png';
import type { RootState } from '@/store';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component with responsive navigation
 * Provides consistent header across all pages
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const wallet = useSelector((state: RootState) => state.wallet);
  const location = useLocation();

  // Public navigation (always visible)
  const publicNavItems = [
    { name: 'Home', href: '/' },
    { name: 'Verify', href: '/verify' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
  ];

  // Protected navigation (only when wallet is connected)
  const protectedNavItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Issue Certificate', href: '/issue' },
  ];

  const navigationItems = wallet.connected 
    ? [...publicNavItems, ...protectedNavItems]
    : publicNavItems;

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
              {navigationItems.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      asChild
                      className="transition-colors"
                    >
                      <Link to={item.href}>{item.name}</Link>
                    </Button>
                  </motion.div>
                );
              })}

              {/* Wallet Connection Button */}
              {!wallet.connected && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: navigationItems.length * 0.1 }}
                >
                  <Button variant="outline" asChild className="border-primary text-primary">
                    <Link to="/wallet">
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Link>
                  </Button>
                </motion.div>
              )}

              {wallet.connected && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="ml-2"
                >
                  <Badge variant="default" className="font-mono">
                    {wallet.accountId?.slice(0, 6)}...{wallet.accountId?.slice(-4)}
                  </Badge>
                </motion.div>
              )}
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
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "default" : "ghost"}
                      asChild
                      className="justify-start"
                    >
                      <Link to={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                        {item.name}
                      </Link>
                    </Button>
                  );
                })}

                {!wallet.connected && (
                  <Button variant="outline" asChild className="justify-start border-primary text-primary">
                    <Link to="/wallet" onClick={() => setIsMobileMenuOpen(false)}>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Link>
                  </Button>
                )}

                {wallet.connected && (
                  <div className="px-2 py-2">
                    <Badge variant="default" className="font-mono">
                      {wallet.accountId?.slice(0, 6)}...{wallet.accountId?.slice(-4)}
                    </Badge>
                  </div>
                )}
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
    </div>
  );
};