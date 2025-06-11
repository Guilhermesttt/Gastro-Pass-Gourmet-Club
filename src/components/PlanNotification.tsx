import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS } from '@/lib/benefitsService';
import { listenToUserChanges } from '@/lib/firestoreListeners';
import { AlertCircle } from 'lucide-react';

interface PlanNotificationProps {
  className?: string;
}

export default function PlanNotification({ className }: PlanNotificationProps) {
  const [show, setShow] = useState(false);
  const [planName, setPlanName] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();

  // Função para formatar data de expiração
  const formatExpirationDate = useCallback((dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Formato: 15/06/2025 11:27 PM
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }, []);

  // Verificar se tem plano ativo e exibir notificação
  const checkAndShowNotification = useCallback((userData) => {
    try {
      if (userData?.subscription?.status === 'ativo' && userData?.subscription?.planId) {
        const planId = userData.subscription.planId;
        const plan = PLANS[planId];
        
        if (plan && userData?.subscription?.endDate) {
          setPlanName(plan.name);
          setExpirationDate(formatExpirationDate(userData.subscription.endDate));
          setShow(true);
          
          // Esconder a notificação após 10 segundos
          const timer = setTimeout(() => {
            setShow(false);
          }, 10000);
          
          return () => clearTimeout(timer);
        }
      }
    } catch (error) {
      console.error('Erro ao processar notificação do plano:', error);
      setErrorMessage('Erro ao carregar status do plano, tente novamente');
      setShow(true);
      
      // Esconder a mensagem de erro após 5 segundos
      const timer = setTimeout(() => {
        setShow(false);
        setErrorMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [formatExpirationDate]);

  // Verificar plano ativo quando o componente montar
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (user) {
      cleanup = checkAndShowNotification(user);
    }
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [user, checkAndShowNotification]);

  // Configurar listener para mudanças na conta do usuário
  useEffect(() => {
    if (!user?.id) return;

    const errorCallback = (error: Error) => {
      console.error('Erro no listener de usuário:', error);
      setErrorMessage('Erro ao carregar status do plano, tente novamente');
      setShow(true);
      
      // Esconder a mensagem de erro após 5 segundos
      setTimeout(() => {
        setShow(false);
        setErrorMessage('');
      }, 5000);
    };

    // Registrar o listener para mudanças no documento do usuário
    listenToUserChanges(
      user.id,
      checkAndShowNotification,
      errorCallback
    );
    
    // O listenToUserChanges não retorna uma função de unsubscribe diretamente
    // então simplesmente limpamos qualquer efeito colateral ao desmontar
    
  }, [user?.id, checkAndShowNotification]);

  // Se não tiver nada para mostrar, não renderiza
  if (!show) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-[#D4EFDF] text-[#2ECC71] shadow-md text-center ${className}`}
      role="alert"
    >
      {errorMessage ? (
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      ) : (
        <div>
          <span className="font-medium">Plano {planName} ativado!</span> Válido até {expirationDate}.
        </div>
      )}
    </div>
  );
} 