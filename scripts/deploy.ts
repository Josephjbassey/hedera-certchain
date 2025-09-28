/**
 * Smart Contract Deployment Script
 * 
 * Deploys the VerifiableCertificateNFT contract to Hedera networks
 * with proper configuration and verification
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import hre from 'hardhat';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

interface DeploymentConfig {
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  network: string;
  gasLimit?: number;
  gasPrice?: string;
}

interface DeploymentResult {
  contract: Contract;
  address: string;
  deploymentHash: string;
  constructorArgs: any[];
  network: string;
  deployer: string;
  timestamp: number;
  gasUsed: number;
}

// Network configurations
const NETWORK_CONFIGS: Record<string, DeploymentConfig> = {
  'hedera-testnet': {
    contractName: 'VerifiableCertificateNFT',
    tokenName: 'Hedera CertChain Testnet',
    tokenSymbol: 'HCERT-T',
    network: 'hedera-testnet',
    gasLimit: 3000000,
  },
  'hedera-mainnet': {
    contractName: 'VerifiableCertificateNFT',
    tokenName: 'Hedera CertChain',
    tokenSymbol: 'HCERT',
    network: 'hedera-mainnet',
    gasLimit: 3000000,
  },
  'localhost': {
    contractName: 'VerifiableCertificateNFT',
    tokenName: 'Hedera CertChain Local',
    tokenSymbol: 'HCERT-L',
    network: 'localhost',
  },
};

/**
 * Deploy the VerifiableCertificateNFT contract
 */
async function deployContract(networkName: string): Promise<DeploymentResult> {
  console.log('\n🚀 Starting Hedera CertChain Contract Deployment');
  console.log('=' .repeat(60));

  const config = NETWORK_CONFIGS[networkName];
  if (!config) {
    throw new Error(`No configuration found for network: ${networkName}`);
  }

  console.log(`📋 Network: ${config.network}`);
  console.log(`📋 Contract: ${config.contractName}`);
  console.log(`📋 Token Name: ${config.tokenName}`);
  console.log(`📋 Token Symbol: ${config.tokenSymbol}`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  console.log(`👑 Deployer: ${deployerAddress}`);
  
  // Check deployer balance
  const balance = await deployer.getBalance();
  console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} HBAR`);

  if (balance.eq(0)) {
    throw new Error('Deployer account has no balance');
  }

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Chain ID: ${network.chainId}`);

  // Verify we're on the correct network
  const expectedChainIds: Record<string, number> = {
    'hedera-testnet': 296,
    'hedera-mainnet': 295,
    'localhost': 31337,
  };

  const expectedChainId = expectedChainIds[networkName];
  if (expectedChainId && network.chainId !== expectedChainId) {
    throw new Error(`Wrong network! Expected chain ID ${expectedChainId}, got ${network.chainId}`);
  }

  // Get contract factory
  console.log('\n📦 Preparing contract deployment...');
  const ContractFactory = await ethers.getContractFactory(config.contractName);

  // Constructor arguments
  const constructorArgs = [
    config.tokenName,    // name
    config.tokenSymbol,  // symbol  
    deployerAddress,     // admin (deployer gets admin role)
  ];

  console.log('📋 Constructor args:', constructorArgs);

  // Deploy contract
  console.log('\n⏳ Deploying contract to blockchain...');
  const deployStartTime = Date.now();

  const deploymentOptions: any = {};
  if (config.gasLimit) {
    deploymentOptions.gasLimit = config.gasLimit;
  }
  if (config.gasPrice) {
    deploymentOptions.gasPrice = ethers.utils.parseUnits(config.gasPrice, 'gwei');
  }

  const contract = await ContractFactory.deploy(...constructorArgs, deploymentOptions);
  
  console.log('📋 Deployment transaction hash:', contract.deployTransaction.hash);
  console.log('⏳ Waiting for deployment confirmation...');

  // Wait for deployment
  await contract.deployed();
  const deployEndTime = Date.now();
  const deploymentDuration = (deployEndTime - deployStartTime) / 1000;

  console.log('\n✅ Contract deployed successfully!');
  console.log(`📍 Contract address: ${contract.address}`);
  console.log(`⏱️  Deployment time: ${deploymentDuration}s`);

  // Get deployment receipt for gas usage
  const receipt = await contract.deployTransaction.wait();
  console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
  console.log(`💰 Gas cost: ${ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))} HBAR`);

  // Verify contract deployment
  console.log('\n🔍 Verifying contract deployment...');
  
  try {
    const contractName = await contract.name();
    const contractSymbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const adminRole = await contract.ADMIN_ROLE();
    const hasAdminRole = await contract.hasRole(adminRole, deployerAddress);

    console.log(`✅ Contract name: ${contractName}`);
    console.log(`✅ Contract symbol: ${contractSymbol}`);
    console.log(`✅ Total supply: ${totalSupply.toString()}`);
    console.log(`✅ Admin role assigned: ${hasAdminRole}`);

    if (contractName !== config.tokenName || contractSymbol !== config.tokenSymbol) {
      throw new Error('Contract verification failed: Name or symbol mismatch');
    }

    if (!hasAdminRole) {
      throw new Error('Contract verification failed: Admin role not assigned');
    }

  } catch (error: any) {
    console.error('❌ Contract verification failed:', error.message);
    throw error;
  }

  const result: DeploymentResult = {
    contract,
    address: contract.address,
    deploymentHash: contract.deployTransaction.hash,
    constructorArgs,
    network: config.network,
    deployer: deployerAddress,
    timestamp: Math.floor(Date.now() / 1000),
    gasUsed: receipt.gasUsed.toNumber(),
  };

  return result;
}

/**
 * Save deployment information
 */
async function saveDeploymentInfo(result: DeploymentResult): Promise<void> {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    contractAddress: result.address,
    deploymentHash: result.deploymentHash,
    constructorArgs: result.constructorArgs,
    network: result.network,
    deployer: result.deployer,
    timestamp: result.timestamp,
    gasUsed: result.gasUsed,
    abi: result.contract.interface.format('json'),
  };

  // Save network-specific deployment
  const networkFile = path.join(deploymentsDir, `${result.network}.json`);
  fs.writeFileSync(networkFile, JSON.stringify(deploymentInfo, null, 2));

  // Save latest deployment
  const latestFile = path.join(deploymentsDir, 'latest.json');
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`📄 Deployment info saved to: ${networkFile}`);
}

/**
 * Update environment variables
 */
async function updateEnvFile(result: DeploymentResult): Promise<void> {
  const envFile = path.join(__dirname, '..', '.env');
  let envContent = '';

  // Read existing .env file
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf8');
  }

  // Update or add contract address
  const contractAddressKey = `VITE_CONTRACT_ADDRESS_${result.network.toUpperCase().replace('-', '_')}`;
  const contractAddressLine = `${contractAddressKey}=${result.address}`;

  if (envContent.includes(contractAddressKey)) {
    // Update existing line
    envContent = envContent.replace(
      new RegExp(`${contractAddressKey}=.*`),
      contractAddressLine
    );
  } else {
    // Add new line
    envContent += `\n${contractAddressLine}`;
  }

  // Add or update general contract address (for current deployment)
  const generalAddressLine = `VITE_CONTRACT_ADDRESS=${result.address}`;
  if (envContent.includes('VITE_CONTRACT_ADDRESS=')) {
    envContent = envContent.replace(
      /VITE_CONTRACT_ADDRESS=.*/,
      generalAddressLine
    );
  } else {
    envContent += `\n${generalAddressLine}`;
  }

  fs.writeFileSync(envFile, envContent.trim() + '\n');
  console.log(`📄 Environment variables updated in: ${envFile}`);
}

/**
 * Main deployment function
 */
async function main() {
  try {
    const networkName = process.env.HARDHAT_NETWORK || 'localhost';
    
    console.log('🏗️  Hedera CertChain Smart Contract Deployment');
    console.log('=' .repeat(60));
    
    const result = await deployContract(networkName);
    
    await saveDeploymentInfo(result);
    await updateEnvFile(result);
    
    console.log('\n🎉 Deployment completed successfully!');
    console.log('=' .repeat(60));
    console.log(`📍 Contract Address: ${result.address}`);
    console.log(`🌐 Network: ${result.network}`);
    console.log(`⛽ Gas Used: ${result.gasUsed.toLocaleString()}`);
    console.log(`👑 Deployer: ${result.deployer}`);
    console.log('=' .repeat(60));

    // Post-deployment instructions
    console.log('\n📋 Next Steps:');
    console.log('1. Verify the contract on Hashscan (if on testnet/mainnet)');
    console.log('2. Add issuers using the addIssuer function');
    console.log('3. Update your frontend with the new contract address');
    console.log('4. Test certificate minting functionality');
    console.log(`\n🔗 Hashscan URL: https://hashscan.io/${networkName === 'hedera-mainnet' ? 'mainnet' : 'testnet'}/contract/${result.address}`);

  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled deployment error:', error);
    process.exit(1);
  });
}

export { deployContract, saveDeploymentInfo, updateEnvFile };
