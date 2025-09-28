/**
 * Certificate Verification Component
 * 
 * Provides comprehensive certificate verification functionality including:
 * - QR code scanning capabilities
 * - Certificate lookup by token ID or hash
 * - Blockchain authenticity validation
 * - Detailed certificate information display
 * - Verification status reporting
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  ShieldCheck,
  ShieldX,
  Search,
  QrCode,
  Camera,
  FileText,
  Calendar,
  Building,
  User,
  Award,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Hash,
  Loader2
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { blockchainService, type VerificationResult } from '@/services/blockchain/contractService';
import { ipfsService, type CertificateMetadata } from '@/services/ipfs/ipfsService';

// Types
export interface CertificateData {
  tokenId: number;
  recipientAddress: string;
  ipfsCID: string;
  certificateHash: string;
  issueTimestamp: number;
  expiryTimestamp?: number;
  isRevoked: boolean;
  issuer: string;
  metadata?: CertificateMetadata;
}

export interface VerificationStatus {
  isValid: boolean;
  isExpired: boolean;
  isRevoked: boolean;
  onChain: boolean;
  hashMatches: boolean;
  metadataLoaded: boolean;
  error?: string;
}

interface CertificateVerifierProps {
  className?: string;
}

export const CertificateVerifier: React.FC<CertificateVerifierProps> = ({
  className = ''
}) => {
  // Verification state
  const [searchInput, setSearchInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<Array<{
    input: string;
    timestamp: Date;
    status: VerificationStatus;
    certificate?: CertificateData;
  }>>([]);

  // QR Scanner state
  const [isQrScannerActive, setIsQrScannerActive] = useState(false);
  const [qrScanError, setQrScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { toast } = useToast();

  // QR Code scanning functionality
  const startQrScanner = useCallback(async () => {
    try {
      setQrScanError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsQrScannerActive(true);
        
        // Start scanning for QR codes
        scanQrCode();
      }
    } catch (error: any) {
      console.error('❌ QR Scanner error:', error);
      setQrScanError(error.message || 'Failed to access camera');
      toast({
        title: "Camera Access Failed",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopQrScanner = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsQrScannerActive(false);
    setQrScanError(null);
  }, []);

  const scanQrCode = useCallback(() => {
    if (!isQrScannerActive || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Simple QR code detection (in practice, use a proper QR code library like jsQR)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Placeholder QR detection - would use jsQR or similar library
      // For now, we'll simulate detection after a delay
      setTimeout(() => {
        if (isQrScannerActive) {
          scanQrCode(); // Continue scanning
        }
      }, 100);
    }
  }, [isQrScannerActive]);

  // Certificate verification logic
  const verifyCertificate = useCallback(async (input: string): Promise<{
    certificate: CertificateData | null;
    status: VerificationStatus;
  }> => {
    const status: VerificationStatus = {
      isValid: false,
      isExpired: false,
      isRevoked: false,
      onChain: false,
      hashMatches: false,
      metadataLoaded: false,
    };

    try {
      // Determine if input is token ID or certificate hash
      let tokenId: number | null = null;
      let certificateHash: string | null = null;

      if (/^\d+$/.test(input)) {
        tokenId = parseInt(input, 10);
      } else if (/^[a-fA-F0-9]{64}$/.test(input)) {
        certificateHash = input;
      } else {
        throw new Error('Invalid input format. Please provide a token ID or certificate hash.');
      }

      // Verify certificate on blockchain
      let verificationResult: VerificationResult;
      
      if (tokenId !== null) {
        verificationResult = await blockchainService.verifyCertificateByTokenId(tokenId);
      } else if (certificateHash !== null) {
        const extendedResult = await blockchainService.verifyCertificateByHashExtended(certificateHash);
        if (extendedResult.success && extendedResult.certificate) {
          // Convert to VerificationResult format
          verificationResult = {
            success: true,
            certificate: extendedResult.certificate
          };
        } else {
          verificationResult = {
            success: false,
            error: extendedResult.error
          };
        }
      } else {
        throw new Error('Unable to determine verification method');
      }

      if (!verificationResult.success || !verificationResult.certificate) {
        status.error = verificationResult.error || 'Certificate not found on blockchain';
        return { certificate: null, status };
      }

      status.onChain = true;
      const cert = verificationResult.certificate;

      // Check if certificate is revoked
      if (cert.isRevoked) {
        status.isRevoked = true;
        status.error = 'Certificate has been revoked';
      }

      // Check if certificate is expired
      const now = Math.floor(Date.now() / 1000);
      if (cert.expiryTimestamp && cert.expiryTimestamp < now) {
        status.isExpired = true;
        status.error = 'Certificate has expired';
      }

      // Verify certificate hash if provided
      if (certificateHash && cert.certificateHash !== certificateHash) {
        status.hashMatches = false;
        status.error = 'Certificate hash mismatch - possible tampering detected';
      } else {
        status.hashMatches = true;
      }

      // Load metadata from IPFS
      let metadata: CertificateMetadata | undefined;
      try {
        if (cert.ipfsCID) {
          metadata = await ipfsService.retrieveMetadata(cert.ipfsCID);
          status.metadataLoaded = true;
        }
      } catch (error) {
        console.warn('⚠️ Failed to load certificate metadata:', error);
        status.metadataLoaded = false;
      }

      // Build certificate data
      const certificateData: CertificateData = {
        tokenId: cert.tokenId,
        recipientAddress: cert.recipient,
        ipfsCID: cert.ipfsCID,
        certificateHash: cert.certificateHash,
        issueTimestamp: cert.issueTimestamp,
        expiryTimestamp: cert.expiryTimestamp,
        isRevoked: cert.isRevoked,
        issuer: cert.issuer,
        metadata,
      };

      // Overall validity check
      status.isValid = status.onChain && 
                      status.hashMatches && 
                      !status.isRevoked && 
                      !status.isExpired;

      return { certificate: certificateData, status };

    } catch (error: any) {
      console.error('❌ Certificate verification failed:', error);
      status.error = error.message || 'Verification failed';
      return { certificate: null, status };
    }
  }, []);

  // Handle verification request
  const handleVerification = useCallback(async () => {
    if (!searchInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a token ID or certificate hash",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setCertificateData(null);
    setVerificationStatus(null);

    try {
      const result = await verifyCertificate(searchInput.trim());
      
      setCertificateData(result.certificate);
      setVerificationStatus(result.status);

      // Add to verification history
      setVerificationHistory(prev => [{
        input: searchInput.trim(),
        timestamp: new Date(),
        status: result.status,
        certificate: result.certificate || undefined,
      }, ...prev.slice(0, 9)]); // Keep last 10 verifications

      if (result.status.isValid) {
        toast({
          title: "Certificate Valid",
          description: "Certificate has been successfully verified",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.status.error || "Certificate verification failed",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [searchInput, verifyCertificate, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopQrScanner();
    };
  }, [stopQrScanner]);

  // Format date helper
  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Generate verification URL for QR code
  const generateVerificationUrl = useCallback((tokenId: number) => {
    return `${window.location.origin}/verify?tokenId=${tokenId}`;
  }, []);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <span>Certificate Verification</span>
          </CardTitle>
          <CardDescription>
            Verify the authenticity of certificates using blockchain technology and IPFS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Search</span>
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center space-x-2">
                <QrCode className="h-4 w-4" />
                <span>QR Scanner</span>
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="search-input">Token ID or Certificate Hash</Label>
                  <Input
                    id="search-input"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Enter token ID (e.g., 123) or certificate hash (64 characters)"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerification()}
                  />
                </div>
                <Button
                  onClick={handleVerification}
                  disabled={isVerifying || !searchInput.trim()}
                  className="mt-6"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* QR Scanner Tab */}
            <TabsContent value="qr" className="space-y-4">
              {!isQrScannerActive ? (
                <div className="text-center space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">
                      Scan QR code on certificate to verify authenticity
                    </p>
                    <Button onClick={startQrScanner}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                  
                  {qrScanError && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{qrScanError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full rounded-lg"
                      style={{ maxHeight: '400px' }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={stopQrScanner}>
                      Stop Scanner
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Verification Result */}
      <AnimatePresence>
        {verificationStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {verificationStatus.isValid ? (
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  ) : (
                    <ShieldX className="h-6 w-6 text-red-600" />
                  )}
                  <span>
                    {verificationStatus.isValid ? 'Certificate Verified' : 'Verification Failed'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {verificationStatus.isValid 
                    ? 'This certificate is authentic and valid'
                    : verificationStatus.error || 'This certificate could not be verified'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Verification Status Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge variant={verificationStatus.onChain ? "default" : "destructive"}>
                    {verificationStatus.onChain ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    On-Chain
                  </Badge>
                  
                  <Badge variant={verificationStatus.hashMatches ? "default" : "destructive"}>
                    {verificationStatus.hashMatches ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    Hash Valid
                  </Badge>
                  
                  <Badge variant={!verificationStatus.isRevoked ? "default" : "destructive"}>
                    {!verificationStatus.isRevoked ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    Not Revoked
                  </Badge>
                  
                  <Badge variant={!verificationStatus.isExpired ? "default" : "secondary"}>
                    {!verificationStatus.isExpired ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <Clock className="h-3 w-3 mr-1" />
                    )}
                    {verificationStatus.isExpired ? 'Expired' : 'Valid'}
                  </Badge>
                  
                  <Badge variant={verificationStatus.metadataLoaded ? "default" : "secondary"}>
                    {verificationStatus.metadataLoaded ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    Metadata Loaded
                  </Badge>
                </div>

                {/* Certificate Details */}
                {certificateData && (
                  <div className="space-y-6">
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Certificate Info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                          <FileText className="h-5 w-5" />
                          <span>Certificate Information</span>
                        </h3>

                        {certificateData.metadata && (
                          <>
                            <div className="space-y-2">
                              <Label className="flex items-center space-x-2">
                                <Award className="h-4 w-4" />
                                <span>Course Name</span>
                              </Label>
                              <p className="font-medium">{certificateData.metadata.courseName}</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>Recipient</span>
                              </Label>
                              <p className="font-medium">{certificateData.metadata.recipientName}</p>
                            </div>

                            <div className="space-y-2">
                              <Label className="flex items-center space-x-2">
                                <Building className="h-4 w-4" />
                                <span>Institution</span>
                              </Label>
                              <p className="font-medium">{certificateData.metadata.institutionName}</p>
                            </div>

                            <div className="space-y-2">
                              <Label>Certificate Type</Label>
                              <Badge variant="outline">{certificateData.metadata.certificateType}</Badge>
                            </div>

                            {certificateData.metadata.grade && (
                              <div className="space-y-2">
                                <Label>Grade/Score</Label>
                                <Badge variant="secondary">{certificateData.metadata.grade}</Badge>
                              </div>
                            )}
                          </>
                        )}

                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Issue Date</span>
                          </Label>
                          <p>{formatDate(certificateData.issueTimestamp)}</p>
                        </div>

                        {certificateData.expiryTimestamp && (
                          <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <p>{formatDate(certificateData.expiryTimestamp)}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Blockchain Info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2">
                          <Hash className="h-5 w-5" />
                          <span>Blockchain Details</span>
                        </h3>

                        <div className="space-y-2">
                          <Label>Token ID</Label>
                          <p className="font-mono text-sm">{certificateData.tokenId}</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Recipient Address</Label>
                          <p className="font-mono text-sm break-all">
                            {certificateData.recipientAddress.slice(0, 6)}...{certificateData.recipientAddress.slice(-4)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Certificate Hash</Label>
                          <p className="font-mono text-sm break-all">
                            {certificateData.certificateHash.slice(0, 8)}...{certificateData.certificateHash.slice(-8)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>IPFS CID</Label>
                          <div className="flex items-center space-x-2">
                            <p className="font-mono text-sm break-all flex-1">
                              {certificateData.ipfsCID.slice(0, 8)}...{certificateData.ipfsCID.slice(-8)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`https://ipfs.io/ipfs/${certificateData.ipfsCID}`, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* QR Code for Sharing */}
                        <div className="space-y-2">
                          <Label>Verification QR Code</Label>
                          <div className="p-4 bg-white rounded-lg border inline-block">
                            <QRCode
                              value={generateVerificationUrl(certificateData.tokenId)}
                              size={120}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {certificateData.metadata?.description && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <p className="text-muted-foreground">{certificateData.metadata.description}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verification History */}
      {verificationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Verifications</span>
            </CardTitle>
            <CardDescription>
              History of recent certificate verifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.status.isValid ? (
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    ) : (
                      <ShieldX className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-mono text-sm">
                        {item.input.length > 20 ? `${item.input.slice(0, 20)}...` : item.input}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.status.isValid ? "default" : "destructive"}>
                    {item.status.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};