import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PLANS } from '@/lib/benefitsService';
import { listenToUserChanges } from '@/lib/firestoreListeners';
import { AlertCircle, Clock, Check } from 'lucide-react';

interface ActivePlanInfoProps {
  className?: string;
}

export default function ActivePlanInfo({ className }: ActivePlanInfoProps) {
  const [planName, setPlanName] = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { user } = useAuth();

  // Função para formatar data de expiração
  const formatExpirationDate = useCallback((dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Formato: 15/06/2025 11:30 PM
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }, []);

  // Verificar se tem plano ativo e exibir informação
  const updatePlanInfo = useCallback((userData) => {
    try {
      if (userData?.subscription?.status === 'ativo' && userData?.subscription?.planId) {
        const planId = userData.subscription.planId;
        
        if (planId === 'free') {
          // Plano gratuito não deve mostrar o indicador de plano ativo
          setPlanName(null);
          setExpirationDate(null);
          return;
        }
        
        const plan = PLANS[planId];
        
        if (plan && userData?.subscription?.endDate) {
          console.log(`Atualizando informações do plano: ${plan.name}, expira em ${userData.subscription.endDate}`);
          
          // Validar se a data de expiração corresponde a 30 dias a partir da data de início
          if (userData?.subscription?.startDate) {
            const startDate = new Date(userData.subscription.startDate);
            const expectedEndDate = new Date(startDate);
            expectedEndDate.setDate(expectedEndDate.getDate() + 30);
            
            const actualEndDate = new Date(userData.subscription.endDate);
            const diffDays = Math.abs(Math.floor((actualEndDate.getTime() - expectedEndDate.getTime()) / (1000 * 60 * 60 * 24)));
            
            if (diffDays > 1) {
              console.warn(`Diferença na data de expiração: esperado ${expectedEndDate.toISOString()}, recebido ${actualEndDate.toISOString()}`);
            }
          }
          
          setPlanName(plan.name);
          setExpirationDate(formatExpirationDate(userData.subscription.endDate));
        } else {
          console.warn('Plano não encontrado ou data de expiração ausente:', { planId, endDate: userData?.subscription?.endDate });
          setPlanName(null);
          setExpirationDate(null);
        }
      } else {
        // Usuário sem assinatura ativa
        setPlanName(null);
        setExpirationDate(null);
      }
    } catch (error) {
      console.error('Erro ao processar informações do plano:', error);
      setErrorMessage('Erro ao carregar status do plano, tente novamente');
      setPlanName(null);
      setExpirationDate(null);
    }
  }, [formatExpirationDate]);

  // Verificar plano ativo quando o componente montar
  useEffect(() => {
    if (user) {
      updatePlanInfo(user);
    }
  }, [user, updatePlanInfo]);

  // Configurar listener para mudanças na conta do usuário
  useEffect(() => {
    if (!user?.id) return;

    const errorCallback = (error: Error) => {
      console.error('Erro no listener de usuário:', error);
      setErrorMessage('Erro ao carregar status do plano, tente novamente');
    };

    // Registrar o listener para mudanças no documento do usuário
    listenToUserChanges(
      user.id,
      updatePlanInfo,
      errorCallback
    );
    
    // O listenToUserChanges não retorna uma função de unsubscribe diretamente
  }, [user?.id, updatePlanInfo]);

  // Se não tiver plano ativo, não renderiza nada
  if (!planName && !errorMessage) return null;

  return (
    <div
      className={`mt-3 rounded-md px-4 py-3 ${errorMessage ? 'bg-red-50 text-red-700' : 'bg-[#D4EFDF] text-[#2ECC71] border border-[#2ECC71]/20'} ${className}`}
      role="status"
    >
      {errorMessage ? (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Check className="h-5 w-5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Plano {planName} ativo.</span>{' '}
            <span className="flex items-center gap-1 mt-0.5 text-sm opacity-90">
              <Clock className="h-4 w-4" /> Válido até {expirationDate}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 