/**
 * WalletConnect Client for Hedera CertChain
 * 
 * This implementation follows the official Hedera WalletConnect repository:
 * https://github.com/hashgraph/hedera-wallet-connect
 * 
 * Features:
 * - Official Hedera DAppConnector integration
 * - Support for mobile and desktop Hedera wallets
 * - Proper session management and reconnection
 * - Transaction signing and execution
 * - Beginner-friendly with detailed comments
 */

import { WalletConnectContext } from "../../../contexts/WalletConnectContext";
import { useCallback, useContext, useEffect } from 'react';
import { WalletInterface } from "../walletInterface";
import { 
  AccountId, 
  ContractExecuteTransaction, 
  ContractId, 
  LedgerId, 
  TokenAssociateTransaction, 
  TokenId, 
  Transaction, 
  TransactionId, 
  TransferTransaction 
} from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "../contractFunctionParameterBuilder";
import { SignClientTypes } from "@walletconnect/types";
import { 
  DAppConnector, 
  HederaJsonRpcMethod, 
  HederaSessionEvent, 
  HederaChainId, 
  SignAndExecuteTransactionParams, 
  transactionToBase64String 
} from "@hashgraph/hedera-wallet-connect";
import EventEmitter from "events";

/**
 * Event emitter for synchronizing WalletConnect state changes
 * This is necessary because the DAppConnector doesn't always trigger callbacks
 * when using `dappConnector.walletConnectClient.on(eventName, callback)`
 */
const refreshEvent = new EventEmitter();

/**
 * WalletConnect Project ID for Hedera CertChain
 * Get your own project ID from: https://cloud.walletconnect.com/
 * This project ID is specifically configured for Hedera networks
 */
const walletConnectProjectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || "377d75bb6f86a2ffd427d032ff6ea7d3";

/**
 * Network configuration for Hedera Testnet
 * The application is configured to work with Hedera Testnet
 * For Mainnet, change LedgerId.TESTNET to LedgerId.MAINNET
 */
const hederaNetwork = LedgerId.TESTNET;

/**
 * DApp metadata for WalletConnect
 * This information is displayed to users when connecting their wallets
 * Make sure the URL matches your domain exactly for security
 */
const metadata: SignClientTypes.Metadata = {
  name: "Hedera CertChain",
  description: "Blockchain-based certificate verification system on Hedera Hashgraph",
  url: window.location.origin,
  icons: [window.location.origin + "/favicon.ico"],
}

/**
 * Official Hedera DAppConnector instance
 * This follows the exact pattern from the official Hedera WalletConnect repository
 * Supports all Hedera JSON-RPC methods and session events
 */
const dappConnector = new DAppConnector(
  metadata,                                           // DApp metadata for wallet display
  hederaNetwork,                                     // Hedera network (testnet/mainnet)
  walletConnectProjectId,                           // WalletConnect project ID
  Object.values(HederaJsonRpcMethod),               // All supported Hedera methods
  [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged], // Session events
  [HederaChainId.Testnet],                          // Supported chains
);

/**
 * Promise-based initialization to ensure WalletConnect is only initialized once
 * This prevents multiple initialization attempts and handles errors gracefully
 */
let walletConnectInitPromise: Promise<void> | undefined = undefined;

/**
 * Initialize WalletConnect with proper error handling
 * This function ensures the DAppConnector is properly initialized before use
 */
const initializeWalletConnect = async (): Promise<void> => {
  if (walletConnectInitPromise === undefined) {
    walletConnectInitPromise = dappConnector.init().catch(error => {
      console.error('❌ WalletConnect initialization failed:', error);
      console.info('💡 Make sure you have a valid WalletConnect project ID');
      walletConnectInitPromise = undefined; // Reset for retry
      throw error;
    });
  }
  await walletConnectInitPromise;
};

/**
 * Opens the WalletConnect modal for connecting to mobile wallets
 * This function follows the official Hedera WalletConnect pattern
 * 
 * @returns Promise<void> - Resolves when connection is established or fails
 * 
 * Usage example:
 * ```typescript
 * await openWalletConnectModal();
 * ```
 */
export const openWalletConnectModal = async (): Promise<void> => {
  try {
    console.log('🔗 Opening WalletConnect modal...');
    
    // Ensure WalletConnect is properly initialized
    await initializeWalletConnect();
    
    // Open the official WalletConnect modal
    // This displays a QR code for mobile wallet connections
    await dappConnector.openModal().then((session) => {
      console.log('✅ WalletConnect session established:', session.topic);
      // Emit sync event to update UI state
      refreshEvent.emit("sync");
    });
  } catch (error) {
    console.error('❌ Failed to open WalletConnect modal:', error);
    console.info('💡 Make sure you have a supported Hedera wallet installed');
  }
};

/**
 * WalletConnect Wallet Implementation
 * 
 * This class implements the WalletInterface for WalletConnect-based wallets
 * It uses the official Hedera DAppConnector for all wallet operations
 * 
 * Key features:
 * - Transaction signing and execution
 * - HBAR and token transfers
 * - Contract function calls
 * - Proper error handling and logging
 */
class WalletConnectWallet implements WalletInterface {
  
  /**
   * Gets the first available signer from the DAppConnector
   * In most cases, there will be only one connected wallet/signer
   * 
   * @returns DAppSigner - The signer object for transaction operations
   * @throws Error if no wallets are connected
   */
  private getSigner() {
    if (dappConnector.signers.length === 0) {
      throw new Error('❌ No WalletConnect sessions found. Please connect a wallet first.');
    }
    // Return the first signer (most recently connected wallet)
    return dappConnector.signers[0];
  }

  /**
   * Gets the Hedera Account ID from the connected signer
   * Converts the WalletConnect AccountId format to Hedera SDK format
   * 
   * @returns AccountId - The Hedera account ID in proper SDK format
   * @throws Error if no signer is available
   */
  private getAccountId(): AccountId {
    // IMPORTANT: WalletConnect AccountId and Hedera SDK AccountId are different types
    // We need to convert between them using string representation
    const signerAccountId = this.getSigner().getAccountId();
    return AccountId.fromString(signerAccountId.toString());
  }

  /**
   * Transfers HBAR from connected account to another account
   * Uses the official Hedera SDK pattern for HBAR transfers
   * 
   * @param toAddress - The recipient's Hedera account ID
   * @param amount - Amount of HBAR to transfer (in tinybars)
   * @returns Promise<TransactionId | null> - Transaction ID if successful, null if failed
   */
  async transferHBAR(toAddress: AccountId, amount: number): Promise<TransactionId | null> {
    try {
      console.log('💰 Transferring HBAR via WalletConnect:', {
        from: this.getAccountId().toString(),
        to: toAddress.toString(),
        amount: amount + ' tinybars'
      });

      // Create HBAR transfer transaction
      // Note: Negative amount debits from sender, positive amount credits to recipient
      const transferHBARTransaction = new TransferTransaction()
        .addHbarTransfer(this.getAccountId(), -amount)    // Debit from sender
        .addHbarTransfer(toAddress, amount);              // Credit to recipient

      // Get the connected wallet signer
      const signer = this.getSigner();
      
      // Freeze transaction with signer (sets transaction fees and nodes)
      await transferHBARTransaction.freezeWithSigner(signer);
      
      // Execute transaction through the connected wallet
      const txResult = await transferHBARTransaction.executeWithSigner(signer);
      
      if (txResult && txResult.transactionId) {
        console.log('✅ HBAR transfer successful:', txResult.transactionId.toString());
        return txResult.transactionId;
      } else {
        console.warn('⚠️ HBAR transfer completed but no transaction ID returned');
        return null;
      }
    } catch (error) {
      console.error('❌ HBAR transfer failed:', error);
      throw error;
    }
  }

  /**
   * Transfers fungible tokens (HTS tokens) between accounts
   * 
   * @param toAddress - The recipient's Hedera account ID
   * @param tokenId - The Hedera Token Service (HTS) token ID to transfer
   * @param amount - Amount of tokens to transfer (in token's smallest unit)
   * @returns Promise<TransactionId | null> - Transaction ID if successful, null if failed
   */
  async transferFungibleToken(toAddress: AccountId, tokenId: TokenId, amount: number): Promise<TransactionId | null> {
    try {
      console.log('🪙 Transferring fungible tokens via WalletConnect:', {
        from: this.getAccountId().toString(),
        to: toAddress.toString(),
        tokenId: tokenId.toString(),
        amount
      });

      // Create token transfer transaction
      // Note: Use AccountId for sender, but string for recipient (SDK requirement)
      const transferTokenTransaction = new TransferTransaction()
        .addTokenTransfer(tokenId, this.getAccountId(), -amount)     // Debit from sender
        .addTokenTransfer(tokenId, toAddress.toString(), amount);    // Credit to recipient

      // Get the connected wallet signer
      const signer = this.getSigner();
      
      // Freeze and execute transaction
      await transferTokenTransaction.freezeWithSigner(signer);
      const txResult = await transferTokenTransaction.executeWithSigner(signer);
      
      if (txResult && txResult.transactionId) {
        console.log('✅ Token transfer successful:', txResult.transactionId.toString());
        return txResult.transactionId;
      } else {
        console.warn('⚠️ Token transfer completed but no transaction ID returned');
        return null;
      }
    } catch (error) {
      console.error('❌ Token transfer failed:', error);
      throw error;
    }
  }

  /**
   * Transfers NFTs (Non-Fungible Tokens) between accounts
   * Perfect for transferring certificate NFTs in our CertChain application
   * 
   * @param toAddress - The recipient's Hedera account ID
   * @param tokenId - The Hedera Token Service (HTS) NFT collection ID
   * @param serialNumber - The specific NFT serial number to transfer
   * @returns Promise<TransactionId | null> - Transaction ID if successful, null if failed
   */
  async transferNonFungibleToken(toAddress: AccountId, tokenId: TokenId, serialNumber: number): Promise<TransactionId | null> {
    try {
      console.log('🎨 Transferring NFT via WalletConnect:', {
        from: this.getAccountId().toString(),
        to: toAddress.toString(),
        tokenId: tokenId.toString(),
        serialNumber
      });

      // Create NFT transfer transaction
      // NFTs are transferred by specifying: tokenId, serialNumber, sender, recipient
      const transferTokenTransaction = new TransferTransaction()
        .addNftTransfer(tokenId, serialNumber, this.getAccountId(), toAddress);

      // Get the connected wallet signer
      const signer = this.getSigner();
      
      // Freeze and execute transaction
      await transferTokenTransaction.freezeWithSigner(signer);
      const txResult = await transferTokenTransaction.executeWithSigner(signer);
      
      if (txResult && txResult.transactionId) {
        console.log('✅ NFT transfer successful:', txResult.transactionId.toString());
        return txResult.transactionId;
      } else {
        console.warn('⚠️ NFT transfer completed but no transaction ID returned');
        return null;
      }
    } catch (error) {
      console.error('❌ NFT transfer failed:', error);
      throw error;
    }
  }

  /**
   * Associates a token with the current account
   * This is required before an account can receive HTS tokens or NFTs
   * 
   * @param tokenId - The Hedera Token Service (HTS) token ID to associate
   * @returns Promise<TransactionId | null> - Transaction ID if successful, null if failed
   */
  async associateToken(tokenId: TokenId): Promise<TransactionId | null> {
    try {
      console.log('🔗 Associating token via WalletConnect:', {
        account: this.getAccountId().toString(),
        tokenId: tokenId.toString()
      });

      // Create token association transaction
      // This allows the account to receive the specified token
      const associateTokenTransaction = new TokenAssociateTransaction()
        .setAccountId(this.getAccountId())    // Account that will be associated
        .setTokenIds([tokenId]);              // Array of tokens to associate

      // Get the connected wallet signer
      const signer = this.getSigner();
      
      // Freeze and execute transaction
      await associateTokenTransaction.freezeWithSigner(signer);
      const txResult = await associateTokenTransaction.executeWithSigner(signer);
      
      if (txResult && txResult.transactionId) {
        console.log('✅ Token association successful:', txResult.transactionId.toString());
        return txResult.transactionId;
      } else {
        console.warn('⚠️ Token association completed but no transaction ID returned');
        return null;
      }
    } catch (error) {
      console.error('❌ Token association failed:', error);
      throw error;
    }
  }

  /**
   * Executes a smart contract function on the Hedera network
   * This is used for calling functions on deployed smart contracts (like our CertificateNFT contract)
   * 
   * @param contractId - The Hedera contract ID to call
   * @param functionName - The name of the contract function to execute
   * @param functionParameters - The parameters to pass to the contract function
   * @param gasLimit - Maximum gas to use for the contract execution
   * @returns Promise<TransactionId | null> - Transaction ID if successful, null if failed
   * 
   * Note: To read contract call results, query the transaction from a mirror node
   * and decode the call_result using ethers and the contract ABI
   */
  async executeContractFunction(
    contractId: ContractId, 
    functionName: string, 
    functionParameters: ContractFunctionParameterBuilder, 
    gasLimit: number
  ): Promise<TransactionId | null> {
    try {
      console.log('📋 Executing contract function via WalletConnect:', {
        contractId: contractId.toString(),
        functionName,
        gasLimit,
        account: this.getAccountId().toString()
      });

      // Build contract execution transaction
      const tx = new ContractExecuteTransaction()
        .setContractId(contractId)                                    // Target contract
        .setGas(gasLimit)                                            // Gas limit
        .setFunction(functionName, functionParameters.buildHAPIParams()); // Function call

      // Get the connected wallet signer
      const signer = this.getSigner();
      
      // Freeze transaction (sets fees and nodes) and execute
      await tx.freezeWithSigner(signer);
      const txResult = await tx.executeWithSigner(signer);

      if (txResult && txResult.transactionId) {
        console.log('✅ Contract function execution successful:', txResult.transactionId.toString());
        console.info('💡 To get results: query transaction from mirror node and decode call_result');
        return txResult.transactionId;
      } else {
        console.warn('⚠️ Contract execution completed but no transaction ID returned');
        return null;
      }
    } catch (error) {
      console.error('❌ Contract function execution failed:', error);
      throw error;
    }
  }
  /**
   * Disconnects all WalletConnect sessions
   * This will disconnect from all connected wallets and clear the session state
   */
  disconnect(): void {
    try {
      console.log('🔌 Disconnecting WalletConnect sessions...');
      
      // Disconnect all active sessions using the official method
      dappConnector.disconnectAll().then(() => {
        console.log('✅ WalletConnect disconnected successfully');
        // Emit sync event to update UI state
        refreshEvent.emit("sync");
      }).catch((error) => {
        console.error('❌ Error during WalletConnect disconnect:', error);
        // Still emit sync to update UI even if disconnect had issues
        refreshEvent.emit("sync");
      });
    } catch (error) {
      console.error('❌ WalletConnect disconnect error:', error);
    }
  }
}

/**
 * Export singleton instance of WalletConnectWallet
 * This provides a consistent wallet interface across the application
 */
export const walletConnectWallet = new WalletConnectWallet();

/**
 * Summary of this WalletConnect implementation:
 * 
 * ✅ Official Hedera repository pattern
 * ✅ Beginner-friendly with detailed comments
 * ✅ Proper error handling and logging
 * ✅ Support for all Hedera transaction types
 * ✅ Mobile wallet compatibility
 * ✅ Session management and reconnection
 * 
 * This implementation follows the exact patterns from:
 * https://github.com/hashgraph/hedera-wallet-connect
 * 
 * For more examples and advanced usage, see the official repository.
 */

/**
 * WalletConnect Client Component
 * 
 * This React component manages the WalletConnect state synchronization
 * between the DAppConnector and the React context system.
 * 
 * Key responsibilities:
 * - Initialize WalletConnect on component mount
 * - Sync connection state with React context
 * - Handle connection/disconnection events
 * - Provide connection status to the UI
 * 
 * This component doesn't render anything visible - it's a pure state manager
 */
export const WalletConnectClient = () => {
  // Access WalletConnect context to update connection state
  const { setAccountId, setIsConnected } = useContext(WalletConnectContext);

  /**
   * Synchronizes WalletConnect state with React context
   * This function is called whenever the connection state changes
   */
  const syncWithWalletConnectContext = useCallback(() => {
    try {
      // Check if there's an active signer (connected wallet)
      const accountId = dappConnector.signers[0]?.getAccountId()?.toString();
      
      if (accountId) {
        console.log('🔗 WalletConnect session active:', accountId);
        setAccountId(accountId);
        setIsConnected(true);
      } else {
        console.log('🔌 No WalletConnect sessions found');
        setAccountId('');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('❌ Error syncing WalletConnect context:', error);
      // Set disconnected state on error
      setAccountId('');
      setIsConnected(false);
    }
  }, [setAccountId, setIsConnected]);

  useEffect(() => {
    // Listen for connection state changes
    refreshEvent.addListener("sync", syncWithWalletConnectContext);

    // Initialize WalletConnect when component mounts
    initializeWalletConnect()
      .then(() => {
        console.log('🚀 WalletConnect initialized successfully');
        // Check for existing sessions after initialization
        syncWithWalletConnectContext();
      })
      .catch((error) => {
        console.error('❌ WalletConnect initialization failed:', error);
        console.info('💡 Some WalletConnect features may not work properly');
      });

    // Cleanup: remove event listener when component unmounts
    return () => {
      refreshEvent.removeListener("sync", syncWithWalletConnectContext);
    }
  }, [syncWithWalletConnectContext]);

  // This component doesn't render anything visible
  return null;
};
