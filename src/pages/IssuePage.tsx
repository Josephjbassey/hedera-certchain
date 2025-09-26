import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Hash, Send, QrCode, CheckCircle, AlertCircle, Wallet, Image, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { hederaContract } from '@/services/hedera-contract';
import { ipfsService } from '@/services/ipfs';
import { CertificateCrypto } from '@/lib/crypto';

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * NFT Certificate issuance page
 * Allows instructors to mint certificate NFTs on Hedera EVM
 */
export const IssuePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    issuer: '',
    courseName: '',
    recipientName: '',
    recipientEmail: '',
    recipientAddress: '',
    issueDate: '',
    description: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [certificateHash, setCertificateHash] = useState('');
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [ipfsData, setIpfsData] = useState<{
    imageUrl?: string;
    metadataUrl?: string;
    imageHash?: string;
    metadataHash?: string;
  }>({});
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [step, setStep] = useState<'connect' | 'upload' | 'details' | 'processing' | 'success'>('connect');

  // Check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  /**
   * Check if wallet is connected and initialize Hedera contract
   */
  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await hederaContract.initialize();
          const address = await hederaContract.getConnectedAddress();
          if (address) {
            setWalletConnected(true);
            setWalletAddress(address);
            setStep('upload');
          }
        }
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  /**
   * Connect to Hedera wallet
   */
  const connectWallet = async () => {
    try {
      await hederaContract.initialize();
      const address = await hederaContract.getConnectedAddress();
      if (address) {
        setWalletConnected(true);
        setWalletAddress(address);
        setStep('upload');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please make sure you have MetaMask or HashPack installed.');
    }
  };

  /**
   * Handle file upload and validate for NFTs
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      // Validate file type for NFTs
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (allowedTypes.includes(uploadedFile.type)) {
        try {
          // Generate certificate hash
          const hash = await CertificateCrypto.generateFileHash(uploadedFile);
          
          setFile(uploadedFile);
          setCertificateHash(hash);
          setStep('details');
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Error processing file. Please try again.');
        }
      } else {
        alert('Please upload a PDF or image file (JPEG, PNG, WebP)');
      }
    }
  };

  /**
   * Handle form submission and mint NFT certificate
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!file) {
      alert('Please upload a certificate file');
      return;
    }

    // Validate required fields
    const requiredFields = ['issuer', 'courseName', 'recipientName', 'recipientEmail', 'recipientAddress', 'issueDate'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return;
      }
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      console.log('🚀 Starting NFT certificate creation...');

      // Step 1: Create and upload NFT metadata to IPFS
      const nftUpload = await ipfsService.uploadCertificateNFT({
        file,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        issuerName: formData.issuer,
        courseName: formData.courseName,
        completionDate: formData.issueDate,
        description: formData.description
      });

      if (!nftUpload.success) {
        throw new Error(nftUpload.error || 'Failed to upload certificate to IPFS');
      }

      setIpfsData({
        imageUrl: nftUpload.imageUrl,
        metadataUrl: nftUpload.metadataUrl,
        imageHash: nftUpload.imageHash,
        metadataHash: nftUpload.metadataHash
      });

      console.log('📦 IPFS upload complete:', nftUpload);

      // Step 2: Mint NFT on Hedera EVM
      const mintResult = await hederaContract.issueCertificate({
        recipient: formData.recipientAddress,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        issuerName: formData.issuer,
        courseName: formData.courseName,
        completionDate: formData.issueDate,
        ipfsHash: nftUpload.metadataHash!,
        certificateHash
      });

      if (!mintResult.success) {
        throw new Error(mintResult.error || 'Failed to mint certificate NFT');
      }

      console.log('🎉 NFT minted successfully:', mintResult);

      setTokenId(mintResult.tokenId || null);
      setTransactionHash(mintResult.transactionHash || '');
      setStep('success');
    } catch (error) {
      console.error('Error submitting to Hedera:', error);
      alert(error instanceof Error ? error.message : 'Error submitting certificate. Please try again.');
      setStep('details');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Mint Certificate NFT
          </h1>
          <p className="text-lg text-muted-foreground">
            Create secure certificate NFTs on Hedera blockchain with IPFS storage
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center justify-center space-x-4 mb-12"
        >
          {['connect', 'upload', 'details', 'processing', 'success'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === stepName
                  ? 'bg-primary text-primary-foreground'
                  : ['connect', 'upload', 'details', 'processing', 'success'].indexOf(step) > index
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {['connect', 'upload', 'details', 'processing', 'success'].indexOf(step) > index ? '✓' : index + 1}
              </div>
              {index < 3 && (
                <div className={`w-12 h-0.5 ml-2 ${
                  ['upload', 'details', 'processing', 'success'].indexOf(step) > index
                    ? 'bg-success'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* Step Content */}
        <div className="space-y-8">
          {/* Step 0: Wallet Connection */}
          {step === 'connect' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="h-5 w-5" />
                    <span>Connect Hedera Wallet</span>
                  </CardTitle>
                  <CardDescription>
                    Connect your wallet to mint certificate NFTs on Hedera EVM
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!walletConnected ? (
                    <div className="text-center">
                      <div className="bg-muted/30 rounded-lg p-8 mb-6">
                        <Wallet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Wallet Required</h3>
                        <p className="text-muted-foreground mb-6">
                          You need a Hedera-compatible wallet to mint certificate NFTs. 
                          Supported wallets include MetaMask and HashPack.
                        </p>
                        <Button onClick={connectWallet} size="lg" className="w-full">
                          <Wallet className="mr-2 h-5 w-5" />
                          Connect Wallet
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">🦊 MetaMask</h4>
                          <p className="text-muted-foreground">Most popular Ethereum wallet</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">🔥 HashPack</h4>
                          <p className="text-muted-foreground">Native Hedera wallet</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-green-50 rounded-lg p-6">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Wallet Connected</h3>
                        <p className="text-green-700 mb-4">
                          Connected to: <code className="bg-green-100 px-2 py-1 rounded text-sm">{walletAddress}</code>
                        </p>
                        <Badge variant="secondary">Ready to mint NFTs</Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 1: File Upload */}
          {step === 'upload' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Upload Certificate</span>
                  </CardTitle>
                  <CardDescription>
                    Upload your certificate file (PDF, JPEG, or PNG)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Click to upload certificate</p>
                      <p className="text-sm text-muted-foreground">
                        Supports PDF, JPEG, PNG (max 10MB)
                      </p>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Certificate Details */}
          {step === 'details' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* File Info */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Uploaded File</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{file?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file && formatFileSize(file.size)} • {file?.type}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                      Change File
                    </Button>
                  </div>
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Certificate Hash</span>
                    </div>
                    <code className="text-xs text-muted-foreground break-all">
                      {certificateHash}
                    </code>
                  </div>
                </CardContent>
              </Card>

              {/* Certificate Metadata Form */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Certificate Details</CardTitle>
                  <CardDescription>
                    Provide information about the certificate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="issuer">Issuing Organization *</Label>
                        <Input
                          id="issuer"
                          value={formData.issuer}
                          onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                          placeholder="e.g., University of Technology"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courseName">Course/Certification Name *</Label>
                        <Input
                          id="courseName"
                          value={formData.courseName}
                          onChange={(e) => setFormData({...formData, courseName: e.target.value})}
                          placeholder="e.g., Blockchain Development"
                          required
                        />
                      </div>
                       <div className="space-y-2">
                         <Label htmlFor="recipientName">Recipient Name *</Label>
                         <Input
                           id="recipientName"
                           value={formData.recipientName}
                           onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
                           placeholder="e.g., John Doe"
                           required
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="recipientEmail">Recipient Email *</Label>
                         <Input
                           id="recipientEmail"
                           type="email"
                           value={formData.recipientEmail}
                           onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                           placeholder="e.g., john.doe@example.com"
                           required
                         />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="recipientAddress">Recipient Wallet Address *</Label>
                         <Input
                           id="recipientAddress"
                           value={formData.recipientAddress}
                           onChange={(e) => setFormData({...formData, recipientAddress: e.target.value})}
                           placeholder="0x... (Hedera EVM address)"
                           required
                         />
                         <p className="text-xs text-muted-foreground">
                           The wallet address that will receive the certificate NFT
                         </p>
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="issueDate">Issue Date *</Label>
                         <Input
                           id="issueDate"
                           type="date"
                           value={formData.issueDate}
                           onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                           required
                         />
                       </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Additional details about the certificate..."
                        rows={3}
                      />
                    </div>
                    <Button type="submit" variant="hero" size="lg" className="w-full">
                      <Send className="mr-2 h-5 w-5" />
                      Submit to Hedera Blockchain
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="shadow-elevated text-center">
                <CardContent className="pt-8 pb-8">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
                  <h3 className="text-lg font-semibold mb-2">Processing Certificate</h3>
                  <p className="text-muted-foreground mb-4">
                    Submitting your certificate to the Hedera blockchain...
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Computing certificate hash</p>
                    <p>✓ Preparing transaction data</p>
                    <p className="animate-pulse">⏳ Uploading to IPFS and minting NFT...</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <Alert className="border-success bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Certificate successfully submitted to Hedera blockchain!
                </AlertDescription>
              </Alert>

              <Card className="shadow-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Certificate NFT Minted Successfully! 🎉</span>
                  </CardTitle>
                  <CardDescription>
                    Your certificate is now a secure NFT on the Hedera blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Certificate NFT successfully minted and stored on IPFS with blockchain verification!
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* NFT Details */}
                    <div className="space-y-4">
                      {tokenId && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">NFT Token ID</Label>
                          <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <code className="text-lg font-bold text-primary">#{tokenId}</code>
                              <Badge variant="secondary">ERC-721</Badge>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Transaction Hash</Label>
                        <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                          <code className="text-xs break-all">{transactionHash}</code>
                        </div>
                      </div>

                      {ipfsData.metadataUrl && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">IPFS Metadata</Label>
                          <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <code className="text-xs break-all">{ipfsData.metadataHash}</code>
                              <Button variant="outline" size="sm" asChild>
                                <a href={ipfsData.metadataUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {tokenId && (
                          <Button variant="default" size="sm" asChild>
                            <a href={`/verify?type=nft&tokenId=${tokenId}`}>
                              <Image className="mr-2 h-4 w-4" />
                              View NFT
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <a 
                            href={`https://hashscan.io/testnet/transaction/${transactionHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Explorer
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          Mint Another
                        </Button>
                      </div>
                    </div>

                    {/* NFT Preview & QR */}
                    <div className="text-center space-y-4">
                      {ipfsData.imageUrl && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Certificate NFT Image</Label>
                          <div className="mt-2 p-4 bg-white rounded-lg border">
                            <img 
                              src={ipfsData.imageUrl} 
                              alt="Certificate NFT" 
                              className="w-full max-w-xs mx-auto rounded-lg shadow-sm"
                            />
                          </div>
                        </div>
                      )}
                      
                      {tokenId && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">QR Code for Verification</Label>
                          <div className="mt-2 p-4 bg-white rounded-lg inline-block border">
                            <QRCodeSVG 
                              value={CertificateCrypto.generateNFTQRData(
                                tokenId, 
                                import.meta.env.VITE_CONTRACT_ADDRESS || '',
                                import.meta.env.VITE_HEDERA_NETWORK || 'testnet'
                              )} 
                              size={120} 
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Scan to verify certificate authenticity
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssuePage;