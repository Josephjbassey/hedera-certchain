/**
 * CertificateMinter Component
 * 
 * Provides comprehensive certificate minting functionality including:
 * - Form validation and data collection
 * - Batch minting capabilities
 * - Wallet integration and connection management
 * - Metadata creation and IPFS storage
 * - Progress tracking and error handling
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Users, 
  Calendar, 
  Building, 
  User, 
  BookOpen,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  FileText,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { CertificateUploader, type UploadedFile } from './CertificateUploader';
import { blockchainService, type MintCertificateParams, type BatchMintParams } from '@/services/blockchain/contractService';
import { ipfsService, type CertificateMetadata } from '@/services/ipfs/ipfsService';

// Types
export interface CertificateFormData {
  recipientName: string;
  recipientEmail: string;
  recipientAddress: string;
  courseName: string;
  institutionName: string;
  issuerName: string;
  certificateType: string;
  issueDate: string;
  expiryDate?: string;
  grade?: string;
  description?: string;
  uploadedFile?: UploadedFile;
}

export interface BatchCertificateData extends Omit<CertificateFormData, 'recipientName' | 'recipientEmail' | 'recipientAddress'> {
  recipients: Array<{
    name: string;
    email: string;
    address: string;
  }>;
}

interface CertificateMinterProps {
  onMintSuccess: (tokenId: number, transactionHash: string) => void;
  onMintError: (error: string) => void;
  className?: string;
}

export const CertificateMinter: React.FC<CertificateMinterProps> = ({
  onMintSuccess,
  onMintError,
  className = ''
}) => {
  // Form state
  const [formData, setFormData] = useState<CertificateFormData>({
    recipientName: '',
    recipientEmail: '',
    recipientAddress: '',
    courseName: '',
    institutionName: '',
    issuerName: '',
    certificateType: 'Completion',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    grade: '',
    description: '',
  });

  // Batch mode state
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchRecipients, setBatchRecipients] = useState<Array<{
    name: string;
    email: string;
    address: string;
  }>>([{ name: '', email: '', address: '' }]);

  // Upload and minting state
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingProgress, setMintingProgress] = useState(0);
  const [mintingStep, setMintingStep] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');

  const { toast } = useToast();

  // Check wallet connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (blockchainService.isReady()) {
          const account = await blockchainService.getCurrentAccount();
          setCurrentAccount(account);
          setIsConnected(true);
        }
      } catch (error) {
        setIsConnected(false);
        setCurrentAccount('');
      }
    };

    checkConnection();
  }, []);

  // Form handlers
  const handleInputChange = useCallback((field: keyof CertificateFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUploaded = useCallback((fileData: UploadedFile) => {
    setUploadedFile(fileData);
    setFormData(prev => ({ ...prev, uploadedFile: fileData }));
    
    toast({
      title: "File ready for minting",
      description: "Your certificate file has been prepared for blockchain minting",
    });
  }, [toast]);

  const handleFileRemoved = useCallback((fileData: UploadedFile) => {
    if (uploadedFile === fileData) {
      setUploadedFile(null);
      setFormData(prev => ({ ...prev, uploadedFile: undefined }));
    }
  }, [uploadedFile]);

  // Batch recipients handlers
  const addRecipient = useCallback(() => {
    setBatchRecipients(prev => [...prev, { name: '', email: '', address: '' }]);
  }, []);

  const removeRecipient = useCallback((index: number) => {
    setBatchRecipients(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateRecipient = useCallback((index: number, field: 'name' | 'email' | 'address', value: string) => {
    setBatchRecipients(prev => 
      prev.map((recipient, i) => 
        i === index ? { ...recipient, [field]: value } : recipient
      )
    );
  }, []);

  // Validation
  const validateForm = useCallback((): string | null => {
    if (!uploadedFile || uploadedFile.status !== 'uploaded') {
      return 'Please upload a certificate file';
    }

    if (!isConnected) {
      return 'Please connect your wallet';
    }

    const requiredFields = [
      'courseName', 'institutionName', 'issuerName', 'certificateType'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof CertificateFormData]) {
        return `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
      }
    }

    if (isBatchMode) {
      for (let i = 0; i < batchRecipients.length; i++) {
        const recipient = batchRecipients[i];
        if (!recipient.name || !recipient.email || !recipient.address) {
          return `Please complete all fields for recipient ${i + 1}`;
        }
        // Basic address validation
        if (!recipient.address.match(/^0x[a-fA-F0-9]{40}$/) && !recipient.address.match(/^0\.0\.\d+$/)) {
          return `Invalid address format for recipient ${i + 1}`;
        }
      }
    } else {
      if (!formData.recipientName || !formData.recipientEmail || !formData.recipientAddress) {
        return 'Please fill in all recipient details';
      }
      // Basic address validation
      if (!formData.recipientAddress.match(/^0x[a-fA-F0-9]{40}$/) && !formData.recipientAddress.match(/^0\.0\.\d+$/)) {
        return 'Invalid recipient address format';
      }
    }

    return null;
  }, [formData, uploadedFile, isConnected, isBatchMode, batchRecipients]);

  // Single certificate minting
  const mintSingleCertificate = useCallback(async () => {
    if (!uploadedFile || !uploadedFile.ipfsCID) {
      throw new Error('File not uploaded to IPFS');
    }

    setMintingStep('Creating metadata...');
    setMintingProgress(25);

    // Create certificate metadata
    const metadata: CertificateMetadata = ipfsService.createCertificateMetadata({
      recipientName: formData.recipientName,
      courseName: formData.courseName,
      institutionName: formData.institutionName,
      issuerName: formData.issuerName,
      issueDate: formData.issueDate,
      certificateType: formData.certificateType,
      fileHash: uploadedFile.hash,
      grade: formData.grade,
      description: formData.description,
      expiryTimestamp: formData.expiryDate ? Math.floor(new Date(formData.expiryDate).getTime() / 1000) : undefined,
    });

    setMintingStep('Uploading metadata to IPFS...');
    setMintingProgress(50);

    // Upload metadata to IPFS
    const metadataUpload = await ipfsService.uploadMetadata(metadata, {
      name: `${formData.courseName}-certificate-metadata`,
      keyvalues: {
        type: 'certificate-metadata',
        recipient: formData.recipientName,
        course: formData.courseName,
      }
    });

    setMintingStep('Minting certificate on blockchain...');
    setMintingProgress(75);

    // Mint certificate
    const mintParams: MintCertificateParams = {
      recipient: formData.recipientAddress,
      ipfsCID: metadataUpload.IpfsHash,
      certificateHash: uploadedFile.hash,
      expiryTimestamp: formData.expiryDate ? Math.floor(new Date(formData.expiryDate).getTime() / 1000) : undefined,
    };

    const result = await blockchainService.mintCertificate(mintParams);

    if (!result.success) {
      throw new Error(result.error || 'Minting failed');
    }

    setMintingProgress(100);
    setMintingStep('Certificate minted successfully!');

    // Extract token ID from transaction receipt (simplified - in practice you'd parse events)
    const tokenId = Date.now(); // Placeholder - would extract from events

    return { tokenId, transactionHash: result.hash };
  }, [formData, uploadedFile]);

  // Batch certificate minting
  const mintBatchCertificates = useCallback(async () => {
    if (!uploadedFile || !uploadedFile.ipfsCID) {
      throw new Error('File not uploaded to IPFS');
    }

    const recipients = batchRecipients.filter(r => r.name && r.email && r.address);
    
    setMintingStep('Creating metadata for all certificates...');
    setMintingProgress(10);

    // Create metadata for each certificate
    const metadataUploads = [];
    const progressStep = 60 / recipients.length;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      setMintingStep(`Creating metadata for ${recipient.name}...`);
      
      const metadata: CertificateMetadata = ipfsService.createCertificateMetadata({
        recipientName: recipient.name,
        courseName: formData.courseName,
        institutionName: formData.institutionName,
        issuerName: formData.issuerName,
        issueDate: formData.issueDate,
        certificateType: formData.certificateType,
        fileHash: uploadedFile.hash,
        grade: formData.grade,
        description: formData.description,
        expiryTimestamp: formData.expiryDate ? Math.floor(new Date(formData.expiryDate).getTime() / 1000) : undefined,
      });

      const upload = await ipfsService.uploadMetadata(metadata, {
        name: `${formData.courseName}-${recipient.name}-certificate-metadata`,
        keyvalues: {
          type: 'certificate-metadata',
          recipient: recipient.name,
          course: formData.courseName,
          batch: 'true',
        }
      });

      metadataUploads.push(upload.IpfsHash);
      setMintingProgress(10 + (i + 1) * progressStep);
    }

    setMintingStep('Batch minting certificates on blockchain...');
    setMintingProgress(75);

    // Prepare batch mint parameters
    const batchParams: BatchMintParams = {
      recipients: recipients.map(r => r.address),
      ipfsCIDs: metadataUploads,
      certificateHashes: recipients.map(() => uploadedFile.hash),
      expiryTimestamps: recipients.map(() => 
        formData.expiryDate ? Math.floor(new Date(formData.expiryDate).getTime() / 1000) : 0
      ),
    };

    const result = await blockchainService.batchMintCertificates(batchParams);

    if (!result.success) {
      throw new Error(result.error || 'Batch minting failed');
    }

    setMintingProgress(100);
    setMintingStep('Batch minting completed successfully!');

    return { tokenIds: [], transactionHash: result.hash }; // Would extract actual token IDs from events
  }, [formData, uploadedFile, batchRecipients]);

  // Main minting handler
  const handleMintCertificate = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);
    setMintingProgress(0);
    setMintingStep('Preparing to mint...');

    try {
      let result;
      
      if (isBatchMode) {
        result = await mintBatchCertificates();
        
        toast({
          title: "Batch minting successful!",
          description: `${batchRecipients.length} certificates minted successfully`,
        });

        onMintSuccess(0, result.transactionHash); // For batch, use 0 as placeholder
      } else {
        result = await mintSingleCertificate();
        
        toast({
          title: "Certificate minted successfully!",
          description: `Certificate for ${formData.recipientName} has been minted`,
        });

        onMintSuccess(result.tokenId, result.transactionHash);
      }

      // Reset form
      setFormData({
        recipientName: '',
        recipientEmail: '',
        recipientAddress: '',
        courseName: '',
        institutionName: '',
        issuerName: '',
        certificateType: 'Completion',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        grade: '',
        description: '',
      });
      setUploadedFile(null);
      setBatchRecipients([{ name: '', email: '', address: '' }]);

    } catch (error: any) {
      console.error('❌ Certificate minting failed:', error);
      
      const errorMessage = error.message || 'Failed to mint certificate';
      toast({
        title: "Minting failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      onMintError(errorMessage);
    } finally {
      setIsMinting(false);
      setMintingProgress(0);
      setMintingStep('');
    }
  }, [validateForm, isBatchMode, mintSingleCertificate, mintBatchCertificates, formData, batchRecipients, onMintSuccess, onMintError, toast]);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-6 w-6" />
            <span>Mint Certificate NFT</span>
          </CardTitle>
          <CardDescription>
            Create verifiable certificate NFTs on the Hedera blockchain with IPFS metadata storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Wallet Status */}
          <Alert className={isConnected ? '' : 'border-amber-500'}>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              {isConnected ? (
                <span className="text-green-600">
                  ✅ Connected: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                </span>
              ) : (
                <span className="text-amber-600">
                  ⚠️ Please connect your wallet to mint certificates
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Batch Mode Toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Batch Mode</span>
            </div>
            <Button
              variant={isBatchMode ? "default" : "outline"}
              onClick={() => setIsBatchMode(!isBatchMode)}
              className="text-sm"
            >
              {isBatchMode ? 'Single Mode' : 'Batch Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <CertificateUploader
        onFileUploaded={handleFileUploaded}
        onFileRemoved={handleFileRemoved}
        maxFiles={1}
        maxFileSize={10}
      />

      {/* Certificate Details Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Certificate Details</span>
          </CardTitle>
          <CardDescription>
            Provide the details that will be included in the certificate metadata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Course Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseName" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Course Name *</span>
              </Label>
              <Input
                id="courseName"
                value={formData.courseName}
                onChange={(e) => handleInputChange('courseName', e.target.value)}
                placeholder="e.g., Advanced Blockchain Development"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificateType" className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>Certificate Type *</span>
              </Label>
              <Input
                id="certificateType"
                value={formData.certificateType}
                onChange={(e) => handleInputChange('certificateType', e.target.value)}
                placeholder="e.g., Completion, Achievement, Participation"
                required
              />
            </div>
          </div>

          {/* Institution Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="institutionName" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Institution Name *</span>
              </Label>
              <Input
                id="institutionName"
                value={formData.institutionName}
                onChange={(e) => handleInputChange('institutionName', e.target.value)}
                placeholder="e.g., Hedera University"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issuerName" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Issuer Name *</span>
              </Label>
              <Input
                id="issuerName"
                value={formData.issuerName}
                onChange={(e) => handleInputChange('issuerName', e.target.value)}
                placeholder="e.g., Dr. Jane Smith"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Issue Date *</span>
              </Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              />
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade/Score (Optional)</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                placeholder="e.g., A+, 95%, Pass"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional details about the certificate..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{isBatchMode ? 'Recipients' : 'Recipient'}</span>
          </CardTitle>
          <CardDescription>
            {isBatchMode 
              ? 'Add multiple recipients for batch certificate minting'
              : 'Specify the recipient details for the certificate'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBatchMode ? (
            <div className="space-y-4">
              {batchRecipients.map((recipient, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Recipient {index + 1}</h4>
                    {batchRecipients.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecipient(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        placeholder="Full Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Wallet Address *</Label>
                      <Input
                        value={recipient.address}
                        onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                        placeholder="0x... or 0.0.xxxxx"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              <Button
                variant="outline"
                onClick={addRecipient}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Name *</Label>
                <Input
                  id="recipientName"
                  value={formData.recipientName}
                  onChange={(e) => handleInputChange('recipientName', e.target.value)}
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Email *</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipientAddress">Wallet Address *</Label>
                <Input
                  id="recipientAddress"
                  value={formData.recipientAddress}
                  onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                  placeholder="0x... or 0.0.xxxxx"
                  required
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minting Progress */}
      <AnimatePresence>
        {isMinting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  <span>Minting Certificate...</span>
                </CardTitle>
                <CardDescription>
                  Please don't close this window while minting is in progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={mintingProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">{mintingStep}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mint Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleMintCertificate}
          disabled={isMinting || !isConnected || !uploadedFile || uploadedFile.status !== 'uploaded'}
          size="lg"
          className="px-8 py-4 text-lg"
        >
          {isMinting ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
              Minting...
            </>
          ) : (
            <>
              <Award className="h-5 w-5 mr-2" />
              {isBatchMode 
                ? `Mint ${batchRecipients.filter(r => r.name && r.email && r.address).length} Certificates`
                : 'Mint Certificate'
              }
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
