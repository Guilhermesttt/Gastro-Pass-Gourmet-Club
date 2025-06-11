import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  console.log('[AdminProtectedRoute] Checking route. Loading:', loading, 'User:', user);

  // Mostra um loading enquanto verifica a autenticação
  if (loading) {
    console.log('[AdminProtectedRoute] Status: Loading...');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="p-6 bg-white rounded-lg shadow-xl flex items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login de admin
  if (!user) {
    console.log('[AdminProtectedRoute] Status: No user. Redirecting to /admin/login');
    toast({
      title: 'Acesso Negado',
      description: 'Por favor, faça login para acessar esta área.',
      variant: 'destructive',
    });
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }
  // Se estiver autenticado como admin e tentar acessar o dashboard, redireciona para o painel admin
  if (user.isAdmin && location.pathname === '/dashboard') {
    return <Navigate to="/admin" replace />;
  }

  // Se estiver autenticado mas não for admin, redireciona para o dashboard
  if (!user.isAdmin) {
    console.log('[AdminProtectedRoute] Status: User is not admin. Redirecting to /dashboard. User data:', user);
    toast({
      title: 'Acesso Restrito',
      description: 'Você não tem permissão para acessar esta área.',
      variant: 'destructive',
    });
    return <Navigate to="/dashboard" replace />;
  }

  // Se for admin, renderiza o conteúdo protegido
  console.log('[AdminProtectedRoute] Status: User is admin. Access granted. User data:', user);
  return <>{children}</>;
};

export default AdminProtectedRoute;