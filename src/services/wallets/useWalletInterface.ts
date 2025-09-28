/**
 * useWalletInterface Hook for Hedera CertChain
 * 
 * This React hook provides a unified interface for interacting with different
 * wallet types in the Hedera CertChain application. It automatically detects
 * which wallet is currently connected and returns the appropriate interface.
 * 
 * Wallet Priority Order (from highest to lowest):
 * 1. HashPack (Native Hedera - preferred for best compatibility)
 * 2. Blade (Native Hedera - excellent for Hedera-specific features)
 * 3. MetaMask (Ethereum/Hedera EVM - good for users familiar with Ethereum)
 * 4. WalletConnect (Mobile wallets - good for mobile users)
 * 
 * Usage Example:
 * ```typescript
 * const { accountId, walletInterface } = useWalletInterface();
 * 
 * if (walletInterface && accountId) {
 *   // Execute contract function
 *   const txId = await walletInterface.executeContractFunction(
 *     contractId, 
 *     "issueCertificate", 
 *     parameters, 
 *     300000
 *   );
 * }
 * ```
 */

import { useContext } from "react"
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import { HashpackContext } from "../../contexts/HashpackContext";
import { BladeContext } from "../../contexts/BladeContext";
import { metamaskWallet } from "./metamask/metamaskClient";
import { walletConnectWallet } from "./walletconnect/walletConnectClient";
import { hashPackWallet } from "./hashpack/hashpackClient";
import { bladeWallet } from "./blade/bladeClient";

/**
 * Hook that returns the currently active wallet interface and account ID
 * 
 * @returns Object containing:
 *   - accountId: The connected account ID (string) or null if no wallet connected
 *   - walletInterface: The wallet interface object or null if no wallet connected
 */
export const useWalletInterface = () => {
  // Get all wallet contexts to check connection status
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const hashpackCtx = useContext(HashpackContext);
  const bladeCtx = useContext(BladeContext);

  /**
   * Wallet Priority Logic:
   * We check wallets in order of preference for Hedera operations
   * Native Hedera wallets (HashPack, Blade) are prioritized over
   * Ethereum-compatible wallets (MetaMask, WalletConnect)
   */

  // Priority 1: HashPack (Native Hedera wallet - most compatible)
  if (hashpackCtx.hashpackAccountId) {
    return {
      accountId: hashpackCtx.hashpackAccountId,
      walletInterface: hashPackWallet
    };
  } 
  
  // Priority 2: Blade (Native Hedera wallet - excellent compatibility)
  else if (bladeCtx.bladeAccountId) {
    return {
      accountId: bladeCtx.bladeAccountId,
      walletInterface: bladeWallet
    };
  } 
  
  // Priority 3: MetaMask (Ethereum wallet with Hedera EVM compatibility)
  else if (metamaskCtx.metamaskAccountAddress) {
    return {
      accountId: metamaskCtx.metamaskAccountAddress,
      walletInterface: metamaskWallet
    };
  } 
  
  // Priority 4: WalletConnect (Mobile and other wallets)
  else if (walletConnectCtx.accountId) {
    return {
      accountId: walletConnectCtx.accountId,
      walletInterface: walletConnectWallet
    }
  }
  
  // No wallet is currently connected
  else {
    return {
      accountId: null,
      walletInterface: null
    };
  }
}