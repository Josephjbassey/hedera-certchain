/**
 * IPFS Service for Hedera CertChain
 * 
 * Provides complete IPFS integration via Pinata for certificate storage including:
 * - File upload with SHA-256 hashing
 * - Metadata upload and management
 * - CID retrieval and validation
 * - Progress tracking for uploads
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import CryptoJS from 'crypto-js';

// Types for certificate metadata
export interface CertificateMetadata {
  name: string;
  description: string;
  image?: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  certificate_data: {
    original_file_hash: string;
    issue_timestamp: number;
    expiry_timestamp?: number;
    verification_url: string;
  };
}

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class IPFSService {
  private pinataApiKey: string;
  private pinataSecretApiKey: string;
  private pinataBaseUrl = 'https://api.pinata.cloud';

  constructor() {
    this.pinataApiKey = import.meta.env.VITE_PINATA_API_KEY || '';
    this.pinataSecretApiKey = import.meta.env.VITE_PINATA_SECRET_API_KEY || '';

    if (!this.pinataApiKey || !this.pinataSecretApiKey) {
      console.warn('Pinata API keys not configured. IPFS upload will not work.');
    }
  }

  /**
   * Test connection to Pinata API
   */
  async testAuthentication(): Promise<boolean> {
    try {
      const response = await fetch(`${this.pinataBaseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretApiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Pinata authentication test failed:', error);
      return false;
    }
  }

  /**
   * Generate SHA-256 hash of a file
   */
  async hashFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
          const hash = CryptoJS.SHA256(wordArray);
          resolve(hash.toString(CryptoJS.enc.Hex));
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Upload file to IPFS via Pinata
   */
  async uploadFile(
    file: File,
    options: {
      name?: string;
      keyvalues?: Record<string, string>;
      onProgress?: (progress: UploadProgress) => void;
    } = {}
  ): Promise<PinataUploadResponse> {
    if (!this.pinataApiKey || !this.pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: options.name || file.name,
      keyvalues: options.keyvalues || {},
    });
    formData.append('pinataMetadata', metadata);

    // Add options
    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            options.onProgress!(progress);
          }
        });
      }

      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));

      xhr.open('POST', `${this.pinataBaseUrl}/pinning/pinFileToIPFS`);
      xhr.setRequestHeader('pinata_api_key', this.pinataApiKey);
      xhr.setRequestHeader('pinata_secret_api_key', this.pinataSecretApiKey);
      xhr.send(formData);
    });
  }

  /**
   * Upload JSON metadata to IPFS via Pinata
   */
  async uploadMetadata(
    metadata: CertificateMetadata,
    options: {
      name?: string;
      keyvalues?: Record<string, string>;
    } = {}
  ): Promise<PinataUploadResponse> {
    if (!this.pinataApiKey || !this.pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured');
    }

    const response = await fetch(`${this.pinataBaseUrl}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.pinataApiKey,
        'pinata_secret_api_key': this.pinataSecretApiKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: options.name || 'Certificate Metadata',
          keyvalues: options.keyvalues || {},
        },
        pinataOptions: {
          cidVersion: 0,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Metadata upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create certificate metadata object
   */
  createCertificateMetadata(
    certificateData: {
      recipientName: string;
      courseName: string;
      institutionName: string;
      issuerName: string;
      issueDate: string;
      certificateType: string;
      fileHash: string;
      grade?: string;
      description?: string;
      expiryTimestamp?: number;
      tokenId?: number;
    }
  ): CertificateMetadata {
    const baseUrl = window.location.origin;
    
    return {
      name: `${certificateData.courseName} Certificate`,
      description: certificateData.description || 
        `Certificate of completion for ${certificateData.courseName} issued by ${certificateData.institutionName}`,
      attributes: [
        { trait_type: 'Recipient', value: certificateData.recipientName },
        { trait_type: 'Course', value: certificateData.courseName },
        { trait_type: 'Institution', value: certificateData.institutionName },
        { trait_type: 'Issuer', value: certificateData.issuerName },
        { trait_type: 'Issue Date', value: certificateData.issueDate },
        { trait_type: 'Certificate Type', value: certificateData.certificateType },
        { trait_type: 'File Hash', value: certificateData.fileHash },
        ...(certificateData.grade ? [{ trait_type: 'Grade/Score', value: certificateData.grade }] : []),
      ],
      certificate_data: {
        original_file_hash: certificateData.fileHash,
        issue_timestamp: Math.floor(Date.now() / 1000),
        ...(certificateData.expiryTimestamp && { expiry_timestamp: certificateData.expiryTimestamp }),
        verification_url: certificateData.tokenId 
          ? `${baseUrl}/verify?id=${certificateData.tokenId}`
          : `${baseUrl}/verify`,
      },
    };
  }

  /**
   * Retrieve content from IPFS via CID
   */
  async retrieveContent(cid: string): Promise<any> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve content: ${response.statusText}`);
      }

      // Try to parse as JSON first
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        // If not JSON, return as text
        return text;
      }
    } catch (error) {
      console.error('Failed to retrieve IPFS content:', error);
      throw error;
    }
  }

  /**
   * Get pinned files list from Pinata
   */
  async getPinnedFiles(
    options: {
      status?: 'pinned' | 'unpinned';
      pageLimit?: number;
      pageOffset?: number;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<any> {
    if (!this.pinataApiKey || !this.pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured');
    }

    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.pageLimit) params.append('pageLimit', options.pageLimit.toString());
    if (options.pageOffset) params.append('pageOffset', options.pageOffset.toString());
    
    // Add metadata filters
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        params.append(`metadata[keyvalues][${key}]`, value);
      });
    }

    const url = `${this.pinataBaseUrl}/data/pinList${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'pinata_api_key': this.pinataApiKey,
        'pinata_secret_api_key': this.pinataSecretApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get pinned files: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Unpin content from IPFS
   */
  async unpinContent(cid: string): Promise<boolean> {
    if (!this.pinataApiKey || !this.pinataSecretApiKey) {
      throw new Error('Pinata API keys not configured');
    }

    const response = await fetch(`${this.pinataBaseUrl}/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        'pinata_api_key': this.pinataApiKey,
        'pinata_secret_api_key': this.pinataSecretApiKey,
      },
    });

    return response.ok;
  }

  /**
   * Generate IPFS gateway URL
   */
  getGatewayUrl(cid: string, useGateway: 'pinata' | 'ipfs' = 'pinata'): string {
    switch (useGateway) {
      case 'pinata':
        return `https://gateway.pinata.cloud/ipfs/${cid}`;
      case 'ipfs':
        return `https://ipfs.io/ipfs/${cid}`;
      default:
        return `https://gateway.pinata.cloud/ipfs/${cid}`;
    }
  }

  /**
   * Validate CID format
   */
  isValidCID(cid: string): boolean {
    // Basic CID validation - could be enhanced with more sophisticated checking
    const cidRegex = /^[a-zA-Z0-9]{46,59}$/;
    return cidRegex.test(cid);
  }

  /**
   * Get IPFS service status and configuration info
   */
  getServiceInfo(): {
    isConfigured: boolean;
    hasApiKey: boolean;
    hasSecretKey: boolean;
    baseUrl: string;
  } {
    return {
      isConfigured: !!(this.pinataApiKey && this.pinataSecretApiKey),
      hasApiKey: !!this.pinataApiKey,
      hasSecretKey: !!this.pinataSecretApiKey,
      baseUrl: this.pinataBaseUrl,
    };
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();