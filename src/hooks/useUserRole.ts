import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'superadmin' | 'institution' | 'instructor' | 'student' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserRole = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRole(null);
        setRoles([]);
        setUserId(null);
        return;
      }

      setUserId(user.id);

      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!userRoles || userRoles.length === 0) {
        setRole(null);
        setRoles([]);
        return;
      }

      const rolesList = userRoles.map(r => r.role as UserRole);
      setRoles(rolesList);

      // Set primary role (highest privilege)
      if (rolesList.includes('superadmin')) {
        setRole('superadmin');
      } else if (rolesList.includes('institution')) {
        setRole('institution');
      } else if (rolesList.includes('instructor')) {
        setRole('instructor');
      } else if (rolesList.includes('student')) {
        setRole('student');
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setRole(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (checkRole: UserRole): boolean => {
    return roles.includes(checkRole);
  };

  const isAdmin = (): boolean => {
    return roles.includes('superadmin') || roles.includes('institution');
  };

  return {
    role,
    roles,
    loading,
    userId,
    hasRole,
    isAdmin,
    refresh: loadUserRole
  };
}
