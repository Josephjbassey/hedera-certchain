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

// Production-ready topic management
const getOrCreateCertificateTopic = async (client: any, operatorAccountId: string) => {
  // Try to use existing topic first (stored in environment for production)
  const existingTopicId = Deno.env.get('CERTIFICATE_TOPIC_ID');
  if (existingTopicId) {
    console.log('Using existing certificate topic:', existingTopicId);
    return existingTopicId;
  }

  // Create new topic for certificate anchoring
  const { TopicCreateTransaction } = await import("https://esm.sh/@hashgraph/sdk@2.64.5");
  
  const topicCreateTx = new TopicCreateTransaction()
    .setTopicMemo("HederaCertChain Certificate Anchoring")
    .setAdminKey(client.operatorPublicKey)
    .setSubmitKey(client.operatorPublicKey);

  const topicCreateResponse = await topicCreateTx.execute(client);
  const topicCreateReceipt = await topicCreateResponse.getReceipt(client);
  
  if (!topicCreateReceipt.topicId) {
    throw new Error('Failed to create certificate topic');
  }
  
  const newTopicId = topicCreateReceipt.topicId.toString();
  
  console.log('Created new certificate topic:', newTopicId);
  return newTopicId;
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
    
    console.log('Starting certificate issuance for user:', user.id);

    console.log('Certificate request body:', body);

    // Generate comprehensive certificate object with timestamp and issuer signature
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

    // Step 2: Generate CID hash for immutable anchoring to Hedera
    const cidEncoder = new TextEncoder();
    const cidData = cidEncoder.encode(ipfsCid);
    const cidHashBuffer = await crypto.subtle.digest('SHA-256', cidData);
    const cidHashArray = Array.from(new Uint8Array(cidHashBuffer));
    const cidHash = cidHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    console.log('Generated CID hash for Hedera:', cidHash);

    // Step 3: Submit immutable proof to Hedera HCS
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
      TopicMessageSubmitTransaction
    } = await import("https://esm.sh/@hashgraph/sdk@2.64.5");

    // Create Hedera client
    const client = Client.forTestnet();
    const operatorAccountId = AccountId.fromString(hederaAccountId);
    const operatorPrivateKey = PrivateKey.fromStringECDSA(hederaPrivateKey);
    
    client.setOperator(operatorAccountId, operatorPrivateKey);

    // Get or create certificate topic
    const certificateTopicId = await getOrCreateCertificateTopic(client, hederaAccountId);

    // Create immutable proof message (only CID hash, not full certificate data)
    const proofMessage = JSON.stringify({
      type: "CERTIFICATE_PROOF",
      version: "1.0",
      certificateId: certificateData.id,
      ipfsCid: ipfsCid,
      cidHash: cidHash,
      issuerUserId: user.id,
      issuerOrganization: body.issuerOrganization,
      timestamp: Date.now(),
      // Include minimal verification data
      recipientHash: await hashString(body.recipientEmail),
      courseHash: await hashString(body.courseName)
    });

    // Submit proof to certificate topic
    const txTopicMessageSubmit = await new TopicMessageSubmitTransaction()
      .setTopicId(certificateTopicId)
      .setMessage(proofMessage);

    const txTopicMessageSubmitResponse = await txTopicMessageSubmit.execute(client);
    const transactionId = txTopicMessageSubmitResponse.transactionId.toString();

    client.close();

    console.log('Certificate proof submitted to Hedera:', transactionId);

    // Step 4: Update certificate record with secure data
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        ipfs_hash: ipfsCid,
        hedera_topic_id: certificateTopicId,
        hedera_transaction_id: transactionId,
        status: 'issued'
      })
      .eq('id', certificate.id);

    if (updateError) {
      console.error('Failed to update certificate:', updateError);
      throw new Error('Failed to finalize certificate issuance');
    }

    const verificationUrl = `${req.headers.get('origin')}/verify?cid=${ipfsCid}`;

    return new Response(JSON.stringify({
      success: true,
      certificateId: certificate.id,
      transactionId,
      topicId: certificateTopicId,
      ipfsCid,
      cidHash,
      verificationUrl,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
      hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`,
      message: "Certificate successfully issued with cryptographic proof on Hedera blockchain"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error issuing certificate:', error);
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