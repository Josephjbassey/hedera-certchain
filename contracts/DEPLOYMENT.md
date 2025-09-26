# Smart Contract Deployment Guide

This guide walks you through deploying the CertificateNFT smart contract to Hedera EVM.

## Prerequisites

1. **Node.js and npm** installed
2. **Hardhat** for contract deployment
3. **Hedera testnet account** with HBAR for gas fees
4. **MetaMask or HashPack** wallet configured for Hedera

## Step 1: Install Hardhat and Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

## Step 2: Initialize Hardhat

```bash
npx hardhat init
```

Choose "Create a TypeScript project" when prompted.

## Step 3: Configure Hardhat for Hedera

Update `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 296,
      gas: 3000000,
      gasPrice: 10000000000, // 10 Gwei
    },
    hederaMainnet: {
      url: "https://mainnet.hashio.io/api", 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 295,
      gas: 3000000,
      gasPrice: 10000000000,
    },
  },
  etherscan: {
    apiKey: {
      hederaTestnet: "abc", // Placeholder - Hedera doesn't use Etherscan
      hederaMainnet: "abc",
    },
    customChains: [
      {
        network: "hederaTestnet",
        chainId: 296,
        urls: {
          apiURL: "https://server-verify.hashscan.io",
          browserURL: "https://hashscan.io/testnet",
        },
      },
      {
        network: "hederaMainnet", 
        chainId: 295,
        urls: {
          apiURL: "https://server-verify.hashscan.io",
          browserURL: "https://hashscan.io/mainnet",
        },
      },
    ],
  },
};

export default config;
```

## Step 4: Create Environment Variables

Create a `.env.local` file in the contracts directory:

```env
# Deployment Configuration
PRIVATE_KEY="your_evm_private_key_here"
HEDERA_ACCOUNT_ID="0.0.123456"

# Contract Configuration
INITIAL_OWNER="0xYourWalletAddress"
```

⚠️ **Security Warning**: Never commit your private key to version control!

## Step 5: Create Deployment Script

Create `scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying CertificateNFT to Hedera...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await certificateNFT.deployed();
  
  console.log("✅ Contract deployed successfully!");
  console.log("Contract address:", certificateNFT.address);
  console.log("Transaction hash:", certificateNFT.deployTransaction.hash);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: certificateNFT.address,
    deployerAddress: deployer.address,
    transactionHash: certificateNFT.deployTransaction.hash,
    network: "hedera-testnet",
    deployedAt: new Date().toISOString(),
    blockNumber: certificateNFT.deployTransaction.blockNumber,
  };
  
  // Save to frontend env
  const envPath = path.join(__dirname, "../.env");
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }
  
  // Update contract address
  const contractAddressRegex = /VITE_CONTRACT_ADDRESS=.*/;
  const newContractAddressLine = `VITE_CONTRACT_ADDRESS="${certificateNFT.address}"`;
  
  if (contractAddressRegex.test(envContent)) {
    envContent = envContent.replace(contractAddressRegex, newContractAddressLine);
  } else {
    envContent += `\n${newContractAddressLine}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  
  // Save deployment details
  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment.json");
  console.log("🔧 Frontend .env updated with contract address");
  
  // Verify the contract (optional)
  console.log("⏳ Waiting 30 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    await run("verify:verify", {
      address: certificateNFT.address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on HashScan");
  } catch (error) {
    console.log("❌ Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
```

## Step 6: Deploy the Contract

```bash
# Deploy to Hedera testnet
npx hardhat run scripts/deploy.ts --network hederaTestnet

# For mainnet (when ready)
# npx hardhat run scripts/deploy.ts --network hederaMainnet
```

## Step 7: Verify Deployment

After deployment, verify your contract on HashScan:

1. Go to [HashScan Testnet](https://hashscan.io/testnet)
2. Search for your contract address
3. Confirm the contract is deployed and verified

## Step 8: Configure Frontend

The deployment script automatically updates your `.env` file with the contract address. Ensure these variables are set:

```env
VITE_CONTRACT_ADDRESS="0x..." # Set by deployment script
VITE_HEDERA_NETWORK="testnet"
VITE_HEDERA_RPC_URL="https://testnet.hashio.io/api"
VITE_HEDERA_CHAIN_ID="296"
```

## Step 9: Test the Contract

Create a test script to verify the deployment:

```typescript
// scripts/test-deployment.ts
import { ethers } from "hardhat";

async function main() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Contract address not found");
  }

  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const contract = CertificateNFT.attach(contractAddress);

  console.log("Testing contract at:", contractAddress);
  
  // Test basic functions
  const totalSupply = await contract.getTotalCertificates();
  console.log("Total certificates:", totalSupply.toString());
  
  const [signer] = await ethers.getSigners();
  const isAuthorized = await contract.isAuthorizedIssuer(signer.address);
  console.log("Is authorized issuer:", isAuthorized);
  
  console.log("✅ Contract is working correctly!");
}

main().catch(console.error);
```

Run the test:
```bash
npx hardhat run scripts/test-deployment.ts --network hederaTestnet
```

## Troubleshooting

### Common Issues:

1. **Insufficient HBAR balance**: Make sure your account has enough HBAR for gas fees
2. **Network connection**: Verify Hedera RPC endpoint is accessible
3. **Gas estimation failures**: Try increasing gas limit in hardhat.config.ts
4. **Private key format**: Ensure private key includes '0x' prefix

### Gas Optimization:

- The contract is optimized for gas efficiency
- Batch operations are available for multiple certificates
- Consider using proxy patterns for upgradeable contracts

### Security Notes:

- The contract owner can authorize/revoke issuers
- Certificate revocation marks NFTs as inactive but doesn't burn them
- All certificate data is stored on-chain for transparency
- IPFS hashes provide immutable metadata storage

## Next Steps

1. **Set up Pinata IPFS**: Configure your IPFS storage for certificate metadata
2. **Add authorized issuers**: Use the `authorizeIssuer` function to add certificate issuers
3. **Test minting**: Try minting a test certificate through your frontend
4. **Set up monitoring**: Monitor contract events and transactions

For more advanced features, consider implementing:
- Batch certificate minting
- Certificate templates
- Role-based access control
- Certificate expiration handling