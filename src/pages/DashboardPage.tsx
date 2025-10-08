import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Award, 
  Shield, 
  Users, 
  TrendingUp, 
  FileText,
  Wallet,
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { RootState } from '@/store';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const wallet = useSelector((state: RootState) => state.wallet);
  const certificates = useSelector((state: RootState) => state.certificate.certificates);

  // Redirect to wallet page if not connected
  useEffect(() => {
    if (!wallet.connected) {
      navigate('/wallet');
    }
  }, [wallet.connected, navigate]);

  const stats = {
    total: certificates.length,
    active: certificates.filter(c => c.status === 'active').length,
    revoked: certificates.filter(c => c.status === 'revoked').length,
    expired: certificates.filter(c => c.status === 'expired').length,
  };

  // Don't render if not connected (will redirect)
  if (!wallet.connected) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-xl text-muted-foreground">
          Manage your blockchain certificates and credentials
        </p>
      </motion.div>

      {/* Wallet Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Connected Wallet</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="font-mono text-base px-3 py-1">
                    {wallet.accountId}
                  </Badge>
                  <Badge variant="outline">
                    {wallet.network}
                  </Badge>
                </div>
              </div>
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All issued certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently valid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.revoked}</div>
            <p className="text-xs text-muted-foreground">Invalidated certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Past expiry date</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Issue and manage certificates</CardDescription>
              </div>
              <Link to="/issue">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Issue Certificate
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/verify">
              <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
                <Shield className="h-8 w-8" />
                <span>Verify Certificate</span>
              </Button>
            </Link>

            <Link to="/wallet">
              <Button className="w-full h-24 flex flex-col gap-2" variant="outline">
                <Wallet className="h-8 w-8" />
                <span>Manage Wallet</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Certificates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Certificates</CardTitle>
            <CardDescription>Latest issued certificates</CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No certificates issued yet</p>
                <Link to="/issue">
                  <Button className="mt-4" size="sm">
                    Issue Your First Certificate
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.slice(0, 5).map((cert) => (
                  <div
                    key={cert.certificateId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{cert.recipientName}</p>
                      <p className="text-sm text-muted-foreground">{cert.courseName}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          cert.status === 'active'
                            ? 'default'
                            : cert.status === 'revoked'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {cert.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
