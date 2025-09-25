import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IssueCertificateRequest {
  recipientName: string;
  recipientEmail: string;
  issuerName: string;
  issuerOrganization: string;
  courseName: string;
  completionDate: string;
  certificateFile: string; // base64 encoded file
  fileName: string;
  fileType: string;
}

// NFT Collection configuration for certificates
const getCertificateCollectionId = async (client: any) => {
  // Try to use existing collection first (stored in environment for production)
  const existingCollectionId = Deno.env.get('CERTIFICATE_COLLECTION_ID');
  if (existingCollectionId) {
    console.log('Using existing certificate collection:', existingCollectionId);
    return existingCollectionId;
  }

  // Create new NFT collection for certificates
  const { TokenCreateTransaction, TokenType, TokenSupplyType } = await import("https://esm.sh/@hashgraph/sdk@2.64.5");
  
  const tokenCreateTx = new TokenCreateTransaction()
    .setTokenName("HederaCertChain Certificates")
    .setTokenSymbol("CERT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setInitialSupply(0)
    .setTreasuryAccountId(client.operatorAccountId)
    .setAdminKey(client.operatorPublicKey)
    .setSupplyKey(client.operatorPublicKey)
    .setMetadataKey(client.operatorPublicKey);

  const tokenCreateResponse = await tokenCreateTx.execute(client);
  const tokenCreateReceipt = await tokenCreateResponse.getReceipt(client);
  
  if (!tokenCreateReceipt.tokenId) {
    throw new Error('Failed to create certificate NFT collection');
  }
  
  const newCollectionId = tokenCreateReceipt.tokenId.toString();
  console.log('Created new certificate NFT collection:', newCollectionId);
  return newCollectionId;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: IssueCertificateRequest = await req.json();
    
    console.log('Starting certificate NFT issuance for user:', user.id);

    // Generate comprehensive certificate object with timestamp
    const issueTimestamp = new Date().toISOString();
    const certificateData = {
      version: "1.0",
      id: crypto.randomUUID(),
      recipientName: body.recipientName,
      recipientEmail: body.recipientEmail,
      issuerName: body.issuerName,
      issuerOrganization: body.issuerOrganization,
      courseName: body.courseName,
      completionDate: body.completionDate,
      issueDate: issueTimestamp,
      issuerUserId: user.id,
      metadata: {
        fileName: body.fileName,
        fileType: body.fileType,
        originalFile: body.certificateFile
      }
    };

    // Create deterministic hash of certificate content
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(certificateData, Object.keys(certificateData).sort());
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create certificate record in database first
    const { data: certificate, error: dbError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        recipient_name: body.recipientName,
        recipient_email: body.recipientEmail,
        issuer_name: body.issuerName,
        issuer_organization: body.issuerOrganization,
        course_name: body.courseName,
        completion_date: body.completionDate,
        certificate_hash: certificateHash,
        status: 'processing'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to create certificate record');
    }

    // Step 1: Upload certificate JSON to IPFS using Pinata
    const pinataApiKey = Deno.env.get('PINATA_API_KEY');
    const pinataSecretKey = Deno.env.get('PINATA_SECRET_API_KEY');

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('IPFS credentials not configured');
    }

    // Create JSON file for IPFS storage
    const certificateJsonBlob = new Blob([JSON.stringify(certificateData, null, 2)], { 
      type: 'application/json' 
    });

    const formData = new FormData();
    formData.append('file', certificateJsonBlob, `certificate-${certificateData.id}.json`);
    
    const metadata = JSON.stringify({
      name: `Certificate-${certificateData.id}`,
      keyvalues: {
        certificateId: certificateData.id,
        recipientName: body.recipientName,
        courseName: body.courseName,
        hash: certificateHash,
        issuerUserId: user.id,
        version: certificateData.version
      }
    });
    formData.append('pinataMetadata', metadata);

    const pinataOptions = JSON.stringify({
      wrapWithDirectory: false,
      cidVersion: 1
    });
    formData.append('pinataOptions', pinataOptions);

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: formData,
    });

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text();
      console.error('Pinata error:', errorText);
      throw new Error(`Failed to upload to IPFS: ${errorText}`);
    }

    const pinataData = await pinataResponse.json();
    const ipfsCid = pinataData.IpfsHash;
    
    console.log('Certificate JSON uploaded to IPFS with CID:', ipfsCid);

    // Step 2: Generate CID hash for NFT metadata
    const cidEncoder = new TextEncoder();
    const cidData = cidEncoder.encode(ipfsCid);
    const cidHashBuffer = await crypto.subtle.digest('SHA-256', cidData);
    const cidHashArray = Array.from(new Uint8Array(cidHashBuffer));
    const cidHash = cidHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated CID hash for NFT:', cidHash);

    // Step 3: Mint NFT with certificate data
    const hederaAccountId = Deno.env.get('HEDERA_ACCOUNT_ID');
    const hederaPrivateKey = Deno.env.get('HEDERA_PRIVATE_KEY');

    if (!hederaAccountId || !hederaPrivateKey) {
      throw new Error('Hedera credentials not configured');
    }

    // Import Hedera SDK
    const {
      AccountId,
      PrivateKey,
      Client,
      TokenMintTransaction,
      TokenId
    } = await import("https://esm.sh/@hashgraph/sdk@2.64.5");

    // Create Hedera client
    const client = Client.forTestnet();
    const operatorAccountId = AccountId.fromString(hederaAccountId);
    const operatorPrivateKey = PrivateKey.fromStringECDSA(hederaPrivateKey);
    
    client.setOperator(operatorAccountId, operatorPrivateKey);

    // Get or create certificate NFT collection
    const certificateCollectionId = await getCertificateCollectionId(client);

    // Create compact NFT metadata (Hedera has size limits)
    const nftMetadata = JSON.stringify({
      name: `Certificate: ${body.courseName}`,
      description: `Digital certificate for ${body.recipientName}`,
      properties: {
        certificateId: certificateData.id,
        ipfsCid: ipfsCid,
        certificateHash: certificateHash,
        verificationMethod: "ipfs_nft_proof"
      }
    });

    // Mint the NFT
    const metadataEncoder = new TextEncoder();
    const tokenMintTx = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(certificateCollectionId))
      .setMetadata([metadataEncoder.encode(nftMetadata)]);

    const tokenMintResponse = await tokenMintTx.execute(client);
    const tokenMintReceipt = await tokenMintResponse.getReceipt(client);
    
    if (!tokenMintReceipt.serials || tokenMintReceipt.serials.length === 0) {
      throw new Error('Failed to mint certificate NFT');
    }

    const nftTokenId = `${certificateCollectionId}-${tokenMintReceipt.serials[0].toString()}`;
    const transactionId = tokenMintResponse.transactionId.toString();

    client.close();

    console.log('Certificate NFT minted:', nftTokenId, 'Transaction:', transactionId);

    // Step 4: Update certificate record with NFT data
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        ipfs_hash: ipfsCid,
        nft_collection_id: certificateCollectionId,
        nft_token_id: nftTokenId,
        hedera_transaction_id: transactionId,
        status: 'issued'
      })
      .eq('id', certificate.id);

    if (updateError) {
      console.error('Failed to update certificate:', updateError);
      throw new Error('Failed to finalize certificate issuance');
    }

    const verificationUrl = `${req.headers.get('origin')}/verify?nft=${nftTokenId}`;

    return new Response(JSON.stringify({
      success: true,
      certificateId: certificate.id,
      transactionId,
      nftTokenId,
      collectionId: certificateCollectionId,
      ipfsCid,
      cidHash,
      verificationUrl,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
      hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      nftUrl: `https://hashscan.io/testnet/token/${certificateCollectionId}/${tokenMintReceipt.serials[0].toString()}`,
      message: "Certificate successfully issued as NFT with cryptographic proof on Hedera blockchain"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error issuing certificate NFT:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to create deterministic hashes
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}