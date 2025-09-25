import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  verificationMethod: 'nft_token_id' | 'ipfs_cid' | 'transaction_id' | 'file_upload';
  nftTokenId?: string;
  ipfsCid?: string;
  transactionId?: string;
  certificateFile?: string; // base64 encoded for file upload verification
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: VerifyRequest = await req.json();
    console.log('Verification request method:', body.verificationMethod);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let certificate = null;
    let verificationResult = null;
    let verificationMethod = body.verificationMethod;

    // Method 1: Verify by NFT Token ID (most direct)
    if (body.verificationMethod === 'nft_token_id' && body.nftTokenId) {
      console.log('Verifying certificate by NFT Token ID:', body.nftTokenId);
      
      // Check database for NFT
      const { data: dbCert, error: dbError } = await supabase
        .from('certificates')
        .select('*')
        .eq('nft_token_id', body.nftTokenId)
        .eq('status', 'issued')
        .maybeSingle();

      if (dbError) {
        throw new Error('Database error during verification');
      }

      if (!dbCert) {
        return new Response(JSON.stringify({
          success: false,
          verified: false,
          message: "Certificate not found or not issued"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      certificate = dbCert;

      // Verify NFT exists on Hedera
      try {
        const hederaAccountId = Deno.env.get('HEDERA_ACCOUNT_ID');
        const hederaPrivateKey = Deno.env.get('HEDERA_PRIVATE_KEY');

        if (hederaAccountId && hederaPrivateKey) {
          const { AccountId, PrivateKey, Client, TokenNftInfoQuery, TokenId } = await import("https://esm.sh/@hashgraph/sdk@2.64.5");
          
          const client = Client.forTestnet();
          client.setOperator(
            AccountId.fromString(hederaAccountId),
            PrivateKey.fromStringECDSA(hederaPrivateKey)
          );

          // Parse NFT token ID
          const [collectionId, serialNumber] = body.nftTokenId.split('-');
          
          const nftInfoQuery = new TokenNftInfoQuery()
            .setTokenId(TokenId.fromString(collectionId))
            .setNftId(serialNumber);

          const nftInfo = await nftInfoQuery.execute(client);
          client.close();

          if (nftInfo && nftInfo.length > 0) {
            const nftMetadata = nftInfo[0].metadata ? new TextDecoder().decode(nftInfo[0].metadata) : null;
            verificationResult = {
              verified: true,
              nftExists: true,
              nftMetadata: nftMetadata ? JSON.parse(nftMetadata) : null,
              collectionId,
              serialNumber: parseInt(serialNumber)
            };
          } else {
            throw new Error('NFT not found on blockchain');
          }
        }
      } catch (error) {
        console.error('Error verifying NFT on Hedera:', error);
        verificationResult = {
          verified: false,
          nftExists: false,
          error: 'Failed to verify NFT on blockchain'
        };
      }
    }

    // Method 2: Verify by IPFS CID
    else if (body.verificationMethod === 'ipfs_cid' && body.ipfsCid) {
      console.log('Verifying certificate by IPFS CID:', body.ipfsCid);
      
      const { data: dbCert, error: dbError } = await supabase
        .from('certificates')
        .select('*')
        .eq('ipfs_hash', body.ipfsCid)
        .eq('status', 'issued')
        .maybeSingle();

      if (dbError) {
        throw new Error('Database error during verification');
      }

      if (!dbCert) {
        return new Response(JSON.stringify({
          success: false,
          verified: false,
          message: "Certificate not found"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      certificate = dbCert;

      // Verify IPFS content and generate CID hash
      try {
        const ipfsResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${body.ipfsCid}`);
        if (!ipfsResponse.ok) {
          throw new Error('Failed to fetch certificate from IPFS');
        }

        const ipfsData = await ipfsResponse.json();
        
        // Generate CID hash for verification
        const encoder = new TextEncoder();
        const cidData = encoder.encode(body.ipfsCid);
        const cidHashBuffer = await crypto.subtle.digest('SHA-256', cidData);
        const cidHashArray = Array.from(new Uint8Array(cidHashBuffer));
        const cidHash = cidHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        verificationResult = {
          verified: true,
          ipfsData,
          cidHash,
          ipfsAccessible: true
        };
        verificationMethod = body.verificationMethod;
      } catch (error) {
        console.error('Error verifying IPFS content:', error);
        verificationResult = {
          verified: false,
          ipfsAccessible: false,
          error: 'Failed to access IPFS content'
        };
      }
    }

    // Method 3: Legacy support - Verify by Transaction ID (find associated NFT)
    else if (body.verificationMethod === 'transaction_id' && body.transactionId) {
      console.log('Verifying certificate by transaction ID:', body.transactionId);
      
      const { data: dbCert, error: dbError } = await supabase
        .from('certificates')
        .select('*')
        .eq('hedera_transaction_id', body.transactionId)
        .eq('status', 'issued')
        .maybeSingle();

      if (dbError) {
        throw new Error('Database error during verification');
      }

      if (!dbCert) {
        return new Response(JSON.stringify({
          success: false,
          verified: false,
          message: "Certificate not found"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      certificate = dbCert;
      verificationResult = {
        verified: true,
        foundByTransactionId: true,
        nftTokenId: dbCert.nft_token_id
      };
    }

    // Method 4: File Upload Verification
    else if (body.verificationMethod === 'file_upload' && body.certificateFile) {
      console.log('Verifying certificate by file upload');
      
      try {
        // Decode the uploaded file and parse it
        const fileContent = atob(body.certificateFile);
        const certificateData = JSON.parse(fileContent);

        // Generate hash of uploaded certificate content
        const encoder = new TextEncoder();
        const dataString = JSON.stringify(certificateData, Object.keys(certificateData).sort());
        const data = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const uploadedCertificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Check if this hash exists in our database
        const { data: dbCert, error: dbError } = await supabase
          .from('certificates')
          .select('*')
          .eq('certificate_hash', uploadedCertificateHash)
          .eq('status', 'issued')
          .maybeSingle();

        if (dbError) {
          throw new Error('Database error during verification');
        }

        if (!dbCert) {
          return new Response(JSON.stringify({
            success: false,
            verified: false,
            message: "Uploaded certificate does not match any issued certificates"
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        certificate = dbCert;
        verificationResult = {
          verified: true,
          uploadedCertificateHash,
          matchedDatabaseHash: dbCert.certificate_hash,
          nftTokenId: dbCert.nft_token_id
        };
        verificationMethod = body.verificationMethod;
      } catch (error) {
        console.error('Error verifying uploaded file:', error);
        return new Response(JSON.stringify({
          success: false,
          verified: false,
          message: "Failed to process uploaded certificate file"
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    else {
      return new Response(JSON.stringify({
        success: false,
        verified: false,
        message: "Invalid verification method or missing required parameters"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!certificate || !verificationResult) {
      return new Response(JSON.stringify({
        success: false,
        verified: false,
        message: "Verification failed - could not validate certificate authenticity"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log verification attempt
    await supabase
      .from('verification_logs')
      .insert({
        certificate_id: certificate.id,
        verification_method: verificationMethod,
        hedera_transaction_id: certificate.hedera_transaction_id,
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        user_agent: req.headers.get('user-agent')
      });

    // Return successful verification result
    return new Response(JSON.stringify({
      success: true,
      verified: verificationResult.verified,
      verificationMethod,
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
        network: "Hedera Testnet",
        transactionId: certificate.hedera_transaction_id,
        nftTokenId: certificate.nft_token_id,
        collectionId: certificate.nft_collection_id,
        hashscanUrl: certificate.hedera_transaction_id ? `https://hashscan.io/testnet/tx/${certificate.hedera_transaction_id}` : null,
        nftUrl: certificate.nft_token_id ? `https://hashscan.io/testnet/token/${certificate.nft_collection_id}/${certificate.nft_token_id.split('-')[1]}` : null,
        verified: verificationResult.verified
      },
      ipfs: {
        cid: certificate.ipfs_hash,
        url: certificate.ipfs_hash ? `https://gateway.pinata.cloud/ipfs/${certificate.ipfs_hash}` : null,
        data: verificationResult.ipfsData || null
      },
      nft: verificationResult.nftMetadata ? {
        metadata: verificationResult.nftMetadata,
        collectionId: verificationResult.collectionId,
        serialNumber: verificationResult.serialNumber
      } : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return new Response(JSON.stringify({
      success: false,
      verified: false,
      message: "Verification failed - could not validate certificate authenticity"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});