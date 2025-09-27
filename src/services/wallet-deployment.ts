import { ethers } from 'ethers';
import {
  Client,
  AccountId,
  ContractCreateFlow,
  ContractFunctionParameters,
  Hbar,
  ContractCallQuery,
  PrivateKey
} from '@hashgraph/sdk';

/**
 * Wallet-based contract deployment service
 * Deploys contracts using user's connected wallet instead of hardcoded private keys
 */
export class WalletContractDeployment {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor() {
    // Initialize with connected wallet if available
    if (typeof window !== 'undefined' && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  /**
   * Connect to wallet and prepare for deployment
   */
  async connectWallet(): Promise<{ address: string; network: string }> {
    if (!window.ethereum) {
      throw new Error('No wallet detected. Please install MetaMask or another Ethereum wallet.');
    }

    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();

    // Get network info
    const network = await this.provider.getNetwork();
    
    return {
      address: accounts[0],
      network: this.getNetworkName(Number(network.chainId))
    };
  }

  /**
   * Deploy contract using wallet signature (Hedera SDK approach)
   */
  async deployContractWithHederaSDK(userAddress: string): Promise<{
    contractId: string;
    contractAddress: string;
    transactionId: string;
  }> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      // Get the compiled contract bytecode
      const contractBytecode = await this.getContractBytecode();

      // For Hedera SDK deployment, we need to create a client
      // But since we're using wallet signing, we'll use the EVM approach instead
      return await this.deployContractWithEVM(userAddress, contractBytecode);
      
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw error;
    }
  }

  /**
   * Deploy contract using EVM/ethers approach (more wallet-friendly)
   */
  async deployContractWithEVM(userAddress: string, bytecode?: string): Promise<{
    contractId: string;
    contractAddress: string;
    transactionId: string;
  }> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // Use the contract ABI and bytecode
      const contractABI = this.getContractABI();
      const contractBytecode = bytecode || await this.getContractBytecode();

      // Create contract factory
      const contractFactory = new ethers.ContractFactory(
        contractABI,
        contractBytecode,
        this.signer
      );

      console.log('🚀 Deploying contract...');
      console.log('👤 Deployer address:', userAddress);

      // Deploy with constructor parameters (initial owner)
      const contract = await contractFactory.deploy(userAddress);
      
      console.log('⏳ Waiting for deployment confirmation...');
      
      // Wait for deployment to complete
      await contract.waitForDeployment();
      
      const contractAddress = await contract.getAddress();
      const deployTransaction = contract.deploymentTransaction();

      console.log('✅ Contract deployed successfully!');
      console.log('📍 Contract Address:', contractAddress);
      console.log('🔗 Transaction Hash:', deployTransaction?.hash);

      // Store the contract address for future use
      this.storeContractAddress(contractAddress);

      return {
        contractId: contractAddress, // For EVM, we use address as ID
        contractAddress: contractAddress,
        transactionId: deployTransaction?.hash || ''
      };

    } catch (error) {
      console.error('EVM contract deployment failed:', error);
      throw error;
    }
  }

  /**
   * Check if a contract is already deployed
   */
  async checkExistingDeployment(): Promise<string | null> {
    // Check localStorage first
    const storedAddress = localStorage.getItem('hedera-certchain-contract-address');
    
    if (storedAddress) {
      // Verify the contract still exists on-chain
      const isValid = await this.verifyContractExists(storedAddress);
      if (isValid) {
        return storedAddress;
      } else {
        // Remove invalid address
        localStorage.removeItem('hedera-certchain-contract-address');
      }
    }

    return null;
  }

  /**
   * Verify that a contract exists at the given address
   */
  async verifyContractExists(contractAddress: string): Promise<boolean> {
    if (!this.provider) return false;

    try {
      const code = await this.provider.getCode(contractAddress);
      return code !== '0x';
    } catch (error) {
      console.warn('Failed to verify contract existence:', error);
      return false;
    }
  }

  /**
   * Store contract address for future use
   */
  private storeContractAddress(contractAddress: string): void {
    localStorage.setItem('hedera-certchain-contract-address', contractAddress);
    
    // Also update environment if in development
    if (import.meta.env.DEV) {
      console.log(`📝 Contract deployed at: ${contractAddress}`);
      console.log('💡 Add this to your .env file:');
      console.log(`VITE_CONTRACT_ADDRESS_TESTNET=${contractAddress}`);
    }
  }

  /**
   * Get contract ABI for deployment
   */
  private getContractABI(): string[] {
    return [
      // Constructor
      "constructor(address initialOwner)",
      
      // ERC721 Standard functions
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function balanceOf(address owner) view returns (uint256)",
      
      // Certificate functions
      "function mintCertificate(address to, string recipientName, string recipientEmail, string issuerName, string courseName, string completionDate, string ipfsHash, string certificateHash) returns (uint256)",
      "function verifyCertificate(uint256 tokenId) view returns (tuple(string recipientName, string recipientEmail, string issuerName, string courseName, string completionDate, string ipfsHash, uint256 issueTimestamp, bool isActive, string certificateHash), address, bool)",
      "function verifyCertificateByHash(string certificateHash) view returns (tuple(string recipientName, string recipientEmail, string issuerName, string courseName, string completionDate, string ipfsHash, uint256 issueTimestamp, bool isActive, string certificateHash), address, bool, uint256)",
      
      // Access control
      "function owner() view returns (address)",
      "function isAuthorizedIssuer(address issuer) view returns (bool)",
      "function addAuthorizedIssuer(address issuer)",
      
      // Events
      "event CertificateMinted(uint256 indexed tokenId, address indexed recipient, string recipientName, string courseName, string ipfsHash)",
      "event CertificateRevoked(uint256 indexed tokenId, string reason)"
    ];
  }

  /**
   * Get compiled contract bytecode
   * This should be replaced with the actual compiled bytecode from CertificateNFT.sol
   */
  private async getContractBytecode(): Promise<string> {
    // Production note: This bytecode should come from compiling CertificateNFT.sol
    // For now, this will require manual compilation or use of a build system
    
    const contractBytecode = localStorage.getItem('CONTRACT_BYTECODE');
    
    if (!contractBytecode) {
      const instructions = `
🔧 Contract Deployment Setup Required

To deploy certificates, you need to:

1. Compile CertificateNFT.sol using Remix IDE or Hardhat
2. Copy the compiled bytecode 
3. Set it via: localStorage.setItem('CONTRACT_BYTECODE', 'your_bytecode_here')
4. Refresh and try again

Alternatively, deploy manually through Remix IDE and set the contract address.
`;
      
      throw new Error(instructions);
    }
    
    return contractBytecode;
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
      case 297:
        return 'Hedera Previewnet';
      default:
        return `Unknown Network (${chainId})`;
    }
  }

  /**
   * Get the stored contract address
   */
  getStoredContractAddress(): string | null {
    return localStorage.getItem('hedera-certchain-contract-address') || 
           import.meta.env.VITE_CONTRACT_ADDRESS_TESTNET || 
           null;
  }

  /**
   * Clear stored contract address (for testing/reset)
   */
  clearStoredContractAddress(): void {
    localStorage.removeItem('hedera-certchain-contract-address');
  }
}

export default WalletContractDeployment;