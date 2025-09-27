/**
 * validation.util.ts - Data Validation Utilities
 * 
 * Description: Provides comprehensive validation functions for forms,
 * data structures, and user inputs following Betty coding style.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Function names in snake_case
 * - Constants in UPPER_CASE
 * - Comprehensive validation with clear error messages
 */

import { ValidationResult } from '@/core/types';
import {
	EMAIL_REGEX,
	HEDERA_ACCOUNT_REGEX,
	ETHEREUM_ADDRESS_REGEX,
	IPFS_HASH_REGEX,
	MAX_FILE_SIZE,
	SUPPORTED_IMAGE_TYPES
} from '@/core/constants';

/**
 * validate_email - Validate email address format
 * 
 * @email: Email address to validate
 * 
 * Description: Validates email address format using RFC-compliant regex
 * and additional checks for common issues.
 * 
 * Return: Validation result with success flag and error message
 */
export function validate_email(email: string): ValidationResult {
	const errors: Record<string, string> = {};

	if (!email || typeof email !== 'string') {
		errors.email = 'Email address is required';
		return { is_valid: false, errors };
	}

	const trimmed_email = email.trim();
	
	if (trimmed_email.length === 0) {
		errors.email = 'Email address cannot be empty';
		return { is_valid: false, errors };
	}

	if (!EMAIL_REGEX.test(trimmed_email)) {
		errors.email = 'Invalid email address format';
		return { is_valid: false, errors };
	}

	if (trimmed_email.length > 254) {
		errors.email = 'Email address is too long';
		return { is_valid: false, errors };
	}

	return { is_valid: true, errors: {} };
}

/**
 * validate_required_field - Validate required text field
 * 
 * @value: Field value to validate
 * @field_name: Name of the field for error messages
 * @min_length: Minimum required length (default: 1)
 * @max_length: Maximum allowed length (default: 255)
 * 
 * Description: Validates that a required field has appropriate content
 * within specified length limits.
 * 
 * Return: Validation result with success flag and error message
 */
export function validate_required_field(
	value: string,
	field_name: string,
	min_length: number = 1,
	max_length: number = 255
): ValidationResult {
	const errors: Record<string, string> = {};

	if (!value || typeof value !== 'string') {
		errors[field_name] = `${field_name.replace('_', ' ')} is required`;
		return { is_valid: false, errors };
	}

	const trimmed_value = value.trim();

	if (trimmed_value.length < min_length) {
		errors[field_name] = `${field_name.replace('_', ' ')} must be at least ${min_length} characters`;
		return { is_valid: false, errors };
	}

	if (trimmed_value.length > max_length) {
		errors[field_name] = `${field_name.replace('_', ' ')} must not exceed ${max_length} characters`;
		return { is_valid: false, errors };
	}

	return { is_valid: true, errors: {} };
}

/**
 * validate_date - Validate date string
 * 
 * @date_string: Date string to validate
 * @field_name: Name of the field for error messages
 * @allow_future: Whether future dates are allowed (default: true)
 * 
 * Description: Validates date string format and checks for reasonable
 * date values with optional future date restriction.
 * 
 * Return: Validation result with success flag and error message
 */
export function validate_date(
	date_string: string,
	field_name: string,
	allow_future: boolean = true
): ValidationResult {
	const errors: Record<string, string> = {};

	if (!date_string || typeof date_string !== 'string') {
		errors[field_name] = `${field_name.replace('_', ' ')} is required`;
		return { is_valid: false, errors };
	}

	const date = new Date(date_string);
	
	if (isNaN(date.getTime())) {
		errors[field_name] = `Invalid ${field_name.replace('_', ' ')} format`;
		return { is_valid: false, errors };
	}

	/* Check for reasonable date ranges */
	const current_date = new Date();
	const min_date = new Date('1900-01-01');
	const max_date = new Date('2100-12-31');

	if (date < min_date || date > max_date) {
		errors[field_name] = `${field_name.replace('_', ' ')} must be between 1900 and 2100`;
		return { is_valid: false, errors };
	}

	if (!allow_future && date > current_date) {
		errors[field_name] = `${field_name.replace('_', ' ')} cannot be in the future`;
		return { is_valid: false, errors };
	}

	return { is_valid: true, errors: {} };
}

/**
 * validate_hedera_account_id - Validate Hedera account ID format
 * 
 * @account_id: Hedera account ID to validate
 * 
 * Description: Validates Hedera account ID format (0.0.xxxxx) and
 * checks for reasonable account number ranges.
 * 
 * Return: Validation result with success flag and error message
 */
export function validate_hedera_account_id(account_id: string): ValidationResult {
	const errors: Record<string, string> = {};

	if (!account_id || typeof account_id !== 'string') {
		errors.account_id = 'Hedera account ID is required';
		return { is_valid: false, errors };
	}

	if (!HEDERA_ACCOUNT_REGEX.test(account_id.trim())) {
		errors.account_id = 'Invalid Hedera account ID format (expected: 0.0.xxxxx)';
		return { is_valid: false, errors };
	}

	return { is_valid: true, errors: {} };
}

/**
 * validate_ethereum_address - Validate Ethereum address format
 * 
 * @address: Ethereum address to validate
 * 
 * Description: Validates Ethereum address format (0x followed by 40 hex chars)
 * with checksum validation if applicable.
 * 
 * Return: Validation result with success flag and error message
 */
export function validate_ethereum_address(address: string): ValidationResult {
	const errors: Record<string, string> = {};

	if (!address || typeof address !== 'string') {
		errors.address = 'Ethereum address is required';
		return { is_valid: false, errors };
	}

	if (!ETHEREUM_ADDRESS_REGEX.test(address.trim())) {
		errors.address = 'Invalid Ethereum address format';
		return { is_valid: false, errors };
	}

	return { is_valid: true, errors: {} };
}

/**
 * validate_file_upload - Validate file upload
 * 
 * @file: File object to validate
 * @allowed_types: Array of allowed MIME types
 * @max_size: Maximum file size in bytes
 * 
 * Description: Validates uploaded file for type, size, and basic integrity
 * checks to ensure safe file processing.
 * 
 * Return: Validation result with success flag and error message
 */
export function validate_file_upload(
	file: File,
	allowed_types: string[] = SUPPORTED_IMAGE_TYPES as any,
	max_size: number = MAX_FILE_SIZE
): ValidationResult {
	const errors: Record<string, string> = {};

	if (!file || !(file instanceof File)) {
		errors.file = 'Valid file is required';
		return { is_valid: false, errors };
	}

	/* Check file type */
	if (!allowed_types.includes(file.type)) {
		errors.file = `Invalid file type. Allowed types: ${allowed_types.join(', ')}`;
		return { is_valid: false, errors };
	}

	/* Check file size */
	if (file.size > max_size) {
		const max_mb = Math.round(max_size / (1024 * 1024));
		errors.file = `File size exceeds ${max_mb}MB limit`;
		return { is_valid: false, errors };
	}

	/* Check for empty file */
	if (file.size === 0) {
		errors.file = 'File cannot be empty';
		return { is_valid: false, errors };
	}

	return { is_valid: true, errors: {} };
}

/**
 * validate_ipfs_hash - Validate IPFS hash format
 * 
 * @hash: IPFS hash to validate
 * 
 * Description: Validates IPFS hash format (currently supports v0 hashes
 * starting with Qm followed by 44 base58 characters).
 * 
 * Return: Validation result with success flag and error message
 */
export function validate_ipfs_hash(hash: string): ValidationResult {
	const errors: Record<string, string> = {};

	if (!hash || typeof hash !== 'string') {
		errors.hash = 'IPFS hash is required';
		return { is_valid: false, errors };
	}

	if (!IPFS_HASH_REGEX.test(hash.trim())) {
		errors.hash = 'Invalid IPFS hash format';
		return { is_valid: false, errors };
	}

	return { is_valid: true, errors: {} };
}

/**
 * validate_certificate_form - Validate complete certificate form
 * 
 * @form_data: Form data object to validate
 * 
 * Description: Performs comprehensive validation of certificate form data
 * including all required fields and their formats.
 * 
 * Return: Complete validation result for all fields
 */
export function validate_certificate_form(form_data: {
	recipient_name?: string;
	recipient_email?: string;
	issuer_name?: string;
	course_name?: string;
	completion_date?: string;
	description?: string;
}): ValidationResult {
	const all_errors: Record<string, string> = {};

	/* Validate required fields */
	const name_validation = validate_required_field(
		form_data.recipient_name || '',
		'recipient_name',
		2,
		100
	);
	Object.assign(all_errors, name_validation.errors);

	const email_validation = validate_email(form_data.recipient_email || '');
	Object.assign(all_errors, email_validation.errors);

	const issuer_validation = validate_required_field(
		form_data.issuer_name || '',
		'issuer_name',
		2,
		100
	);
	Object.assign(all_errors, issuer_validation.errors);

	const course_validation = validate_required_field(
		form_data.course_name || '',
		'course_name',
		2,
		200
	);
	Object.assign(all_errors, course_validation.errors);

	const date_validation = validate_date(
		form_data.completion_date || '',
		'completion_date',
		false /* Don't allow future completion dates */
	);
	Object.assign(all_errors, date_validation.errors);

	/* Validate optional description if provided */
	if (form_data.description && form_data.description.trim().length > 0) {
		const desc_validation = validate_required_field(
			form_data.description,
			'description',
			1,
			1000
		);
		Object.assign(all_errors, desc_validation.errors);
	}

	return {
		is_valid: Object.keys(all_errors).length === 0,
		errors: all_errors
	};
}