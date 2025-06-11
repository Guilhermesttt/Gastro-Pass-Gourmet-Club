import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Payment, checkPaymentStatus, reopenQRCodePayment } from '@/lib/paymentService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CircleDollarSign, RefreshCw } from 'lucide-react';

interface PaymentQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onPaymentStatusChange: (status: Payment['status'], payment?: Payment) => void;
}

export const PaymentQRCodeModal: React.FC<PaymentQRCodeModalProps> = ({
  isOpen,
  onClose,
  payment,
  onPaymentStatusChange
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReopening, setIsReopening] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !payment.qrCodeExpiracao) return;

    const checkExpiration = () => {
      const expiration = new Date(payment.qrCodeExpiracao!);
      const now = new Date();
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expirado');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    // Check immediately and then set interval
    checkExpiration();
    const interval = setInterval(checkExpiration, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [isOpen, payment.qrCodeExpiracao, payment]);

  const handleCheckStatus = async () => {
    try {
      setIsLoading(true);
      const updatedPayment = await checkPaymentStatus(payment.id);
      onPaymentStatusChange(updatedPayment.status, updatedPayment);

      if (updatedPayment.status === 'aprovado' || updatedPayment.status === 'pago') {
        toast({
          title: 'Pagamento Aprovado!',
          description: 'Seus benefícios foram liberados.',
          duration: 5000
        });
        onClose();
      } else if (updatedPayment.status === 'rejeitado') {
        toast({
          title: 'Pagamento Rejeitado',
          description: 'Você foi movido para o plano gratuito.',
          variant: 'destructive'
        });
        onClose();
      } else {
        toast({
          title: 'Pagamento Pendente',
          description: 'O pagamento ainda não foi processado. Tente novamente mais tarde.',
        });
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível verificar o status do pagamento.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReopenQRCode = async () => {
    try {
      setIsReopening(true);
      const updatedPayment = await reopenQRCodePayment(payment.id);
      onPaymentStatusChange(updatedPayment.status, updatedPayment);
      
      toast({
        title: 'QR Code Atualizado',
        description: 'Um novo QR Code foi gerado para o pagamento.',
      });
      
      setIsExpired(false);
    } catch (error: any) {
      console.error('Erro ao reabrir QR Code:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar um novo QR Code.',
        variant: 'destructive'
      });
    } finally {
      setIsReopening(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">QR Code de Pagamento</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 animate-fade-scale">
            <div className="relative w-20 h-20 shine">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-primary border-l-transparent border-r-transparent border-b-transparent animate-spin-gentle"></div>
              <div className="absolute inset-0 flex items-center justify-center animate-pulse-soft">
                <CircleDollarSign className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-700 animate-fade-scale delay-200">
              Verificando pagamento...
            </p>
            <p className="mt-2 text-sm text-gray-500 animate-fade-scale delay-300">
              Isso pode levar alguns instantes
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 p-4">
            {payment.status === 'pendente' && (
              <div className={`bg-white p-4 rounded-lg ${isExpired ? 'opacity-50' : ''}`}>
                <QRCodeSVG
                  value={payment.qrCode || ''}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            )}
            
            <div className="text-center">
              {payment.status === 'pendente' && (
                <>
                  <p className={`text-sm ${isExpired ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                    {isExpired ? 'QR Code Expirado' : `Tempo restante: ${timeLeft}`}
                  </p>
                  <p className="text-lg font-semibold mt-2">
                    Valor: R$ {payment.amount.toFixed(2)}
                  </p>
                </>
              )}
              
              {payment.status === 'aprovado' && (
                <div className="bg-green-50 p-4 rounded-lg text-green-800">
                  <p className="font-bold">Pagamento Aprovado!</p>
                  <p>Seus benefícios foram liberados.</p>
                </div>
              )}
              
              {payment.status === 'rejeitado' && (
                <div className="bg-red-50 p-4 rounded-lg text-red-800">
                  <p className="font-bold">Pagamento Rejeitado</p>
                  <p>Por favor, tente novamente ou entre em contato com o suporte.</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              {payment.status === 'pendente' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCheckStatus}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verificar Status
                  </Button>
                  
                  {isExpired && (
                    <Button
                      variant="secondary"
                      onClick={handleReopenQRCode}
                      disabled={isReopening}
                      className="flex items-center gap-2"
                    >
                      {isReopening ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Reabrir QR Code
                    </Button>
                  )}
                </>
              )}
              
              <Button onClick={onClose}>
                {payment.status === 'pendente' ? 'Fechar' : 'OK'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};