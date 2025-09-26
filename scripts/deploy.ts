import { ethers } from "hardhat";
import { CertificateNFT } from "../typechain-types";

async function main() {
  console.log("🚀 Starting CertificateNFT deployment to Hedera...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR");
  
  if (balance === 0n) {
    throw new Error("❌ Deployer account has no HBAR. Please fund your account first.");
  }

  // Deploy CertificateNFT contract
  console.log("\n📦 Deploying CertificateNFT contract...");
  const CertificateNFTFactory = await ethers.getContractFactory("CertificateNFT");
  
  // Deploy with constructor parameters
  const initialOwner = deployer.address; // Contract owner
  const certificateNFT = await CertificateNFTFactory.deploy(initialOwner) as CertificateNFT;
  
  await certificateNFT.waitForDeployment();
  const contractAddress = await certificateNFT.getAddress();
  
  console.log("✅ CertificateNFT deployed to:", contractAddress);
  console.log("👤 Contract owner:", initialOwner);
  
  // Verify initial state
  console.log("\n🔍 Verifying deployment...");
  const owner = await certificateNFT.owner();
  const name = await certificateNFT.name();
  const symbol = await certificateNFT.symbol();
  
  console.log("📄 Contract Name:", name);
  console.log("🏷️  Contract Symbol:", symbol);
  console.log("👑 Contract Owner:", owner);
  
  // Check if deployer is authorized issuer (should be true by default)
  const isAuthorized = await certificateNFT.isAuthorizedIssuer(deployer.address);
  console.log("🎫 Deployer is authorized issuer:", isAuthorized);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Summary:");
  console.log(`   Contract Address: ${contractAddress}`);
  console.log(`   Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`   Owner: ${owner}`);
  
  console.log("\n📝 Next steps:");
  console.log("1. Add this contract address to your .env file:");
  console.log(`   VITE_CONTRACT_ADDRESS_TESTNET=${contractAddress}`);
  console.log("2. Update your frontend configuration");
  console.log("3. Test certificate issuance");
  
  return {
    contractAddress,
    deployer: deployer.address,
    name,
    symbol,
  };
}

// Handle script execution
main()
  .then((result) => {
    console.log("\n✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });