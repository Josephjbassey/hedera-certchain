import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Building2, GraduationCap, Award, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState({
    institutions: 0,
    instructors: 0,
    students: 0,
    certificates: 0
  });

  useEffect(() => {
    checkUserRole();
    loadStats();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (!roles || roles.length === 0) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      const userRoles = roles.map(r => r.role);
      if (userRoles.includes('superadmin')) {
        setUserRole('superadmin');
      } else if (userRoles.includes('institution')) {
        setUserRole('institution');
      } else {
        toast({
          title: 'Access Denied',
          description: 'You need admin privileges to access this page',
          variant: 'destructive'
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      navigate('/auth');
    }
  };

  const loadStats = async () => {
    try {
      // Load institutions count
      const { count: institutionsCount } = await supabase
        .from('institutions')
        .select('*', { count: 'exact', head: true });

      // Load instructors count
      const { count: instructorsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'instructor');

      // Load students count
      const { count: studentsCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      setStats({
        institutions: institutionsCount || 0,
        instructors: instructorsCount || 0,
        students: studentsCount || 0,
        certificates: 0 // Will be updated when certificates table exists
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (!userRole) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your certification system
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          {userRole === 'superadmin' ? 'Super Admin' : 'Institution Admin'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.institutions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.instructors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.students}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Manage Institutions</CardTitle>
            <CardDescription>Create and manage educational institutions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin/institutions')} className="w-full">
              Manage Institutions
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>Assign roles and manage user permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin/users')} className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Certificates</CardTitle>
            <CardDescription>Monitor all issued certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/admin/certificates')} className="w-full">
              View Certificates
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
