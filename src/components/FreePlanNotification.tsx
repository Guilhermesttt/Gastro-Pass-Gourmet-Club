import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Info, Gift } from 'lucide-react';

interface FreePlanNotificationProps {
  className?: string;
  showTemporary?: boolean; // If true, displays a temporary notification and then fades out
}

export default function FreePlanNotification({ className, showTemporary = false }: FreePlanNotificationProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isCancelled, setIsCancelled] = useState(false);
  
  // Verificar se é um plano gratuito e se precisa exibir notificação temporária
  useEffect(() => {
    if (showTemporary) {
      // Mostrar por 5 segundos e depois esconder
      setIsCancelled(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      // Verificar se o usuário está no plano gratuito
      setIsCancelled(false);
      if (user?.subscription?.planId === 'free') {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  }, [user, showTemporary]);
  
  // Se não for visível, não renderiza
  if (!isVisible) return null;
  
  return (
    <div 
      className={`mt-3 rounded-md px-4 py-3 ${isCancelled 
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
        : 'bg-green-100 text-green-800 border border-green-300'} ${className}`}
      role="status"
    >
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 flex-shrink-0 text-green-600" />
        <div>
          {isCancelled ? (
            <span className="font-semibold">
              Plano cancelado com sucesso. Você agora está no modo gratuito.
            </span>
          ) : (
            <span className="font-semibold">Plano Gratuito Ativo.</span>
          )}
          {!isCancelled && typeof user?.freeCoupons === 'number' && (
            <span className="flex items-center gap-1 mt-0.5 text-sm ml-1">
              Você possui {user.freeCoupons} {user.freeCoupons === 1 ? 'cupom gratuito disponível' : 'cupons gratuitos disponíveis'}.
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 