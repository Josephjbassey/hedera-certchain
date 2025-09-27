import { useContext } from "react"
import { MetamaskContext } from "../../contexts/MetamaskContext";
import { WalletConnectContext } from "../../contexts/WalletConnectContext";
import { HashpackContext } from "../../contexts/HashpackContext";
import { BladeContext } from "../../contexts/BladeContext";
import { metamaskWallet } from "./metamask/metamaskClient";
import { walletConnectWallet } from "./walletconnect/walletConnectClient";
import { hashPackWallet } from "./hashpack/hashpackClient";
import { bladeWallet } from "./blade/bladeClient";

// Purpose: This hook is used to determine which wallet interface to use
// Example: const { accountId, walletInterface } = useWalletInterface();
// Returns: { accountId: string | null, walletInterface: WalletInterface | null }
export const useWalletInterface = () => {
  const metamaskCtx = useContext(MetamaskContext);
  const walletConnectCtx = useContext(WalletConnectContext);
  const hashpackCtx = useContext(HashpackContext);
  const bladeCtx = useContext(BladeContext);

  // Priority order: Native Hedera wallets first, then MetaMask, then WalletConnect
  if (hashpackCtx.hashpackAccountId) {
    return {
      accountId: hashpackCtx.hashpackAccountId,
      walletInterface: hashPackWallet
    };
  } else if (bladeCtx.bladeAccountId) {
    return {
      accountId: bladeCtx.bladeAccountId,
      walletInterface: bladeWallet
    };
  } else if (metamaskCtx.metamaskAccountAddress) {
    return {
      accountId: metamaskCtx.metamaskAccountAddress,
      walletInterface: metamaskWallet
    };
  } else if (walletConnectCtx.accountId) {
    return {
      accountId: walletConnectCtx.accountId,
      walletInterface: walletConnectWallet
    }
  } else {
    return {
      accountId: null,
      walletInterface: null
    };
  }
}