import { ethers } from 'ethers';
import { CertificateCrypto } from './crypto';

// Hedera EVM Network Configuration
const HEDERA_NETWORKS = {
  testnet: {
    chainId: '0x128', // 296 in hex
    chainName: 'Hedera Testnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: ['https://testnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/testnet'],
  },
  mainnet: {
    chainId: '0x127', // 295 in hex
    chainName: 'Hedera Mainnet',
    nativeCurrency: {
      name: 'HBAR',
      symbol: 'HBAR',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.hashio.io/api'],
    blockExplorerUrls: ['https://hashscan.io/mainnet'],
  },
};

// Contract ABI (Generated from Solidity contract)
const CERTIFICATE_NFT_ABI = [
  "function issueCertificate(address recipient, string recipientName, string recipientEmailHash, string issuerName, string courseName, string completionDate, string ipfsHash, string certificateHash) returns (uint256)",
  "function verifyCertificate(uint256 tokenId) view returns (tuple(string recipientName, string recipientEmail, string issuerName, string courseName, string completionDate, string ipfsHash, uint256 issueTimestamp, bool isActive, string certificateHash), address, bool)",
  "function verifyCertificateByHash(string certificateHash) view returns (tuple(string recipientName, string recipientEmail, string issuerName, string courseName, string completionDate, string ipfsHash, uint256 issueTimestamp, bool isActive, string certificateHash), address, bool, uint256)",
  "function getCertificatesByOwner(address owner) view returns (uint256[])",
  "function getCertificatesByRecipient(address recipient) view returns (uint256[])",
  "function revokeCertificate(uint256 tokenId, string reason)",
  "function authorizeIssuer(address issuer)",
  "function revokeIssuer(address issuer)",
  "function isAuthorizedIssuer(address issuer) view returns (bool)",
  "function getTotalCertificates() view returns (uint256)",
  "function batchIssueCertificates(address[] recipients, string[][] certificateData, string[] ipfsHashes, string[] certificateHashes) returns (uint256[])",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, address indexed issuer, string courseName, string ipfsHash)",
  "event CertificateRevoked(uint256 indexed tokenId, string reason)"
];

interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  issuerName: string;
  courseName: string;
  completionDate: string;
  ipfsHash: string;
  issueTimestamp: number;
  isActive: boolean;
  certificateHash: string;
}

interface VerificationResult {
  certificate: CertificateData;
  owner: string;
  isValid: boolean;
  tokenId?: number;
}

export class HederaContractService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string;
  private network: 'testnet' | 'mainnet';

  constructor(contractAddress: string, network: 'testnet' | 'mainnet' = 'testnet') {
    this.contractAddress = contractAddress;
    this.network = network;
  }

  /**
   * Connect wallet and return connection info
   */
  async connectWallet(): Promise<{ address: string; network: string }> {
    if (!window.ethereum) {
      throw new Error('MetaMask or compatible wallet not found');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Switch to Hedera network if needed
      await this.switchToHederaNetwork();
      
      this.signer = await this.provider.getSigner();

      // Get current network info
      const network = await this.provider.getNetwork();
      const networkName = this.getNetworkName(Number(network.chainId));

      return {
        address: accounts[0],
        network: networkName,
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Get network name from chain ID
   */
  private getNetworkName(chainId: number): string {
    switch (chainId) {
      case 296:
        return 'Hedera Testnet';
      case 295:
        return 'Hedera Mainnet';
      default:
        return `Unknown Network (${chainId})`;
    }
  }

  /**
   * Initialize connection to Hedera EVM
   */
  async initialize(): Promise<void> {
    try {
      // Check if MetaMask or compatible wallet is available
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Switch to Hedera network if needed
        await this.switchToHederaNetwork();
        
        // Get signer
        this.signer = await this.provider.getSigner();
        
        // Initialize contract
        this.contract = new ethers.Contract(
          this.contractAddress,
          CERTIFICATE_NFT_ABI,
          this.signer
        );
        
        console.log('✅ Hedera EVM connection established');
      } else {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or HashPack.');
      }
    } catch (error) {
      console.error('Failed to initialize Hedera connection:', error);
      throw error;
    }
  }

  /**
   * Switch to Hedera network
   */
  async switchToHederaNetwork(): Promise<void> {
    const networkConfig = HEDERA_NETWORKS[this.network];
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      });
    } catch (switchError: any) {
      // Network not added, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
        } catch (addError) {
          throw new Error('Failed to add Hedera network to wallet');
        }
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Issue a new certificate NFT
   */
  async issueCertificate(certificateData: {
    recipient: string;
    recipientName: string;
    recipientEmail: string;
    issuerName: string;
    courseName: string;
    completionDate: string;
    ipfsHash: string;
    certificateHash: string;
  }): Promise<{
    success: boolean;
    tokenId?: number;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Hash email for privacy
      const emailHash = CertificateCrypto.hashEmail(certificateData.recipientEmail);
      
      // Generate certificate hash
      const certificateHash = CertificateCrypto.generateCertificateHash({
        recipientName: certificateData.recipientName,
        recipientEmail: certificateData.recipientEmail,
        issuerName: certificateData.issuerName,
        courseName: certificateData.courseName,
        completionDate: certificateData.completionDate,
      });

      console.log('🚀 Issuing certificate NFT...');
      
      const tx = await this.contract.issueCertificate(
        certificateData.recipient,
        certificateData.recipientName,
        emailHash,
        certificateData.issuerName,
        certificateData.courseName,
        certificateData.completionDate,
        certificateData.ipfsHash,
        certificateData.certificateHash
      );

      console.log('⏳ Transaction submitted:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt.transactionHash);

      // Parse events to get token ID
      const event = receipt.logs.find((log: any) => {
        try {
          return this.contract?.interface.parseLog(log)?.name === 'CertificateIssued';
        } catch {
          return false;
        }
      });

      let tokenId;
      if (event) {
        const parsedEvent = this.contract.interface.parseLog(event);
        tokenId = parseInt(parsedEvent?.args[0].toString());
      }

      return {
        success: true,
        tokenId,
        transactionHash: receipt.transactionHash
      };

    } catch (error: any) {
      console.error('❌ Failed to issue certificate:', error);
      return {
        success: false,
        error: error.message || 'Failed to issue certificate NFT'
      };
    }
  }

  /**
   * Verify certificate by token ID
   */
  async verifyCertificateById(tokenId: number): Promise<VerificationResult | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [certificate, owner, isValid] = await this.contract.verifyCertificate(tokenId);
      
      return {
        certificate: {
          recipientName: certificate.recipientName,
          recipientEmail: certificate.recipientEmail,
          issuerName: certificate.issuerName,
          courseName: certificate.courseName,
          completionDate: certificate.completionDate,
          ipfsHash: certificate.ipfsHash,
          issueTimestamp: parseInt(certificate.issueTimestamp.toString()),
          isActive: certificate.isActive,
          certificateHash: certificate.certificateHash
        },
        owner,
        isValid,
        tokenId
      };

    } catch (error) {
      console.error('Failed to verify certificate:', error);
      return null;
    }
  }

  /**
   * Verify certificate by original file hash
   */
  async verifyCertificateByHash(certificateHash: string): Promise<VerificationResult | null> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [certificate, owner, isValid, tokenId] = await this.contract.verifyCertificateByHash(certificateHash);
      
      return {
        certificate: {
          recipientName: certificate.recipientName,
          recipientEmail: certificate.recipientEmail,
          issuerName: certificate.issuerName,
          courseName: certificate.courseName,
          completionDate: certificate.completionDate,
          ipfsHash: certificate.ipfsHash,
          issueTimestamp: parseInt(certificate.issueTimestamp.toString()),
          isActive: certificate.isActive,
          certificateHash: certificate.certificateHash
        },
        owner,
        isValid,
        tokenId: parseInt(tokenId.toString())
      };

    } catch (error) {
      console.error('Failed to verify certificate by hash:', error);
      return null;
    }
  }

  /**
   * Get all certificates owned by an address
   */
  async getCertificatesByOwner(ownerAddress: string): Promise<number[]> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tokenIds = await this.contract.getCertificatesByOwner(ownerAddress);
      return tokenIds.map((id: any) => parseInt(id.toString()));

    } catch (error) {
      console.error('Failed to get certificates by owner:', error);
      return [];
    }
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(tokenId: number, reason: string): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log('🚫 Revoking certificate...', tokenId);
      
      const tx = await this.contract.revokeCertificate(tokenId, reason);
      const receipt = await tx.wait();
      
      console.log('✅ Certificate revoked:', receipt.transactionHash);

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };

    } catch (error: any) {
      console.error('❌ Failed to revoke certificate:', error);
      return {
        success: false,
        error: error.message || 'Failed to revoke certificate'
      };
    }
  }

  /**
   * Check if address is authorized issuer
   */
  async isAuthorizedIssuer(address: string): Promise<boolean> {
    try {
      if (!this.contract) return false;
      
      return await this.contract.isAuthorizedIssuer(address);
    } catch (error) {
      console.error('Failed to check issuer authorization:', error);
      return false;
    }
  }

  /**
   * Get total number of certificates
   */
  async getTotalCertificates(): Promise<number> {
    try {
      if (!this.contract) return 0;
      
      const total = await this.contract.getTotalCertificates();
      return parseInt(total.toString());
    } catch (error) {
      console.error('Failed to get total certificates:', error);
      return 0;
    }
  }

  /**
   * Batch issue multiple certificates
   */
  async batchIssueCertificates(certificates: Array<{
    recipient: string;
    recipientName: string;
    recipientEmail: string;
    issuerName: string;
    courseName: string;
    completionDate: string;
    ipfsHash: string;
    certificateHash: string;
  }>): Promise<{
    success: boolean;
    tokenIds?: number[];
    transactionHash?: string;
    error?: string;
  }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Prepare batch data
      const recipients = certificates.map(cert => cert.recipient);
      const certificateData = await Promise.all(
        certificates.map(async (cert) => {
          const emailHash = CertificateCrypto.hashEmail(cert.recipientEmail);
          const certificateHash = CertificateCrypto.generateCertificateHash({
            recipientName: cert.recipientName,
            recipientEmail: cert.recipientEmail,
            issuerName: cert.issuerName,
            courseName: cert.courseName,
            completionDate: cert.completionDate,
          });
          
          return [
            cert.recipientName,
            emailHash,
            cert.issuerName,
            cert.courseName,
            cert.completionDate
          ];
        })
      );
      const ipfsHashes = certificates.map(cert => cert.ipfsHash);
      const certificateHashes = certificates.map(cert => cert.certificateHash);

      console.log('🚀 Batch issuing certificates...', certificates.length);
      
      const tx = await this.contract.batchIssueCertificates(
        recipients,
        certificateData,
        ipfsHashes,
        certificateHashes
      );

      const receipt = await tx.wait();
      console.log('✅ Batch issuance completed:', receipt.transactionHash);

      // Parse events for token IDs
      const events = receipt.logs
        .map((log: any) => {
          try {
            return this.contract?.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter((event: any) => event?.name === 'CertificateIssued');

      const tokenIds = events.map((event: any) => parseInt(event.args[0].toString()));

      return {
        success: true,
        tokenIds,
        transactionHash: receipt.transactionHash
      };

    } catch (error: any) {
      console.error('❌ Failed to batch issue certificates:', error);
      return {
        success: false,
        error: error.message || 'Failed to batch issue certificates'
      };
    }
  }

  /**
   * Get current connected wallet address
   */
  async getConnectedAddress(): Promise<string | null> {
    try {
      if (!this.signer) return null;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to get connected address:', error);
      return null;
    }
  }

  /**
   * Listen for certificate events
   */
  onCertificateIssued(callback: (tokenId: number, recipient: string, issuer: string, courseName: string) => void): void {
    if (!this.contract) return;

    this.contract.on('CertificateIssued', (tokenId, recipient, issuer, courseName, ipfsHash, event) => {
      callback(parseInt(tokenId.toString()), recipient, issuer, courseName);
    });
  }

  /**
   * Listen for certificate revocation events
   */
  onCertificateRevoked(callback: (tokenId: number, reason: string) => void): void {
    if (!this.contract) return;

    this.contract.on('CertificateRevoked', (tokenId, reason, event) => {
      callback(parseInt(tokenId.toString()), reason);
    });
  }

  /**
   * Get contract instance (for advanced operations)
   */
  getContract(): ethers.Contract | null {
    return this.contract;
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.Provider | null {
    return this.provider;
  }
}

// Export singleton instance
export const hederaContract = new HederaContractService(
  process.env.VITE_CONTRACT_ADDRESS || '', // Set this in your .env file
  process.env.VITE_HEDERA_NETWORK as 'testnet' | 'mainnet' || 'testnet'
);

export default HederaContractService;