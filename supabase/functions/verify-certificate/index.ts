import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  transactionId?: string;
  certificateHash?: string;
  verificationMethod: 'transaction_id' | 'file_hash';
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
    console.log('Verification request:', body);

    let certificate = null;
    let hederaData = null;

    if (body.verificationMethod === 'transaction_id' && body.transactionId) {
      // First check our database
      const { data: dbCertificate } = await supabase
        .from('certificates')
        .select('*')
        .eq('hedera_transaction_id', body.transactionId)
        .single();

      certificate = dbCertificate;

      // Also verify from Hedera Mirror Node
      try {
        const mirrorResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/transactions/${body.transactionId}`
        );

        if (mirrorResponse.ok) {
          hederaData = await mirrorResponse.json();
        }
      } catch (error) {
        console.log('Mirror node lookup failed:', error);
      }

    } else if (body.verificationMethod === 'file_hash' && body.certificateHash) {
      // Verify by certificate hash
      const { data: dbCertificate } = await supabase
        .from('certificates')
        .select('*')
        .eq('certificate_hash', body.certificateHash)
        .single();

      certificate = dbCertificate;

      // If we have the certificate, also get Hedera data
      if (certificate?.hedera_transaction_id) {
        try {
          const mirrorResponse = await fetch(
            `https://testnet.mirrornode.hedera.com/api/v1/transactions/${certificate.hedera_transaction_id}`
          );

          if (mirrorResponse.ok) {
            hederaData = await mirrorResponse.json();
          }
        } catch (error) {
          console.log('Mirror node lookup failed:', error);
        }
      }
    }

    // Log verification attempt
    if (certificate) {
      await supabase
        .from('verification_logs')
        .insert({
          certificate_id: certificate.id,
          hedera_transaction_id: body.transactionId || certificate.hedera_transaction_id,
          verification_method: body.verificationMethod,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        });
    }

    if (!certificate) {
      return new Response(JSON.stringify({
        success: false,
        verified: false,
        message: 'Certificate not found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Additional verification from IPFS if available
    let ipfsContent = null;
    if (certificate.ipfs_hash) {
      try {
        const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${certificate.ipfs_hash}`);
        if (ipfsResponse.ok) {
          ipfsContent = {
            available: true,
            hash: certificate.ipfs_hash,
            url: `https://gateway.pinata.cloud/ipfs/${certificate.ipfs_hash}`
          };
        }
      } catch (error) {
        console.log('IPFS lookup failed:', error);
      }
    }

    const verificationResult = {
      success: true,
      verified: true,
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
        mirrorNodeData: hederaData
      },
      ipfs: ipfsContent,
      verifiedAt: new Date().toISOString()
    };

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