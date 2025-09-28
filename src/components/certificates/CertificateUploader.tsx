/**
 * CertificateUploader Component
 * 
 * Provides comprehensive file upload functionality for certificates including:
 * - Drag & drop interface with visual feedback
 * - File validation (type, size, format)
 * - SHA-256 hash generation for integrity verification
 * - IPFS upload via Pinata with progress tracking
 * - Error handling and user feedback
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X, 
  FileText, 
  Image as ImageIcon,
  Hash,
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { ipfsService, type UploadProgress } from '@/services/ipfs/ipfsService';

// Types
export interface UploadedFile {
  file: File;
  hash: string;
  ipfsCID?: string;
  status: 'pending' | 'hashing' | 'uploading' | 'uploaded' | 'error';
  error?: string;
  uploadProgress?: number;
}

interface CertificateUploaderProps {
  onFileUploaded: (fileData: UploadedFile) => void;
  onFileRemoved: (fileData: UploadedFile) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  maxFiles?: number;
  className?: string;
}

export const CertificateUploader: React.FC<CertificateUploaderProps> = ({
  onFileUploaded,
  onFileRemoved,
  maxFileSize = 10,
  allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  maxFiles = 1,
  className = ''
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    if (uploadedFiles.length >= maxFiles) {
      return `Maximum ${maxFiles} file(s) allowed`;
    }

    return null;
  }, [allowedTypes, maxFileSize, maxFiles, uploadedFiles.length]);

  // Process uploaded file
  const processFile = useCallback(async (file: File) => {
    const fileData: UploadedFile = {
      file,
      hash: '',
      status: 'pending',
    };

    setUploadedFiles(prev => [...prev, fileData]);
    setIsProcessing(true);

    try {
      // Step 1: Generate hash
      fileData.status = 'hashing';
      setUploadedFiles(prev => prev.map(f => f.file === file ? fileData : f));

      console.log('🔄 Generating SHA-256 hash for file:', file.name);
      const hash = await ipfsService.hashFile(file);
      fileData.hash = hash;

      console.log('✅ Hash generated:', hash);

      // Step 2: Upload to IPFS
      fileData.status = 'uploading';
      fileData.uploadProgress = 0;
      setUploadedFiles(prev => prev.map(f => f.file === file ? fileData : f));

      console.log('🔄 Uploading file to IPFS:', file.name);

      const uploadResponse = await ipfsService.uploadFile(file, {
        name: `certificate-${Date.now()}-${file.name}`,
        keyvalues: {
          type: 'certificate',
          hash: hash,
          uploadedAt: new Date().toISOString(),
        },
        onProgress: (progress: UploadProgress) => {
          fileData.uploadProgress = progress.percentage;
          setUploadedFiles(prev => prev.map(f => f.file === file ? { ...fileData } : f));
        }
      });

      fileData.ipfsCID = uploadResponse.IpfsHash;
      fileData.status = 'uploaded';
      fileData.uploadProgress = 100;

      setUploadedFiles(prev => prev.map(f => f.file === file ? fileData : f));

      console.log('✅ File uploaded successfully:', {
        fileName: file.name,
        hash: hash,
        cid: uploadResponse.IpfsHash
      });

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded to IPFS with CID: ${uploadResponse.IpfsHash.slice(0, 16)}...`,
      });

      onFileUploaded(fileData);

    } catch (error: any) {
      console.error('❌ File processing failed:', error);
      
      fileData.status = 'error';
      fileData.error = error.message || 'Upload failed';
      setUploadedFiles(prev => prev.map(f => f.file === file ? fileData : f));

      toast({
        title: "Upload failed",
        description: error.message || 'Failed to upload file to IPFS',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUploaded, toast]);

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: "File validation failed",
          description: validationError,
          variant: "destructive",
        });
        continue;
      }

      await processFile(file);
    }
  }, [validateFile, processFile, toast]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // File input handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // Remove file
  const removeFile = useCallback((fileData: UploadedFile) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileData));
    onFileRemoved(fileData);
    
    toast({
      title: "File removed",
      description: `${fileData.file.name} has been removed from the upload list`,
    });
  }, [onFileRemoved, toast]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'hashing':
        return <Badge variant="secondary">Generating Hash</Badge>;
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>;
      case 'uploaded':
        return <Badge variant="default">✅ Uploaded</Badge>;
      case 'error':
        return <Badge variant="destructive">❌ Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5" />
            <span>Upload Certificate File</span>
          </CardTitle>
          <CardDescription>
            Upload your certificate file to IPFS for blockchain storage. 
            Supported formats: PDF, DOC, DOCX, JPG, PNG (max {maxFileSize}MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragOver 
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
              ${isProcessing ? 'pointer-events-none opacity-60' : ''}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFilePicker}
            animate={{ scale: isDragOver ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={allowedTypes.join(',')}
              multiple={maxFiles > 1}
              onChange={handleFileInput}
              disabled={isProcessing}
            />

            <motion.div
              className="flex flex-col items-center space-y-4"
              animate={{ scale: isDragOver ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`
                p-4 rounded-full 
                ${isDragOver ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
              `}>
                <Upload className="h-8 w-8" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragOver ? 'Drop files here' : 'Drop files here or click to browse'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximum file size: {maxFileSize}MB
                </p>
              </div>
            </motion.div>

            {isProcessing && (
              <motion.div
                className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center space-x-2 text-primary">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="font-medium">Processing...</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Service Status */}
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              {ipfsService.getServiceInfo().isConfigured ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>IPFS service configured</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <span>IPFS service not configured - upload will fail</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Uploaded Files</h3>
            
            {uploadedFiles.map((fileData, index) => (
              <motion.div
                key={`${fileData.file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {getFileIcon(fileData.file)}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fileData.file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {/* Hash display */}
                          {fileData.hash && (
                            <div className="flex items-center space-x-2 mt-1">
                              <Hash className="h-3 w-3" />
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {fileData.hash.slice(0, 16)}...
                              </code>
                            </div>
                          )}

                          {/* IPFS CID */}
                          {fileData.ipfsCID && (
                            <div className="flex items-center space-x-2 mt-1">
                              <Cloud className="h-3 w-3" />
                              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                                {fileData.ipfsCID.slice(0, 16)}...
                              </code>
                            </div>
                          )}

                          {/* Upload Progress */}
                          {fileData.status === 'uploading' && typeof fileData.uploadProgress === 'number' && (
                            <div className="mt-2">
                              <ProgressBar value={fileData.uploadProgress} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1">
                                Uploading: {fileData.uploadProgress}%
                              </p>
                            </div>
                          )}

                          {/* Error message */}
                          {fileData.status === 'error' && fileData.error && (
                            <Alert className="mt-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-sm">
                                {fileData.error}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {getStatusBadge(fileData.status)}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileData)}
                          disabled={fileData.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
