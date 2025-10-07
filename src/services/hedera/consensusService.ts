import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  PrivateKey,
  AccountId,
} from '@hashgraph/sdk';

export interface ConsensusMessage {
  certificateId: string;
  recipientAccountId: string;
  ipfsCid: string;
  fileHash: string;
  timestamp: string;
  metadata: Record<string, any>;
}

class ConsensusService {
  private client: Client | null = null;
  private topicId: TopicId | null = null;

  // Initialize Hedera client
  initializeClient(accountId: string, privateKey: string, network: 'testnet' | 'mainnet' = 'testnet') {
    try {
      if (network === 'testnet') {
        this.client = Client.forTestnet();
      } else {
        this.client = Client.forMainnet();
      }

      this.client.setOperator(
        AccountId.fromString(accountId),
        PrivateKey.fromString(privateKey)
      );

      console.log('Hedera Consensus Service client initialized');
    } catch (error) {
      console.error('Error initializing Consensus Service client:', error);
      throw error;
    }
  }

  // Create a new topic for certificate records
  async createTopic(memo: string = 'Certificate Records Topic'): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized. Call initializeClient first.');
    }

    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo(memo);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      this.topicId = receipt.topicId;
      
      if (!this.topicId) {
        throw new Error('Failed to create topic');
      }

      console.log('Topic created:', this.topicId.toString());
      return this.topicId.toString();
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  }

  // Set existing topic ID
  setTopicId(topicId: string) {
    this.topicId = TopicId.fromString(topicId);
    console.log('Topic ID set:', topicId);
  }

  // Submit certificate record to consensus topic
  async submitCertificateRecord(message: ConsensusMessage): Promise<string> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (!this.topicId) {
      throw new Error('Topic ID not set. Create or set a topic first.');
    }

    try {
      const messageJson = JSON.stringify(message);
      const messageBytes = Buffer.from(messageJson, 'utf-8');

      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(messageBytes);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      // Get consensus timestamp from transaction response
      const consensusTimestamp = txResponse.transactionId.validStart?.toString() || new Date().toISOString();
      
      console.log('Certificate record submitted to consensus:', {
        topicId: this.topicId.toString(),
        consensusTimestamp,
        certificateId: message.certificateId,
      });

      return consensusTimestamp;
    } catch (error) {
      console.error('Error submitting to consensus:', error);
      throw error;
    }
  }

  // Query consensus messages (requires mirror node API)
  async queryCertificateRecords(topicId: string, limit: number = 10): Promise<any[]> {
    try {
      // This would typically use Hedera Mirror Node REST API
      // Example: https://testnet.mirrornode.hedera.com/api/v1/topics/{topicId}/messages
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=${limit}`;
      
      const response = await fetch(mirrorNodeUrl);
      
      if (!response.ok) {
        throw new Error(`Mirror node query failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Decode messages
      const messages = data.messages.map((msg: any) => {
        try {
          const decodedMessage = Buffer.from(msg.message, 'base64').toString('utf-8');
          return {
            ...msg,
            decodedMessage: JSON.parse(decodedMessage),
          };
        } catch {
          return msg;
        }
      });

      return messages;
    } catch (error) {
      console.error('Error querying consensus records:', error);
      throw error;
    }
  }

  // Verify certificate exists in consensus
  async verifyCertificateInConsensus(
    topicId: string, 
    certificateId: string
  ): Promise<boolean> {
    try {
      const messages = await this.queryCertificateRecords(topicId, 100);
      
      return messages.some(
        msg => msg.decodedMessage?.certificateId === certificateId
      );
    } catch (error) {
      console.error('Error verifying certificate in consensus:', error);
      return false;
    }
  }
}

export const consensusService = new ConsensusService();
