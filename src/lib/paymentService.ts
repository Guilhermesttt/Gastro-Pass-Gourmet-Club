import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, getDoc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';
import QRCode from 'qrcode';
import { validateAuthToken } from './authService';

// Removed Mercado Pago API configuration

export interface Payment {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'pago' | 'cancelado';
  planId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  qrCode?: string;
  qrCodeExpiracao?: string;
  expiresAt?: string;
  createdAt?: Timestamp | null;
  rejectionReason?: string;
  paymentProvider?: {
    name: 'stripe';
    paymentId?: string;
    preferenceId?: string;
  };
}

// Generate QR code as data URL
export const generateQRCode = async (text: string): Promise<string> => {
  try {
    // If text is too long, compress it
    let qrText = text;
    if (text.length > 500) {
      // For very long data, create a shortened version with essential info
      try {
        const jsonData = JSON.parse(text);
        qrText = JSON.stringify({
          id: jsonData.id || 'payment',
          amount: jsonData.amount || 0,
          date: jsonData.date || new Date().toISOString().slice(0, 10)
        });
      } catch (e) {
        // If not JSON, truncate with ellipsis
        qrText = text.slice(0, 500) + '...';
      }
    }
    
    const url = await QRCode.toDataURL(qrText, {
      width: 256,
      margin: 1,
      errorCorrectionLevel: 'L', // Use lower error correction to allow more data
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return url;
  } catch (error) {
    console.error('Error generating QR code:', error);
    
    // Create a fallback QR code with a simple message
    try {
      const fallbackUrl = await QRCode.toDataURL('Erro ao gerar QR code. Por favor, tente novamente.', {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'L',
      });
      return fallbackUrl;
    } catch (fallbackError) {
      throw new Error('Failed to generate QR code');
    }
  }
};

export const createPayment = async (paymentData: Omit<Payment, 'id' | 'qrCode' | 'paymentProvider'>) => {
  try {
    // Validate token before making the request
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Set expiration date (24 hours from now)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    const payment = {
      ...paymentData,
      status: 'pendente' as const,
      createdAt: null, // Initialize as null and set after saving to Firestore
      expiresAt: expirationDate.toISOString(),
    };

    let qrCodeDataURL;

    // Use the existing PIX QR code generation logic directly
    const paymentInfo = JSON.stringify({
      description: payment.description,
      amount: payment.amount,
      date: new Date().toISOString(),
    });
    qrCodeDataURL = await generateQRCode(paymentInfo);
    
    // Always proceed with saving the payment
    const paymentWithQr = {
      ...payment,
      qrCode: qrCodeDataURL,
      qrCodeExpiracao: expirationDate.toISOString(),
      createdAt: serverTimestamp(), // Set serverTimestamp() when saving to Firestore
    };
    
    // Save to Firestore
    const docRef = await addDoc(collection(db, 'payments'), paymentWithQr);
    return { ...paymentWithQr, id: docRef.id, createdAt: null }; // Return with id and null createdAt
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const updatePaymentStatus = async (paymentId: string, status: Payment['status']) => {
  try {
    // Validate token before making the request
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, { status });
    
    // If payment is approved, update user subscription
    if (status === 'aprovado' || status === 'pago') {
      const paymentDoc = await getDoc(paymentRef);
      const paymentData = paymentDoc.data() as Payment;
      
      // This should trigger subscription update logic
      await updateUserBenefitsFromPayment(paymentData);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Utility function to calculate expiration date for annual plan
const calculateAnnualPlanExpiryDate = (startDate: Date = new Date()): string => {
  const expiryDate = new Date(startDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  return expiryDate.toISOString();
};

export const updateUserBenefitsFromPayment = async (payment: Payment) => {
  try {
    // Validate token before making the request
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    // Calculate expiration date based on plan type
    const now = new Date();
    let expirationDate: string;
    
    // If it's the annual plan, calculate 1 year from now
    if (payment.planId === 'annual') {
      expirationDate = calculateAnnualPlanExpiryDate(now);
    } else {
      // Default to 30 days for other plans
      const expDate = new Date(now);
      expDate.setDate(expDate.getDate() + 30);
      expirationDate = expDate.toISOString();
    }
    
    // Update user document with appropriate expiration date
    const { activateBenefits } = await import('./benefitsService');
    return await activateBenefits(payment.userId, payment.planId, expirationDate);
    
  } catch (error) {
    console.error('Error updating user benefits from payment:', error);
    throw error;
  }
};

export const checkPaymentStatus = async (paymentId: string) => {
  try {
    // Validate token before making the request
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    const paymentRef = doc(db, 'payments', paymentId);
    const paymentDoc = await getDoc(paymentRef);
    
    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }
    
    const payment = { id: paymentDoc.id, ...paymentDoc.data() } as Payment;
    
    // REMOVED Mercado Pago specific status check
    // Assuming status is updated via webhook or other mechanism now, 
    // just return the payment data from Firestore.
    // If there's no webhook, the status will remain 'pendente' until manually updated.

    return payment;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
};

export const getPendingPayments = async () => {
  try {
    // Validate token before making the request
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    const q = query(
      collection(db, 'payments'),
      where('status', '==', 'pendente')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    throw error;
  }
};

/**
 * Retorna todos os pagamentos do sistema para administradores
 */
export const getAllPayments = async () => {
  try {
    // Validar token antes de fazer a requisição
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    const q = query(collection(db, 'payments'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
  } catch (error) {
    console.error('Error fetching all payments:', error);
    throw error;
  }
};

export const getUserPayments = async (userId: string) => {
  try {
    // Validate token before making the request
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    const q = query(
      collection(db, 'payments'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Payment[];
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
};

export const reopenQRCodePayment = async (userId: string) => {
  try {
    // Validar token antes de fazer a requisição
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    // Buscar pagamentos pendentes do usuário
    const payments = await getUserPayments(userId);
    const pendingPayment = payments.find(p => p.status === 'pendente');
    
    // If a pending payment exists and is not expired and has a qrCode, update user state and return it.
    if (pendingPayment && pendingPayment.expiresAt && new Date(pendingPayment.expiresAt) > new Date() && pendingPayment.qrCode) {
         // Update user's paymentPending field in case it was cleared
        await updateUserPaymentPending(userId, {
            paymentId: pendingPayment.id,
            planId: pendingPayment.planId,
            qrCode: pendingPayment.qrCode,
            status: pendingPayment.status,
            createdAt: pendingPayment.createdAt ? new Date(pendingPayment.createdAt.toDate()).toISOString() : new Date().toISOString(), // Convert Timestamp to string if necessary
            expiresAt: pendingPayment.expiresAt,
            amount: pendingPayment.amount
        });
      return pendingPayment;
    }
    
    // If no valid pending payment is found (expired, missing QR, or not exist),
    // indicate that a new payment needs to be initiated (handled in Dashboard.tsx).
    throw new Error('Nenhum pagamento pendente válido encontrado. Por favor, inicie um novo pagamento.');

  } catch (error) {
    console.error('Error reopening QR code:', error);
    throw error;
  }
};

// Função para criar um pagamento via PIX
export const createPixPayment = async (paymentData: Omit<Payment, 'id' | 'qrCode' | 'qrCodeExpiracao' | 'paymentProvider'>) => {
  try {
    // Validar token antes de fazer a requisição
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Definir data de expiração (24 horas a partir de agora)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    // Criar o payload do pagamento
    const payment = {
      ...paymentData,
      status: 'pendente' as const,
      expiresAt: expirationDate.toISOString(),
      createdAt: null, // Initialize as null
    };

    // Add data and expiration to the payment (without QR code)
    const paymentWithQR = {
      ...payment,
      createdAt: serverTimestamp(), // Set serverTimestamp() when saving to Firestore
    };

    // Salvar no Firestore
    const docRef = await addDoc(collection(db, 'payments'), paymentWithQR);
    
    // Atualizar o usuário com o pagamento pendente
    await updateUserPaymentPending(payment.userId, {
      paymentId: docRef.id,
      planId: payment.planId,
      status: 'pendente',
      createdAt: new Date().toISOString(),
      expiresAt: expirationDate.toISOString(),
      amount: payment.amount
    });

    return { ...paymentWithQR, id: docRef.id, createdAt: null }; // Return with id and null createdAt
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    throw error;
  }
};

export const updateUserPaymentPending = async (userId: string, paymentDetails: { 
  paymentId: string;
  planId: string;
  qrCode?: string;
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'pago' | 'cancelado';
  createdAt?: string;
  expiresAt?: string;
  amount?: number;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    // Ensure qrCode is not undefined
    const detailsToSave = {
      ...paymentDetails,
      qrCode: paymentDetails.qrCode === undefined ? null : paymentDetails.qrCode,
    };
    await updateDoc(userRef, {
      paymentPending: detailsToSave // Use the sanitized object
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar pagamento pendente do usuário:', error);
    throw error;
  }
};

export const checkExpiredPayments = async () => {
  try {
    // Validar token antes de fazer a requisição
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Obter todos os pagamentos pendentes
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('status', '==', 'pendente'));
    const paymentDocs = await getDocs(q);
    
    const now = new Date();
    let expiredCount = 0;
    
    // Verificar cada pagamento
    for (const paymentDoc of paymentDocs.docs) {
      const payment = paymentDoc.data() as Payment;
      
      // Verificar se o pagamento expirou
      if (payment.expiresAt && new Date(payment.expiresAt) < now) {
        // Atualizar status para rejeitado
        await updatePaymentStatus(paymentDoc.id, 'rejeitado');
        expiredCount++;
        
        // Atualizar usuário para plano gratuito
        await updateUserPaymentToFree(payment.userId);
      }
    }
    
    return { expiredCount };
  } catch (error) {
    console.error('Erro ao verificar pagamentos expirados:', error);
    throw error;
  }
};

// Função para atualizar o usuário para plano gratuito após rejeição de pagamento
export const updateUserPaymentToFree = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscription: {
        planId: 'free',
        startDate: new Date().toISOString(),
        endDate: '', // Plano gratuito não tem data de término
        status: 'ativo'
      },
      paymentPending: null,
      hasActiveSubscription: false,
      freeCoupons: 3 // Restaurar cupons gratuitos
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar usuário para plano gratuito:', error);
    throw error;
  }
};

export const reopenPaymentQRCode = async (userId: string) => {
  try {
    // Validar token antes de fazer a requisição
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }
    
    // Buscar todos os pagamentos do usuário
    const payments = await getUserPayments(userId);
    
    if (!payments || payments.length === 0) {
      throw new Error('Nenhum pagamento encontrado para este usuário.');
    }
    
    // Ordenar pagamentos por data de criação (mais recente primeiro)
    const sortedPayments = [...payments].sort((a, b) => {
      const dateA = a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const dateB = b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return dateB - dateA;
    });
    
    // Procurar por pagamentos pendentes
    const pendingPayment = sortedPayments.find(p => p.status === 'pendente');
    
    // Procurar por pagamentos rejeitados (para mostrar mensagens diferentes)
    const rejectedPayment = sortedPayments.find(p => p.status === 'rejeitado');
    
    // Verificar se há um pagamento pendente não expirado
    if (pendingPayment && pendingPayment.expiresAt) {
      const expirationDate = new Date(pendingPayment.expiresAt);
      const now = new Date();
      
      // Verificar se o pagamento expirou
      if (expirationDate < now) {
        throw new Error('O pagamento pendente encontrado já expirou. Por favor, inicie um novo pagamento.');
      }
      
      // Atualizar dados do pagamento pendente no documento do usuário
      await updateUserPaymentPending(userId, {
        paymentId: pendingPayment.id,
        planId: pendingPayment.planId,
        qrCode: pendingPayment.qrCode ?? null,
        status: pendingPayment.status,
        createdAt: pendingPayment.createdAt 
          ? new Date(pendingPayment.createdAt.toDate()).toISOString() 
          : new Date().toISOString(),
        expiresAt: pendingPayment.expiresAt,
        amount: pendingPayment.amount
      });
      
      // Se o QR code não existir ou estiver vazio, informar ao usuário
      if (!pendingPayment.qrCode) {
        console.warn('Pagamento pendente encontrado, mas sem QR code associado');
      }
      
      return pendingPayment;
    }
    
    // Se encontrou um pagamento rejeitado, mostrar mensagem específica
    if (rejectedPayment) {
      throw new Error('O pagamento foi rejeitado. Por favor, inicie um novo pagamento.');
    }
    
    // Se não encontrou nenhum pagamento pendente ou rejeitado
    throw new Error('Nenhum pagamento pendente válido encontrado. Por favor, inicie um novo pagamento.');

  } catch (error) {
    console.error('Error reopening QR code:', error);
    throw error;
  }
};

/**
 * Exclui um pagamento do banco de dados
 * @param paymentId ID do pagamento a ser excluído
 * @returns true se bem sucedido
 */
export const deletePayment = async (paymentId: string) => {
  try {
    // Validar token antes de fazer a requisição
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Excluir o pagamento
    const paymentRef = doc(db, 'payments', paymentId);
    await deleteDoc(paymentRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir pagamento:', error);
    throw error;
  }
};

/**
 * Exclui múltiplos pagamentos do banco de dados
 * @param paymentIds Array de IDs de pagamentos a serem excluídos
 * @returns Número de pagamentos excluídos com sucesso
 */
export const deleteMultiplePayments = async (paymentIds: string[]) => {
  try {
    // Validar token antes de fazer a requisição
    const isTokenValid = await validateAuthToken();
    if (!isTokenValid) {
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    let successCount = 0;

    // Excluir cada pagamento
    for (const paymentId of paymentIds) {
      try {
        const paymentRef = doc(db, 'payments', paymentId);
        await deleteDoc(paymentRef);
        successCount++;
      } catch (error) {
        console.error(`Erro ao excluir pagamento ID ${paymentId}:`, error);
        // Continuar com os próximos mesmo se houver erro
      }
    }

    return successCount;
  } catch (error) {
    console.error('Erro ao excluir múltiplos pagamentos:', error);
    throw error;
  }
};

/**
 * Estorna um pagamento aprovado (simulação).
 * Substitua por integração real com o gateway de pagamento se necessário.
 */
export const refundPayment = async (paymentId: string): Promise<boolean> => {
  // Aqui você pode integrar com o gateway real (ex: Stripe, Mercado Pago, etc)
  // Por enquanto, apenas simula o estorno
  console.log(`Estornando pagamento ${paymentId} (simulado)`);
  // Se for integração real, lance erro se falhar
  return true;
};
