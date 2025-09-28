import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Upload, CheckCircle, XCircle, FileText, Link, Award, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export const VerifyPage: React.FC = () => {
  const [verificationMethod, setVerificationMethod] = useState<'transaction_id' | 'file_upload' | 'ipfs_cid'>('ipfs_cid');
  const [certificateId, setCertificateId] = useState('');
  const [ipfsCid, setIpfsCid] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Check URL parameters for auto-verification
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const cid = urlParams.get('cid');
    
    if (id) {
      setCertificateId(id);
      setVerificationMethod('transaction_id');
      // Auto-verify
      handleVerificationWithParams('transaction_id', { transactionId: id });
    } else if (cid) {
      setIpfsCid(cid);
      setVerificationMethod('ipfs_cid');
      // Auto-verify
      handleVerificationWithParams('ipfs_cid', { ipfsCid: cid });
    }
  }, []);

  const handleVerificationWithParams = async (method: string, params: any) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const requestBody = {
        verificationMethod: method,
        ...params
      };

      console.log('Sending verification request:', requestBody);

      // TODO: Replace with direct Hedera contract interaction
      // Removed Supabase functions - implement direct blockchain verification here
      const data = {
        valid: true,
        certificate: {
          id: `cert_${Date.now()}`,
          recipientName: 'Sample Recipient',
          issuerName: 'Sample Issuer',
          courseName: 'Sample Course',
          issueDate: new Date().toISOString(),
          status: 'verified'
        },
        message: 'Certificate verified successfully (placeholder implementation)'
      };
      const error = null;

      if (error) {
        throw new Error(error.message);
      }

      setVerificationResult(data);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerification = async () => {
    if (!certificateId && !file && !ipfsCid) {
      alert('Please provide a transaction ID, upload a certificate file, or enter an IPFS CID');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      let requestBody: any = {
        verificationMethod
      };

      if (verificationMethod === 'transaction_id') {
        requestBody.transactionId = certificateId;
      } else if (verificationMethod === 'ipfs_cid') {
        requestBody.ipfsCid = ipfsCid;
      } else if (verificationMethod === 'file_upload' && file) {
        // Convert file to base64 for secure verification
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:application/json;base64, prefix
          };
          reader.readAsDataURL(file);
        });
        requestBody.certificateFile = base64;
      }

      console.log('Sending verification request:', { method: verificationMethod });

      // TODO: Replace with direct Hedera contract interaction
      // Removed Supabase functions - implement direct blockchain verification here
      const data = {
        valid: true,
        certificate: {
          id: `cert_${Date.now()}`,
          recipientName: 'Sample Recipient',
          issuerName: 'Sample Issuer', 
          courseName: 'Sample Course',
          issueDate: new Date().toISOString(),
          status: 'verified'
        },
        message: 'Certificate verified from file successfully (placeholder implementation)'
      };
      const error = null;

      if (error) {
        throw new Error(error.message);
      }

      setVerificationResult(data);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type - only accept JSON files for certificate verification
      if (!selectedFile.type.includes('json') && !selectedFile.name.endsWith('.json')) {
        alert('Please upload a valid JSON certificate file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      console.log('Certificate file selected for verification:', selectedFile.name);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Verify Certificate Authenticity
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify certificates using cryptographic proof via blockchain verification and IPFS content validation.
          </p>
        </motion.div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Choose Verification Method</CardTitle>
                <CardDescription>
                  Select how you would like to verify the certificate's authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Choose Verification Method</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        verificationMethod === 'file_upload' ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setVerificationMethod('file_upload')}
                    >
                      <h3 className="font-medium mb-2">🔐 Upload Certificate (Most Secure)</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload the certificate JSON file for cryptographic verification via IPFS and blockchain proof.
                      </p>
                    </div>
                    
                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        verificationMethod === 'ipfs_cid' ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setVerificationMethod('ipfs_cid')}
                    >
                      <h3 className="font-medium mb-2">📎 IPFS CID</h3>
                      <p className="text-sm text-muted-foreground">
                        Verify using the IPFS Content Identifier (CID) directly.
                      </p>
                    </div>

                    <div 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        verificationMethod === 'transaction_id' ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setVerificationMethod('transaction_id')}
                    >
                      <h3 className="font-medium mb-2">🔗 Transaction ID (Legacy)</h3>
                      <p className="text-sm text-muted-foreground">
                        Verify using Hedera transaction ID. Less secure than file upload method.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                {verificationMethod === 'transaction_id' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="transaction-id" className="block text-sm font-medium mb-2">
                        Hedera Transaction ID
                      </label>
                      <Input
                        id="transaction-id"
                        type="text"
                        placeholder="Enter Hedera transaction ID..."
                        value={certificateId}
                        onChange={(e) => setCertificateId(e.target.value)}
                        className="w-full font-mono"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter the transaction ID from the certificate issuance
                      </p>
                    </div>
                  </div>
                )}

                {verificationMethod === 'file_upload' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <input
                        type="file"
                        id="certificate-upload"
                        accept=".json,application/json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="certificate-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">Upload Certificate JSON File</p>
                          <p className="text-sm text-muted-foreground">
                            Drag and drop your certificate JSON file here, or click to browse
                          </p>
                        </div>
                      </label>
                    </div>
                    {file && (
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                          Selected file: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
                          <br />
                          <span className="text-xs text-muted-foreground">
                            This file will be cryptographically verified against IPFS and Hedera blockchain.
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {verificationMethod === 'ipfs_cid' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="ipfs-cid" className="block text-sm font-medium mb-2">
                        IPFS Content Identifier (CID)
                      </label>
                      <Input
                        id="ipfs-cid"
                        type="text"
                        placeholder="Enter IPFS CID (e.g., QmXxxxxx...)"
                        value={ipfsCid}
                        onChange={(e) => setIpfsCid(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter the IPFS CID provided when the certificate was issued
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleVerification}
                  disabled={isVerifying || (!certificateId && !file && !ipfsCid)}
                  className="w-full mt-6"
                >
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Verifying Certificate...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Certificate Authenticity
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              {verificationResult.success && verificationResult.verified ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Certificate Verified ✅</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {verificationResult.message || "This certificate has been cryptographically verified and is authentic."}
                    {verificationResult.verificationMethod && (
                      <div className="mt-2 text-xs">
                        <strong>Verification Method:</strong> {verificationResult.verificationMethod}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Verification Failed ❌</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {verificationResult.message || verificationResult.error || "Certificate could not be verified. It may be fraudulent or tampered with."}
                  </AlertDescription>
                </Alert>
              )}

              {verificationResult.success && verificationResult.verified && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Certificate Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Recipient</label>
                        <p className="text-lg font-semibold">{verificationResult.certificate.recipientName}</p>
                        <p className="text-sm text-muted-foreground">{verificationResult.certificate.recipientEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Course</label>
                        <p className="text-lg font-semibold">{verificationResult.certificate.courseName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Issuer</label>
                        <p className="font-medium">{verificationResult.certificate.issuerName}</p>
                        <p className="text-sm text-muted-foreground">{verificationResult.certificate.issuerOrganization}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                        <p className="font-medium">{formatDate(verificationResult.certificate.issueDate)}</p>
                      </div>
                    </div>

                    {verificationResult.blockchain && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Link className="w-4 h-4" />
                          Blockchain Verification
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="text-muted-foreground">Network</label>
                            <p className="font-mono">{verificationResult.blockchain.network}</p>
                          </div>
                          <div>
                            <label className="text-muted-foreground">Transaction ID</label>
                            <p className="font-mono text-xs break-all">{verificationResult.blockchain.transactionId}</p>
                          </div>
                          {verificationResult.blockchain.cidHash && (
                            <div>
                              <label className="text-muted-foreground">CID Hash (Hedera Proof)</label>
                              <p className="font-mono text-xs break-all">{verificationResult.blockchain.cidHash}</p>
                            </div>
                          )}
                          <div>
                            <a 
                              href={verificationResult.blockchain.hashscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              View on Hedera Explorer →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {verificationResult.ipfs && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          IPFS Storage Verification
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="text-muted-foreground">IPFS CID</label>
                            <p className="font-mono text-xs break-all">{verificationResult.ipfs.cid}</p>
                          </div>
                          <div>
                            <a 
                              href={verificationResult.ipfs.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              View Certificate on IPFS →
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {verificationResult.warning && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-700">
                          {verificationResult.warning}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;