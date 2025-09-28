/**
 * Wallet Interface for Hedera CertChain Application
 * 
 * This interface defines the standard methods that all wallet implementations
 * must provide. It ensures consistency across different wallet types:
 * - MetaMask (Ethereum/Hedera EVM compatibility)
 * - HashPack (Native Hedera wallet)
 * - Blade (Native Hedera wallet) 
 * - WalletConnect (Mobile wallets)
 * 
 * Each method handles different types of Hedera network operations
 * needed for the certificate verification system.
 */

import { AccountId, ContractId, TokenId, TransactionId } from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "./contractFunctionParameterBuilder";

/**
 * Standard interface for all wallet implementations in Hedera CertChain
 */
export interface WalletInterface {
  /**
   * Executes a smart contract function on the Hedera network
   * Used for interacting with the CertificateNFT contract
   * 
   * @param contractId - The deployed contract's Hedera ID
   * @param functionName - Name of the contract function to call
   * @param functionParameters - Parameters to pass to the function
   * @param gasLimit - Maximum gas to use for execution
   * @returns Promise resolving to transaction ID or null if failed
   */
  executeContractFunction: (
    contractId: ContractId, 
    functionName: string, 
    functionParameters: ContractFunctionParameterBuilder, 
    gasLimit: number
  ) => Promise<TransactionId | string | null>;

  /**
   * Disconnects from the wallet and clears session data
   * Should be called when user logs out or switches wallets
   */
  disconnect: () => void;

  /**
   * Transfers HBAR (Hedera's native cryptocurrency) between accounts
   * 
   * @param toAddress - Recipient's Hedera account ID
   * @param amount - Amount in tinybars (1 HBAR = 100,000,000 tinybars)
   * @returns Promise resolving to transaction ID or null if failed
   */
  transferHBAR: (
    toAddress: AccountId, 
    amount: number
  ) => Promise<TransactionId | string | null>;

  /**
   * Transfers fungible tokens (HTS tokens) between accounts
   * 
   * @param toAddress - Recipient's Hedera account ID
   * @param tokenId - The HTS token ID to transfer
   * @param amount - Amount of tokens to transfer
   * @returns Promise resolving to transaction ID or null if failed
   */
  transferFungibleToken: (
    toAddress: AccountId, 
    tokenId: TokenId, 
    amount: number
  ) => Promise<TransactionId | string | null>;

  /**
   * Transfers NFTs (Certificate NFTs) between accounts
   * This is the core function for transferring certificates in our system
   * 
   * @param toAddress - Recipient's Hedera account ID
   * @param tokenId - The NFT collection (CertificateNFT contract) ID
   * @param serialNumber - Specific certificate NFT serial number
   * @returns Promise resolving to transaction ID or null if failed
   */
  transferNonFungibleToken: (
    toAddress: AccountId, 
    tokenId: TokenId, 
    serialNumber: number
  ) => Promise<TransactionId | string | null>;

  /**
   * Associates a token with an account (required before receiving HTS tokens/NFTs)
   * Users must associate with the CertificateNFT contract before receiving certificates
   * 
   * @param tokenId - The HTS token/NFT collection ID to associate
   * @returns Promise resolving to transaction ID or null if failed
   */
  associateToken: (
    tokenId: TokenId
  ) => Promise<TransactionId | string | null>;
}