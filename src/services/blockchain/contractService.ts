/**
 * Blockchain Service for Hedera CertChain
 * 
 * Provides complete smart contract interaction layer including:
 * - Multi-wallet support (MetaMask, HashPack, Blade, WalletConnect)
 * - Certificate operations (mint, verify, revoke, batch mint)
 * - Issuer management and role-based access
 * - Error handling and transaction tracking
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import { ethers, Contract, BrowserProvider, JsonRpcProvider, Signer, TransactionResponse, TransactionReceipt } from 'ethers';

// Contract ABI - This would typically be imported from compiled artifacts
const CERTIFICATE_NFT_ABI = [
  // Certificate operations
  "function mintCertificate(address recipient, string memory ipfsCID, bytes32 certificateHash, uint256 expiryTimestamp) external returns (uint256)",
  "function verifyCertificate(uint256 tokenId) external view returns (bool isValid, address issuer, uint256 timestamp, string memory ipfsCID, bool isRevoked, bool isExpired)",
  "function revokeCertificate(uint256 tokenId) external",
  "function getCertificateByHash(bytes32 hash) external view returns (uint256 tokenId, bool exists)",
  "function batchMintCertificates(address[] memory recipients, string[] memory ipfsCIDs, bytes32[] memory hashes, uint256[] memory expiryTimestamps) external returns (uint256[] memory)",
  
  // Issuer management
  "function addIssuer(address issuer, string memory institutionName) external",
  "function removeIssuer(address issuer) external",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  
  // Token operations
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  
  // Certificate queries
  "function getCertificatesByOwner(address owner) external view returns (uint256[] memory)",
  "function getCertificatesByIssuer(address issuer) external view returns (uint256[] memory)",
  "function getInstitution(address issuer) external view returns (string memory name, address admin, bool isActive, uint256 certificatesIssued)",
  
  // Events
  "event CertificateMinted(uint256 indexed tokenId, address indexed recipient, address indexed issuer, bytes32 certificateHash, string ipfsCID)",
  "event CertificateRevoked(uint256 indexed tokenId, address indexed issuer, uint256 timestamp)",
  "event IssuerAdded(address indexed issuer, string institutionName, address indexed admin)",
  "event BatchMintCompleted(address indexed issuer, uint256 count, uint256[] tokenIds)",
];

// Role constants
const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

// Types
export type WalletType = 'MetaMask' | 'HashPack' | 'Blade' | 'WalletConnect';

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  error?: string;
}

export interface CertificateData {
  tokenId: number;
  recipient: string;
  issuer: string;
  certificateHash: string;
  timestamp: number;
  expiryTimestamp?: number;
  ipfsCID: string;
  isRevoked: boolean;
  institutionName: string;
}

export interface VerificationResult {
  isValid: boolean;
  issuer: string;
  timestamp: number;
  ipfsCID: string;
  isRevoked: boolean;
  isExpired: boolean;
  tokenId?: number;
}

export interface Institution {
  name: string;
  admin: string;
  isActive: boolean;
  certificatesIssued: number;
}

export interface MintCertificateParams {
  recipient: string;
  ipfsCID: string;
  certificateHash: string;
  expiryTimestamp?: number;
}

export interface BatchMintParams {
  recipients: string[];
  ipfsCIDs: string[];
  certificateHashes: string[];
  expiryTimestamps: number[];
}

export interface TransactionResult {
  hash: string;
  receipt?: TransactionReceipt;
  success: boolean;
  error?: string;
}

export class BlockchainService {
  private provider: BrowserProvider | null = null;
  private signer: Signer | null = null;
  private contract: Contract | null = null;
  private contractAddress: string;
  private chainId: number;

  constructor(contractAddress?: string, chainId: number = 296) {
    this.contractAddress = contractAddress || import.meta.env.VITE_CONTRACT_ADDRESS || '';
    this.chainId = chainId;
  }

  /**
   * Initialize the service with a Web3 provider
   */
  async initialize(provider: BrowserProvider): Promise<void> {
    try {
      this.provider = provider;
      this.signer = await provider.getSigner();

      // Verify network
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== this.chainId) {
        throw new Error(`Wrong network. Expected chain ID ${this.chainId}, got ${network.chainId}`);
      }

      // Initialize contract
      if (!this.contractAddress) {
        throw new Error('Contract address not configured');
      }

      this.contract = new Contract(
        this.contractAddress,
        CERTIFICATE_NFT_ABI,
        this.signer
      );

      console.log('✅ Blockchain service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Check if service is initialized and ready
   */
  isReady(): boolean {
    return !!(this.provider && this.signer && this.contract);
  }

  /**
   * Get current account address
   */
  async getCurrentAccount(): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }
    return await this.signer.getAddress();
  }

  /**
   * Get account balance
   */
  async getAccountBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const accountAddress = address || await this.getCurrentAccount();
    const balance = await this.provider.getBalance(accountAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Mint a new certificate NFT
   */
  async mintCertificate(params: MintCertificateParams): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hashBytes = ethers.hexlify(ethers.toUtf8Bytes(params.certificateHash));
      const expiryTimestamp = params.expiryTimestamp || 0;

      console.log('🔄 Minting certificate...', { 
        recipient: params.recipient,
        hash: hashBytes,
        expiry: expiryTimestamp 
      });

      const transaction: TransactionResponse = await this.contract.mintCertificate(
        params.recipient,
        params.ipfsCID,
        hashBytes,
        expiryTimestamp
      );

      console.log('📤 Transaction sent:', transaction.hash);

      const receipt = await transaction.wait();

      console.log('✅ Certificate minted successfully');

      return {
        hash: transaction.hash,
        receipt: receipt || undefined,
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Failed to mint certificate:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Verify a certificate by token ID
   */
  async verifyCertificate(tokenId: number): Promise<VerificationResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.verifyCertificate(tokenId);
      
      return {
        isValid: result.isValid,
        issuer: result.issuer,
        timestamp: result.timestamp.toNumber(),
        ipfsCID: result.ipfsCID,
        isRevoked: result.isRevoked,
        isExpired: result.isExpired,
        tokenId,
      };
    } catch (error: any) {
      console.error('❌ Failed to verify certificate:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }

  /**
   * Verify certificate by hash
   */
  async verifyCertificateByHash(hash: string): Promise<VerificationResult | null> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const hashBytes = ethers.hexlify(ethers.toUtf8Bytes(hash));
      const result = await this.contract.getCertificateByHash(hashBytes);
      
      if (!result.exists) {
        return null;
      }

      return await this.verifyCertificate(Number(result.tokenId));
    } catch (error: any) {
      console.error('❌ Failed to verify certificate by hash:', error);
      throw new Error(`Hash verification failed: ${error.message}`);
    }
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(tokenId: number): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('🔄 Revoking certificate...', tokenId);

      const transaction: TransactionResponse = await this.contract.revokeCertificate(tokenId);

      console.log('📤 Transaction sent:', transaction.hash);

      const receipt = await transaction.wait();

      console.log('✅ Certificate revoked successfully');

      return {
        hash: transaction.hash,
        receipt: receipt || undefined,
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Failed to revoke certificate:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Batch mint certificates
   */
  async batchMintCertificates(params: BatchMintParams): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Validate arrays have same length
      const { recipients, ipfsCIDs, certificateHashes, expiryTimestamps } = params;
      
      if (recipients.length !== ipfsCIDs.length || 
          recipients.length !== certificateHashes.length || 
          recipients.length !== expiryTimestamps.length) {
        throw new Error('All arrays must have the same length');
      }

      // Convert hashes to bytes32
      const hashBytes = certificateHashes.map(hash => 
        ethers.hexlify(ethers.toUtf8Bytes(hash))
      );

      console.log('🔄 Batch minting certificates...', { count: recipients.length });

      const transaction: TransactionResponse = await this.contract.batchMintCertificates(
        recipients,
        ipfsCIDs,
        hashBytes,
        expiryTimestamps
      );

      console.log('📤 Transaction sent:', transaction.hash);

      const receipt = await transaction.wait();

      console.log('✅ Batch mint completed successfully');

      return {
        hash: transaction.hash,
        receipt: receipt || undefined,
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Failed to batch mint certificates:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Add a new issuer
   */
  async addIssuer(issuerAddress: string, institutionName: string): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('🔄 Adding issuer...', { issuerAddress, institutionName });

      const transaction: TransactionResponse = await this.contract.addIssuer(
        issuerAddress,
        institutionName
      );

      console.log('📤 Transaction sent:', transaction.hash);

      const receipt = await transaction.wait();

      console.log('✅ Issuer added successfully');

      return {
        hash: transaction.hash,
        receipt: receipt || undefined,
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Failed to add issuer:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Remove an issuer
   */
  async removeIssuer(issuerAddress: string): Promise<TransactionResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      console.log('🔄 Removing issuer...', issuerAddress);

      const transaction: TransactionResponse = await this.contract.removeIssuer(issuerAddress);

      console.log('📤 Transaction sent:', transaction.hash);

      const receipt = await transaction.wait();

      console.log('✅ Issuer removed successfully');

      return {
        hash: transaction.hash,
        receipt: receipt || undefined,
        success: true,
      };
    } catch (error: any) {
      console.error('❌ Failed to remove issuer:', error);
      return {
        hash: '',
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if address has issuer role
   */
  async isIssuer(address: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.hasRole(ISSUER_ROLE, address);
    } catch (error: any) {
      console.error('❌ Failed to check issuer role:', error);
      return false;
    }
  }

  /**
   * Check if address has admin role
   */
  async isAdmin(address: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.hasRole(ADMIN_ROLE, address);
    } catch (error: any) {
      console.error('❌ Failed to check admin role:', error);
      return false;
    }
  }

  /**
   * Get certificates owned by an address
   */
  async getCertificatesByOwner(ownerAddress: string): Promise<number[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tokenIds = await this.contract.getCertificatesByOwner(ownerAddress);
      return tokenIds.map((id: bigint) => Number(id));
    } catch (error: any) {
      console.error('❌ Failed to get certificates by owner:', error);
      throw new Error(`Failed to get certificates: ${error.message}`);
    }
  }

  /**
   * Get certificates issued by an address
   */
  async getCertificatesByIssuer(issuerAddress: string): Promise<number[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tokenIds = await this.contract.getCertificatesByIssuer(issuerAddress);
      return tokenIds.map((id: bigint) => Number(id));
    } catch (error: any) {
      console.error('❌ Failed to get certificates by issuer:', error);
      throw new Error(`Failed to get certificates: ${error.message}`);
    }
  }

  /**
   * Get institution information
   */
  async getInstitution(issuerAddress: string): Promise<Institution> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getInstitution(issuerAddress);
      
      return {
        name: result.name,
        admin: result.admin,
        isActive: result.isActive,
        certificatesIssued: Number(result.certificatesIssued),
      };
    } catch (error: any) {
      console.error('❌ Failed to get institution:', error);
      throw new Error(`Failed to get institution: ${error.message}`);
    }
  }

  /**
   * Get token URI for a certificate
   */
  async getTokenURI(tokenId: number): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.tokenURI(tokenId);
    } catch (error: any) {
      console.error('❌ Failed to get token URI:', error);
      throw new Error(`Failed to get token URI: ${error.message}`);
    }
  }

  /**
   * Get total supply of certificates
   */
  async getTotalSupply(): Promise<number> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const totalSupply = await this.contract.totalSupply();
      return Number(totalSupply);
    } catch (error: any) {
      console.error('❌ Failed to get total supply:', error);
      throw new Error(`Failed to get total supply: ${error.message}`);
    }
  }

  /**
   * Verify certificate by token ID
   */
  async verifyCertificateByTokenId(tokenId: number): Promise<{ success: boolean; certificate?: CertificateData; error?: string }> {
    try {
      const result = await this.verifyCertificate(tokenId);
      if (result.isValid) {
        // Get additional certificate data
        const owner = await this.contract?.ownerOf(tokenId);
        const certificate: CertificateData = {
          tokenId,
          recipient: owner,
          issuer: result.issuer,
          certificateHash: '', // Would need to get from events or storage
          timestamp: result.timestamp,
          expiryTimestamp: result.isExpired ? Date.now() / 1000 - 1 : undefined,
          ipfsCID: result.ipfsCID,
          isRevoked: result.isRevoked,
          institutionName: '', // Would need to get from issuer data
        };
        return { success: true, certificate };
      } else {
        return { success: false, error: 'Certificate not valid' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify certificate by hash (dashboard version)
   */
  async verifyCertificateByHashExtended(hash: string): Promise<{ success: boolean; certificate?: CertificateData; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const hashBytes = ethers.keccak256(ethers.toUtf8Bytes(hash));
      const result = await this.contract.getCertificateByHash(hashBytes);
      
      if (result.exists) {
        return this.verifyCertificateByTokenId(Number(result.tokenId));
      } else {
        return { success: false, error: 'Certificate not found' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get certificates issued by an address
   */
  async getIssuedCertificates(issuerAddress: string): Promise<{ success: boolean; certificates?: CertificateData[]; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const tokenIds = await this.contract.getCertificatesByIssuer(issuerAddress);
      const certificates: CertificateData[] = [];
      
      for (const tokenId of tokenIds) {
        try {
          const verifyResult = await this.verifyCertificateByTokenId(Number(tokenId));
          if (verifyResult.success && verifyResult.certificate) {
            certificates.push(verifyResult.certificate);
          }
        } catch (error) {
          console.warn(`Failed to get certificate ${tokenId}:`, error);
        }
      }
      
      return { success: true, certificates };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get certificates received by an address
   */
  async getReceivedCertificates(ownerAddress: string): Promise<{ success: boolean; certificates?: CertificateData[]; error?: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      
      const tokenIds = await this.contract.getCertificatesByOwner(ownerAddress);
      const certificates: CertificateData[] = [];
      
      for (const tokenId of tokenIds) {
        try {
          const verifyResult = await this.verifyCertificateByTokenId(Number(tokenId));
          if (verifyResult.success && verifyResult.certificate) {
            certificates.push(verifyResult.certificate);
          }
        } catch (error) {
          console.warn(`Failed to get certificate ${tokenId}:`, error);
        }
      }
      
      return { success: true, certificates };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Listen for contract events
   */
  listenForEvents(eventName: string, callback: (event: any) => void): void {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    this.contract.on(eventName, callback);
  }

  /**
   * Stop listening for contract events
   */
  removeContractListeners(): void {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }

  /**
   * Get service configuration and status
   */
  getServiceInfo(): {
    isReady: boolean;
    contractAddress: string;
    chainId: number;
    hasProvider: boolean;
    hasSigner: boolean;
    hasContract: boolean;
  } {
    return {
      isReady: this.isReady(),
      contractAddress: this.contractAddress,
      chainId: this.chainId,
      hasProvider: !!this.provider,
      hasSigner: !!this.signer,
      hasContract: !!this.contract,
    };
  }

  /**
   * Wallet Management Methods
   */
  
  /**
   * Get list of supported wallets
   */
  async getSupportedWallets(): Promise<WalletType[]> {
    const supported: WalletType[] = [];
    
    // Check MetaMask
    if (typeof window !== 'undefined' && window.ethereum) {
      supported.push('MetaMask');
    }
    
    // Check HashPack
    if (typeof window !== 'undefined' && (window as any).hashpack) {
      supported.push('HashPack');
    }
    
    // Check Blade
    if (typeof window !== 'undefined' && (window as any).bladeAPI) {
      supported.push('Blade');
    }
    
    // WalletConnect is always potentially available
    supported.push('WalletConnect');
    
    return supported;
  }

  /**
   * Connect to a specific wallet
   */
  async connectWallet(walletType: WalletType): Promise<WalletConnectionResult> {
    try {
      let provider: BrowserProvider;
      
      switch (walletType) {
        case 'MetaMask':
          if (!window.ethereum) {
            return { success: false, error: 'MetaMask not installed' };
          }
          
          const ethereum = window.ethereum as any;
          if (!ethereum || !ethereum.request) {
            return { success: false, error: 'MetaMask not available' };
          }
          await ethereum.request({ method: 'eth_requestAccounts' });
          provider = new BrowserProvider(ethereum);
          break;
          
        case 'HashPack':
          // HashPack integration would go here
          return { success: false, error: 'HashPack integration not implemented yet' };
          
        case 'Blade':
          // Blade integration would go here
          return { success: false, error: 'Blade integration not implemented yet' };
          
        case 'WalletConnect':
          // WalletConnect integration would go here
          return { success: false, error: 'WalletConnect integration not implemented yet' };
          
        default:
          return { success: false, error: `Unsupported wallet type: ${walletType}` };
      }
      
      await this.initialize(provider);
      const address = await this.getCurrentAccount();
      
      return { success: true, address };
      
    } catch (error: any) {
      console.error(`❌ Failed to connect ${walletType}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.contract = null;
  }

  /**
   * Check if wallet is still connected
   */
  async isWalletConnected(): Promise<boolean> {
    try {
      if (!this.provider || !this.signer) return false;
      
      // Try to get current account
      await this.getCurrentAccount();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Switch to different account
   */
  async switchAccount(address: string): Promise<WalletConnectionResult> {
    try {
      if (!this.provider) {
        return { success: false, error: 'No provider available' };
      }
      
      // For MetaMask, request account change
      const ethereum = window.ethereum as any;
      if (ethereum && ethereum.request) {
        await ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      }
      
      // Re-initialize signer
      this.signer = await this.provider.getSigner();
      
      if (this.contractAddress) {
        this.contract = new Contract(
          this.contractAddress,
          CERTIFICATE_NFT_ABI,
          this.signer
        );
      }
      
      const currentAddress = await this.getCurrentAccount();
      return { success: true, address: currentAddress };
      
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    return this.getAccountBalance(address);
  }

  /**
   * Get current network
   */
  async getNetwork(): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    const network = await this.provider.getNetwork();
    return network.name;
  }

  /**
   * Event listeners for wallet changes
   */
  private accountChangeListeners: ((account: string) => void)[] = [];
  private networkChangeListeners: ((network: string) => void)[] = [];
  private disconnectListeners: (() => void)[] = [];

  onAccountChanged(callback: (account: string) => void): void {
    this.accountChangeListeners.push(callback);
    
    // Set up MetaMask listener
    const ethereum = window.ethereum as any;
    if (ethereum && ethereum.on) {
      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          callback(accounts[0]);
        } else {
          this.disconnectListeners.forEach(cb => cb());
        }
      });
    }
  }

  onNetworkChanged(callback: (network: string) => void): void {
    this.networkChangeListeners.push(callback);
    
    // Set up MetaMask listener
    const ethereum = window.ethereum as any;
    if (ethereum && ethereum.on) {
      ethereum.on('chainChanged', async () => {
        try {
          const network = await this.getNetwork();
          callback(network);
        } catch (error) {
          console.error('Failed to get network info:', error);
        }
      });
    }
  }

  onDisconnect(callback: () => void): void {
    this.disconnectListeners.push(callback);
    
    // Set up MetaMask listener
    const ethereum = window.ethereum as any;
    if (ethereum && ethereum.on) {
      ethereum.on('disconnect', callback);
    }
  }

  removeAllListeners(): void {
    this.accountChangeListeners = [];
    this.networkChangeListeners = [];
    this.disconnectListeners = [];
    
    // Remove MetaMask listeners
    const ethereum = window.ethereum;
    if (ethereum && ethereum.removeListener) {
      if (typeof ethereum.removeAllListeners === 'function') {
        (ethereum as any).removeAllListeners('accountsChanged');
        (ethereum as any).removeAllListeners('chainChanged');
        (ethereum as any).removeAllListeners('disconnect');
      }
    }
  }

  /**
   * Set contract address (useful for testing or updating)
   */
  setContractAddress(address: string): void {
    this.contractAddress = address;
    // Re-initialize contract if we have a signer
    if (this.signer && address) {
      this.contract = new Contract(
        address,
        CERTIFICATE_NFT_ABI,
        this.signer
      );
    }
  }
}

// Export singleton instance
export const blockchainService = new BlockchainService();