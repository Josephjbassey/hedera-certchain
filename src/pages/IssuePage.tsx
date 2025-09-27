import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletInterface } from '@/services/wallets/useWalletInterface';
import { WalletSelectionDialog } from '@/components/WalletSelectionDialog';

/**
 * Simplified IssuePage for testing wallet connection
 * TODO: Implement full certificate issuance functionality
 */
const IssuePage: React.FC = () => {
  const { accountId, walletInterface } = useWalletInterface();
  const [showWalletPopup, setShowWalletPopup] = useState(false);
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    courseName: '',
    issueDate: new Date().toISOString().split('T')[0]
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!accountId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Connect Your Wallet</span>
              </CardTitle>
              <CardDescription>
                Connect your wallet to issue certificates on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowWalletPopup(true)}
                className="w-full"
              >
                Connect Wallet
              </Button>
            </CardContent>
          </Card>

          <WalletSelectionDialog
            open={showWalletPopup}
            setOpen={setShowWalletPopup}
            onClose={() => setShowWalletPopup(false)}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Issue Certificate</h1>
            <p className="text-muted-foreground">
              Create blockchain-verified certificates for your students
            </p>
          </div>

          {/* Connected Wallet Info */}
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Connected: {accountId.slice(0, 6)}...{accountId.slice(-4)}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-4"
                onClick={() => walletInterface?.disconnect()}
              >
                Disconnect
              </Button>
            </AlertDescription>
          </Alert>

          {/* Certificate Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Certificate Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    placeholder="Enter recipient's name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="recipientEmail">Recipient Email</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                    placeholder="Enter recipient's email"
                  />
                </div>
                
                <div>
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input
                    id="courseName"
                    value={formData.courseName}
                    onChange={(e) => handleInputChange('courseName', e.target.value)}
                    placeholder="Enter course name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Certificate Description</Label>
                <Textarea
                  placeholder="Enter a description of the achievement..."
                  rows={3}
                />
              </div>

              <div className="pt-4">
                <Button className="w-full" size="lg" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Issue Certificate (Coming Soon)
                </Button>
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Full certificate issuance functionality will be implemented next
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default IssuePage;