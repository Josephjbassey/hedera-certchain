/**
 * error-handler.util.ts - Error Handling Utilities
 * 
 * Description: Provides standardized error handling, logging, and user-friendly
 * error message generation following Betty coding style guidelines.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Function names in snake_case
 * - Class names in PascalCase
 * - Constants in UPPER_CASE
 * - Comprehensive error categorization
 */

import { AppError, ErrorCategory } from '@/core/types';
import { log_error, log_warn } from './logger.util';
import {
	ERROR_WALLET_NOT_FOUND,
	ERROR_WALLET_CONNECTION_FAILED,
	ERROR_IPFS_UPLOAD_FAILED,
	ERROR_INVALID_EMAIL,
	ERROR_FILE_TOO_LARGE
} from '@/core/constants';

/**
 * ErrorHandler - Centralized error handling service
 * 
 * Description: Provides consistent error handling, logging, and user
 * message generation across the entire application.
 */
export class ErrorHandler {
	
	/**
	 * handle_error - Main error handling function
	 * 
	 * @error: Error object or message
	 * @category: Error category for classification
	 * @context: Additional context information
	 * 
	 * Description: Processes errors, logs them appropriately, and returns
	 * user-friendly error information.
	 * 
	 * Return: Standardized AppError object
	 */
	static handle_error(
		error: Error | string | any,
		category: ErrorCategory = ErrorCategory.UNKNOWN_ERROR,
		context?: string
	): AppError {
		const timestamp = new Date().toISOString();
		let app_error: AppError;

		if (error instanceof Error) {
			app_error = {
				code: this.get_error_code(error.message, category),
				message: this.get_user_friendly_message(error.message, category),
				details: {
					original_message: error.message,
					stack: error.stack,
					context
				},
				timestamp
			};
		} else if (typeof error === 'string') {
			app_error = {
				code: this.get_error_code(error, category),
				message: this.get_user_friendly_message(error, category),
				details: { context },
				timestamp
			};
		} else {
			app_error = {
				code: 'UNKNOWN_ERROR',
				message: 'An unexpected error occurred',
				details: { error, context },
				timestamp
			};
		}

		/* Log error with appropriate level */
		if (category === ErrorCategory.VALIDATION_ERROR) {
			log_warn('ErrorHandler', `Validation error: ${app_error.message}`, app_error.details);
		} else {
			log_error('ErrorHandler', `${category}: ${app_error.message}`, app_error.details);
		}

		return app_error;
	}

	/**
	 * handle_wallet_error - Handle wallet-specific errors
	 * 
	 * @error: Wallet error object or message
	 * @wallet_type: Type of wallet that encountered the error
	 * 
	 * Description: Specialized error handling for wallet-related errors
	 * with wallet-specific context and messaging.
	 * 
	 * Return: Wallet-specific AppError object
	 */
	static handle_wallet_error(error: Error | string, wallet_type: string): AppError {
		const context = `Wallet: ${wallet_type}`;
		return this.handle_error(error, ErrorCategory.WALLET_ERROR, context);
	}

	/**
	 * handle_blockchain_error - Handle blockchain transaction errors
	 * 
	 * @error: Blockchain error object or message
	 * @transaction_type: Type of transaction that failed
	 * 
	 * Description: Specialized error handling for blockchain transaction
	 * errors with transaction context.
	 * 
	 * Return: Blockchain-specific AppError object
	 */
	static handle_blockchain_error(error: Error | string, transaction_type: string): AppError {
		const context = `Transaction: ${transaction_type}`;
		return this.handle_error(error, ErrorCategory.BLOCKCHAIN_ERROR, context);
	}

	/**
	 * handle_ipfs_error - Handle IPFS operation errors
	 * 
	 * @error: IPFS error object or message
	 * @operation: IPFS operation that failed
	 * 
	 * Description: Specialized error handling for IPFS-related errors
	 * with operation context.
	 * 
	 * Return: IPFS-specific AppError object
	 */
	static handle_ipfs_error(error: Error | string, operation: string): AppError {
		const context = `IPFS Operation: ${operation}`;
		return this.handle_error(error, ErrorCategory.IPFS_ERROR, context);
	}

	/**
	 * handle_validation_error - Handle form validation errors
	 * 
	 * @field_errors: Object containing field-specific error messages
	 * @form_name: Name of the form being validated
	 * 
	 * Description: Processes form validation errors and creates appropriate
	 * error responses for user feedback.
	 * 
	 * Return: Validation-specific AppError object
	 */
	static handle_validation_error(
		field_errors: Record<string, string>,
		form_name: string
	): AppError {
		const error_count = Object.keys(field_errors).length;
		const first_error = Object.values(field_errors)[0] || 'Validation failed';
		
		return {
			code: 'VALIDATION_ERROR',
			message: error_count === 1 ? first_error : `${error_count} validation errors in ${form_name}`,
			details: { field_errors, form_name },
			timestamp: new Date().toISOString()
		};
	}

	/**
	 * get_error_code - Generate appropriate error code
	 * 
	 * @message: Error message to analyze
	 * @category: Error category
	 * 
	 * Description: Analyzes error message and category to generate
	 * appropriate error codes for tracking and handling.
	 * 
	 * Return: Error code string
	 */
	private static get_error_code(message: string, category: ErrorCategory): string {
		const lower_message = message.toLowerCase();

		/* Wallet error codes */
		if (category === ErrorCategory.WALLET_ERROR) {
			if (lower_message.includes('not found') || lower_message.includes('not installed')) {
				return ERROR_WALLET_NOT_FOUND;
			}
			if (lower_message.includes('connection') || lower_message.includes('connect')) {
				return ERROR_WALLET_CONNECTION_FAILED;
			}
			return 'WALLET_UNKNOWN_ERROR';
		}

		/* IPFS error codes */
		if (category === ErrorCategory.IPFS_ERROR) {
			if (lower_message.includes('upload') || lower_message.includes('pin')) {
				return ERROR_IPFS_UPLOAD_FAILED;
			}
			return 'IPFS_UNKNOWN_ERROR';
		}

		/* Validation error codes */
		if (category === ErrorCategory.VALIDATION_ERROR) {
			if (lower_message.includes('email')) {
				return ERROR_INVALID_EMAIL;
			}
			if (lower_message.includes('file') && lower_message.includes('size')) {
				return ERROR_FILE_TOO_LARGE;
			}
			return 'VALIDATION_FAILED';
		}

		/* Generic category-based codes */
		switch (category) {
			case ErrorCategory.BLOCKCHAIN_ERROR:
				return 'BLOCKCHAIN_ERROR';
			case ErrorCategory.NETWORK_ERROR:
				return 'NETWORK_ERROR';
			default:
				return 'UNKNOWN_ERROR';
		}
	}

	/**
	 * get_user_friendly_message - Generate user-friendly error message
	 * 
	 * @message: Original error message
	 * @category: Error category
	 * 
	 * Description: Converts technical error messages into user-friendly
	 * messages that provide clear guidance for resolution.
	 * 
	 * Return: User-friendly error message
	 */
	private static get_user_friendly_message(message: string, category: ErrorCategory): string {
		const lower_message = message.toLowerCase();

		/* Wallet error messages */
		if (category === ErrorCategory.WALLET_ERROR) {
			if (lower_message.includes('not found') || lower_message.includes('not installed')) {
				return 'Wallet not found. Please install the wallet extension and try again.';
			}
			if (lower_message.includes('rejected') || lower_message.includes('denied')) {
				return 'Transaction was rejected. Please approve the transaction in your wallet.';
			}
			if (lower_message.includes('connection')) {
				return 'Failed to connect to wallet. Please check your wallet and try again.';
			}
			return 'Wallet error occurred. Please check your wallet connection and try again.';
		}

		/* IPFS error messages */
		if (category === ErrorCategory.IPFS_ERROR) {
			if (lower_message.includes('upload')) {
				return 'Failed to upload file. Please check your connection and try again.';
			}
			if (lower_message.includes('fetch') || lower_message.includes('retrieve')) {
				return 'Failed to retrieve file. The file may be temporarily unavailable.';
			}
			return 'File storage error occurred. Please try again.';
		}

		/* Blockchain error messages */
		if (category === ErrorCategory.BLOCKCHAIN_ERROR) {
			if (lower_message.includes('gas') || lower_message.includes('fee')) {
				return 'Transaction failed due to insufficient gas. Please increase gas limit.';
			}
			if (lower_message.includes('timeout')) {
				return 'Transaction timed out. Please check network status and try again.';
			}
			return 'Blockchain transaction failed. Please try again.';
		}

		/* Network error messages */
		if (category === ErrorCategory.NETWORK_ERROR) {
			if (lower_message.includes('timeout')) {
				return 'Request timed out. Please check your connection and try again.';
			}
			if (lower_message.includes('offline')) {
				return 'You appear to be offline. Please check your internet connection.';
			}
			return 'Network error occurred. Please check your connection and try again.';
		}

		/* Validation error messages */
		if (category === ErrorCategory.VALIDATION_ERROR) {
			return message; /* Validation messages are already user-friendly */
		}

		/* Fallback to original message if no specific handling */
		return message || 'An unexpected error occurred. Please try again.';
	}

	/**
	 * is_retryable_error - Determine if error is retryable
	 * 
	 * @error: Error object to analyze
	 * 
	 * Description: Analyzes error to determine if the operation should
	 * be retried automatically or requires user intervention.
	 * 
	 * Return: Boolean indicating if error is retryable
	 */
	static is_retryable_error(error: AppError): boolean {
		/* Network errors are generally retryable */
		if (error.code.includes('NETWORK') || error.code.includes('TIMEOUT')) {
			return true;
		}

		/* Some blockchain errors are retryable */
		if (error.code.includes('BLOCKCHAIN')) {
			const message = error.message.toLowerCase();
			if (message.includes('timeout') || message.includes('network')) {
				return true;
			}
		}

		/* IPFS upload errors might be retryable */
		if (error.code === ERROR_IPFS_UPLOAD_FAILED) {
			return true;
		}

		/* Validation and wallet errors are not retryable */
		return false;
	}

	/**
	 * format_error_for_display - Format error for UI display
	 * 
	 * @error: Error object to format
	 * @include_details: Whether to include technical details
	 * 
	 * Description: Formats error object for display in user interface
	 * with appropriate level of detail.
	 * 
	 * Return: Formatted error object for UI
	 */
	static format_error_for_display(error: AppError, include_details: boolean = false) {
		const formatted = {
			title: 'Error',
			message: error.message,
			timestamp: new Date(error.timestamp).toLocaleString(),
			is_retryable: this.is_retryable_error(error)
		};

		if (include_details) {
			return {
				...formatted,
				code: error.code,
				details: error.details
			};
		}

		return formatted;
	}
}

/* Convenience functions for common error types */
export const handle_wallet_error = ErrorHandler.handle_wallet_error;
export const handle_blockchain_error = ErrorHandler.handle_blockchain_error;
export const handle_ipfs_error = ErrorHandler.handle_ipfs_error;
export const handle_validation_error = ErrorHandler.handle_validation_error;