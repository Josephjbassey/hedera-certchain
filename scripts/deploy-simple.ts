import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Starting deployment to Hedera EVM...');

  // Check environment variables
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not found in environment variables');
  }

  // Setup provider and wallet
  const rpcUrl = 'https://testnet.hashio.io/api';
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`📝 Deploying with wallet: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} HBAR`);

  if (balance === 0n) {
    throw new Error('❌ Wallet has no HBAR. Please fund your account first.');
  }

  // For now, let's provide manual contract data until we set up proper compilation
  console.log(`
⚠️  MANUAL DEPLOYMENT SETUP REQUIRED:

To deploy your smart contract, you have two options:

OPTION 1: Use Remix IDE (Recommended for first deployment)
1. Go to https://remix.ethereum.org/
2. Create a new file called CertificateNFT.sol
3. Copy the contract from ./contracts/CertificateNFT.sol
4. Compile it in Remix
5. Deploy to Hedera Testnet using your wallet
6. Copy the contract address and add it to .env as VITE_CONTRACT_ADDRESS_TESTNET

OPTION 2: Use Hardhat (Advanced)
1. Set up proper Hardhat configuration
2. Run: npx hardhat compile
3. Run: npx hardhat run scripts/deploy.ts --network hedera_testnet

Your wallet address: ${wallet.address}
Network: Hedera Testnet (Chain ID: 296)
RPC URL: ${rpcUrl}

After deployment, update your .env file with the contract address.
`);

  return { walletAddress: wallet.address, rpcUrl };
}

main()
  .then((result) => {
    console.log('\n✅ Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  });