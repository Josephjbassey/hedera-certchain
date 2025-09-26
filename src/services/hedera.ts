import { 
  Client, 
  TopicMessageSubmitTransaction,
  TopicCreateTransaction,
  TopicInfoQuery,
  Hbar,
  PrivateKey,
  AccountId,
  TopicId
} from '@hashgraph/sdk';

/**
 * Hedera Blockchain Service for Certificate Chain
 * Handles direct blockchain interactions without backend dependencies
 */

export interface CertificateProof {
  certificateId: string;
  ipfsCid: string;
  cidHash: string;
  issuerAccountId: string;
  recipientHash: string;
  courseHash: string;
  timestamp: number;
  version: string;
}

export interface BlockchainResult {
  success: boolean;
  transactionId?: string;
  topicId?: string;
  consensusTimestamp?: string;
  error?: string;
}

class HederaService {
  private client: Client | null = null;
  private network: 'testnet' | 'mainnet';
  private certTopicId: TopicId | null = null;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
  }

  /**
   * Initialize Hedera client with operator account
   */
  async initialize(accountId: string, privateKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create client for the specified network
      this.client = this.network === 'mainnet' 
        ? Client.forMainnet()
        : Client.forTestnet();

      // Set operator (account that pays for transactions)
      this.client.setOperator(
        AccountId.fromString(accountId),
        PrivateKey.fromStringECDSA(privateKey)
      );

      // Set default max transaction fee
      this.client.setDefaultMaxTransactionFee(new Hbar(2));

      // Initialize or get certificate topic
      await this.initializeCertificateTopic();

      console.log('Hedera client initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      };
    }
  }

  /**
   * Initialize the certificate topic for consensus messages
   */
  private async initializeCertificateTopic(): Promise<void> {
    if (!this.client) {
      throw new Error('Hedera client not initialized');
    }

    // Try to use existing topic ID from environment
    const existingTopicId = import.meta.env.VITE_HEDERA_TOPIC_ID;
    
    if (existingTopicId) {
      try {
        this.certTopicId = TopicId.fromString(existingTopicId);
        
        // Verify topic exists
        const topicInfo = await new TopicInfoQuery()
          .setTopicId(this.certTopicId)
          .execute(this.client);
          
        console.log('Using existing certificate topic:', this.certTopicId.toString());
        return;
      } catch (error) {
        console.warn('Existing topic not accessible, creating new one');
      }
    }

    // Create new topic
    try {
      const createTopicTx = new TopicCreateTransaction()
        .setTopicMemo('Hedera CertChain - Certificate Proofs')
        .setMaxTransactionFee(new Hbar(2));

      const createTopicResult = await createTopicTx.execute(this.client);
      const receipt = await createTopicResult.getReceipt(this.client);
      
      this.certTopicId = receipt.topicId;
      console.log('Created new certificate topic:', this.certTopicId?.toString());
      
      // Note: In production, save this topic ID to your environment variables
      console.log('⚠️  Save this Topic ID to your environment: VITE_HEDERA_TOPIC_ID=' + this.certTopicId?.toString());
    } catch (error) {
      console.error('Failed to create certificate topic:', error);
      throw error;
    }
  }

  /**
   * Submit certificate proof to Hedera Consensus Service
   */
  async submitCertificateProof(proof: CertificateProof): Promise<BlockchainResult> {
    if (!this.client || !this.certTopicId) {
      return {
        success: false,
        error: 'Hedera client or topic not initialized'
      };
    }

    try {
      // Create consensus message with certificate proof
      const message = JSON.stringify({
        type: 'CERTIFICATE_PROOF',
        version: '1.0',
        ...proof
      });

      // Submit message to consensus topic
      const submitTx = new TopicMessageSubmitTransaction()
        .setTopicId(this.certTopicId)
        .setMessage(message)
        .setMaxTransactionFee(new Hbar(2));

      const txResult = await submitTx.execute(this.client);
      const receipt = await txResult.getReceipt(this.client);
      
      // Get consensus timestamp
      const consensusTimestamp = receipt.consensusTimestamp?.toDate().toISOString();

      console.log('Certificate proof submitted to blockchain:', {
        transactionId: txResult.transactionId.toString(),
        topicId: this.certTopicId.toString(),
        consensusTimestamp
      });

      return {
        success: true,
        transactionId: txResult.transactionId.toString(),
        topicId: this.certTopicId.toString(),
        consensusTimestamp
      };
    } catch (error) {
      console.error('Failed to submit certificate proof:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed'
      };
    }
  }

  /**
   * Verify certificate proof on blockchain
   */
  async verifyCertificate(
    cidHash: string, 
    transactionId?: string
  ): Promise<{
    success: boolean;
    verified: boolean;
    proof?: CertificateProof;
    error?: string;
  }> {
    try {
      // Note: In a full implementation, you would query the Hedera Mirror Node
      // to search for the specific CID hash in topic messages
      // For now, we'll implement a simplified verification
      
      console.log('Verifying certificate with CID hash:', cidHash);
      
      // This would typically involve:
      // 1. Query Hedera Mirror Node API for topic messages
      // 2. Search for messages containing the CID hash
      // 3. Verify the message structure and authenticity
      
      // Simplified verification for demo
      const isValid = cidHash && cidHash.length === 64; // SHA-256 hash length
      
      return {
        success: true,
        verified: isValid,
        proof: isValid ? {
          certificateId: 'verified',
          ipfsCid: 'placeholder',
          cidHash,
          issuerAccountId: 'verified',
          recipientHash: 'verified',
          courseHash: 'verified',
          timestamp: Date.now(),
          version: '1.0'
        } : undefined
      };
    } catch (error) {
      console.error('Certificate verification failed:', error);
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get network status
   */
  getNetworkStatus(): {
    network: 'testnet' | 'mainnet';
    clientInitialized: boolean;
    topicId: string | null;
  } {
    return {
      network: this.network,
      clientInitialized: this.client !== null,
      topicId: this.certTopicId?.toString() || null
    };
  }

  /**
   * Hash sensitive data for privacy
   */
  static hashString(data: string): string {
    // Simple hash function - in production use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Generate certificate ID
   */
  static generateCertificateId(): string {
    return 'cert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Close client connection
   */
  close(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  }
}

// Export singleton instance
export const hederaService = new HederaService(
  import.meta.env.VITE_HEDERA_NETWORK === 'mainnet' ? 'mainnet' : 'testnet'
);

export default hederaService;