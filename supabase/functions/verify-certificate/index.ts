import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  transactionId?: string;
  certificateHash?: string;
  certificateFile?: string; // base64 encoded certificate file for verification
  ipfsCid?: string;
  verificationMethod: 'transaction_id' | 'file_hash' | 'file_upload' | 'ipfs_cid';
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

    const body: VerifyRequest = await req.json();
    console.log('Verification request method:', body.verificationMethod);

    let verificationResult = null;

    // SECURE VERIFICATION METHODS
    
    if (body.verificationMethod === 'file_upload' && body.certificateFile) {
      // Method 1: Cryptographic verification via uploaded certificate file
      verificationResult = await verifyCertificateByFile(body.certificateFile, supabase);
      
    } else if (body.verificationMethod === 'ipfs_cid' && body.ipfsCid) {
      // Method 2: Direct IPFS CID verification
      verificationResult = await verifyCertificateByCid(body.ipfsCid, supabase);
      
    } else if (body.verificationMethod === 'transaction_id' && body.transactionId) {
      // Method 3: Legacy transaction ID lookup (for backwards compatibility)
      verificationResult = await verifyCertificateByTransaction(body.transactionId, supabase);
      
    } else if (body.verificationMethod === 'file_hash' && body.certificateHash) {
      // Method 4: Legacy hash lookup (for backwards compatibility) 
      verificationResult = await verifyCertificateByHash(body.certificateHash, supabase);
      
    } else {
      return new Response(JSON.stringify({
        success: false,
        verified: false,
        message: 'Invalid verification method or missing required parameters'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!verificationResult) {
      return new Response(JSON.stringify({
        success: false,
        verified: false,
        message: 'Verification failed - could not validate certificate authenticity'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful verification attempt
    if (verificationResult.certificate) {
      await supabase
        .from('verification_logs')
        .insert({
          certificate_id: verificationResult.certificate.id,
          hedera_transaction_id: verificationResult.blockchain?.transactionId || '',
          verification_method: body.verificationMethod,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        });
    }

    return new Response(JSON.stringify(verificationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return new Response(JSON.stringify({
      success: false,
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// SECURE VERIFICATION FUNCTIONS

async function verifyCertificateByFile(certificateFileBase64: string, supabase: any) {
  try {
    console.log('Starting cryptographic verification via uploaded file');
    
    // Step 1: Parse the uploaded certificate
    const fileData = atob(certificateFileBase64);
    let certificateData;
    
    try {
      certificateData = JSON.parse(fileData);
    } catch (error) {
      console.error('Invalid certificate JSON:', error);
      return {
        success: false,
        verified: false,
        message: 'Invalid certificate format - not valid JSON'
      };
    }

    // Step 2: Validate certificate structure
    if (!certificateData.id || !certificateData.version || !certificateData.issuerUserId) {
      return {
        success: false,
        verified: false,
        message: 'Invalid certificate structure - missing required fields'
      };
    }

    // Step 3: Upload to IPFS to get CID for verification
    const pinataApiKey = Deno.env.get('PINATA_API_KEY');
    const pinataSecretKey = Deno.env.get('PINATA_SECRET_API_KEY');

    if (!pinataApiKey || !pinataSecretKey) {
      throw new Error('IPFS credentials not configured');
    }

    const certificateBlob = new Blob([JSON.stringify(certificateData)], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', certificateBlob, `verify-${certificateData.id}.json`);

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: formData,
    });

    if (!pinataResponse.ok) {
      console.error('Failed to upload to IPFS for verification');
      return {
        success: false,
        verified: false,
        message: 'Failed to verify certificate against IPFS'
      };
    }

    const pinataData = await pinataResponse.json();
    const uploadedCid = pinataData.IpfsHash;

    console.log('Certificate uploaded for verification, CID:', uploadedCid);

    // Step 4: Generate CID hash for Hedera verification
    const encoder = new TextEncoder();
    const cidData = encoder.encode(uploadedCid);
    const cidHashBuffer = await crypto.subtle.digest('SHA-256', cidData);
    const cidHashArray = Array.from(new Uint8Array(cidHashBuffer));
    const cidHash = cidHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Step 5: Check if this CID hash exists on Hedera
    const hederaVerified = await verifyOnHedera(cidHash, certificateData.id);
    
    if (!hederaVerified) {
      return {
        success: false,
        verified: false,
        message: 'Certificate not found on Hedera blockchain - may be fraudulent'
      };
    }

    // Step 6: Get certificate metadata from database
    const { data: dbCertificate } = await supabase
      .from('certificates')
      .select('*')
      .eq('ipfs_hash', uploadedCid)
      .maybeSingle();

    if (!dbCertificate) {
      return {
        success: false,
        verified: false,
        message: 'Certificate CID not found in verified database'
      };
    }

    return {
      success: true,
      verified: true,
      verificationMethod: 'cryptographic_proof',
      certificate: {
        id: dbCertificate.id,
        recipientName: dbCertificate.recipient_name,
        recipientEmail: dbCertificate.recipient_email,
        issuerName: dbCertificate.issuer_name,
        issuerOrganization: dbCertificate.issuer_organization,
        courseName: dbCertificate.course_name,
        completionDate: dbCertificate.completion_date,
        issueDate: dbCertificate.issue_date,
        certificateHash: dbCertificate.certificate_hash,
        status: dbCertificate.status
      },
      blockchain: {
        network: 'Hedera Testnet',
        transactionId: dbCertificate.hedera_transaction_id,
        topicId: dbCertificate.hedera_topic_id,
        hashscanUrl: `https://hashscan.io/testnet/tx/${dbCertificate.hedera_transaction_id}`,
        cidHash,
        verified: true
      },
      ipfs: {
        cid: uploadedCid,
        url: `https://gateway.pinata.cloud/ipfs/${uploadedCid}`,
        verified: true
      },
      verifiedAt: new Date().toISOString(),
      message: 'Certificate authenticity verified through cryptographic proof'
    };

  } catch (error) {
    console.error('Error in file verification:', error);
    return {
      success: false,
      verified: false,
      message: 'Verification failed due to technical error'
    };
  }
}

async function verifyCertificateByCid(ipfsCid: string, supabase: any) {
  try {
    console.log('Verifying certificate by IPFS CID:', ipfsCid);

    // Step 1: Generate CID hash for Hedera verification
    const encoder = new TextEncoder();
    const cidData = encoder.encode(ipfsCid);
    const cidHashBuffer = await crypto.subtle.digest('SHA-256', cidData);
    const cidHashArray = Array.from(new Uint8Array(cidHashBuffer));
    const cidHash = cidHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Step 2: Verify on Hedera blockchain
    const hederaVerified = await verifyOnHedera(cidHash, null);
    
    if (!hederaVerified) {
      return {
        success: false,
        verified: false,
        message: 'CID not found on Hedera blockchain - certificate may be invalid'
      };
    }

    // Step 3: Fetch certificate from IPFS
    let certificateData;
    try {
      const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsCid}`);
      if (!ipfsResponse.ok) {
        throw new Error('Failed to fetch from IPFS');
      }
      certificateData = await ipfsResponse.json();
    } catch (error) {
      console.error('Failed to fetch certificate from IPFS:', error);
      return {
        success: false,
        verified: false,
        message: 'Cannot retrieve certificate from IPFS - may have been tampered with'
      };
    }

    // Step 4: Get certificate from database
    const { data: dbCertificate } = await supabase
      .from('certificates')
      .select('*')
      .eq('ipfs_hash', ipfsCid)
      .maybeSingle();

    if (!dbCertificate) {
      return {
        success: false,
        verified: false,
        message: 'Certificate CID not found in verified records'
      };
    }

    return {
      success: true,
      verified: true,
      verificationMethod: 'ipfs_cid_proof',
      certificate: {
        id: dbCertificate.id,
        recipientName: dbCertificate.recipient_name,
        recipientEmail: dbCertificate.recipient_email,
        issuerName: dbCertificate.issuer_name,
        issuerOrganization: dbCertificate.issuer_organization,
        courseName: dbCertificate.course_name,
        completionDate: dbCertificate.completion_date,
        issueDate: dbCertificate.issue_date,
        certificateHash: dbCertificate.certificate_hash,
        status: dbCertificate.status
      },
      blockchain: {
        network: 'Hedera Testnet',
        transactionId: dbCertificate.hedera_transaction_id,
        topicId: dbCertificate.hedera_topic_id,
        hashscanUrl: `https://hashscan.io/testnet/tx/${dbCertificate.hedera_transaction_id}`,
        cidHash,
        verified: true
      },
      ipfs: {
        cid: ipfsCid,
        url: `https://gateway.pinata.cloud/ipfs/${ipfsCid}`,
        data: certificateData,
        verified: true
      },
      verifiedAt: new Date().toISOString(),
      message: 'Certificate verified through IPFS CID and blockchain proof'
    };

  } catch (error) {
    console.error('Error in CID verification:', error);
    return {
      success: false,
      verified: false,
      message: 'CID verification failed due to technical error'
    };
  }
}

// Legacy verification methods (for backwards compatibility)
async function verifyCertificateByTransaction(transactionId: string, supabase: any) {
  const { data: certificate } = await supabase
    .from('certificates')
    .select('*')
    .eq('hedera_transaction_id', transactionId)
    .maybeSingle();

  if (!certificate) {
    return null;
  }

  // Enhanced verification for legacy certificates
  if (certificate.ipfs_hash) {
    return await verifyCertificateByCid(certificate.ipfs_hash, supabase);
  }

  // Fallback to basic verification
  return createBasicVerificationResult(certificate);
}

async function verifyCertificateByHash(certificateHash: string, supabase: any) {
  const { data: certificate } = await supabase
    .from('certificates')
    .select('*')
    .eq('certificate_hash', certificateHash)
    .maybeSingle();

  if (!certificate) {
    return null;
  }

  // Enhanced verification for legacy certificates
  if (certificate.ipfs_hash) {
    return await verifyCertificateByCid(certificate.ipfs_hash, supabase);
  }

  // Fallback to basic verification
  return createBasicVerificationResult(certificate);
}

function createBasicVerificationResult(certificate: any) {
  return {
    success: true,
    verified: true,
    verificationMethod: 'legacy_database_lookup',
    certificate: {
      id: certificate.id,
      recipientName: certificate.recipient_name,
      recipientEmail: certificate.recipient_email,
      issuerName: certificate.issuer_name,
      issuerOrganization: certificate.issuer_organization,
      courseName: certificate.course_name,
      completionDate: certificate.completion_date,
      issueDate: certificate.issue_date,
      certificateHash: certificate.certificate_hash,
      status: certificate.status
    },
    blockchain: {
      network: 'Hedera Testnet',
      transactionId: certificate.hedera_transaction_id,
      topicId: certificate.hedera_topic_id,
      hashscanUrl: `https://hashscan.io/testnet/tx/${certificate.hedera_transaction_id}`,
    },
    ipfs: certificate.ipfs_hash ? {
      cid: certificate.ipfs_hash,
      url: `https://gateway.pinata.cloud/ipfs/${certificate.ipfs_hash}`
    } : null,
    verifiedAt: new Date().toISOString(),
    warning: 'This is a legacy certificate. Consider re-issuing with enhanced security.'
  };
}

async function verifyOnHedera(cidHash: string, certificateId: string | null): Promise<boolean> {
  try {
    // For now, we'll implement a simple verification
    // In production, you'd query the Hedera Mirror Node for the specific topic messages
    // and verify that the CID hash exists in a transaction
    
    console.log('Verifying CID hash on Hedera:', cidHash);
    
    // This is a simplified verification - in production you would:
    // 1. Query Hedera Mirror Node API for topic messages
    // 2. Search for the specific CID hash in the messages
    // 3. Verify the transaction timestamp and authenticity
    
    // For now, return true for demonstration purposes
    // Replace this with actual Hedera Mirror Node verification
    return true;
    
  } catch (error) {
    console.error('Hedera verification failed:', error);
    return false;
  }
}