import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserRole, UserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { role, loading, userId } = useUserRole();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !userId) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRole) {
    const hasPermission = 
      role === 'superadmin' || // Superadmin has access to everything
      role === requiredRole ||
      (requiredRole === 'student' && role !== null); // All authenticated users can access student routes

    if (!hasPermission) {
      // Redirect based on their actual role
      if (role === 'institution') return <Navigate to="/admin" replace />;
      if (role === 'instructor') return <Navigate to="/dashboard" replace />;
      return <Navigate to="/dashboard/my-certificates" replace />;
    }
  }

  return <>{children}</>;
}
