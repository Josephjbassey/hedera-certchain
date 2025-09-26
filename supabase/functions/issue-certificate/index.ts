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
    
    console.log('Starting secure certificate issuance for user:', user.id);

    // Step 1: Generate comprehensive certificate with cryptographic integrity
    const issueTimestamp = new Date().toISOString();
    const certificateId = crypto.randomUUID();
    
    const certificateData = {
      version: "2.0",
      id: certificateId,
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

    // Step 2: Create deterministic hash of certificate content for integrity
    const encoder = new TextEncoder();
    const dataString = JSON.stringify(certificateData, Object.keys(certificateData).sort());
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated certificate hash:', certificateHash);

    // Step 3: Upload certificate to IPFS via Pinata for immutable storage
    const pinataApiKey = Deno.env.get('PINATA_API_KEY');
    const pinataSecretKey = Deno.env.get('PINATA_SECRET_API_KEY');

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('IPFS credentials not configured');
    }

    // Create JSON blob for IPFS
    const certificateJsonBlob = new Blob([JSON.stringify(certificateData, null, 2)], { 
      type: 'application/json' 
    });

    const formData = new FormData();
    formData.append('file', certificateJsonBlob, `certificate-${certificateId}.json`);
    
    const metadata = JSON.stringify({
      name: `SecureCertificate-${certificateId}`,
      keyvalues: {
        certificateId: certificateId,
        recipientName: body.recipientName,
        courseName: body.courseName,
        hash: certificateHash,
        issuerUserId: user.id,
        version: "2.0",
        issueTimestamp: issueTimestamp
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
      console.error('Pinata upload failed:', errorText);
      throw new Error(`Failed to upload certificate to IPFS: ${errorText}`);
    }

    const pinataData = await pinataResponse.json();
    const ipfsCid = pinataData.IpfsHash;
    
    console.log('Certificate uploaded to IPFS with CID:', ipfsCid);

    // Step 4: Generate CID hash for Hedera Consensus Service anchoring
    const cidEncoder = new TextEncoder();
    const cidData = cidEncoder.encode(ipfsCid);
    const cidHashBuffer = await crypto.subtle.digest('SHA-256', cidData);
    const cidHashArray = Array.from(new Uint8Array(cidHashBuffer));
    const cidHash = cidHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated CID hash for Hedera anchoring:', cidHash);

    // Step 5: Create Hedera NFT for immutable certificate proof
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
    
    // Support both ECDSA and ED25519 keys
    let operatorPrivateKey;
    try {
      operatorPrivateKey = PrivateKey.fromStringECDSA(hederaPrivateKey);
    } catch {
      operatorPrivateKey = PrivateKey.fromStringED25519(hederaPrivateKey);
    }
    
    client.setOperator(operatorAccountId, operatorPrivateKey);

    let nftCollectionId = "0.0.6903181"; // Certificate collection
    let transactionId;
    let nftTokenId;

    try {
      // Create ultra-minimal metadata to avoid size limits
      const nftMetadata = new TextEncoder().encode(JSON.stringify({
        cid: ipfsCid,
        hash: cidHash.substring(0, 32), // Truncate for size
        org: body.issuerOrganization.substring(0, 20)
      }));

      console.log('Minting NFT with metadata size:', nftMetadata.length, 'bytes');

      // Mint NFT with certificate proof
      const mintTx = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(nftCollectionId))
        .addMetadata(nftMetadata)
        .freezeWith(client);

      const signedMintTx = await mintTx.sign(operatorPrivateKey);
      const mintResponse = await signedMintTx.execute(client);
      const mintReceipt = await mintResponse.getReceipt(client);
      
      if (!mintReceipt.serials || mintReceipt.serials.length === 0) {
        throw new Error('Failed to mint certificate NFT');
      }

      const nftSerial = mintReceipt.serials[0].toString();
      nftTokenId = `${nftCollectionId}-${nftSerial}`;
      transactionId = mintResponse.transactionId.toString();

      console.log('Certificate NFT minted. Token:', nftTokenId, 'Transaction:', transactionId);

    } catch (hederaError) {
      client?.close();
      console.error('Hedera NFT creation failed:', hederaError);
      throw new Error(`Failed to create certificate NFT: ${hederaError instanceof Error ? hederaError.message : 'Unknown error'}`);
    }
    
    client.close();

    // Step 6: Store only essential metadata in Supabase (not the full certificate)
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
        ipfs_hash: ipfsCid,
        hedera_transaction_id: transactionId,
        nft_token_id: nftTokenId,
        status: 'issued'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to create certificate record');
    }

    const verificationUrl = `${req.headers.get('origin')}/verify?cid=${ipfsCid}`;

    return new Response(JSON.stringify({
      success: true,
      certificateId: certificate.id,
      transactionId,
      nftTokenId,
      ipfsCid,
      cidHash,
      certificateHash,
      verificationUrl,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
      hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      nftUrl: `https://hashscan.io/testnet/token/${nftTokenId.split('-')[0]}`,
      message: "Certificate securely issued with IPFS + Hedera NFT proof"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error issuing secure certificate:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});