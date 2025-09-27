import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Compile Solidity contracts for Hedera deployment
 * This script uses solc (Solidity compiler) to compile our CertificateNFT contract
 */
async function compileContract() {
  console.log('🔨 Compiling CertificateNFT contract...');

  try {
    // Check if solc is installed
    try {
      await execAsync('solc --version');
    } catch (error) {
      console.log('📦 Installing Solidity compiler...');
      await execAsync('npm install -g solc');
    }

    // Create output directory
    const outputDir = './artifacts/contracts/CertificateNFT.sol';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Compile the contract
    const contractPath = './contracts/CertificateNFT.sol';
    
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract file not found: ${contractPath}`);
    }

    console.log('📝 Compiling with OpenZeppelin dependencies...');

    // Compile command with node_modules path for OpenZeppelin
    const compileCommand = `solc --optimize --optimize-runs 200 \\
      --base-path . \\
      --include-path ./node_modules \\
      --output-dir ${outputDir} \\
      --abi --bin --metadata \\
      ${contractPath}`;

    const { stdout, stderr } = await execAsync(compileCommand);

    if (stderr && !stderr.includes('Warning')) {
      throw new Error(`Compilation failed: ${stderr}`);
    }

    console.log('✅ Compilation successful!');

    // Read the compiled artifacts
    const binFile = path.join(outputDir, 'CertificateNFT.bin');
    const abiFile = path.join(outputDir, 'CertificateNFT.abi');

    if (!fs.existsSync(binFile) || !fs.existsSync(abiFile)) {
      throw new Error('Compilation artifacts not found');
    }

    const bytecode = fs.readFileSync(binFile, 'utf8').trim();
    const abi = JSON.parse(fs.readFileSync(abiFile, 'utf8'));

    // Create a combined artifact file (similar to Hardhat format)
    const artifact = {
      contractName: 'CertificateNFT',
      abi: abi,
      bytecode: `0x${bytecode}`,
      deployedBytecode: `0x${bytecode}`,
      sourceName: 'contracts/CertificateNFT.sol',
      contractPath: 'contracts/CertificateNFT.sol',
    };

    // Write the combined artifact
    const artifactFile = path.join(outputDir, 'CertificateNFT.json');
    fs.writeFileSync(artifactFile, JSON.stringify(artifact, null, 2));

    console.log(`📄 Contract compiled successfully!`);
    console.log(`📁 Artifacts saved to: ${outputDir}`);
    console.log(`📏 Bytecode size: ${bytecode.length / 2} bytes`);
    
    // Check if bytecode is too large (Hedera limit is ~24KB for jumbo transactions)
    const maxSize = 24 * 1024; // 24KB
    if (bytecode.length / 2 > maxSize) {
      console.warn(`⚠️  Warning: Bytecode size (${bytecode.length / 2} bytes) exceeds recommended limit (${maxSize} bytes)`);
      console.warn('Consider optimizing your contract or using proxy patterns');
    }

    return {
      abi,
      bytecode: `0x${bytecode}`,
      artifact
    };

  } catch (error) {
    console.error('❌ Compilation failed:', error);
    
    // Provide helpful suggestions
    console.log('\n🔧 Compilation troubleshooting:');
    console.log('1. Install Solidity compiler: npm install -g solc');
    console.log('2. Ensure OpenZeppelin contracts are installed: npm install @openzeppelin/contracts');
    console.log('3. Check contract syntax in contracts/CertificateNFT.sol');
    console.log('4. Alternative: Use Remix IDE for compilation');
    
    throw error;
  }
}

// Main execution
if (require.main === module) {
  compileContract()
    .then((result) => {
      console.log('✅ Compilation completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Run deployment: npm run deploy:hedera-sdk');
      console.log('2. Or use: tsx scripts/deploy-hedera-sdk.ts');
    })
    .catch((error) => {
      console.error('❌ Compilation failed:', error.message);
      process.exit(1);
    });
}

export { compileContract };