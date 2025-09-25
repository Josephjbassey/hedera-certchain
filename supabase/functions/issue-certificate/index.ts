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
    
    console.log('Starting certificate issuance for user:', user.id);

    // Generate certificate hash
    const certificateData = JSON.stringify({
      recipientName: body.recipientName,
      recipientEmail: body.recipientEmail,
      issuerName: body.issuerName,
      issuerOrganization: body.issuerOrganization,
      courseName: body.courseName,
      completionDate: body.completionDate,
      issueDate: new Date().toISOString(),
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(certificateData);
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

    // Upload to IPFS using Pinata
    const pinataApiKey = Deno.env.get('PINATA_API_KEY');
    const pinataSecretKey = Deno.env.get('PINATA_SECRET_API_KEY');

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('IPFS credentials not configured');
    }

    // Convert base64 to blob for IPFS upload
    const fileData = atob(body.certificateFile);
    const arrayBuffer = new ArrayBuffer(fileData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < fileData.length; i++) {
      uint8Array[i] = fileData.charCodeAt(i);
    }

    const formData = new FormData();
    const blob = new Blob([uint8Array], { type: body.fileType });
    formData.append('file', blob, body.fileName);
    
    const metadata = JSON.stringify({
      name: `Certificate-${certificate.id}`,
      keyvalues: {
        certificateId: certificate.id,
        recipientName: body.recipientName,
        courseName: body.courseName,
        hash: certificateHash
      }
    });
    formData.append('pinataMetadata', metadata);

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: formData,
    });

    if (!pinataResponse.ok) {
      throw new Error('Failed to upload to IPFS');
    }

    const pinataData = await pinataResponse.json();
    const ipfsHash = pinataData.IpfsHash;
    
    console.log('File uploaded to IPFS:', ipfsHash);

    // Submit to Hedera HCS
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
      TopicCreateTransaction,
      TopicMessageSubmitTransaction
    } = await import("https://esm.sh/@hashgraph/sdk@2.64.5");

    // Create Hedera client
    const client = Client.forTestnet();
    client.setOperator(
      AccountId.fromString(hederaAccountId),
      PrivateKey.fromStringECDSA(hederaPrivateKey)
    );

    // Create topic if needed (you might want to reuse an existing topic)
    const txCreateTopic = new TopicCreateTransaction();
    const txCreateTopicResponse = await txCreateTopic.execute(client);
    const receiptCreateTopicTx = await txCreateTopicResponse.getReceipt(client);
    const topicId = receiptCreateTopicTx.topicId?.toString();
    if (!topicId) {
      throw new Error('Failed to create Hedera topic');
    }

    // Prepare certificate message for Hedera
    const certificateMessage = JSON.stringify({
      certificateId: certificate.id,
      recipientName: body.recipientName,
      recipientEmail: body.recipientEmail,
      issuerName: body.issuerName,
      issuerOrganization: body.issuerOrganization,
      courseName: body.courseName,
      completionDate: body.completionDate,
      issueDate: new Date().toISOString(),
      certificateHash,
      ipfsHash,
      timestamp: Date.now()
    });

    // Submit message to Hedera topic
    const txTopicMessageSubmit = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(certificateMessage);

    const txTopicMessageSubmitResponse = await txTopicMessageSubmit.execute(client);
    const receiptTopicMessageSubmitTx = await txTopicMessageSubmitResponse.getReceipt(client);
    const transactionId = txTopicMessageSubmitResponse.transactionId.toString();

    client.close();

    console.log('Certificate submitted to Hedera:', transactionId);

    // Update certificate record with blockchain and IPFS data
    const { error: updateError } = await supabase
      .from('certificates')
      .update({
        ipfs_hash: ipfsHash,
        hedera_topic_id: topicId,
        hedera_transaction_id: transactionId,
        status: 'issued'
      })
      .eq('id', certificate.id);

    if (updateError) {
      console.error('Failed to update certificate:', updateError);
    }

    const verificationUrl = `${req.headers.get('origin')}/verify?id=${transactionId}`;

    return new Response(JSON.stringify({
      success: true,
      certificateId: certificate.id,
      transactionId,
      topicId,
      ipfsHash,
      verificationUrl,
      hashscanUrl: `https://hashscan.io/testnet/tx/${transactionId}`
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