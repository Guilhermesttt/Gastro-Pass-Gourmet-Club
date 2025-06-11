import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface PaymentRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  rejectionReason?: string;
  isRetrying: boolean;
}

export const PaymentRejectionModal: React.FC<PaymentRejectionModalProps> = ({
  isOpen,
  onClose,
  onRetry,
  rejectionReason,
  isRetrying
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertOctagon className="h-6 w-6" />
            Pagamento Não Aprovado
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-gray-900">
              Ops! Seu pagamento não foi aprovado.
            </p>
            <p className="text-sm text-gray-500">
              {rejectionReason || 'Por favor, tente novamente ou utilize outro método de pagamento.'}
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col w-full gap-2">
            <Button 
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Tentar Novamente'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Escolher Outro Método
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 