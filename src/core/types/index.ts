/**
 * index.ts - Core Application Types
 * 
 * Description: Centralized type definitions for the Hedera CertChain application.
 * Contains interfaces, types, and enums used throughout the application.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Interface names in PascalCase
 * - Type names in PascalCase
 * - Enum names in PascalCase with UPPER_CASE values
 * - Clear documentation for all exports
 */

/* ========================================================================== */
/*                                 WALLET TYPES                              */
/* ========================================================================== */

/* Supported wallet types in the application */
export enum WalletType {
	METAMASK = 'metamask',
	HASHPACK = 'hashpack',
	BLADE = 'blade',
	KABILA = 'kabila',
	WALLETCONNECT = 'walletconnect',
}

/* Wallet connection status */
export enum ConnectionStatus {
	DISCONNECTED = 'disconnected',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	ERROR = 'error',
}

/* Wallet user information interface */
export interface WalletUser {
	account_id: string;
	address: string;
	network: string;
	wallet_type: WalletType;
	public_key?: string;
}

/* ========================================================================== */
/*                              CERTIFICATE TYPES                            */
/* ========================================================================== */

/* Certificate status enumeration */
export enum CertificateStatus {
	DRAFT = 'draft',
	PENDING = 'pending',
	ISSUED = 'issued',
	VERIFIED = 'verified',
	REVOKED = 'revoked',
}

/* Certificate metadata interface */
export interface CertificateMetadata {
	recipient_name: string;
	recipient_email: string;
	issuer_name: string;
	course_name: string;
	completion_date: string;
	issue_date: string;
	description?: string;
	certificate_hash: string;
	image_url?: string;
	metadata_url?: string;
}

/* Certificate NFT data interface */
export interface CertificateNFT {
	token_id: number;
	serial_number: number;
	metadata: CertificateMetadata;
	transaction_hash: string;
	block_timestamp: string;
	owner_address: string;
	status: CertificateStatus;
}

/* ========================================================================== */
/*                                 IPFS TYPES                                */
/* ========================================================================== */

/* IPFS upload result interface */
export interface IPFSUploadResult {
	success: boolean;
	cid?: string;
	url?: string;
	error?: string;
	size?: number;
	timestamp?: number;
}

/* IPFS file metadata interface */
export interface IPFSFileMetadata {
	name: string;
	description: string;
	image: string;
	attributes: Array<{
		trait_type: string;
		value: string | number;
		display_type?: string;
	}>;
	properties: Record<string, any>;
	external_url?: string;
	animation_url?: string;
}

/* ========================================================================== */
/*                              BLOCKCHAIN TYPES                             */
/* ========================================================================== */

/* Transaction result interface */
export interface TransactionResult {
	transaction_id: string;
	transaction_hash: string;
	consensus_timestamp: string;
	status: 'SUCCESS' | 'FAILED' | 'PENDING';
	error_message?: string;
}

/* Smart contract deployment interface */
export interface ContractDeployment {
	contract_address: string;
	transaction_result: TransactionResult;
	deployment_timestamp: string;
	deployer_address: string;
	network: string;
}

/* ========================================================================== */
/*                               API TYPES                                   */
/* ========================================================================== */

/* API response wrapper interface */
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: string;
	request_id?: string;
}

/* Pagination interface */
export interface PaginationParams {
	page: number;
	limit: number;
	sort_by?: string;
	sort_order?: 'asc' | 'desc';
}

/* ========================================================================== */
/*                               ERROR TYPES                                 */
/* ========================================================================== */

/* Application error interface */
export interface AppError {
	code: string;
	message: string;
	details?: any;
	timestamp: string;
}

/* Error categories enumeration */
export enum ErrorCategory {
	WALLET_ERROR = 'wallet_error',
	BLOCKCHAIN_ERROR = 'blockchain_error',
	IPFS_ERROR = 'ipfs_error',
	VALIDATION_ERROR = 'validation_error',
	NETWORK_ERROR = 'network_error',
	UNKNOWN_ERROR = 'unknown_error',
}

/* ========================================================================== */
/*                               UI TYPES                                    */
/* ========================================================================== */

/* Loading state interface */
export interface LoadingState {
	is_loading: boolean;
	message?: string;
	progress?: number;
}

/* Form validation result interface */
export interface ValidationResult {
	is_valid: boolean;
	errors: Record<string, string>;
}

/* Modal props interface */
export interface ModalProps {
	is_open: boolean;
	on_close: () => void;
	title?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

/* ========================================================================== */
/*                              UTILITY TYPES                                */
/* ========================================================================== */

/* Generic key-value pair interface */
export interface KeyValuePair<T = any> {
	key: string;
	value: T;
}

/* Optional fields utility type */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/* Required fields utility type */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;