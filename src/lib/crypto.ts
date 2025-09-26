import CryptoJS from 'crypto-js';

/**
 * Enhanced cryptographic utilities for NFT certificate security
 * Includes specialized functions for blockchain operations
 */

export class CertificateCrypto {
  /**
   * Generate SHA-256 hash of certificate file
   */
  static async generateFileHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const wordArray = CryptoJS.lib.WordArray.create(reader.result as ArrayBuffer);
          const hash = CryptoJS.SHA256(wordArray);
          resolve('0x' + hash.toString(CryptoJS.enc.Hex)); // Add 0x prefix for blockchain
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Generate deterministic hash for certificate metadata
   */
  static generateMetadataHash(metadata: {
    issuer: string;
    recipient: string;
    course: string;
    issueDate: string;
  }): string {
    const dataString = JSON.stringify({
      issuer: metadata.issuer.toLowerCase().trim(),
      recipient: metadata.recipient.toLowerCase().trim(),
      course: metadata.course.toLowerCase().trim(),
      issueDate: metadata.issueDate
    });
    return '0x' + CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex);
  }

  /**
   * Create certificate fingerprint combining file and metadata
   */
  static async generateCertificateFingerprint(
    file: File, 
    metadata: any
  ): Promise<string> {
    const fileHash = await this.generateFileHash(file);
    const metadataHash = this.generateMetadataHash(metadata);
    
    const combinedHash = CryptoJS.SHA256(fileHash + metadataHash);
    return '0x' + combinedHash.toString(CryptoJS.enc.Hex);
  }

  /**
   * Generate secure verification token for NFTs
   */
  static generateNFTVerificationToken(tokenId: number, contractAddress: string): string {
    const timestamp = Date.now();
    const randomBytes = CryptoJS.lib.WordArray.random(16);
    const tokenData = `${contractAddress}:${tokenId}:${timestamp}:${randomBytes.toString()}`;
    return '0x' + CryptoJS.SHA256(tokenData).toString(CryptoJS.enc.Hex).substring(0, 32);
  }

  /**
   * Hash email for privacy (used in smart contract)
   */
  static hashEmail(email: string): string {
    const normalizedEmail = email.toLowerCase().trim();
    return '0x' + CryptoJS.SHA256(normalizedEmail).toString(CryptoJS.enc.Hex);
  }

  /**
   * Generate IPFS metadata for NFT
   */
  static generateNFTMetadata(certificateData: {
    recipientName: string;
    recipientEmail: string;
    issuerName: string;
    courseName: string;
    completionDate: string;
    description?: string;
    certificateImageUrl?: string;
  }): any {
    const timestamp = Date.now();
    
    return {
      name: `${certificateData.courseName} Certificate - ${certificateData.recipientName}`,
      description: certificateData.description || `Certificate of completion for ${certificateData.courseName} issued by ${certificateData.issuerName}`,
      image: certificateData.certificateImageUrl || '',
      attributes: [
        {
          trait_type: 'Recipient',
          value: certificateData.recipientName
        },
        {
          trait_type: 'Issuer',
          value: certificateData.issuerName
        },
        {
          trait_type: 'Course',
          value: certificateData.courseName
        },
        {
          trait_type: 'Completion Date',
          value: certificateData.completionDate,
          display_type: 'date'
        },
        {
          trait_type: 'Issue Timestamp',
          value: timestamp,
          display_type: 'date'
        },
        {
          trait_type: 'Certificate Type',
          value: 'Educational Certificate'
        },
        {
          trait_type: 'Blockchain',
          value: 'Hedera Hashgraph'
        }
      ],
      properties: {
        category: 'education',
        type: 'certificate',
        issuer: certificateData.issuerName,
        recipient: certificateData.recipientName,
        course: certificateData.courseName,
        completionDate: certificateData.completionDate,
        recipientEmailHash: this.hashEmail(certificateData.recipientEmail),
        issueTimestamp: timestamp,
        version: '1.0'
      },
      external_url: `${window.location.origin}/verify`,
      animation_url: certificateData.certificateImageUrl
    };
  }

  /**
   * Validate certificate integrity using multiple hashes
   */
  static async validateCertificateIntegrity(
    file: File,
    expectedHash: string,
    metadata: any
  ): Promise<{
    isValid: boolean;
    fileHash: string;
    metadataHash: string;
    fingerprint: string;
  }> {
    const fileHash = await this.generateFileHash(file);
    const metadataHash = this.generateMetadataHash(metadata);
    const fingerprint = await this.generateCertificateFingerprint(file, metadata);
    
    // Remove 0x prefix for comparison if present
    const normalizeHash = (hash: string) => hash.replace(/^0x/, '');
    
    return {
      isValid: normalizeHash(fileHash) === normalizeHash(expectedHash),
      fileHash,
      metadataHash,
      fingerprint
    };
  }

  /**
   * Generate QR code data for NFT certificate
   */
  static generateNFTQRData(tokenId: number, contractAddress: string, network: string = 'testnet'): string {
    const timestamp = Date.now();
    const verificationUrl = `${window.location.origin}/verify?type=nft&tokenId=${tokenId}&contract=${contractAddress}&network=${network}`;
    const checksum = CryptoJS.SHA256(`${tokenId}:${contractAddress}:${timestamp}`).toString().substring(0, 8);
    
    return JSON.stringify({
      type: 'nft_certificate',
      tokenId,
      contract: contractAddress,
      network,
      url: verificationUrl,
      ts: timestamp,
      cs: checksum
    });
  }

  /**
   * Validate NFT QR code data
   */
  static validateNFTQRData(qrData: string): {
    isValid: boolean;
    tokenId?: number;
    contractAddress?: string;
    network?: string;
    url?: string;
    timestamp?: number;
  } {
    try {
      const data = JSON.parse(qrData);
      
      if (data.type !== 'nft_certificate') {
        return { isValid: false };
      }
      
      const expectedChecksum = CryptoJS.SHA256(`${data.tokenId}:${data.contract}:${data.ts}`).toString().substring(0, 8);
      
      return {
        isValid: data.cs === expectedChecksum,
        tokenId: data.tokenId,
        contractAddress: data.contract,
        network: data.network,
        url: data.url,
        timestamp: data.ts
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Generate smart contract interaction signature
   */
  static generateContractSignature(
    functionName: string,
    parameters: any[],
    userAddress: string,
    timestamp: number
  ): string {
    const message = JSON.stringify({
      function: functionName,
      params: parameters,
      user: userAddress.toLowerCase(),
      timestamp
    });
    
    return '0x' + CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
  }

  /**
   * Encrypt sensitive certificate data
   */
  static encryptCertificateData(data: string, password: string): string {
    return CryptoJS.AES.encrypt(data, password).toString();
  }

  /**
   * Decrypt sensitive certificate data
   */
  static decryptCertificateData(encryptedData: string, password: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Generate secure random seed for certificate
   */
  static generateSecureRandom(): string {
    const randomBytes = CryptoJS.lib.WordArray.random(32);
    return '0x' + randomBytes.toString(CryptoJS.enc.Hex);
  }

  /**
   * Create merkle tree leaf for batch operations
   */
  static createMerkleLeaf(certificateData: {
    recipient: string;
    courseHash: string;
    timestamp: number;
  }): string {
    const leafData = JSON.stringify({
      recipient: certificateData.recipient.toLowerCase(),
      course: certificateData.courseHash,
      timestamp: certificateData.timestamp
    });
    
    return '0x' + CryptoJS.SHA256(leafData).toString(CryptoJS.enc.Hex);
  }

  /**
   * Verify certificate authenticity using blockchain data
   */
  static verifyBlockchainCertificate(
    onChainHash: string,
    localHash: string,
    tokenId: number,
    contractAddress: string
  ): {
    isAuthentic: boolean;
    confidence: number;
    details: string;
  } {
    const normalizeHash = (hash: string) => hash.replace(/^0x/, '').toLowerCase();
    
    const onChainNormalized = normalizeHash(onChainHash);
    const localNormalized = normalizeHash(localHash);
    
    const isMatch = onChainNormalized === localNormalized;
    
    let confidence = 0;
    let details = '';
    
    if (isMatch) {
      confidence = 100;
      details = 'Certificate hash matches blockchain record perfectly';
    } else {
      // Check partial match for debugging
      const matchedChars = onChainNormalized
        .split('')
        .filter((char, index) => char === localNormalized[index])
        .length;
      
      confidence = (matchedChars / onChainNormalized.length) * 100;
      details = `Hash mismatch detected. ${matchedChars}/${onChainNormalized.length} characters match`;
    }
    
    return {
      isAuthentic: isMatch,
      confidence,
      details
    };
  }
}

/**
 * Enhanced file processing for NFTs
 */
export class NFTFileProcessor {
  /**
   * Convert file to base64 with compression
   */
  static async fileToBase64(file: File, maxSize: number = 5 * 1024 * 1024): Promise<string> {
    if (file.size > maxSize) {
      const compressedFile = await this.compressFile(file, 0.7);
      file = compressedFile;
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Compress image files for NFT storage
   */
  static async compressFile(file: File, quality: number = 0.8): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file; // Only compress images
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate optimal dimensions for NFTs (recommended 1:1 ratio, max 1000px)
        const maxDimension = 1000;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Generate NFT-optimized certificate image
   */
  static async generateNFTCertificateImage(
    certificateFile: File,
    metadata: {
      recipientName: string;
      courseName: string;
      issuerName: string;
      completionDate: string;
    }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set NFT standard dimensions (1:1 ratio)
      canvas.width = 1000;
      canvas.height = 1000;
      
      const img = new Image();
      img.onload = () => {
        try {
          // Create gradient background
          const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
          gradient.addColorStop(0, '#1e3a8a'); // Blue
          gradient.addColorStop(1, '#059669'); // Green (Hedera colors)
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 1000, 1000);
          
          // Draw certificate image (centered)
          const aspectRatio = img.width / img.height;
          let drawWidth, drawHeight, drawX, drawY;
          
          if (aspectRatio > 1) {
            drawWidth = 800;
            drawHeight = 800 / aspectRatio;
          } else {
            drawHeight = 600;
            drawWidth = 600 * aspectRatio;
          }
          
          drawX = (1000 - drawWidth) / 2;
          drawY = 100;
          
          // Add border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.strokeRect(drawX - 10, drawY - 10, drawWidth + 20, drawHeight + 20);
          
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          
          // Add NFT certificate text overlay
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('BLOCKCHAIN CERTIFICATE', 500, 50);
          
          // Add metadata text
          ctx.font = '24px Arial';
          const textY = drawY + drawHeight + 60;
          ctx.fillText(metadata.recipientName, 500, textY);
          ctx.fillText(metadata.courseName, 500, textY + 40);
          ctx.fillText(`Issued by ${metadata.issuerName}`, 500, textY + 80);
          ctx.fillText(metadata.completionDate, 500, textY + 120);
          
          // Add Hedera logo/text
          ctx.font = '18px Arial';
          ctx.fillText('Secured on Hedera Hashgraph', 500, 980);
          
          // Convert to file
          canvas.toBlob((blob) => {
            if (blob) {
              const nftFile = new File([blob], `nft-${certificateFile.name}`, {
                type: 'image/png',
                lastModified: Date.now()
              });
              resolve(nftFile);
            } else {
              reject(new Error('Failed to generate NFT image'));
            }
          }, 'image/png', 0.9);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(certificateFile);
    });
  }

  /**
   * Validate file for NFT requirements
   */
  static validateNFTFile(file: File): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not supported for NFTs. Use JPEG, PNG, WebP, or PDF.');
    }
    
    // Check file size (max 10MB for NFTs)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      warnings.push('File size is large. Consider compressing for better performance.');
    }
    
    // Check minimum dimensions for images
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        if (img.width < 300 || img.height < 300) {
          warnings.push('Image resolution is low. NFTs work best with high-quality images.');
        }
      };
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default CertificateCrypto;