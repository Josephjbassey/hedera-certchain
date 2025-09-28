import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, Copy, CheckCircle, Key, Database, Cloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export const SetupGuide: React.FC = () => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    toast({
      title: "Copied!",
      description: "Command copied to clipboard",
    });
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const setupSteps = [
    {
      id: 'hedera-account',
      title: 'Get Hedera Testnet Account',
      description: 'Create a free testnet account to get your credentials',
      icon: Key,
      badge: 'Required',
      badgeVariant: 'destructive' as const,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You need a Hedera testnet account to issue certificates. Follow these steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Visit the <a href="https://portal.hedera.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Hedera Portal</a></li>
            <li>Create an account and navigate to testnet</li>
            <li>Create a new testnet account and note down:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Account ID (format: 0.0.123456)</li>
                <li>Private Key (ECDSA format)</li>
              </ul>
            </li>
          </ol>
          <Alert>
            <AlertDescription>
              Keep your private key secure! Never share it publicly or commit it to version control.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 'pinata-account',
      title: 'Setup IPFS Storage with Pinata',
      description: 'Get API keys for decentralized file storage',
      icon: Cloud,
      badge: 'Required',
      badgeVariant: 'destructive' as const,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pinata provides IPFS pinning services for storing certificate files:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Sign up at <a href="https://pinata.cloud" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Pinata Cloud</a></li>
            <li>Go to API Keys section in your dashboard</li>
            <li>Create a new API key with pinning permissions</li>
            <li>Save both:
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>API Key</li>
                <li>API Secret</li>
              </ul>
            </li>
          </ol>
          <Alert>
            <AlertDescription>
              Pinata offers a generous free tier that's perfect for testing and small deployments.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 'supabase-secrets',
      title: 'Configure Supabase Secrets',
      description: 'Add your API keys securely to the backend',
      icon: Database,
      badge: 'Critical',
      badgeVariant: 'destructive' as const,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add your credentials to Supabase Edge Function secrets:
          </p>
          <div className="space-y-3">
            {[
              { name: 'HEDERA_ACCOUNT_ID', example: '0.0.123456', description: 'Your testnet account ID' },
              { name: 'HEDERA_PRIVATE_KEY', example: 'YOUR_PRIVATE_KEY_HERE', description: 'Your ECDSA private key' },
              { name: 'PINATA_API_KEY', example: 'YOUR_PINATA_API_KEY', description: 'Pinata API key' },
              { name: 'PINATA_SECRET_API_KEY', example: 'YOUR_PINATA_SECRET', description: 'Pinata secret key' }
            ].map((secret) => (
              <div key={secret.name} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {secret.name}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(secret.name, secret.name)}
                  >
                    {copiedStep === secret.name ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{secret.description}</p>
              </div>
            ))}
          </div>
          <Alert>
            <AlertDescription>
              Visit the Supabase Dashboard → Project Settings → Edge Functions → Manage secrets to add these values.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-4">Setup Guide</h1>
        <p className="text-lg text-muted-foreground">
          Follow these steps to configure your Hedera CertChain instance
        </p>
      </motion.div>

      <div className="space-y-6">
        {setupSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span>Step {index + 1}: {step.title}</span>
                  </CardTitle>
                  <Badge variant={step.badgeVariant}>
                    {step.badge}
                  </Badge>
                </div>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {step.content}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center"
      >
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center justify-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Ready to Go!</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Once you've completed all steps above, your system will be ready to issue and verify certificates on the Hedera blockchain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="default">
                <a href="/auth">
                  <Key className="mr-2 h-4 w-4" />
                  Sign In & Start
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/verify">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Test Verification
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Additional Resources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a 
                href="https://docs.hedera.com" 
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Hedera Documentation</span>
              </a>
              <a 
                href="https://pinata.cloud/documentation" 
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Pinata API Docs</span>
              </a>
              <a 
                href="https://supabase.com/docs/guides/functions/secrets" 
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Supabase Secrets Guide</span>
              </a>
              <a 
                href="https://hashscan.io/testnet" 
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Hedera Testnet Explorer</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupGuide;