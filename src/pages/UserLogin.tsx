import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword, updateUserState } from '@/lib/authService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const estadosBrasileiros = [
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
];

const UserLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, setUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [estado, setEstado] = useState('MS');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    estado?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'O email é obrigatório';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (!validatePassword(password)) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
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

    try {
      const userData = await login(email, password);
      
      // Atualiza o estado do usuário se foi selecionado
      if (estado) {
        await updateUserState(userData.id, estado);
        // Atualiza os dados do usuário no contexto
        setUser({
          ...userData,
          estado
        });
      }
      
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Você será redirecionado para o dashboard.',
      });
      
      // Redirecionar para o dashboard após o login
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro no login:', error);
      setErrors({
        general: error.message || 'Ocorreu um erro ao fazer login. Tente novamente.'
      });
      
      toast({
        title: 'Erro no login',
        description: 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-60 pb-20 bg-gray-50">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden my-4 sm:my-8">
            <div className="p-6 w-full">
              <Link to="/auth" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para opções de acesso
              </Link>
              
              <h2 className="text-2xl font-bold mb-6 text-center">Entrar na sua Conta</h2>
              
              {errors.general && (
                <div className="p-3 rounded-lg bg-red-50 text-red-900 flex items-start mb-4">
                  <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-2 shrink-0" />
                  <p className="text-sm">{errors.general}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="seu@email.com"
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="••••••••"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                  <div className="text-right">
                    <Link to="/reset-password" className="text-sm text-primary hover:underline">
                      Esqueceu sua senha?
                    </Link>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="estado" className="text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors border-gray-300"
                    disabled={true}
                  >
                    <option value="">Selecione seu estado</option>
                    {estadosBrasileiros.map((estado) => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Não tem uma conta?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Cadastre-se
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserLogin; 