import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createAdminUser } from '@/lib/authService';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SetupAdmin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSetupAdmin = async () => {
    setIsLoading(true);
    try {
      const result = await createAdminUser();
      
      toast({
        title: 'Sucesso!',
        description: result.message,
      });

      // Redirecionar para a página de login de admin após 2 segundos
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao configurar admin:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível configurar o administrador.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-center">Configuração de Administrador</h1>
          <p className="text-text-light text-center mt-2">
            Criar ou configurar o usuário administrador do sistema
          </p>
        </div>
        
        <Button
          onClick={handleSetupAdmin}
          className="w-full h-12 text-base"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Configurando...
            </>
          ) : (
            'Criar/Configurar Administrador'
          )}
        </Button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Informações do Administrador:</strong>
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-blue-600">
            <li>Email: admin@gastropass.com</li>
            <li>Senha: admin@998</li>
            <li>Nome: Administrador</li>
          </ul>
          <p className="mt-4 text-sm text-blue-700">
            Esta página irá:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-blue-600">
            <li>Criar o usuário admin se ele não existir</li>
            <li>Configurar as permissões de administrador</li>
            <li>Garantir que todos os dados estejam corretos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SetupAdmin; 