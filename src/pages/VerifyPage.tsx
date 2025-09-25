import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Upload, QrCode, CheckCircle, XCircle, ExternalLink, Calendar, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * Certificate verification page
 * Allows users to verify certificates by ID or file upload
 */
export const VerifyPage: React.FC = () => {
  const [verificationMethod, setVerificationMethod] = useState<'id' | 'file'>('id');
  const [certificateId, setCertificateId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate?: {
      id: string;
      issuer: string;
      courseName: string;
      recipientName: string;
      issueDate: string;
      description: string;
      hash: string;
      timestamp: string;
      explorerUrl: string;
    };
    error?: string;
  } | null>(null);

  // Check URL parameters for certificate ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setCertificateId(id);
      // Auto-verify if ID is provided in URL
      handleVerification(id);
    }
  }, []);

  /**
   * Handle certificate verification using edge function
   */
  const handleVerification = async (idToVerify?: string) => {
    const id = idToVerify || certificateId;
    if (!id && !file) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { supabase } = await import('@/integrations/supabase/client');

      let requestBody: any = {
        verificationMethod: verificationMethod
      };

      if (verificationMethod === 'id' && id) {
        requestBody.transactionId = id;
      } else if (verificationMethod === 'file' && file) {
        // Generate hash from file for verification
        const fileBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        requestBody.certificateHash = certificateHash;
      }

      // Call verification edge function (public, no auth required)
      const response = await fetch(`https://rcrtloxuqhnjlusisjgf.supabase.co/functions/v1/verify-certificate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!result.success || !result.verified) {
        setVerificationResult({
          isValid: false,
          error: result.message || 'Certificate not found or verification failed'
        });
        return;
      }

      // Convert the response to our expected format
      setVerificationResult({
        isValid: true,
        certificate: {
          id: result.certificate.id,
          issuer: result.certificate.issuerOrganization,
          courseName: result.certificate.courseName,
          recipientName: result.certificate.recipientName,
          issueDate: result.certificate.issueDate,
          description: `Certificate issued by ${result.certificate.issuerName}`,
          hash: result.certificate.certificateHash,
          timestamp: result.verifiedAt,
          explorerUrl: result.blockchain.hashscanUrl
        }
      });

    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        isValid: false,
        error: "Verification failed. Please try again."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Handle file upload for verification
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (allowedTypes.includes(uploadedFile.type)) {
        setFile(uploadedFile);
      } else {
        alert('Please upload a PDF or image file (JPEG, PNG)');
      }
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
            Verify Certificate
          </h1>
          <p className="text-lg text-muted-foreground">
            Instantly verify any certificate secured on the Hedera blockchain
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* Verification Method Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Choose Verification Method</CardTitle>
                <CardDescription>
                  Verify using a certificate ID or upload the original file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={verificationMethod === 'id' ? 'hero' : 'outline'}
                    onClick={() => setVerificationMethod('id')}
                    className="h-auto p-6 flex flex-col items-center space-y-2"
                  >
                    <Search className="h-8 w-8" />
                    <span className="font-medium">Certificate ID</span>
                    <span className="text-xs opacity-80 text-center">
                      Enter transaction ID from Hedera
                    </span>
                  </Button>
                  <Button
                    variant={verificationMethod === 'file' ? 'hero' : 'outline'}
                    onClick={() => setVerificationMethod('file')}
                    className="h-auto p-6 flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8" />
                    <span className="font-medium">Upload File</span>
                    <span className="text-xs opacity-80 text-center">
                      Upload original certificate file
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Verification Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {verificationMethod === 'id' ? (
                    <Search className="h-5 w-5" />
                  ) : (
                    <Upload className="h-5 w-5" />
                  )}
                  <span>
                    {verificationMethod === 'id' ? 'Enter Certificate ID' : 'Upload Certificate'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {verificationMethod === 'id'
                    ? 'Enter the Hedera transaction ID (format: 0.0.123456@1234567890.123456789)'
                    : 'Upload the original certificate file for verification'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {verificationMethod === 'id' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="certificate-id">Certificate Transaction ID</Label>
                      <Input
                        id="certificate-id"
                        value={certificateId}
                        onChange={(e) => setCertificateId(e.target.value)}
                        placeholder="0.0.123456@1234567890.123456789"
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button
                      onClick={() => handleVerification()}
                      disabled={!certificateId || isVerifying}
                      variant="hero"
                      size="lg"
                      className="w-full"
                    >
                      {isVerifying ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-5 w-5" />
                          Verify Certificate
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <input
                        type="file"
                        id="file-upload-verify"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="file-upload-verify" className="cursor-pointer">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium mb-2">
                          {file ? file.name : 'Click to upload certificate'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supports PDF, JPEG, PNG (max 10MB)
                        </p>
                      </label>
                    </div>
                    {file && (
                      <Button
                        onClick={() => handleVerification()}
                        disabled={isVerifying}
                        variant="hero"
                        size="lg"
                        className="w-full"
                      >
                        {isVerifying ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Verify Uploaded Certificate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Verification Result */}
          {verificationResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {verificationResult.isValid && verificationResult.certificate ? (
                <div className="space-y-6">
                  <Alert className="border-success bg-success/10">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <AlertDescription className="text-success font-medium">
                      ✅ Certificate is Valid and Verified on Hedera Blockchain
                    </AlertDescription>
                  </Alert>

                  <Card className="shadow-elevated border-success/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2 text-success">
                          <CheckCircle className="h-5 w-5" />
                          <span>Verified Certificate</span>
                        </CardTitle>
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                          Blockchain Verified
                        </Badge>
                      </div>
                      <CardDescription>
                        This certificate has been cryptographically verified on the Hedera network
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Certificate Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <Label className="text-sm font-medium">Recipient</Label>
                            </div>
                            <p className="text-lg font-semibold">{verificationResult.certificate.recipientName}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <Label className="text-sm font-medium">Issuing Organization</Label>
                            </div>
                            <p className="font-medium">{verificationResult.certificate.issuer}</p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Course/Certification</Label>
                            <p className="font-medium mt-1">{verificationResult.certificate.courseName}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <Label className="text-sm font-medium">Issue Date</Label>
                            </div>
                            <p className="font-medium">{formatDate(verificationResult.certificate.issueDate)}</p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Blockchain Timestamp</Label>
                            <p className="text-sm font-mono mt-1">
                              {new Date(verificationResult.certificate.timestamp).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                            <p className="text-xs font-mono mt-1 break-all text-muted-foreground">
                              {verificationResult.certificate.id}
                            </p>
                          </div>
                        </div>
                      </div>

                      {verificationResult.certificate.description && (
                        <>
                          <Separator />
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                            <p className="mt-2 text-sm">{verificationResult.certificate.description}</p>
                          </div>
                        </>
                      )}

                      <Separator />

                      {/* Technical Details */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground">Technical Details</Label>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Certificate Hash:</span>
                            <code className="text-xs">{verificationResult.certificate.hash}</code>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Blockchain Network:</span>
                            <span className="font-medium">Hedera Mainnet</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Verification Status:</span>
                            <span className="text-success font-medium">✅ Valid</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button variant="success" asChild>
                          <a 
                            href={verificationResult.certificate.explorerUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Hedera Explorer
                          </a>
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                          Print Verification
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Alert className="border-destructive bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    ❌ {verificationResult.error || 'Certificate verification failed'}
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;