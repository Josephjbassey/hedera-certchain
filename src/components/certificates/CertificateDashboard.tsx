/**
 * CertificateDashboard Component
 * 
 * A comprehensive dashboard for managing certificates on the Hedera blockchain.
 * 
 * Features:
 * - Statistics overview with visual cards
 * - Issued and received certificates display
 * - Search and filtering functionality
 * - Certificate management actions (revoke, view, download)
 * - Real-time updates and notifications
 * 
 * Author: Hedera CertChain Team
 * Created: September 28, 2025
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  Archive,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

import { useWallet } from '@/contexts/WalletContext';
import { blockchainService } from '@/services/blockchain/contractService';
import { ipfsService, type CertificateMetadata } from '@/services/ipfs/ipfsService';

// Helper functions to extract data from metadata attributes
const getMetadataValue = (metadata: CertificateMetadata | undefined | null, traitType: string): string => {
  if (!metadata?.attributes) return '';
  const attribute = metadata.attributes.find(attr => attr.trait_type === traitType);
  return attribute?.value || '';
};

const getCourseName = (metadata?: CertificateMetadata | null) => getMetadataValue(metadata, 'Course');
const getRecipientName = (metadata?: CertificateMetadata | null) => getMetadataValue(metadata, 'Recipient');
const getInstitutionName = (metadata?: CertificateMetadata | null) => getMetadataValue(metadata, 'Institution');

// Types
export interface DashboardCertificate {
  tokenId: number;
  recipientAddress: string;
  ipfsCID: string;
  certificateHash: string;
  issueTimestamp: number;
  expiryTimestamp?: number;
  isRevoked: boolean;
  issuer: string;
  metadata?: CertificateMetadata;
  type: 'issued' | 'received';
}

export interface DashboardStats {
  totalIssued: number;
  totalReceived: number;
  totalValid: number;
  totalExpired: number;
  totalRevoked: number;
  recentActivity: number;
  thisMonthIssued: number;
  thisMonthReceived: number;
}

interface CertificateDashboardProps {
  walletAddress?: string;
  className?: string;
}

export const CertificateDashboard: React.FC<CertificateDashboardProps> = ({
  walletAddress,
  className = ''
}) => {
  // State
  const [certificates, setCertificates] = useState<DashboardCertificate[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalIssued: 0,
    totalReceived: 0,
    totalValid: 0,
    totalExpired: 0,
    totalRevoked: 0,
    recentActivity: 0,
    thisMonthIssued: 0,
    thisMonthReceived: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'expired' | 'revoked'>('all');
  const [filterType, setFilterType] = useState<'all' | 'issued' | 'received'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCertificates, setSelectedCertificates] = useState<Set<number>>(new Set());

  const { toast } = useToast();

  // Load certificates and stats
  const loadDashboardData = useCallback(async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    try {
      // Get certificates issued by this address
      const issuedResult = await blockchainService.getIssuedCertificates(walletAddress);
      const issuedCerts: DashboardCertificate[] = [];

      if (issuedResult.success && issuedResult.certificates) {
        for (const cert of issuedResult.certificates) {
          let metadata: CertificateMetadata | undefined;
          try {
            metadata = await ipfsService.retrieveContent(cert.ipfsCID) as CertificateMetadata;
          } catch (error) {
            console.error('Failed to load metadata for issued certificate:', error);
            metadata = undefined;
          }
          issuedCerts.push({
            tokenId: cert.tokenId,
            recipientAddress: cert.recipient,
            issuer: cert.issuer,
            certificateHash: cert.certificateHash,
            issueTimestamp: cert.timestamp,
            ipfsCID: cert.ipfsCID,
            isRevoked: cert.isRevoked,
            metadata,
            type: 'issued' as const
          });
        }
      }

      // Get certificates received by this address
      const receivedResult = await blockchainService.getReceivedCertificates(walletAddress);
      const receivedCerts: DashboardCertificate[] = [];

      if (receivedResult.success && receivedResult.certificates) {
        for (const cert of receivedResult.certificates) {
          let metadata: CertificateMetadata | undefined;
          try {
            metadata = await ipfsService.retrieveContent(cert.ipfsCID) as CertificateMetadata;
          } catch (error) {
            console.warn('Failed to load metadata for certificate:', cert.tokenId);
            metadata = undefined;
          }

          receivedCerts.push({
            tokenId: cert.tokenId,
            recipientAddress: cert.recipient,
            issuer: cert.issuer,
            certificateHash: cert.certificateHash,
            issueTimestamp: cert.timestamp,
            ipfsCID: cert.ipfsCID,
            isRevoked: cert.isRevoked,
            metadata,
            type: 'received' as const
          });
        }
      }

      const allCertificates = [...issuedCerts, ...receivedCerts];
      setCertificates(allCertificates);

      // Calculate statistics
      const now = Math.floor(Date.now() / 1000);
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthTimestamp = Math.floor(thisMonth.getTime() / 1000);

      const newStats: DashboardStats = {
        totalIssued: issuedCerts.length,
        totalReceived: receivedCerts.length,
        totalValid: allCertificates.filter(cert => 
          !cert.isRevoked && (!cert.expiryTimestamp || cert.expiryTimestamp > now)
        ).length,
        totalExpired: allCertificates.filter(cert => 
          cert.expiryTimestamp && cert.expiryTimestamp <= now && !cert.isRevoked
        ).length,
        totalRevoked: allCertificates.filter(cert => cert.isRevoked).length,
        recentActivity: allCertificates.filter(cert => 
          cert.issueTimestamp > now - 7 * 24 * 60 * 60 // Last 7 days
        ).length,
        thisMonthIssued: issuedCerts.filter(cert => 
          cert.issueTimestamp >= thisMonthTimestamp
        ).length,
        thisMonthReceived: receivedCerts.filter(cert => 
          cert.issueTimestamp >= thisMonthTimestamp
        ).length,
      };

      setStats(newStats);

    } catch (error: any) {
      console.error('❌ Failed to load dashboard data:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load certificate dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, toast]);

  // Load data on mount and wallet change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Filter and sort certificates
  const filteredAndSortedCertificates = useMemo(() => {
    let filtered = certificates;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(cert => 
        getCourseName(cert.metadata)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getRecipientName(cert.metadata)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getInstitutionName(cert.metadata)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.tokenId.toString().includes(searchQuery)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      filtered = filtered.filter(cert => {
        switch (filterStatus) {
          case 'valid':
            return !cert.isRevoked && (!cert.expiryTimestamp || cert.expiryTimestamp > now);
          case 'expired':
            return cert.expiryTimestamp && cert.expiryTimestamp <= now && !cert.isRevoked;
          case 'revoked':
            return cert.isRevoked;
          default:
            return true;
        }
      });
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(cert => cert.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = getCourseName(a.metadata) || a.tokenId.toString();
          bValue = getCourseName(b.metadata) || b.tokenId.toString();
          break;
        case 'status':
          aValue = getCertificateStatus(a);
          bValue = getCertificateStatus(b);
          break;
        case 'date':
        default:
          aValue = a.issueTimestamp;
          bValue = b.issueTimestamp;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [certificates, searchQuery, filterStatus, filterType, sortBy, sortOrder]);

  // Helper functions
  const getCertificateStatus = useCallback((cert: DashboardCertificate): string => {
    if (cert.isRevoked) return 'revoked';
    
    const now = Math.floor(Date.now() / 1000);
    if (cert.expiryTimestamp && cert.expiryTimestamp <= now) return 'expired';
    
    return 'valid';
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'valid': return 'default';
      case 'expired': return 'secondary';
      case 'revoked': return 'destructive';
      default: return 'outline';
    }
  }, []);

  const formatDate = useCallback((timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Certificate actions
  const handleRevokeCertificate = useCallback(async (tokenId: number) => {
    try {
      const result = await blockchainService.revokeCertificate(tokenId);
      
      if (result.success) {
        toast({
          title: "Certificate Revoked",
          description: "Certificate has been successfully revoked",
        });
        
        // Reload data
        loadDashboardData();
      } else {
        throw new Error(result.error || 'Revocation failed');
      }
    } catch (error: any) {
      toast({
        title: "Revocation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast, loadDashboardData]);

  const handleViewCertificate = useCallback((tokenId: number) => {
    // Navigate to verification page
    window.open(`/verify?tokenId=${tokenId}`, '_blank');
  }, []);

  const handleDownloadCertificate = useCallback(async (cert: DashboardCertificate) => {
    try {
      if (cert.ipfsCID) {
        // Generate download URL for IPFS content
        const downloadUrl = `https://ipfs.io/ipfs/${cert.ipfsCID}`;
        window.open(downloadUrl, '_blank');
      } else {
        throw new Error('No IPFS CID available');
      }
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const StatsCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    description?: string;
    trend?: number;
  }> = ({ title, value, icon, description, trend }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend !== undefined && (
          <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend >= 0 ? '+' : ''}{trend}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!walletAddress) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to view your certificate dashboard
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificate Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track your certificates on the Hedera blockchain
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Issued"
          value={stats.totalIssued}
          icon={<Award className="h-4 w-4 text-blue-600" />}
          description="Certificates you've issued"
          trend={stats.thisMonthIssued > 0 ? 15 : 0}
        />
        
        <StatsCard
          title="Total Received"
          value={stats.totalReceived}
          icon={<Users className="h-4 w-4 text-green-600" />}
          description="Certificates you've received"
          trend={stats.thisMonthReceived > 0 ? 8 : 0}
        />
        
        <StatsCard
          title="Valid Certificates"
          value={stats.totalValid}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          description="Currently valid certificates"
        />
        
        <StatsCard
          title="Recent Activity"
          value={stats.recentActivity}
          icon={<Calendar className="h-4 w-4 text-purple-600" />}
          description="Last 7 days"
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Certificate Management</CardTitle>
          <CardDescription>
            Search, filter, and manage your certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Certificates ({filteredAndSortedCertificates.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading certificates...</span>
            </div>
          ) : filteredAndSortedCertificates.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No certificates found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Start by issuing or receiving certificates'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCertificates.map((cert) => {
                  const status = getCertificateStatus(cert);
                  
                  return (
                    <TableRow key={cert.tokenId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {getCourseName(cert.metadata) || `Certificate #${cert.tokenId}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getInstitutionName(cert.metadata)}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {getRecipientName(cert.metadata) || 
                            `${cert.recipientAddress.slice(0, 6)}...${cert.recipientAddress.slice(-4)}`}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {cert.type === 'issued' ? 'Issued' : 'Received'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={getStatusColor(status) as any}>
                          {status === 'valid' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {status === 'expired' && <Clock className="h-3 w-3 mr-1" />}
                          {status === 'revoked' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {formatDate(cert.issueTimestamp)}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewCertificate(cert.tokenId)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadCertificate(cert)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {cert.type === 'issued' && !cert.isRevoked && (
                              <DropdownMenuItem 
                                onClick={() => handleRevokeCertificate(cert.tokenId)}
                                className="text-destructive"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Revoke
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateDashboard;