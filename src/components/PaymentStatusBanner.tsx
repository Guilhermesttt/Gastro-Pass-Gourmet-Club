import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Payment } from '@/lib/paymentService';

interface PaymentStatusBannerProps {
  payment: Payment | null;
  onOpenPayment: () => void;
}

export const PaymentStatusBanner: React.FC<PaymentStatusBannerProps> = ({ 
  payment, 
  onOpenPayment 
}) => {
  if (!payment) return null;

  if (payment.status === 'pendente') {
    return (
      <div className="bg-red-500 text-white p-4 rounded-lg mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-semibold">Pagamento Pendente</p>
            <p className="text-sm">Seu pagamento está aguardando confirmação.</p>
          </div>
        </div>
        <button 
          onClick={onOpenPayment}
          className="bg-white text-red-500 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-50 transition-colors"
        >
          Visualizar QR Code
        </button>
      </div>
    );
  }

  if (payment.status === 'aprovado' || payment.status === 'pago') {
    return (
      <div className="bg-green-500 text-white p-4 rounded-lg mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-semibold">Pagamento Aprovado!</p>
            <p className="text-sm">Seus benefícios foram liberados.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentStatusBanner; 