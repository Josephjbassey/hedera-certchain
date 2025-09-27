/**
 * Enhanced IPFS Storage Service for Hedera CertChain NFTs
 * Handles file uploads, NFT metadata, and certificate images via Pinata
 */

import axios from 'axios';
import { CertificateCrypto } from '@/services/crypto';

export interface IPFSUploadResult {
  success: boolean;
  cid?: string;
  url?: string;
  error?: string;
  size?: number;
  timestamp?: number;
}

interface NFTMetadata {
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

export interface CertificateMetadata {
  issuer: string;
  recipient: string;
  course: string;
  issueDate: string;
  description?: string;
  fileHash: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  timestamp: number;
  network: 'testnet' | 'mainnet';
}

class IPFSService {
  private pinataApiKey: string;
  private pinataSecretKey: string;
  private pinataBaseUrl = 'https://api.pinata.cloud';

  constructor() {
    // Get Pinata credentials from environment
    this.pinataApiKey = import.meta.env.VITE_PINATA_API_KEY || '';
    this.pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY || '';
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('Pinata credentials not found. IPFS uploads will fail.');
    }
  }

  /**
   * Upload certificate file to IPFS
   */
  async uploadFile(file: File, metadata?: Partial<CertificateMetadata>): Promise<IPFSUploadResult> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return {
        success: false,
        error: 'Pinata API credentials not configured'
      };
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add metadata for better organization
      const pinataMetadata = {
        name: file.name,
        keyvalues: {
          type: 'certificate',
          network: metadata?.network || 'testnet',
          timestamp: Date.now().toString(),
          issuer: metadata?.issuer || 'unknown',
          ...(metadata && {
            recipient: metadata.recipient,
            course: metadata.course,
            fileHash: metadata.fileHash
          })
        }
      };

      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      // Configure pinning options
      const pinataOptions = {
        cidVersion: 1,
        wrapWithDirectory: false
      };
      formData.append('pinataOptions', JSON.stringify(pinataOptions));

      const response = await fetch(`${this.pinataBaseUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        cid: result.IpfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
        size: result.PinSize,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('IPFS upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload certificate metadata as JSON to IPFS
   */
  async uploadMetadata(metadata: CertificateMetadata): Promise<IPFSUploadResult> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return {
        success: false,
        error: 'Pinata API credentials not configured'
      };
    }

    try {
      const jsonData = JSON.stringify(metadata, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const file = new File([blob], `certificate-metadata-${Date.now()}.json`, {
        type: 'application/json'
      });

      return await this.uploadFile(file, metadata);
    } catch (error) {
      console.error('Metadata upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Metadata upload failed'
      };
    }
  }

  /**
   * Retrieve file from IPFS
   */
  async getFile(cid: string): Promise<{
    success: boolean;
    data?: ArrayBuffer;
    error?: string;
  }> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const data = await response.arrayBuffer();
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Failed to retrieve file from IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve file'
      };
    }
  }

  /**
   * Get file metadata from IPFS
   */
  async getMetadata(cid: string): Promise<{
    success: boolean;
    metadata?: CertificateMetadata;
    error?: string;
  }> {
    try {
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadata = await response.json();
      
      return {
        success: true,
        metadata
      };
    } catch (error) {
      console.error('Failed to retrieve metadata from IPFS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve metadata'
      };
    }
  }

  /**
   * Pin existing IPFS content
   */
  async pinByCID(cid: string, name?: string): Promise<IPFSUploadResult> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return {
        success: false,
        error: 'Pinata API credentials not configured'
      };
    }

    try {
      const response = await fetch(`${this.pinataBaseUrl}/pinning/pinByHash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
        body: JSON.stringify({
          hashToPin: cid,
          pinataMetadata: {
            name: name || `pinned-${cid}`,
            keyvalues: {
              type: 'certificate',
              timestamp: Date.now().toString()
            }
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata pin failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        cid: result.ipfsHash,
        url: `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}`,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('IPFS pinning failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pinning failed'
      };
    }
  }

  /**
   * Create and upload complete NFT metadata for certificate
   */
  async uploadCertificateNFT(certificateData: {
    file: File;
    recipientName: string;
    recipientEmail: string;
    issuerName: string;
    courseName: string;
    completionDate: string;
    description?: string;
  }): Promise<{
    success: boolean;
    imageHash?: string;
    metadataHash?: string;
    imageUrl?: string;
    metadataUrl?: string;
    error?: string;
  }> {
    try {
      console.log('🎨 Creating NFT certificate...');

      // Step 1: Use original certificate file as NFT image
      console.log('📤 Uploading certificate image...');
      const imageUpload = await this.uploadFile(certificateData.file, {
        issuer: certificateData.issuerName,
        recipient: certificateData.recipientName,
        course: certificateData.courseName,
        issueDate: certificateData.completionDate
      });

      if (!imageUpload.success) {
        throw new Error(imageUpload.error);
      }

      // Step 3: Create NFT metadata
      const baseMetadata = CertificateCrypto.generateNFTMetadata({
        ...certificateData,
        certificateImageUrl: imageUpload.url!
      });

      const metadata: NFTMetadata = {
        ...baseMetadata,
        properties: {
          issuer: certificateData.issuerName,
          course: certificateData.courseName,
          recipient: certificateData.recipientName
        }
      };

      // Step 4: Upload metadata to IPFS
      console.log('📤 Uploading NFT metadata...');
      const metadataUpload = await this.uploadJSON(
        metadata,
        `certificate-metadata-${Date.now()}.json`
      );

      if (!metadataUpload.success) {
        throw new Error(metadataUpload.error);
      }

      console.log('✅ NFT certificate created successfully');

      return {
        success: true,
        imageHash: imageUpload.cid,
        metadataHash: metadataUpload.cid,
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url
      };

    } catch (error: any) {
      console.error('❌ Failed to create NFT certificate:', error);
      return {
        success: false,
        error: error.message || 'Failed to create NFT certificate'
      };
    }
  }

  /**
   * Upload JSON metadata to IPFS
   */
  async uploadJSON(data: any, filename: string = 'metadata.json'): Promise<IPFSUploadResult> {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], filename, { type: 'application/json' });

      return await this.uploadFile(file, {
        issuer: 'system',
        recipient: 'metadata',
        course: 'nft-metadata',
        issueDate: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ JSON upload failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload JSON to IPFS'
      };
    }
  }

  /**
   * Test Pinata connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      return {
        success: false,
        error: 'API credentials not configured'
      };
    }

    try {
      const response = await fetch(`${this.pinataBaseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Authentication failed: ${response.status}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export singleton instance
export const ipfsService = new IPFSService();
export default ipfsService;