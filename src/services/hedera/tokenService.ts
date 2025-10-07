import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenId,
  PrivateKey,
  AccountId,
  TransferTransaction,
  TokenAssociateTransaction,
  TokenNftInfoQuery,
} from '@hashgraph/sdk';

export interface NFTMetadata {
  certificateId: string;
  recipientName: string;
  courseName: string;
  institutionName: string;
  issueDate: string;
  ipfsCid: string;
  fileHash: string;
}

class TokenService {
  private client: Client | null = null;
  private operatorKey: PrivateKey | null = null;
  private certificateTokenId: TokenId | null = null;

  // Initialize client
  initializeClient(accountId: string, privateKey: string, network: 'testnet' | 'mainnet' = 'testnet') {
    try {
      if (network === 'testnet') {
        this.client = Client.forTestnet();
      } else {
        this.client = Client.forMainnet();
      }

      this.operatorKey = PrivateKey.fromString(privateKey);
      
      this.client.setOperator(
        AccountId.fromString(accountId),
        this.operatorKey
      );

      console.log('Hedera Token Service client initialized');
    } catch (error) {
      console.error('Error initializing Token Service client:', error);
      throw error;
    }
  }

  // Create NFT collection for certificates
  async createCertificateNFT(
    name: string = 'Hedera Certificate NFT',
    symbol: string = 'HCERT'
  ): Promise<string> {
    if (!this.client || !this.operatorKey) {
      throw new Error('Client not initialized');
    }

    try {
      const transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.client.operatorAccountId!)
        .setSupplyType(TokenSupplyType.Infinite)
        .setSupplyKey(this.operatorKey)
        .setAdminKey(this.operatorKey)
        .setFreezeDefault(false);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      this.certificateTokenId = receipt.tokenId;
      
      if (!this.certificateTokenId) {
        throw new Error('Failed to create NFT token');
      }

      console.log('Certificate NFT created:', this.certificateTokenId.toString());
      return this.certificateTokenId.toString();
    } catch (error) {
      console.error('Error creating certificate NFT:', error);
      throw error;
    }
  }

  // Set existing token ID
  setTokenId(tokenId: string) {
    this.certificateTokenId = TokenId.fromString(tokenId);
    console.log('Token ID set:', tokenId);
  }

  // Mint certificate NFT
  async mintCertificateNFT(metadata: NFTMetadata): Promise<{
    tokenId: string;
    serialNumber: number;
    transactionId: string;
  }> {
    if (!this.client || !this.operatorKey) {
      throw new Error('Client not initialized');
    }

    if (!this.certificateTokenId) {
      throw new Error('Certificate token not created. Call createCertificateNFT first.');
    }

    try {
      // Encode metadata as bytes
      const metadataBytes = Buffer.from(JSON.stringify(metadata), 'utf-8');

      const transaction = new TokenMintTransaction()
        .setTokenId(this.certificateTokenId)
        .addMetadata(metadataBytes);

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      const serialNumber = receipt.serials[0].toNumber();
      const transactionId = txResponse.transactionId.toString();

      console.log('Certificate NFT minted:', {
        tokenId: this.certificateTokenId.toString(),
        serialNumber,
        transactionId,
      });

      return {
        tokenId: this.certificateTokenId.toString(),
        serialNumber,
        transactionId,
      };
    } catch (error) {
      console.error('Error minting certificate NFT:', error);
      throw error;
    }
  }

  // Associate token with recipient account
  async associateToken(recipientAccountId: string, recipientPrivateKey: string): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (!this.certificateTokenId) {
      throw new Error('Certificate token not set');
    }

    try {
      const recipientKey = PrivateKey.fromString(recipientPrivateKey);
      
      const transaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(recipientAccountId))
        .setTokenIds([this.certificateTokenId])
        .freezeWith(this.client);

      const signedTx = await transaction.sign(recipientKey);
      const txResponse = await signedTx.execute(this.client);
      await txResponse.getReceipt(this.client);

      console.log('Token associated with recipient:', recipientAccountId);
    } catch (error) {
      console.error('Error associating token:', error);
      throw error;
    }
  }

  // Transfer NFT to recipient
  async transferNFT(
    recipientAccountId: string,
    serialNumber: number
  ): Promise<string> {
    if (!this.client || !this.operatorKey) {
      throw new Error('Client not initialized');
    }

    if (!this.certificateTokenId) {
      throw new Error('Certificate token not set');
    }

    try {
      const transaction = new TransferTransaction()
        .addNftTransfer(
          this.certificateTokenId,
          serialNumber,
          this.client.operatorAccountId!,
          AccountId.fromString(recipientAccountId)
        );

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      console.log('NFT transferred to recipient:', {
        recipient: recipientAccountId,
        serialNumber,
        status: receipt.status.toString(),
      });

      return txResponse.transactionId.toString();
    } catch (error) {
      console.error('Error transferring NFT:', error);
      throw error;
    }
  }

  // Query NFT info
  async getNFTInfo(serialNumber: number): Promise<any> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (!this.certificateTokenId) {
      throw new Error('Certificate token not set');
    }

    try {
      const nftInfos = await new TokenNftInfoQuery()
        .setTokenId(this.certificateTokenId)
        .setStart(serialNumber)
        .setEnd(serialNumber)
        .execute(this.client);

      if (!nftInfos || nftInfos.length === 0) {
        throw new Error('NFT not found');
      }

      const nftInfo = nftInfos[0];

      return {
        tokenId: this.certificateTokenId.toString(),
        serialNumber,
        accountId: nftInfo.nftId.toString(),
        metadata: Buffer.from(nftInfo.metadata).toString('utf-8'),
        creationTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error querying NFT info:', error);
      throw error;
    }
  }
}

export const tokenService = new TokenService();
