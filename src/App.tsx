import { Routes, Route, Outlet } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/react-query';

import './styles/animations.css';

// Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import AdminRestaurants from './pages/AdminRestaurants';
import AdminUsers from './pages/AdminUsers';
import AdminPayments from './pages/AdminPayments';
import AuthPortal from './pages/AuthPortal';
import UserLogin from './pages/UserLogin';
import ChangePasswordAuthenticated from './pages/ChangePasswordAuthenticated';

import NotFound from './pages/NotFound';
import SetupAdmin from './pages/SetupAdmin';

// Protected Routes
import ProtectedRoute from './utils/protectedRoute';
import AdminProtectedRoute from './utils/adminProtectedRoute';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Index />} />
            
            {/* Rotas de Autenticação Estratégicas */}
            <Route path="/auth" element={<AuthPortal />} />
            <Route path="/login" element={<UserLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            
            {/* Manter compatibilidade com rotas antigas */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/setup-admin" element={<SetupAdmin />} />

            {/* Rotas Protegidas do Usuário */}
            <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/change-password" element={<ChangePasswordAuthenticated />} />
            </Route>

            {/* Rotas Protegidas do Admin */}
            <Route path="/admin" element={<AdminProtectedRoute><Outlet /></AdminProtectedRoute>}>
              <Route index element={<Admin />} />
              <Route path="restaurants" element={<AdminRestaurants />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="payments" element={<AdminPayments />} />
            </Route>

            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
