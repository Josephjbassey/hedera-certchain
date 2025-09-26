import { ethers } from "hardhat";

async function main() {
  // Get contract address from command line arguments or environment
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS_TESTNET || process.argv[2];
  
  if (!contractAddress) {
    throw new Error("Please provide contract address as argument or set VITE_CONTRACT_ADDRESS_TESTNET");
  }

  console.log("🔍 Verifying CertificateNFT contract at:", contractAddress);
  
  // Get contract instance
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const contract = CertificateNFT.attach(contractAddress);
  
  try {
    // Basic contract information
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    const totalSupply = await contract.getTotalCertificates();
    
    console.log("\n📄 Contract Information:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Total Certificates: ${totalSupply}`);
    
    // Network information
    const network = await ethers.provider.getNetwork();
    const blockNumber = await ethers.provider.getBlockNumber();
    
    console.log("\n🌐 Network Information:");
    console.log(`   Network: ${network.name}`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Current Block: ${blockNumber}`);
    
    // Check deployer authorization
    const [deployer] = await ethers.getSigners();
    const isAuthorized = await contract.isAuthorizedIssuer(deployer.address);
    
    console.log("\n🎫 Authorization Status:");
    console.log(`   Deployer (${deployer.address}): ${isAuthorized ? '✅ Authorized' : '❌ Not Authorized'}`);
    
    console.log("\n✅ Contract verification completed successfully!");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n🎉 Verification script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Verification script failed:", error);
    process.exit(1);
  });