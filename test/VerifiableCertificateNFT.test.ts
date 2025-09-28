/**
 * Smart Contract Testing Suite
 * 
 * Comprehensive test coverage for Hedera CertChain functionality including:
 * - Smart contract deployment and initialization
 * - Certificate minting and verification operations
 * - IPFS integration and metadata handling
 * - Component interaction and user flows
 * - Error handling and edge cases
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { beforeEach, describe, it } from 'mocha';

// Test Configuration
const TEST_CONFIG = {
  contractName: 'VerifiableCertificateNFT',
  initialSupply: 0,
  maxSupply: 1000000,
  chainId: 296, // Hedera Testnet
  testTimeout: 30000,
};

// Test Data
const TEST_DATA = {
  certificates: [
    {
      recipient: '0x742d35Cc8B4E8c4c88E7f5F3b306683278C6B465',
      courseName: 'Advanced Blockchain Development',
      institutionName: 'Hedera University',
      issuerName: 'Dr. Jane Smith',
      certificateType: 'Completion',
      ipfsCID: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o',
      hash: '0x' + '1234567890abcdef'.repeat(4),
      expiryTimestamp: Math.floor(Date.now() / 1000) + 31536000, // 1 year
    },
    {
      recipient: '0x8ba1f109551bD432803012645Hac136c22C177ec',
      courseName: 'Smart Contract Security',
      institutionName: 'Hedera Institute',
      issuerName: 'Prof. Bob Johnson',
      certificateType: 'Achievement',
      ipfsCID: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7p',
      hash: '0x' + 'abcdef1234567890'.repeat(4),
      expiryTimestamp: Math.floor(Date.now() / 1000) + 15768000, // 6 months
    },
  ],
};

describe('Hedera CertChain Smart Contract Tests', function () {
  let contract: Contract;
  let admin: Signer;
  let issuer1: Signer;
  let issuer2: Signer;
  let recipient1: Signer;
  let recipient2: Signer;
  let nonIssuer: Signer;

  let adminAddress: string;
  let issuer1Address: string;
  let issuer2Address: string;
  let recipient1Address: string;
  let recipient2Address: string;
  let nonIssuerAddress: string;

  beforeEach(async function () {
    this.timeout(TEST_CONFIG.testTimeout);

    // Get test accounts
    const signers = await ethers.getSigners();
    [admin, issuer1, issuer2, recipient1, recipient2, nonIssuer] = signers;

    // Get addresses
    adminAddress = await admin.getAddress();
    issuer1Address = await issuer1.getAddress();
    issuer2Address = await issuer2.getAddress();
    recipient1Address = await recipient1.getAddress();
    recipient2Address = await recipient2.getAddress();
    nonIssuerAddress = await nonIssuer.getAddress();

    // Deploy contract
    console.log('📋 Deploying VerifiableCertificateNFT contract...');
    const ContractFactory = await ethers.getContractFactory(TEST_CONFIG.contractName);
    contract = await ContractFactory.deploy('Hedera CertChain', 'CERT', adminAddress);
    await contract.deployed();

    console.log('✅ Contract deployed at:', contract.address);
    console.log('👑 Admin address:', adminAddress);
    console.log('🏢 Issuer1 address:', issuer1Address);
    console.log('🏢 Issuer2 address:', issuer2Address);
  });

  describe('Contract Deployment and Initialization', function () {
    it('Should deploy with correct name and symbol', async function () {
      expect(await contract.name()).to.equal('Hedera CertChain');
      expect(await contract.symbol()).to.equal('CERT');
    });

    it('Should set admin role correctly', async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      expect(await contract.hasRole(ADMIN_ROLE, adminAddress)).to.be.true;
    });

    it('Should start with zero total supply', async function () {
      expect(await contract.totalSupply()).to.equal(0);
    });

    it('Should not have any issuers initially', async function () {
      const ISSUER_ROLE = await contract.ISSUER_ROLE();
      expect(await contract.hasRole(ISSUER_ROLE, issuer1Address)).to.be.false;
    });
  });

  describe('Issuer Management', function () {
    it('Should allow admin to add issuers', async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
      
      const ISSUER_ROLE = await contract.ISSUER_ROLE();
      expect(await contract.hasRole(ISSUER_ROLE, issuer1Address)).to.be.true;

      // Check institution details
      const institution = await contract.getInstitution(issuer1Address);
      expect(institution.name).to.equal('Hedera University');
      expect(institution.admin).to.equal(adminAddress);
      expect(institution.isActive).to.be.true;
      expect(institution.certificatesIssued).to.equal(0);
    });

    it('Should emit IssuerAdded event', async function () {
      await expect(contract.connect(admin).addIssuer(issuer1Address, 'Test Institution'))
        .to.emit(contract, 'IssuerAdded')
        .withArgs(issuer1Address, 'Test Institution', adminAddress);
    });

    it('Should not allow non-admin to add issuers', async function () {
      await expect(
        contract.connect(issuer1).addIssuer(issuer2Address, 'Unauthorized Institution')
      ).to.be.revertedWith('AccessControl');
    });

    it('Should allow admin to remove issuers', async function () {
      // Add issuer first
      await contract.connect(admin).addIssuer(issuer1Address, 'Test Institution');
      
      // Remove issuer
      await contract.connect(admin).removeIssuer(issuer1Address);
      
      const ISSUER_ROLE = await contract.ISSUER_ROLE();
      expect(await contract.hasRole(ISSUER_ROLE, issuer1Address)).to.be.false;
    });

    it('Should not allow duplicate issuers', async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'First Institution');
      
      await expect(
        contract.connect(admin).addIssuer(issuer1Address, 'Second Institution')
      ).to.be.revertedWith('Issuer already exists');
    });
  });

  describe('Certificate Minting', function () {
    beforeEach(async function () {
      // Add issuer1 before each test
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
    });

    it('Should allow issuer to mint certificate', async function () {
      const testData = TEST_DATA.certificates[0];
      
      const tx = await contract.connect(issuer1).mintCertificate(
        testData.recipient,
        testData.ipfsCID,
        testData.hash,
        testData.expiryTimestamp
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'CertificateMinted');
      
      expect(event).to.not.be.undefined;
      expect(event?.args?.recipient).to.equal(testData.recipient);
      expect(event?.args?.issuer).to.equal(issuer1Address);
      expect(event?.args?.certificateHash).to.equal(testData.hash);
      expect(event?.args?.ipfsCID).to.equal(testData.ipfsCID);

      // Check total supply increased
      expect(await contract.totalSupply()).to.equal(1);

      // Check token ownership
      const tokenId = event?.args?.tokenId;
      expect(await contract.ownerOf(tokenId)).to.equal(testData.recipient);
    });

    it('Should not allow non-issuer to mint certificate', async function () {
      const testData = TEST_DATA.certificates[0];
      
      await expect(
        contract.connect(nonIssuer).mintCertificate(
          testData.recipient,
          testData.ipfsCID,
          testData.hash,
          testData.expiryTimestamp
        )
      ).to.be.revertedWith('Not authorized issuer');
    });

    it('Should not allow minting with duplicate hash', async function () {
      const testData = TEST_DATA.certificates[0];
      
      // Mint first certificate
      await contract.connect(issuer1).mintCertificate(
        testData.recipient,
        testData.ipfsCID,
        testData.hash,
        testData.expiryTimestamp
      );

      // Try to mint with same hash
      await expect(
        contract.connect(issuer1).mintCertificate(
          recipient2Address,
          'QmDifferentCID',
          testData.hash, // Same hash
          testData.expiryTimestamp
        )
      ).to.be.revertedWith('Certificate hash already exists');
    });

    it('Should create soulbound tokens (non-transferable)', async function () {
      const testData = TEST_DATA.certificates[0];
      
      const tx = await contract.connect(issuer1).mintCertificate(
        recipient1Address,
        testData.ipfsCID,
        testData.hash,
        testData.expiryTimestamp
      );

      const receipt = await tx.wait();
      const tokenId = receipt.events?.find(e => e.event === 'CertificateMinted')?.args?.tokenId;

      // Try to transfer (should fail for soulbound tokens)
      await expect(
        contract.connect(recipient1).transferFrom(recipient1Address, recipient2Address, tokenId)
      ).to.be.revertedWith('Soulbound token cannot be transferred');
    });
  });

  describe('Batch Minting', function () {
    beforeEach(async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
    });

    it('Should allow batch minting multiple certificates', async function () {
      const recipients = [recipient1Address, recipient2Address];
      const ipfsCIDs = ['QmCID1', 'QmCID2'];
      const hashes = [
        '0x' + '1111111111111111'.repeat(4),
        '0x' + '2222222222222222'.repeat(4)
      ];
      const expiryTimestamps = [
        Math.floor(Date.now() / 1000) + 31536000,
        Math.floor(Date.now() / 1000) + 31536000
      ];

      const tx = await contract.connect(issuer1).batchMintCertificates(
        recipients,
        ipfsCIDs,
        hashes,
        expiryTimestamps
      );

      const receipt = await tx.wait();
      const batchEvent = receipt.events?.find(e => e.event === 'BatchMintCompleted');
      
      expect(batchEvent).to.not.be.undefined;
      expect(batchEvent?.args?.issuer).to.equal(issuer1Address);
      expect(batchEvent?.args?.count).to.equal(2);

      // Check total supply
      expect(await contract.totalSupply()).to.equal(2);

      // Check individual ownership
      const tokenIds = batchEvent?.args?.tokenIds;
      expect(await contract.ownerOf(tokenIds[0])).to.equal(recipient1Address);
      expect(await contract.ownerOf(tokenIds[1])).to.equal(recipient2Address);
    });

    it('Should fail if array lengths dont match', async function () {
      const recipients = [recipient1Address, recipient2Address];
      const ipfsCIDs = ['QmCID1']; // Different length
      const hashes = ['0x' + '1111111111111111'.repeat(4), '0x' + '2222222222222222'.repeat(4)];
      const expiryTimestamps = [0, 0];

      await expect(
        contract.connect(issuer1).batchMintCertificates(
          recipients,
          ipfsCIDs,
          hashes,
          expiryTimestamps
        )
      ).to.be.revertedWith('Array lengths must match');
    });
  });

  describe('Certificate Verification', function () {
    let tokenId: number;
    const testData = TEST_DATA.certificates[0];

    beforeEach(async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
      
      const tx = await contract.connect(issuer1).mintCertificate(
        testData.recipient,
        testData.ipfsCID,
        testData.hash,
        testData.expiryTimestamp
      );

      const receipt = await tx.wait();
      tokenId = receipt.events?.find(e => e.event === 'CertificateMinted')?.args?.tokenId;
    });

    it('Should verify valid certificate correctly', async function () {
      const verification = await contract.verifyCertificate(tokenId);
      
      expect(verification.isValid).to.be.true;
      expect(verification.issuer).to.equal(issuer1Address);
      expect(verification.ipfsCID).to.equal(testData.ipfsCID);
      expect(verification.isRevoked).to.be.false;
      expect(verification.isExpired).to.be.false;
    });

    it('Should find certificate by hash', async function () {
      const hashBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(testData.hash));
      const result = await contract.getCertificateByHash(hashBytes);
      
      expect(result.exists).to.be.true;
      expect(result.tokenId).to.equal(tokenId);
    });

    it('Should return false for non-existent certificate', async function () {
      const nonExistentTokenId = 99999;
      
      await expect(contract.verifyCertificate(nonExistentTokenId))
        .to.be.revertedWith('Certificate does not exist');
    });

    it('Should detect expired certificates', async function () {
      // Mint certificate with past expiry
      const pastTimestamp = Math.floor(Date.now() / 1000) - 86400; // Yesterday
      
      const tx = await contract.connect(issuer1).mintCertificate(
        recipient2Address,
        'QmExpiredCID',
        '0x' + 'expired123456789'.repeat(3) + '12',
        pastTimestamp
      );

      const receipt = await tx.wait();
      const expiredTokenId = receipt.events?.find(e => e.event === 'CertificateMinted')?.args?.tokenId;

      const verification = await contract.verifyCertificate(expiredTokenId);
      
      expect(verification.isExpired).to.be.true;
      expect(verification.isValid).to.be.false;
    });
  });

  describe('Certificate Revocation', function () {
    let tokenId: number;
    const testData = TEST_DATA.certificates[0];

    beforeEach(async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
      
      const tx = await contract.connect(issuer1).mintCertificate(
        testData.recipient,
        testData.ipfsCID,
        testData.hash,
        testData.expiryTimestamp
      );

      const receipt = await tx.wait();
      tokenId = receipt.events?.find(e => e.event === 'CertificateMinted')?.args?.tokenId;
    });

    it('Should allow issuer to revoke certificate', async function () {
      await expect(contract.connect(issuer1).revokeCertificate(tokenId))
        .to.emit(contract, 'CertificateRevoked')
        .withArgs(tokenId, issuer1Address);

      const verification = await contract.verifyCertificate(tokenId);
      expect(verification.isRevoked).to.be.true;
      expect(verification.isValid).to.be.false;
    });

    it('Should not allow non-issuer to revoke certificate', async function () {
      await expect(
        contract.connect(nonIssuer).revokeCertificate(tokenId)
      ).to.be.revertedWith('Not authorized to revoke');
    });

    it('Should not allow revoking already revoked certificate', async function () {
      await contract.connect(issuer1).revokeCertificate(tokenId);
      
      await expect(
        contract.connect(issuer1).revokeCertificate(tokenId)
      ).to.be.revertedWith('Certificate already revoked');
    });
  });

  describe('Certificate Queries', function () {
    beforeEach(async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
      await contract.connect(admin).addIssuer(issuer2Address, 'Hedera Institute');
    });

    it('Should return certificates by owner', async function () {
      // Mint certificates to recipient1
      await contract.connect(issuer1).mintCertificate(
        recipient1Address,
        'QmCID1',
        '0x' + '1111111111111111'.repeat(4),
        0
      );

      await contract.connect(issuer2).mintCertificate(
        recipient1Address,
        'QmCID2',
        '0x' + '2222222222222222'.repeat(4),
        0
      );

      // Mint certificate to recipient2
      await contract.connect(issuer1).mintCertificate(
        recipient2Address,
        'QmCID3',
        '0x' + '3333333333333333'.repeat(4),
        0
      );

      const recipient1Certs = await contract.getCertificatesByOwner(recipient1Address);
      const recipient2Certs = await contract.getCertificatesByOwner(recipient2Address);

      expect(recipient1Certs.length).to.equal(2);
      expect(recipient2Certs.length).to.equal(1);
    });

    it('Should return certificates by issuer', async function () {
      // Issuer1 mints 2 certificates
      await contract.connect(issuer1).mintCertificate(
        recipient1Address,
        'QmCID1',
        '0x' + '1111111111111111'.repeat(4),
        0
      );

      await contract.connect(issuer1).mintCertificate(
        recipient2Address,
        'QmCID2',
        '0x' + '2222222222222222'.repeat(4),
        0
      );

      // Issuer2 mints 1 certificate
      await contract.connect(issuer2).mintCertificate(
        recipient1Address,
        'QmCID3',
        '0x' + '3333333333333333'.repeat(4),
        0
      );

      const issuer1Certs = await contract.getCertificatesByIssuer(issuer1Address);
      const issuer2Certs = await contract.getCertificatesByIssuer(issuer2Address);

      expect(issuer1Certs.length).to.equal(2);
      expect(issuer2Certs.length).to.equal(1);
    });

    it('Should update institution certificate count', async function () {
      await contract.connect(issuer1).mintCertificate(
        recipient1Address,
        'QmCID1',
        '0x' + '1111111111111111'.repeat(4),
        0
      );

      const institution = await contract.getInstitution(issuer1Address);
      expect(institution.certificatesIssued).to.equal(1);
    });
  });

  describe('Gas Usage and Performance', function () {
    beforeEach(async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
    });

    it('Should mint certificate within gas limits', async function () {
      const testData = TEST_DATA.certificates[0];
      
      const tx = await contract.connect(issuer1).mintCertificate(
        testData.recipient,
        testData.ipfsCID,
        testData.hash,
        testData.expiryTimestamp
      );

      const receipt = await tx.wait();
      console.log('⛽ Single mint gas used:', receipt.gasUsed.toString());
      
      // Hedera has low gas costs, but let's ensure reasonable limits
      expect(receipt.gasUsed.toNumber()).to.be.lessThan(500000);
    });

    it('Should batch mint efficiently', async function () {
      const batchSize = 10;
      const recipients = Array(batchSize).fill(0).map((_, i) => 
        ethers.utils.getAddress(`0x${'0'.repeat(39)}${(i + 1).toString()}`)
      );
      const ipfsCIDs = Array(batchSize).fill(0).map((_, i) => `QmCID${i}`);
      const hashes = Array(batchSize).fill(0).map((_, i) => 
        '0x' + (i.toString().repeat(16).slice(0, 64))
      );
      const expiryTimestamps = Array(batchSize).fill(0);

      const tx = await contract.connect(issuer1).batchMintCertificates(
        recipients,
        ipfsCIDs,
        hashes,
        expiryTimestamps
      );

      const receipt = await tx.wait();
      console.log(`⛽ Batch mint (${batchSize}) gas used:`, receipt.gasUsed.toString());
      console.log(`⛽ Average gas per certificate:`, receipt.gasUsed.div(batchSize).toString());
      
      // Batch should be more efficient than individual mints
      const avgGasPerCert = receipt.gasUsed.div(batchSize).toNumber();
      expect(avgGasPerCert).to.be.lessThan(150000);
    });
  });

  describe('Edge Cases and Error Handling', function () {
    beforeEach(async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
    });

    it('Should handle zero expiry timestamp', async function () {
      const tx = await contract.connect(issuer1).mintCertificate(
        recipient1Address,
        'QmCID',
        '0x' + '1234567890abcdef'.repeat(4),
        0 // No expiry
      );

      const receipt = await tx.wait();
      const tokenId = receipt.events?.find(e => e.event === 'CertificateMinted')?.args?.tokenId;

      const verification = await contract.verifyCertificate(tokenId);
      expect(verification.isExpired).to.be.false;
    });

    it('Should handle empty IPFS CID', async function () {
      await expect(
        contract.connect(issuer1).mintCertificate(
          recipient1Address,
          '', // Empty CID
          '0x' + '1234567890abcdef'.repeat(4),
          0
        )
      ).to.be.revertedWith('IPFS CID cannot be empty');
    });

    it('Should handle zero address recipient', async function () {
      await expect(
        contract.connect(issuer1).mintCertificate(
          ethers.constants.AddressZero,
          'QmCID',
          '0x' + '1234567890abcdef'.repeat(4),
          0
        )
      ).to.be.revertedWith('Invalid recipient address');
    });

    it('Should handle empty certificate hash', async function () {
      await expect(
        contract.connect(issuer1).mintCertificate(
          recipient1Address,
          'QmCID',
          '0x' + '0'.repeat(64), // Empty hash
          0
        )
      ).to.be.revertedWith('Certificate hash cannot be empty');
    });
  });

  describe('Integration Scenarios', function () {
    beforeEach(async function () {
      await contract.connect(admin).addIssuer(issuer1Address, 'Hedera University');
      await contract.connect(admin).addIssuer(issuer2Address, 'Hedera Institute');
    });

    it('Should handle complete certificate lifecycle', async function () {
      const testData = TEST_DATA.certificates[0];
      
      // 1. Mint certificate
      const mintTx = await contract.connect(issuer1).mintCertificate(
        recipient1Address,
        testData.ipfsCID,
        testData.hash,
        testData.expiryTimestamp
      );

      const mintReceipt = await mintTx.wait();
      const tokenId = mintReceipt.events?.find(e => e.event === 'CertificateMinted')?.args?.tokenId;

      // 2. Verify certificate
      let verification = await contract.verifyCertificate(tokenId);
      expect(verification.isValid).to.be.true;

      // 3. Query by owner and issuer
      const ownerCerts = await contract.getCertificatesByOwner(recipient1Address);
      const issuerCerts = await contract.getCertificatesByIssuer(issuer1Address);
      
      expect(ownerCerts).to.include(tokenId);
      expect(issuerCerts).to.include(tokenId);

      // 4. Revoke certificate
      await contract.connect(issuer1).revokeCertificate(tokenId);
      
      verification = await contract.verifyCertificate(tokenId);
      expect(verification.isRevoked).to.be.true;
      expect(verification.isValid).to.be.false;

      // 5. Certificate should still be in queries but marked revoked
      const ownerCertsAfterRevoke = await contract.getCertificatesByOwner(recipient1Address);
      expect(ownerCertsAfterRevoke).to.include(tokenId);
    });

    it('Should handle multiple institutions scenario', async function () {
      // Institution 1 issues certificates
      await contract.connect(issuer1).mintCertificate(
        recipient1Address,
        'QmUni1Cert1',
        '0x' + '1111111111111111'.repeat(4),
        0
      );

      await contract.connect(issuer1).mintCertificate(
        recipient2Address,
        'QmUni1Cert2',
        '0x' + '2222222222222222'.repeat(4),
        0
      );

      // Institution 2 issues certificates
      await contract.connect(issuer2).mintCertificate(
        recipient1Address,
        'QmInst2Cert1',
        '0x' + '3333333333333333'.repeat(4),
        0
      );

      // Check institution stats
      const inst1 = await contract.getInstitution(issuer1Address);
      const inst2 = await contract.getInstitution(issuer2Address);

      expect(inst1.certificatesIssued).to.equal(2);
      expect(inst2.certificatesIssued).to.equal(1);

      // Check recipient has certificates from both institutions
      const recipient1Certs = await contract.getCertificatesByOwner(recipient1Address);
      expect(recipient1Certs.length).to.equal(2);
    });
  });
});

// Additional utility functions for testing
export class TestHelpers {
  static generateRandomAddress(): string {
    return ethers.utils.getAddress(ethers.utils.hexlify(ethers.utils.randomBytes(20)));
  }

  static generateRandomHash(): string {
    return ethers.utils.hexlify(ethers.utils.randomBytes(32));
  }

  static generateTestCertificate(overrides: Partial<typeof TEST_DATA.certificates[0]> = {}) {
    return {
      ...TEST_DATA.certificates[0],
      recipient: TestHelpers.generateRandomAddress(),
      hash: TestHelpers.generateRandomHash(),
      ipfsCID: `QmTest${Math.random().toString(36).slice(2)}`,
      ...overrides,
    };
  }

  static async deployTestContract(): Promise<Contract> {
    const [admin] = await ethers.getSigners();
    const adminAddress = await admin.getAddress();
    
    const ContractFactory = await ethers.getContractFactory('VerifiableCertificateNFT');
    const contract = await ContractFactory.deploy('Test CertChain', 'TEST', adminAddress);
    await contract.deployed();
    
    return contract;
  }
}

console.log('✅ Smart Contract Test Suite loaded successfully');
console.log('📋 Test configuration:', TEST_CONFIG);
console.log('🧪 Test data prepared for', TEST_DATA.certificates.length, 'certificates');