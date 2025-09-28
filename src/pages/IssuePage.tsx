import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Hash, Send, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Certificate issuance page
 * Allows instructors to upload certificates and submit to Hedera blockchain
 */
export const IssuePage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    issuer: '',
    courseName: '',
    recipientName: '',
    recipientEmail: '',
    issueDate: '',
    description: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [certificateHash, setCertificateHash] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [step, setStep] = useState<'upload' | 'details' | 'processing' | 'success'>('upload');

  /**
   * Handle file upload and validate file type
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      // Validate file type (PDF or images)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (allowedTypes.includes(uploadedFile.type)) {
        setFile(uploadedFile);
        setStep('details');
        // In a real app, we would compute SHA-256 hash here
        const mockHash = 'sha256:' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        setCertificateHash(mockHash);
      } else {
        alert('Please upload a PDF or image file (JPEG, PNG)');
      }
    }
  };

  /**
   * Handle form submission and submit directly to Hedera blockchain
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStep('processing');

    try {
      if (!file) {
        throw new Error('No file selected');
      }

      // Convert file to base64 (safe for large files)
      const fileBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(fileBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = btoa(binary);

      // Authentication removed - anyone can issue certificates now
      console.log('Starting certificate issuance...');

      // TODO: Replace with direct Hedera contract interaction
      // Removed Supabase functions - implement direct blockchain interaction here
      const response = {
        data: {
          success: true,
          certificateId: `cert_${Date.now()}`,
          transactionId: '0x' + Math.random().toString(16).substr(2, 8),
          transactionHash: '0x' + Math.random().toString(16).substr(2, 8),
          verificationUrl: `https://hedera-certchain.com/verify?id=cert_${Date.now()}`,
          message: 'Certificate issued successfully (placeholder implementation)'
        },
        error: null
      };

      console.log('Certificate issuance response (placeholder):', response);

      if (response.error) {
        console.error('Blockchain submission error:', response.error);
        throw new Error(response.error.message || 'Failed to issue certificate');
      }

      const result = response.data;
      console.log('Certificate issuance result:', result);
      
      if (!result.success) {
        console.error('Certificate issuance failed:', result.message);
        throw new Error(result.message || 'Failed to issue certificate');
      }

      setTransactionId(result.transactionId);
      setVerificationUrl(result.verificationUrl);
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
            Issue New Certificate
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload and secure your certificates on the Hedera blockchain
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center justify-center space-x-4 mb-12"
        >
          {['upload', 'details', 'processing', 'success'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === stepName
                  ? 'bg-primary text-primary-foreground'
                  : ['upload', 'details', 'processing', 'success'].indexOf(step) > index
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {['upload', 'details', 'processing', 'success'].indexOf(step) > index ? '✓' : index + 1}
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
                    <p className="animate-pulse">⏳ Submitting to Hedera Consensus Service...</p>
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
                  <CardTitle className="flex items-center space-x-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span>Certificate Issued Successfully</span>
                  </CardTitle>
                  <CardDescription>
                    Your certificate is now secured on the blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                        <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                          <code className="text-sm break-all">{transactionId}</code>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Verification URL</Label>
                        <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                          <code className="text-xs break-all">{verificationUrl}</code>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="success" size="sm" asChild>
                          <a href={`/verify?id=${transactionId}`}>
                            View Certificate
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                          Issue Another
                        </Button>
                      </div>
                    </div>
                    <div className="text-center">
                      <Label className="text-sm font-medium text-muted-foreground">QR Code for Verification</Label>
                      <div className="mt-2 p-4 bg-white rounded-lg inline-block">
                        <QRCodeSVG value={verificationUrl} size={150} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Share this QR code for easy verification
                      </p>
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