/**
 * All Wallets Provider for Hedera CertChain
 * 
 * This component provides a comprehensive wallet integration system that supports
 * multiple wallet types for the Hedera network. It wraps the entire application
 * to provide wallet functionality throughout the component tree.
 * 
 * Supported Wallets:
 * 1. MetaMask - Ethereum wallet with Hedera EVM compatibility
 * 2. WalletConnect - Mobile wallets and cross-platform support  
 * 3. HashPack - Native Hedera wallet (browser extension)
 * 4. Blade - Native Hedera wallet (browser extension)
 * 
 * Architecture:
 * - Each wallet has its own Context Provider for state management
 * - Each wallet has a Client component for connection management
 * - The providers are nested to ensure proper context availability
 * - The clients are rendered as invisible components that handle initialization
 * 
 * This follows the proven architecture from the official Hedera wallet template.
 */

import { ReactNode } from "react"
import { MetamaskContextProvider } from "../../contexts/MetamaskContext"
import { WalletConnectContextProvider } from "../../contexts/WalletConnectContext"
import { HashpackContextProvider } from "../../contexts/HashpackContext"
import { BladeContextProvider } from "../../contexts/BladeContext"
import { MetaMaskClient } from "./metamask/metamaskClient"
import { WalletConnectClient } from "./walletconnect/walletConnectClient"
import { HashPackClient } from "./hashpack/hashpackClient"
import { BladeClient } from "./blade/bladeClient"

/**
 * Props for the AllWalletsProvider component
 */
interface AllWalletsProviderProps {
  children: ReactNode | undefined
}

/**
 * Main wallet provider component that initializes all wallet support
 * 
 * This component must wrap your entire application to enable wallet functionality.
 * It sets up the context providers and client components for all supported wallets.
 * 
 * @param props - Component props containing children to render
 * @returns JSX element with all wallet providers initialized
 */
export const AllWalletsProvider = (props: AllWalletsProviderProps) => {
  return (
    // Nested context providers - order matters for proper context resolution
    <MetamaskContextProvider>
      <WalletConnectContextProvider>
        <HashpackContextProvider>
          <BladeContextProvider>
            {/* 
              Wallet client components handle initialization and state management
              These are invisible components that run wallet-specific logic
            */}
            <MetaMaskClient />
            <WalletConnectClient />
            <HashPackClient />
            <BladeClient />
            
            {/* Render the application content with wallet context available */}
            {props.children}
          </BladeContextProvider>
        </HashpackContextProvider>
      </WalletConnectContextProvider>
    </MetamaskContextProvider>
  )
}
