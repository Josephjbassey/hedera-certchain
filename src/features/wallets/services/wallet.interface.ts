/**
 * wallet.interface.ts - Wallet Integration Interface
 * 
 * Description: Defines the standard interface for all wallet integrations
 * in the Hedera CertChain application. Provides a consistent API for
 * interacting with different wallet types.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Interface names in PascalCase
 * - Function names in snake_case
 * - Parameter names in snake_case
 * - Comprehensive documentation for all methods
 */

import { AccountId, ContractId, TokenId, TransactionId } from "@hashgraph/sdk";
import { ContractFunctionParameterBuilder } from "./parameter-builder.service";

/**
 * WalletInterface - Standard wallet operations interface
 * 
 * Description: Defines the contract that all wallet implementations must follow.
 * Provides methods for contract execution, token transfers, and wallet management.
 */
export interface WalletInterface {
	
	/**
	 * execute_contract_function - Execute a smart contract function
	 * 
	 * @contract_id: ID of the contract to execute
	 * @function_name: Name of the function to call
	 * @function_parameters: Parameters for the function call
	 * @gas_limit: Maximum gas to use for execution
	 * 
	 * Description: Executes a function on a smart contract with the provided
	 * parameters and gas limit. Returns transaction ID on success.
	 * 
	 * Return: Promise resolving to transaction ID or null on failure
	 */
	execute_contract_function(
		contract_id: ContractId,
		function_name: string,
		function_parameters: ContractFunctionParameterBuilder,
		gas_limit: number
	): Promise<TransactionId | string | null>;

	/**
	 * disconnect - Disconnect from the wallet
	 * 
	 * Description: Safely disconnects from the wallet and cleans up
	 * any active sessions or listeners.
	 * 
	 * Return: void
	 */
	disconnect(): void;

	/**
	 * transfer_hbar - Transfer HBAR tokens
	 * 
	 * @to_address: Recipient account ID
	 * @amount: Amount of HBAR to transfer
	 * 
	 * Description: Transfers the specified amount of HBAR to the target
	 * address using the connected wallet.
	 * 
	 * Return: Promise resolving to transaction ID or null on failure
	 */
	transfer_hbar(
		to_address: AccountId,
		amount: number
	): Promise<TransactionId | string | null>;

	/**
	 * transfer_fungible_token - Transfer fungible tokens
	 * 
	 * @to_address: Recipient account ID
	 * @token_id: ID of the token to transfer
	 * @amount: Number of tokens to transfer
	 * 
	 * Description: Transfers fungible tokens (HTS tokens) to the specified
	 * address using the connected wallet.
	 * 
	 * Return: Promise resolving to transaction ID or null on failure
	 */
	transfer_fungible_token(
		to_address: AccountId,
		token_id: TokenId,
		amount: number
	): Promise<TransactionId | string | null>;

	/**
	 * transfer_non_fungible_token - Transfer NFT
	 * 
	 * @to_address: Recipient account ID
	 * @token_id: ID of the NFT collection
	 * @serial_number: Serial number of the specific NFT
	 * 
	 * Description: Transfers a specific NFT by serial number to the
	 * target address using the connected wallet.
	 * 
	 * Return: Promise resolving to transaction ID or null on failure
	 */
	transfer_non_fungible_token(
		to_address: AccountId,
		token_id: TokenId,
		serial_number: number
	): Promise<TransactionId | string | null>;

	/**
	 * associate_token - Associate a token with the wallet account
	 * 
	 * @token_id: ID of the token to associate
	 * 
	 * Description: Creates an association between the wallet account and
	 * the specified token, allowing the account to hold that token type.
	 * 
	 * Return: Promise resolving to transaction ID or null on failure
	 */
	associate_token(
		token_id: TokenId
	): Promise<TransactionId | string | null>;
}

/**
 * WalletConnectionInfo - Wallet connection information
 * 
 * Description: Contains information about the connected wallet including
 * account details and connection status.
 */
export interface WalletConnectionInfo {
	account_id: string;
	address: string;
	network: string;
	wallet_type: string;
	public_key?: string;
	is_connected: boolean;
	connection_timestamp?: string;
}

/**
 * WalletCapabilities - Wallet feature capabilities
 * 
 * Description: Defines which features are supported by a specific wallet
 * implementation to enable conditional UI and functionality.
 */
export interface WalletCapabilities {
	supports_contract_calls: boolean;
	supports_token_transfers: boolean;
	supports_nft_transfers: boolean;
	supports_token_association: boolean;
	supports_message_signing: boolean;
	supports_network_switching: boolean;
}

/**
 * WalletError - Wallet operation error information
 * 
 * Description: Standardized error structure for wallet operations
 * providing consistent error handling across different wallet types.
 */
export interface WalletError {
	code: string;
	message: string;
	details?: any;
	timestamp: string;
	wallet_type: string;
}