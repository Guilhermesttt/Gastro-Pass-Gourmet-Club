import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mostra um loading enquanto verifica a autenticação
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="p-6 bg-white rounded-lg shadow-xl flex items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado e não estiver na página de login ou registro,
  // redireciona para o login mantendo a URL original
  if (!user && !['/login', '/register'].includes(location.pathname)) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Se for admin, redireciona para o painel administrativo
  if (user?.isAdmin && location.pathname === '/dashboard') {
    return <Navigate to="/admin" replace />;
  }

  // Se estiver na página de login ou registro e já estiver autenticado como usuário normal,
  // redireciona para o dashboard
  if (user && !user.isAdmin && ['/login', '/register'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se estiver autenticado e na rota correta, renderiza o conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;