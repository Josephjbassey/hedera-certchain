import * as CryptoJS from 'crypto-js';

/**
 * Cryptographic utilities for certificate generation and verification
 */
export class CertificateCrypto {
  /**
   * Generate a unique certificate hash from certificate data
   */
  static generateCertificateHash(certificateData: {
    recipientName: string;
    recipientEmail: string;
    issuerName: string;
    courseName: string;
    completionDate: string;
    timestamp?: string;
  }): string {
    const dataString = [
      certificateData.recipientName,
      certificateData.recipientEmail,
      certificateData.issuerName,
      certificateData.courseName,
      certificateData.completionDate,
      certificateData.timestamp || Date.now().toString(),
    ].join('|');

    return CryptoJS.SHA256(dataString).toString();
  }

  /**
   * Hash email for privacy (one-way hash)
   */
  static hashEmail(email: string): string {
    return CryptoJS.SHA256(email.toLowerCase().trim()).toString();
  }

  /**
   * Generate a secure random ID
   */
  static generateSecureId(): string {
    const randomWords = CryptoJS.lib.WordArray.random(32);
    return CryptoJS.SHA256(randomWords).toString();
  }

  /**
   * Verify certificate hash integrity
   */
  static verifyCertificateHash(
    certificateData: {
      recipientName: string;
      recipientEmail: string;
      issuerName: string;
      courseName: string;
      completionDate: string;
      timestamp?: string;
    },
    expectedHash: string
  ): boolean {
    const calculatedHash = this.generateCertificateHash(certificateData);
    return calculatedHash === expectedHash;
  }

  /**
   * Generate certificate metadata for NFT
   */
  static generateNFTMetadata(certificateData: {
    recipientName: string;
    recipientEmail: string;
    issuerName: string;
    courseName: string;
    completionDate: string;
    certificateImageUrl?: string;
    certificateHash?: string;
  }) {
    const timestamp = new Date().toISOString();
    const hash = certificateData.certificateHash || this.generateCertificateHash({
      ...certificateData,
      timestamp,
    });

    return {
      name: `Certificate: ${certificateData.courseName}`,
      description: `Certificate of completion for ${certificateData.courseName} issued to ${certificateData.recipientName} by ${certificateData.issuerName}`,
      image: certificateData.certificateImageUrl || '',
      attributes: [
        {
          trait_type: 'Recipient',
          value: certificateData.recipientName,
        },
        {
          trait_type: 'Course',
          value: certificateData.courseName,
        },
        {
          trait_type: 'Issuer',
          value: certificateData.issuerName,
        },
        {
          trait_type: 'Completion Date',
          value: certificateData.completionDate,
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
      external_url: `https://hedera-certchain./verify/${hash}`,
      certificate_data: {
        recipientName: certificateData.recipientName,
        recipientEmailHash: this.hashEmail(certificateData.recipientEmail),
        issuerName: certificateData.issuerName,
        courseName: certificateData.courseName,
        completionDate: certificateData.completionDate,
        issueTimestamp: timestamp,
        certificateHash: hash,
      },
    };
  }
}