/**
 * crypto.service.ts - Certificate Cryptographic Operations
 * 
 * Description: Provides cryptographic utilities for certificate generation,
 * hashing, and verification operations. Implements secure practices for
 * certificate data integrity and privacy protection.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Function names in snake_case
 * - Class names in PascalCase
 * - Constants in UPPER_CASE
 * - Comprehensive documentation for all functions
 */

import * as CryptoJS from 'crypto-js';
import { CertificateMetadata } from '@/core/types';

/**
 * CertificateCryptoService - Cryptographic operations for certificates
 * 
 * Description: Handles all cryptographic operations including hashing,
 * certificate data validation, and NFT metadata generation.
 */
export class CertificateCryptoService {
	
	/**
	 * generate_certificate_hash - Create unique certificate hash
	 * 
	 * @certificate_data: Object containing certificate information
	 * 
	 * Description: Generates a SHA256 hash from certificate data to create
	 * a unique identifier that can be used for verification and NFT creation.
	 * 
	 * Return: Hexadecimal string representation of the hash
	 */
	static generate_certificate_hash(certificate_data: {
		recipient_name: string;
		recipient_email: string;
		issuer_name: string;
		course_name: string;
		completion_date: string;
		timestamp?: string;
	}): string {
		/* Validate required fields */
		if (!certificate_data.recipient_name || !certificate_data.recipient_email ||
			!certificate_data.issuer_name || !certificate_data.course_name ||
			!certificate_data.completion_date) {
			throw new Error('Missing required certificate data for hash generation');
		}

		/* Create deterministic data string */
		const data_string = [
			certificate_data.recipient_name.trim(),
			certificate_data.recipient_email.toLowerCase().trim(),
			certificate_data.issuer_name.trim(),
			certificate_data.course_name.trim(),
			certificate_data.completion_date,
			certificate_data.timestamp || Date.now().toString(),
		].join('|');

		return CryptoJS.SHA256(data_string).toString();
	}

	/**
	 * hash_email_for_privacy - Create one-way hash of email address
	 * 
	 * @email: Email address to hash
	 * 
	 * Description: Generates a SHA256 hash of the email address for privacy
	 * protection while maintaining the ability to verify ownership.
	 * 
	 * Return: Hexadecimal hash string
	 */
	static hash_email_for_privacy(email: string): string {
		if (!email || typeof email !== 'string') {
			throw new Error('Invalid email address provided');
		}

		const normalized_email = email.toLowerCase().trim();
		return CryptoJS.SHA256(normalized_email).toString();
	}

	/**
	 * generate_secure_id - Create cryptographically secure random ID
	 * 
	 * Description: Generates a secure random identifier using cryptographic
	 * random number generation and SHA256 hashing.
	 * 
	 * Return: Secure hexadecimal ID string
	 */
	static generate_secure_id(): string {
		const random_words = CryptoJS.lib.WordArray.random(32);
		return CryptoJS.SHA256(random_words).toString();
	}

	/**
	 * verify_certificate_hash - Validate certificate hash integrity
	 * 
	 * @certificate_data: Certificate data to verify
	 * @expected_hash: The expected hash value
	 * 
	 * Description: Verifies that the provided certificate data generates
	 * the expected hash value, ensuring data integrity.
	 * 
	 * Return: Boolean indicating if hash matches
	 */
	static verify_certificate_hash(
		certificate_data: {
			recipient_name: string;
			recipient_email: string;
			issuer_name: string;
			course_name: string;
			completion_date: string;
			timestamp?: string;
		},
		expected_hash: string
	): boolean {
		try {
			const calculated_hash = this.generate_certificate_hash(certificate_data);
			return calculated_hash === expected_hash;
		} catch (error) {
			console.error('Hash verification failed:', error);
			return false;
		}
	}

	/**
	 * generate_nft_metadata - Create NFT metadata for certificate
	 * 
	 * @certificate_data: Certificate information
	 * 
	 * Description: Generates comprehensive NFT metadata following OpenSea
	 * and ERC-721 standards for certificate representation.
	 * 
	 * Return: Complete NFT metadata object
	 */
	static generate_nft_metadata(certificate_data: {
		recipient_name: string;
		recipient_email: string;
		issuer_name: string;
		course_name: string;
		completion_date: string;
		certificate_image_url?: string;
		certificate_hash?: string;
	}) {
		const timestamp = new Date().toISOString();
		const hash = certificate_data.certificate_hash || 
					 this.generate_certificate_hash({
						 ...certificate_data,
						 timestamp,
					 });

		return {
			name: `Certificate: ${certificate_data.course_name}`,
			description: `Certificate of completion for ${certificate_data.course_name} ` +
						`issued to ${certificate_data.recipient_name} by ${certificate_data.issuer_name}`,
			image: certificate_data.certificate_image_url || '',
			attributes: [
				{
					trait_type: 'Recipient',
					value: certificate_data.recipient_name,
				},
				{
					trait_type: 'Course',
					value: certificate_data.course_name,
				},
				{
					trait_type: 'Issuer',
					value: certificate_data.issuer_name,
				},
				{
					trait_type: 'Completion Date',
					value: certificate_data.completion_date,
				},
				{
					trait_type: 'Issue Timestamp',
					value: timestamp,
				},
				{
					trait_type: 'Certificate Hash',
					value: hash,
				},
			],
			external_url: `https://hedera-certchain.com/verify/${hash}`,
			certificate_data: {
				recipient_name: certificate_data.recipient_name,
				recipient_email_hash: this.hash_email_for_privacy(certificate_data.recipient_email),
				issuer_name: certificate_data.issuer_name,
				course_name: certificate_data.course_name,
				completion_date: certificate_data.completion_date,
				issue_timestamp: timestamp,
				certificate_hash: hash,
			},
		};
	}

	/**
	 * generate_file_hash - Create hash of uploaded file
	 * 
	 * @file: File object to hash
	 * 
	 * Description: Generates SHA256 hash of file contents for integrity
	 * verification and duplicate detection.
	 * 
	 * Return: Promise resolving to file hash string
	 */
	static async generate_file_hash(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			
			reader.onload = (event) => {
				try {
					const array_buffer = event.target?.result as ArrayBuffer;
					const word_array = CryptoJS.lib.WordArray.create(array_buffer);
					const hash = CryptoJS.SHA256(word_array).toString();
					resolve(hash);
				} catch (error) {
					reject(new Error('Failed to generate file hash: ' + error));
				}
			};
			
			reader.onerror = () => {
				reject(new Error('Failed to read file for hashing'));
			};
			
			reader.readAsArrayBuffer(file);
		});
	}

	/**
	 * validate_certificate_data - Validate certificate data structure
	 * 
	 * @data: Certificate data object to validate
	 * 
	 * Description: Performs comprehensive validation of certificate data
	 * ensuring all required fields are present and properly formatted.
	 * 
	 * Return: Validation result object
	 */
	static validate_certificate_data(data: any): {
		is_valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		/* Required field validation */
		const required_fields = [
			'recipient_name',
			'recipient_email', 
			'issuer_name',
			'course_name',
			'completion_date'
		];

		required_fields.forEach(field => {
			if (!data[field] || typeof data[field] !== 'string' || !data[field].trim()) {
				errors.push(`Missing or invalid ${field.replace('_', ' ')}`);
			}
		});

		/* Email format validation */
		if (data.recipient_email) {
			const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!email_regex.test(data.recipient_email)) {
				errors.push('Invalid email address format');
			}
		}

		/* Date format validation */
		if (data.completion_date) {
			const date = new Date(data.completion_date);
			if (isNaN(date.getTime())) {
				errors.push('Invalid completion date format');
			}
		}

		return {
			is_valid: errors.length === 0,
			errors
		};
	}
}

/* Legacy compatibility - maintain old interface */
export const CertificateCrypto = CertificateCryptoService;