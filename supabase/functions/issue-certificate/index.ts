import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IssueCertificateRequest {
  recipientWallet: string;
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Init Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth
    const authHeader = req.headers.get("Authorization")!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) throw new Error("Unauthorized");

    const body: IssueCertificateRequest = await req.json();
    const issueTimestamp = new Date().toISOString();

    // Certificate JSON
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
        originalFile: body.certificateFile,
      },
    };

    // Step 1: Upload to Pinata
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([JSON.stringify(certificateData, null, 2)], { type: "application/json" }),
      `certificate-${certificateData.id}.json`,
    );

    const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("PINATA_JWT")}` },
      body: formData,
    });
    if (!pinataResponse.ok) throw new Error(await pinataResponse.text());

    const { IpfsHash } = await pinataResponse.json();
    const ipfsUrl = `ipfs://${IpfsHash}`;

    // Step 2: Mint NFT on Hedera
    const {
      AccountId,
      PrivateKey,
      Client,
      TokenCreateTransaction,
      TokenType,
      TokenSupplyType,
      TokenMintTransaction,
      TransferTransaction,
    } = await import("https://esm.sh/@hashgraph/sdk@2.64.5");

    const client = Client.forTestnet()
      .setOperator(
        AccountId.fromString(Deno.env.get("HEDERA_ACCOUNT_ID")!),
        PrivateKey.fromStringECDSA(Deno.env.get("HEDERA_PRIVATE_KEY")!),
      );

    // Create NFT
    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName(body.issuerOrganization)
      .setTokenSymbol("CERTNFT")
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setMaxSupply(1)
      .setTreasuryAccountId(Deno.env.get("HEDERA_ACCOUNT_ID")!)
      .freezeWith(client);

    const tokenCreateSubmit = await tokenCreateTx.execute(client);
    const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
    const tokenId = tokenCreateReceipt.tokenId?.toString();
    if (!tokenId) throw new Error("Failed to create NFT token");

    // Mint NFT with IPFS metadata
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([new TextEncoder().encode(ipfsUrl)])
      .freezeWith(client);
    const mintSubmit = await mintTx.execute(client);
    const mintReceipt = await mintSubmit.getReceipt(client);

    // Auto transfer to recipient
    if (body.recipientWallet) {
      const transferTx = await new TransferTransaction()
        .addNftTransfer(tokenId, 1, Deno.env.get("HEDERA_ACCOUNT_ID")!, body.recipientWallet)
        .freezeWith(client);
      await transferTx.execute(client);
    }

    client.close();

    // Update DB
    await supabase.from("certificates").insert({
      user_id: user.id,
      recipient_name: body.recipientName,
      recipient_email: body.recipientEmail,
      issuer_name: body.issuerName,
      issuer_organization: body.issuerOrganization,
      course_name: body.courseName,
      completion_date: body.completionDate,
      certificate_hash: IpfsHash,
      ipfs_hash: IpfsHash,
      status: "issued",
    });

    return new Response(JSON.stringify({
      success: true,
      tokenId,
      ipfsCid: IpfsHash,
      ipfsUrl,
      explorer: `https://hashscan.io/testnet/token/${tokenId}`,
      message: "Certificate NFT minted successfully",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Error issuing certificate:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
