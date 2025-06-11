import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword } from '@/lib/authService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const ChangePasswordAuthenticated = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const auth = getAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = (): boolean => {
    if (!newPassword) {
      setError('A nova senha é obrigatória.');
      return false;
    }
    if (!validatePassword(newPassword)) {
        setError('A nova senha deve ter pelo menos 8 caracteres, incluindo letras e números.');
        return false;
    }
    if (newPassword !== confirmNewPassword) {
      setError('A nova senha e a confirmação da nova senha não coincidem.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuário não autenticado.');
      }

      await updatePassword(currentUser, newPassword);

      setSuccess(true);
      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
        variant: 'success',
      });
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      let errorMessage = 'Ocorreu um erro ao alterar sua senha. Por favor, tente novamente.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'A senha atual está incorreta.';
      } else if (err.code === 'auth/requires-recent-login') {
          errorMessage = 'Por favor, saia e faça login novamente para alterar a senha.';
      }
      setError(errorMessage);
      toast({
        title: 'Erro ao alterar senha',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-grow flex items-center justify-center pt-60 pb-12 bg-gray-50">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden my-4">
            <div className="p-6 w-full">
              <h2 className="text-2xl font-bold mb-6 text-center">Alterar Senha</h2>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-900 flex items-start mb-4">
                  <div className="w-5 h-5 text-red-600 mr-2 mt-0.5 shrink-0">!</div>{/* Ícone de alerta simples */} 
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success ? (
                 <div className="space-y-4">
                 <div className="bg-green-50 p-4 rounded-lg text-green-800 flex items-start">
                   <div className="w-5 h-5 text-green-600 mr-2 mt-0.5 shrink-0">✓</div>{/* Ícone de sucesso simples */} 
                   <div>
                     <p className="font-medium">Senha atualizada com sucesso!</p>
                   </div>
                 </div>
                 <div className="text-center mt-4">
                   <Link
                     to="/dashboard"
                     className="text-primary hover:underline text-sm font-medium"
                   >
                     Voltar para o Dashboard
                   </Link>
                 </div>
               </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campo Nova Senha */}
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors border-gray-300"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Campo Confirmar Nova Senha */}
                  <div className="space-y-2">
                    <label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-700">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        id="confirm-new-password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors border-gray-300"
                        placeholder="••••••••"
                        disabled={isSubmitting}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmNewPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Alterando...
                      </>
                    ) : (
                      'Alterar Senha'
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <Link
                      to="/dashboard"
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Voltar para o Dashboard
                    </Link>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ChangePasswordAuthenticated; 