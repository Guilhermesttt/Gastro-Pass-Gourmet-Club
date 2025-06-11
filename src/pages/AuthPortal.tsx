import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { UserRound, UserPlus, ShieldAlert } from 'lucide-react';

const AuthPortal = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-60 pb-20 bg-gray-50">
        <div className="container max-w-lg mx-auto px-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden my-8 p-6">
            <h2 className="text-3xl font-bold mb-6 text-center">Bem-vindo ao Gastro Pass</h2>
            <p className="text-gray-600 text-center mb-8">
              Escolha uma das opções abaixo para continuar
            </p>
            
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/login')} 
                variant="default" 
                className="w-full py-6 text-lg"
              >
                <UserRound className="mr-2 h-6 w-6" />
                Entrar com sua conta
              </Button>
              
              <Button 
                onClick={() => navigate('/register')} 
                variant="outline" 
                className="w-full py-6 text-lg"
              >
                <UserPlus className="mr-2 h-6 w-6" />
                Criar nova conta
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Acesso restrito</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/admin-login')} 
                variant="ghost" 
                className="w-full py-4 text-base text-gray-700 hover:text-gray-900"
              >
                <ShieldAlert className="mr-2 h-5 w-5" />
                Área do Administrador
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AuthPortal; 