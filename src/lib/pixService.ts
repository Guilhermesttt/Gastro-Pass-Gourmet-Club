import React from 'react';

// Serviço para geração de pagamentos PIX
export interface PixData {
  qrCode: string;
  amount: number;
}

export interface SavedPayment {
  id: string;
  planId: string;
  amount: number;
  qrCode: string;
  expiresAt: string;
  status: string; // Deveria ser 'pendente' | 'aprovado' | 'rejeitado' | 'pago' | 'cancelado' como em Payment
}

// Funções de persistência do pagamento
export const savePaymentToLocalStorage = (payment: SavedPayment): void => {
  localStorage.setItem('gastropass_payment', JSON.stringify(payment));
};

export const loadPaymentFromLocalStorage = (): SavedPayment | null => {
  const savedPayment = localStorage.getItem('gastropass_payment');
  if (!savedPayment) return null;
  
  try {
    return JSON.parse(savedPayment);
  } catch (e) {
    console.error('Error parsing saved payment', e);
    return null;
  }
};

export const clearPaymentFromLocalStorage = (): void => {
  localStorage.removeItem('gastropass_payment');
};

// Função para gerar um pagamento PIX
export const generatePixPayment = async (amount: number, planId: string): Promise<PixData> => {
  // Generate a simpler PIX code format to avoid "Data too long" errors
  // This is a simplified mock - in production you would use a proper PIX API
  const simpleCode = `GP${planId.substring(0,3).toUpperCase()}${amount.toFixed(0)}${Date.now().toString().substring(5, 10)}`;
  
  return {
    qrCode: simpleCode,
    amount
  };
};

// Safe QR code props for use in all QR codes
export const getSafeQrCodeProps = () => {
  return {
    onClick: (e: React.MouseEvent) => e.preventDefault(),
    style: { pointerEvents: 'none' as const },
    className: 'mx-auto',
    bgColor: '#FFFFFF',
    fgColor: '#000000',
    level: 'L' as const
  };
};
