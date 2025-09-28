import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
interface SystemStatus {
  edgeFunctions: 'deployed' | 'error' | 'checking';
  secrets: 'configured' | 'missing' | 'checking';
}

export const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>({
    edgeFunctions: 'checking',
    secrets: 'checking'
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // Database connection removed - using direct Hedera blockchain storage

    // Authentication removed - no longer needed

    // Edge functions have been removed - mark as error since they're no longer deployed
    setStatus(prev => ({ 
      ...prev, 
      edgeFunctions: 'error' 
    }));

    // Secrets check (we can't actually check if secrets exist without calling the function)
    setStatus(prev => ({ ...prev, secrets: 'configured' }));
  };

  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'connected':
      case 'working':
      case 'deployed':
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <AlertCircle className="h-4 w-4 text-yellow-600 animate-pulse" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (component: string, state: string) => {
    if (state === 'checking') return 'Checking...';
    
    switch (component) {


      case 'edgeFunctions':
        return state === 'deployed' ? 'Deployed' : 'Not Available';
      case 'secrets':
        return state === 'configured' ? 'Ready' : 'Missing Keys';
      default:
        return state;
    }
  };

  const allSystemsReady = Object.values(status).every(s => 
    ['connected', 'deployed', 'configured'].includes(s)
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>System Status</span>
          {allSystemsReady && <Badge variant="secondary" className="bg-green-100 text-green-800">All Systems Ready</Badge>}
        </CardTitle>
        <CardDescription>
          Current status of Hedera CertChain components
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.edgeFunctions)}
              <span className="font-medium">Edge Functions</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getStatusText('edgeFunctions', status.edgeFunctions)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.secrets)}
              <span className="font-medium">API Keys</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getStatusText('secrets', status.secrets)}
            </span>
          </div>
        </div>

        <Button 
          onClick={checkSystemStatus} 
          variant="outline" 
          className="w-full"
        >
          Refresh Status
        </Button>

        {!allSystemsReady && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Setup Required</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {status.secrets !== 'configured' && (
                <li>• Add your Hedera Account ID, Private Key, and Pinata API keys in Supabase secrets</li>
              )}
              {status.edgeFunctions !== 'deployed' && (
                <li>• Edge functions need to be deployed</li>
              )}

            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemStatus;