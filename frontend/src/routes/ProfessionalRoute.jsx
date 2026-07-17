import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const ALLOWED_ROLES = ['professional', 'admin'];

export default function ProfessionalRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/professional/login" replace />;
  }

  if (!ALLOWED_ROLES.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
