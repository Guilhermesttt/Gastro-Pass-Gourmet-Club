import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { login, user } = useAuth();

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    // Email validation
    if (!email) {
      newErrors.email = 'O e-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'A senha é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('[AdminLogin] Attempting login with:', email);
      await login(email, password);
      
      // O log abaixo pode não refletir o estado final imediatamente 
      // devido à natureza assíncrona do onAuthStateChanged.
      // O estado real do usuário será verificado pelo AdminProtectedRoute.
      // console.log('[AdminLogin] User from AuthContext immediately after login call:', user); // user aqui é do render atual

      toast({
        title: 'Login realizado!',
        description: 'Verificando credenciais de administrador...',
      });

      // Remover a pausa de diagnóstico. A lógica de loading no AuthContext e AdminProtectedRoute deve ser suficiente.
      // await new Promise(resolve => setTimeout(resolve, 500)); 

      // console.log('[AdminLogin] Navigating to /admin. Current AuthContext user state:', user);
      navigate('/admin');

    } catch (error: any) {
      console.error("Erro no login de admin:", error);
      setErrors({
        general: error.message || 'Credenciais inválidas ou erro no login. Verifique se você é um administrador.',
      });
      toast({
        title: 'Erro de Acesso',
        description: error.message || 'Credenciais inválidas ou você não tem permissão de administrador.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className={`flex-grow flex items-center justify-center ${isMobile ? 'pt-36' : 'pt-60'} pb-20 bg-gray-50`}>
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden my-4 sm:my-8">
            <div className="p-4 sm:p-6 w-full">
              <div className="flex items-center justify-center mb-3 sm:mb-4 text-yellow-600">
                <ShieldAlert size={36} />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Acesso de Administrador</h2>
              
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 sm:mb-6">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3 sm:mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1">
                    E-mail de Administrador
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="admin@gastropass.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="mb-4 sm:mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-text-dark mb-1">
                    Senha de Administrador
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary pr-10 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full flex items-center justify-center text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin mr-2" /> Entrando...
                    </>
                  ) : (
                    'Entrar como Administrador'
                  )}
                </button>
              </form>

              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs sm:text-sm text-text">
                  <Link to="/" className="text-primary hover:underline font-medium">
                    Voltar para a página inicial
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminLogin;
