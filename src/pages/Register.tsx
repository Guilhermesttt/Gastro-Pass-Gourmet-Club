import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import RegisterForm from '@/components/RegisterForm';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [errors, setErrors] = useState<{ general?: string }>({});

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center pt-40 pb-20 bg-gray-50">
        <div className="container max-w-md mx-auto px-4">
          <div className="bg-white shadow-md rounded-lg overflow-hidden my-4 sm:my-8">
            <div className="p-6 w-full">
              <Link to="/auth" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para opções de acesso
              </Link>
              
              <h2 className="text-2xl font-bold mb-6 text-center">Criar sua Conta</h2>
              
              {errors.general && (
                <div className="p-3 rounded-lg bg-red-50 text-red-900 flex items-start mb-4">
                  <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-2 shrink-0" />
                  <p className="text-sm">{errors.general}</p>
                </div>
              )}
              
              <RegisterForm />
              
              <p className="text-sm text-center text-gray-600 mt-6">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
