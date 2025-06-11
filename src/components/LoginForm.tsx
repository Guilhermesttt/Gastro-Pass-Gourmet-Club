import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validateEmail, validatePassword, updateUserState } from '@/lib/authService';

const estadosBrasileiros = [
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
];

const LoginForm = ({ phone }: { phone?: string }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, loginWithGoogle, setUser, user } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [estado, setEstado] = useState('MS');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cidade, setCidade] = useState('');
  const [profissao, setProfissao] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    estado?: string;
    telefone?: string;
    cpf?: string;
    cidade?: string;
    profissao?: string;
    dataNascimento?: string;
    general?: string;
  }>({});

  useEffect(() => {
    if (user && user.estado) {
      setEstado(user.estado);
    }
  }, [user]);

  // Se phone for passado, preencha o campo telefone e desabilite
  useEffect(() => {
    if (phone) {
      setTelefone(phone);
    }
  }, [phone]);

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

    if (!telefone) {
      newErrors.telefone = 'O número de telefone é obrigatório';
    } else if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(telefone)) {
      newErrors.telefone = 'Formato inválido. Use (99) 99999-9999';
    }

    if (cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf)) {
      newErrors.cpf = 'Formato inválido. Use 999.999.999-99';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length > 2) {
        value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      }
      if (value.length > 9) {
        value = `${value.substring(0, 10)}-${value.substring(10)}`;
      }
    }
    setTelefone(value);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length > 3) {
        value = `${value.substring(0, 3)}.${value.substring(3)}`;
      }
      if (value.length > 7) {
        value = `${value.substring(0, 7)}.${value.substring(7)}`;
      }
      if (value.length > 11) {
        value = `${value.substring(0, 11)}-${value.substring(11)}`;
      }
    }
    setCpf(value);
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
          estado,
          telefone,
          cpf,
          cidade,
          profissao,
          dataNascimento
        });
      }
      
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Você será redirecionado para o dashboard.',
      });
      
      // Redirecionar para o dashboard após o login
      navigate('/dashboard');    } catch (error: any) {
      console.error('Erro no login:', error);
      setErrors({
        general: 'Erro ao entrar. Usuário não identificado.'
      });
      
      toast({
        title: 'Erro ao entrar',
        description: 'Usuário não identificado. Por favor, verifique suas credenciais.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    setErrors({});

    try {
      const userData = await loginWithGoogle();
      
      // Atualiza o estado do usuário se foi selecionado
      if (estado) {
        await updateUserState(userData.id, estado);
        // Atualiza os dados do usuário no contexto
        setUser({
          ...userData,
          estado,
          telefone,
          cpf,
          cidade,
          profissao,
          dataNascimento
        });
      }
      
      toast({
        title: 'Login com Google realizado com sucesso!',
        description: 'Você será redirecionado para o dashboard.',
      });
      
      // O redirecionamento é feito no AuthContext
    } catch (error: any) {      console.error('Erro no login com Google:', error);
            
      setErrors({
        general: 'Erro ao entrar com Google. Usuário não identificado.'
      });
      
      toast({
        title: 'Erro ao entrar com Google',
        description: 'Usuário não identificado. Por favor, tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <div className="p-6 w-full">
      <h2 className="text-2xl font-bold mb-6 text-center">Entrar</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 rounded-lg bg-red-50 text-red-900 flex items-start">
            <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-2 shrink-0" />
            <p className="text-sm">{errors.general}</p>
          </div>
        )}
        
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
            disabled={isSubmitting || isGoogleSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="telefone" className="text-sm font-medium text-gray-700">
            Número de Telefone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="telefone"
            name="telefone"
            value={telefone}
            onChange={handleTelefoneChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
              errors.telefone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="(99) 99999-9999"
            maxLength={15}
            disabled={!!phone || isSubmitting || isGoogleSubmitting}
          />
          {errors.telefone && (
            <p className="text-sm text-red-600">{errors.telefone}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="cpf" className="text-sm font-medium text-gray-700">
            CPF
          </label>
          <input
            type="text"
            id="cpf"
            name="cpf"
            value={cpf}
            onChange={handleCpfChange}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
              errors.cpf ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="999.999.999-99"
            maxLength={14}
            disabled={isSubmitting || isGoogleSubmitting}
          />
          {errors.cpf && (
            <p className="text-sm text-red-600">{errors.cpf}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="cidade" className="text-sm font-medium text-gray-700">
            Cidade
          </label>
          <input
            type="text"
            id="cidade"
            name="cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            placeholder="Sua cidade"
            disabled={isSubmitting || isGoogleSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="profissao" className="text-sm font-medium text-gray-700">
            Profissão
          </label>
          <input
            type="text"
            id="profissao"
            name="profissao"
            value={profissao}
            onChange={(e) => setProfissao(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            placeholder="Sua profissão"
            disabled={isSubmitting || isGoogleSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="dataNascimento" className="text-sm font-medium text-gray-700">
            Data de Aniversário
          </label>
          <input
            type="date"
            id="dataNascimento"
            name="dataNascimento"
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
            disabled={isSubmitting || isGoogleSubmitting}
          />
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
              disabled={isSubmitting || isGoogleSubmitting}
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
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white ${
              errors.estado ? 'border-red-500' : 'border-gray-300'
            }`}
            style={{ borderRadius: '5px', padding: '8px' }}
            disabled={true}
          >
            <option value="">Selecione seu estado</option>
            {estadosBrasileiros.map((uf) => (
              <option key={uf.sigla} value={uf.sigla}>
                {uf.nome} ({uf.sigla})
              </option>
            ))}
          </select>
          {errors.estado && (
            <p className="text-sm text-red-600">{errors.estado}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary-dark transition-colors relative overflow-hidden"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center animate-fade-scale">
              <div className="relative w-5 h-5 mr-2">
                <div className="absolute inset-0 rounded-full border-2 border-t-white border-l-transparent border-r-transparent border-b-transparent animate-spin-gentle"></div>
              </div>
              Entrando...
            </span>
          ) : (
            'Entrar'
          )}
        </button>

        <div className="relative flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">ou</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting || isGoogleSubmitting}
          className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center relative overflow-hidden"
        >
          {isGoogleSubmitting ? (
            <span className="flex items-center justify-center animate-fade-scale">
              <div className="relative w-5 h-5 mr-2">
                <div className="absolute inset-0 rounded-full border-2 border-t-primary border-l-transparent border-r-transparent border-b-transparent animate-spin-gentle"></div>
              </div>
              Conectando...
            </span>
          ) : (
            <>
              <img src="/google.svg" alt="Google" className="w-5 h-5 mr-2" />
              Continuar com Google
            </>
          )}
        </button>
        
        <div className="text-sm text-center text-gray-600 space-y-2">
          <p>
            Não tem uma conta?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
          <p>
            <Link to="/admin/login" className="text-primary hover:underline">
              Entrar como Admin
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
