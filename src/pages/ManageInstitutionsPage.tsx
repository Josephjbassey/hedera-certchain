import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

export default function ManageInstitutionsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useUserRole();
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (role !== 'superadmin') {
      navigate('/');
      return;
    }
    loadInstitutions();
  }, [role, navigate]);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error loading institutions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load institutions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('institutions')
        .update({ is_verified: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Institution ${!currentStatus ? 'verified' : 'unverified'}`,
      });

      loadInstitutions();
    } catch (error) {
      console.error('Error updating institution:', error);
      toast({
        title: 'Error',
        description: 'Failed to update institution',
        variant: 'destructive'
      });
    }
  };

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          Manage Institutions
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage educational institutions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Institutions</CardTitle>
              <CardDescription>All registered institutions</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search institutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredInstitutions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No institutions found</p>
          ) : (
            <div className="space-y-3">
              {filteredInstitutions.map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{inst.name}</p>
                      {inst.is_verified && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {inst.domain && (
                      <p className="text-sm text-muted-foreground">{inst.domain}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {inst.hedera_account_id && (
                        <span>Account: {inst.hedera_account_id}</span>
                      )}
                      {inst.did && (
                        <span>DID: {inst.did.substring(0, 20)}...</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={inst.is_verified ? "destructive" : "default"}
                      onClick={() => toggleVerification(inst.id, inst.is_verified)}
                    >
                      {inst.is_verified ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Unverify
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </>
                      )}
                    </Button>
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
    </div>
  );
}
