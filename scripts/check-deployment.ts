import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

async function checkDeployment() {
  console.log('🔍 Checking contract deployment...');

  const contractAddress = process.env.VITE_CONTRACT_ADDRESS_TESTNET;
  
  if (!contractAddress || contractAddress === '') {
    console.log('❌ No contract address found in .env file');
    console.log('Please update VITE_CONTRACT_ADDRESS_TESTNET in .env with your deployed contract address');
    return;
  }

  // Setup provider
  const rpcUrl = 'https://testnet.hashio.io/api';
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  try {
    // Check if the address has bytecode (is a contract)
    const code = await provider.getCode(contractAddress);
    
    if (code === '0x') {
      console.log('❌ No contract found at address:', contractAddress);
      console.log('Please check the contract address is correct');
      return;
    }

    console.log('✅ Contract verified at:', contractAddress);
    console.log('📊 Contract code length:', code.length, 'bytes');
    
    // Try to read basic contract info (name, symbol, etc.)
    const abi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)", 
      "function owner() view returns (address)",
      "function totalSupply() view returns (uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    try {
      const name = await contract.name();
      const symbol = await contract.symbol();
      const owner = await contract.owner();
      const totalSupply = await contract.totalSupply();
      
      console.log('📄 Contract Name:', name);
      console.log('🏷️  Contract Symbol:', symbol);
      console.log('👑 Contract Owner:', owner);
      console.log('📈 Total Supply:', totalSupply.toString());
      
    } catch (err) {
      console.log('⚠️  Could not read contract details (this is normal if ABI differs)');
    }
    
    console.log('\n🎉 Contract deployment verified successfully!');
    console.log('🌐 View on Hedera Explorer:', `https://hashscan.io/testnet/contract/${contractAddress}`);
    
  } catch (error) {
    console.error('❌ Error checking deployment:', error);
  }
}

checkDeployment();