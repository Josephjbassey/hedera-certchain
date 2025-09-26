import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, Shield, Database, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface SystemStatus {
  hederaNetwork: 'connected' | 'disconnected' | 'loading';
  ipfsService: 'connected' | 'disconnected' | 'loading';
  walletConnection: 'connected' | 'disconnected' | 'loading';
  contractStatus: 'deployed' | 'not-deployed' | 'loading';
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    hederaNetwork: 'loading',
    ipfsService: 'loading',
    walletConnection: 'loading',
    contractStatus: 'loading',
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkSystemStatus = async () => {
    setIsChecking(true);
    
    try {
      // Check Hedera Network connectivity
      const hederaStatus = await checkHederaNetwork();
      
      // Check IPFS service
      const ipfsStatus = await checkIPFSService();
      
      // Check wallet connection
      const walletStatus = await checkWalletConnection();
      
      // Check contract deployment
      const contractStatus = await checkContractStatus();
      
      setStatus({
        hederaNetwork: hederaStatus,
        ipfsService: ipfsStatus,
        walletConnection: walletStatus,
        contractStatus: contractStatus,
      });
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkHederaNetwork = async (): Promise<'connected' | 'disconnected'> => {
    try {
      // Try to connect to Hedera testnet RPC
      const response = await fetch('https://testnet.hashio.io/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.result ? 'connected' : 'disconnected';
      }
      return 'disconnected';
    } catch (error) {
      return 'disconnected';
    }
  };

  const checkIPFSService = async (): Promise<'connected' | 'disconnected'> => {
    try {
      // Check if Pinata API keys are configured
      const apiKey = import.meta.env.VITE_PINATA_API_KEY;
      const secretKey = import.meta.env.VITE_PINATA_SECRET_KEY;
      
      return (apiKey && secretKey) ? 'connected' : 'disconnected';
    } catch (error) {
      return 'disconnected';
    }
  };

  const checkWalletConnection = async (): Promise<'connected' | 'disconnected'> => {
    try {
      if (!window.ethereum) {
        return 'disconnected';
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0 ? 'connected' : 'disconnected';
    } catch (error) {
      return 'disconnected';
    }
  };

  const checkContractStatus = async (): Promise<'deployed' | 'not-deployed'> => {
    try {
      const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS_TESTNET;
      return contractAddress ? 'deployed' : 'not-deployed';
    } catch (error) {
      return 'not-deployed';
    }
  };

  useEffect(() => {
    checkSystemStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'deployed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
      case 'not-deployed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Disconnected</Badge>;
      case 'loading':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Checking...</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
      case 'not-deployed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'loading':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Status</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkSystemStatus}
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4" />
            <span className="text-sm">Hedera Network</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(status.hederaNetwork)}
            {getStatusBadge(status.hederaNetwork)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span className="text-sm">IPFS Service</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(status.ipfsService)}
            {getStatusBadge(status.ipfsService)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Wallet Connection</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(status.walletConnection)}
            {getStatusBadge(status.walletConnection)}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Smart Contract</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(status.contractStatus)}
            {getStatusBadge(status.contractStatus)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SystemStatus;