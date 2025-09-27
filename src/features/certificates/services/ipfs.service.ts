/**
 * ipfs.service.ts - IPFS Storage Service
 * 
 * Description: Provides IPFS file storage functionality via Pinata gateway
 * for certificate images, metadata, and document storage with comprehensive
 * error handling and validation.
 * 
 * Author: Hedera CertChain Team
 * Created: September 27, 2025
 * Last Modified: September 27, 2025
 * 
 * Betty Style Guidelines:
 * - Function names in snake_case
 * - Class names in PascalCase
 * - Constants in UPPER_CASE
 * - Comprehensive error handling and logging
 */

import axios from 'axios';
import { IPFSUploadResult, CertificateMetadata } from '@/core/types';
import { 
	PINATA_API_BASE, 
	IPFS_UPLOAD_TIMEOUT, 
	MAX_FILE_SIZE,
	DEFAULT_IPFS_GATEWAY 
} from '@/core/constants';
import { handle_ipfs_error } from '@/shared/utils/error-handler.util';
import { log_info, log_error } from '@/shared/utils/logger.util';
import { validate_file_upload } from '@/shared/utils/validation.util';

/**
 * IPFSService - IPFS storage and retrieval service
 * 
 * Description: Handles all IPFS operations including file uploads,
 * metadata management, and content retrieval through Pinata gateway.
 */
export class IPFSService {
	private pinata_api_key: string;
	private pinata_secret_key: string;
	private gateway_url: string;

	/**
	 * constructor - Initialize IPFS service
	 * 
	 * @api_key: Pinata API key for authentication
	 * @secret_key: Pinata secret key for authentication
	 * @gateway_url: IPFS gateway URL for content retrieval
	 * 
	 * Description: Initializes the IPFS service with Pinata credentials
	 * and gateway configuration.
	 */
	constructor(
		api_key?: string,
		secret_key?: string,
		gateway_url: string = DEFAULT_IPFS_GATEWAY
	) {
		this.pinata_api_key = api_key || process.env.REACT_APP_PINATA_API_KEY || '';
		this.pinata_secret_key = secret_key || process.env.REACT_APP_PINATA_SECRET_KEY || '';
		this.gateway_url = gateway_url;

		if (!this.pinata_api_key || !this.pinata_secret_key) {
			log_error('IPFSService', 'Pinata API credentials not configured');
		}
	}

	/**
	 * upload_file - Upload file to IPFS
	 * 
	 * @file: File object to upload
	 * @metadata: Optional metadata for the file
	 * 
	 * Description: Uploads a file to IPFS via Pinata with validation,
	 * progress tracking, and comprehensive error handling.
	 * 
	 * Return: Promise resolving to upload result with CID and URL
	 */
	async upload_file(
		file: File, 
		metadata?: Partial<CertificateMetadata>
	): Promise<IPFSUploadResult> {
		try {
			log_info('IPFSService', `Starting file upload: ${file.name} (${file.size} bytes)`);

			/* Validate file before upload */
			const validation = validate_file_upload(file);
			if (!validation.is_valid) {
				throw new Error(`File validation failed: ${Object.values(validation.errors).join(', ')}`);
			}

			/* Check API credentials */
			if (!this.pinata_api_key || !this.pinata_secret_key) {
				throw new Error('IPFS service not properly configured - missing API credentials');
			}

			/* Prepare form data */
			const form_data = new FormData();
			form_data.append('file', file);

			/* Add pinning options */
			const pinata_options = {
				cidVersion: 1,
				customPinPolicy: {
					regions: [
						{ id: 'FRA1', desiredReplicationCount: 1 },
						{ id: 'NYC1', desiredReplicationCount: 1 }
					]
				}
			};
			form_data.append('pinataOptions', JSON.stringify(pinata_options));

			/* Add metadata if provided */
			if (metadata) {
				const pinata_metadata = {
					name: `${metadata.course_name || 'Certificate'} - ${file.name}`,
					keyvalues: {
						recipient: metadata.recipient_name || '',
						course: metadata.course_name || '',
						issuer: metadata.issuer_name || '',
						upload_timestamp: new Date().toISOString()
					}
				};
				form_data.append('pinataMetadata', JSON.stringify(pinata_metadata));
			}

			/* Execute upload request */
			const response = await axios.post(
				`${PINATA_API_BASE}/pinning/pinFileToIPFS`,
				form_data,
				{
					headers: {
						'Content-Type': 'multipart/form-data',
						'pinata_api_key': this.pinata_api_key,
						'pinata_secret_api_key': this.pinata_secret_key,
					},
					timeout: IPFS_UPLOAD_TIMEOUT,
				}
			);

			const ipfs_hash = response.data.IpfsHash;
			const gateway_url = `${this.gateway_url}${ipfs_hash}`;

			log_info('IPFSService', `File uploaded successfully: ${ipfs_hash}`);

			return {
				success: true,
				cid: ipfs_hash,
				url: gateway_url,
				size: file.size,
				timestamp: Date.now(),
			};

		} catch (error) {
			const handled_error = handle_ipfs_error(error as Error, 'file_upload');
			log_error('IPFSService', `File upload failed: ${handled_error.message}`);
			
			return {
				success: false,
				error: handled_error.message,
				timestamp: Date.now(),
			};
		}
	}

	/**
	 * upload_json - Upload JSON data to IPFS
	 * 
	 * @data: JSON data object to upload
	 * @filename: Optional filename for the JSON data
	 * 
	 * Description: Uploads JSON data (like NFT metadata) to IPFS via Pinata
	 * with proper content type handling and validation.
	 * 
	 * Return: Promise resolving to upload result with CID and URL
	 */
	async upload_json(data: any, filename: string = 'metadata.json'): Promise<IPFSUploadResult> {
		try {
			log_info('IPFSService', `Uploading JSON data: ${filename}`);

			/* Validate JSON data */
			if (!data || typeof data !== 'object') {
				throw new Error('Invalid JSON data provided for upload');
			}

			/* Check API credentials */
			if (!this.pinata_api_key || !this.pinata_secret_key) {
				throw new Error('IPFS service not properly configured - missing API credentials');
			}

			/* Prepare request body */
			const request_body = {
				pinataContent: data,
				pinataOptions: {
					cidVersion: 1,
					customPinPolicy: {
						regions: [
							{ id: 'FRA1', desiredReplicationCount: 1 },
							{ id: 'NYC1', desiredReplicationCount: 1 }
						]
					}
				},
				pinataMetadata: {
					name: filename,
					keyvalues: {
						type: 'json_metadata',
						upload_timestamp: new Date().toISOString()
					}
				}
			};

			/* Execute upload request */
			const response = await axios.post(
				`${PINATA_API_BASE}/pinning/pinJSONToIPFS`,
				request_body,
				{
					headers: {
						'Content-Type': 'application/json',
						'pinata_api_key': this.pinata_api_key,
						'pinata_secret_api_key': this.pinata_secret_key,
					},
					timeout: IPFS_UPLOAD_TIMEOUT,
				}
			);

			const ipfs_hash = response.data.IpfsHash;
			const gateway_url = `${this.gateway_url}${ipfs_hash}`;

			log_info('IPFSService', `JSON uploaded successfully: ${ipfs_hash}`);

			return {
				success: true,
				cid: ipfs_hash,
				url: gateway_url,
				size: JSON.stringify(data).length,
				timestamp: Date.now(),
			};

		} catch (error) {
			const handled_error = handle_ipfs_error(error as Error, 'json_upload');
			log_error('IPFSService', `JSON upload failed: ${handled_error.message}`);
			
			return {
				success: false,
				error: handled_error.message,
				timestamp: Date.now(),
			};
		}
	}

	/**
	 * retrieve_content - Retrieve content from IPFS
	 * 
	 * @cid: IPFS Content Identifier
	 * @response_type: Expected response type ('json', 'blob', 'text')
	 * 
	 * Description: Retrieves content from IPFS using the CID with appropriate
	 * response type handling and error management.
	 * 
	 * Return: Promise resolving to the retrieved content
	 */
	async retrieve_content(
		cid: string, 
		response_type: 'json' | 'blob' | 'text' = 'json'
	): Promise<any> {
		try {
			log_info('IPFSService', `Retrieving content: ${cid}`);

			if (!cid || typeof cid !== 'string') {
				throw new Error('Valid IPFS CID is required');
			}

			const url = `${this.gateway_url}${cid}`;
			const response = await axios.get(url, {
				responseType: response_type === 'blob' ? 'blob' : 'text',
				timeout: 30000, /* 30 seconds for retrieval */
			});

			let content;
			switch (response_type) {
				case 'json':
					content = typeof response.data === 'string' ? 
						JSON.parse(response.data) : response.data;
					break;
				case 'blob':
					content = response.data;
					break;
				case 'text':
				default:
					content = response.data;
					break;
			}

			log_info('IPFSService', `Content retrieved successfully: ${cid}`);
			return content;

		} catch (error) {
			const handled_error = handle_ipfs_error(error as Error, 'content_retrieval');
			log_error('IPFSService', `Content retrieval failed: ${handled_error.message}`);
			throw handled_error;
		}
	}

	/**
	 * pin_by_cid - Pin existing content by CID
	 * 
	 * @cid: IPFS Content Identifier to pin
	 * @name: Optional name for the pinned content
	 * 
	 * Description: Pins existing IPFS content by CID to ensure it remains
	 * available through the Pinata service.
	 * 
	 * Return: Promise resolving to pin operation result
	 */
	async pin_by_cid(cid: string, name?: string): Promise<IPFSUploadResult> {
		try {
			log_info('IPFSService', `Pinning content by CID: ${cid}`);

			if (!cid || typeof cid !== 'string') {
				throw new Error('Valid IPFS CID is required for pinning');
			}

			/* Check API credentials */
			if (!this.pinata_api_key || !this.pinata_secret_key) {
				throw new Error('IPFS service not properly configured - missing API credentials');
			}

			const request_body = {
				hashToPin: cid,
				pinataOptions: {
					cidVersion: 1
				},
				pinataMetadata: {
					name: name || `Pinned content - ${cid}`,
					keyvalues: {
						pin_timestamp: new Date().toISOString()
					}
				}
			};

			const response = await axios.post(
				`${PINATA_API_BASE}/pinning/pinByHash`,
				request_body,
				{
					headers: {
						'Content-Type': 'application/json',
						'pinata_api_key': this.pinata_api_key,
						'pinata_secret_api_key': this.pinata_secret_key,
					},
					timeout: IPFS_UPLOAD_TIMEOUT,
				}
			);

			const gateway_url = `${this.gateway_url}${cid}`;

			log_info('IPFSService', `Content pinned successfully: ${cid}`);

			return {
				success: true,
				cid: cid,
				url: gateway_url,
				timestamp: Date.now(),
			};

		} catch (error) {
			const handled_error = handle_ipfs_error(error as Error, 'pin_by_cid');
			log_error('IPFSService', `Content pinning failed: ${handled_error.message}`);
			
			return {
				success: false,
				error: handled_error.message,
				timestamp: Date.now(),
			};
		}
	}

	/**
	 * get_gateway_url - Get gateway URL for CID
	 * 
	 * @cid: IPFS Content Identifier
	 * 
	 * Description: Generates the full gateway URL for accessing IPFS content
	 * through the configured gateway.
	 * 
	 * Return: Complete gateway URL for the content
	 */
	get_gateway_url(cid: string): string {
		return `${this.gateway_url}${cid}`;
	}

	/**
	 * is_service_configured - Check if service is properly configured
	 * 
	 * Description: Validates that the IPFS service has proper API credentials
	 * and configuration for operation.
	 * 
	 * Return: Boolean indicating if service is ready for use
	 */
	is_service_configured(): boolean {
		return !!(this.pinata_api_key && this.pinata_secret_key && this.gateway_url);
	}
}

/* Create default service instance */
export const ipfs_service = new IPFSService();