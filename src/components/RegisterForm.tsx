import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { register } from '@/lib/authService';
import { useAuth } from '@/contexts/AuthContext';

const estadosBrasileiros = ['MS'];

const RegisterForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [estado, setEstado] = useState('MS');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [cidade, setCidade] = useState('');
  const [profissao, setProfissao] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    estado?: string;
    telefone?: string;
    cpf?: string;
    cidade?: string;
    profissao?: string;
    dataNascimento?: string;
    general?: string;
  }>({});

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

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name) {
      newErrors.name = 'O nome é obrigatório';
    }

    if (!email) {
      newErrors.email = 'O email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'A senha é obrigatória';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Registra o usuário e obtém os dados
      const userData = await register(email, password, name, estado, telefone, cpf, cidade, profissao, dataNascimento);
      
      // Faz login após o registro bem-sucedido
      await login(email, password);
        
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Você será redirecionado para o dashboard.',
      });
      
      // Redireciona para o dashboard após o login
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      toast({
        title: 'Erro no registro',
        description: error.message || 'Não foi possível criar sua conta. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="p-3 rounded-lg bg-red-50 text-red-900 flex items-start">
          <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-2 shrink-0" />
          <p className="text-sm">{errors.general}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Nome completo
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Seu nome"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
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
        <label htmlFor="telefone" className="text-sm font-medium text-gray-700">
          Número de Telefone <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="telefone"
          value={telefone}
          onChange={handleTelefoneChange}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.telefone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="(99) 99999-9999"
          maxLength={15}
          disabled={isSubmitting}
        />
        {errors.telefone && (
          <p className="text-sm text-red-600">{errors.telefone}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="••••••••"
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
          Confirmar senha
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="••••••••"
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="estado" className="text-sm font-medium text-gray-700">
          Estado
        </label>
        <select
          id="estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.estado ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={true}
        >
          <option value="MS">MS</option>
        </select>
        {errors.estado && (
          <p className="text-sm text-red-600">{errors.estado}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label htmlFor="cpf" className="text-sm font-medium text-gray-700">
          CPF
        </label>
        <input
          type="text"
          id="cpf"
          value={cpf}
          onChange={handleCpfChange}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${
            errors.cpf ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="999.999.999-99"
          maxLength={14}
          disabled={isSubmitting}
        />
        {errors.cpf && (
          <p className="text-sm text-red-600">{errors.cpf}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="cidade" className="text-sm font-medium text-gray-700">
          Cidade (Opcional)
        </label>
        <input
          type="text"
          id="cidade"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors border-gray-300`}
          placeholder="Sua cidade"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="profissao" className="text-sm font-medium text-gray-700">
          Profissão (Opcional)
        </label>
        <input
          type="text"
          id="profissao"
          value={profissao}
          onChange={(e) => setProfissao(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors border-gray-300`}
          placeholder="Sua profissão"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dataNascimento" className="text-sm font-medium text-gray-700">
          Data de Nascimento (Opcional)
        </label>
        <input
          type="date"
          id="dataNascimento"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors border-gray-300`}
          disabled={isSubmitting}
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Criando conta...
          </>
        ) : (
          'Criar conta'
        )}
      </button>
    </form>
  );
};

export default RegisterForm;
