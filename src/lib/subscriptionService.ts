import { db } from './firebase';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

export type SubscriptionPlan = 'gratuito' | 'basico' | 'premium' | 'familia';

export interface SubscriptionBenefits {
  planId: SubscriptionPlan;
  accessRestaurants: number;
  discountPercentage: number;
  supportType: 'email' | 'prioritario' | '24/7';
  couponsFrequency: 'nenhum' | 'mensal' | 'semanal';
  price: number;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionBenefits> = {
  gratuito: {
    planId: 'gratuito',
    accessRestaurants: 5,
    discountPercentage: 5,
    supportType: 'email',
    couponsFrequency: 'nenhum',
    price: 0
  },
  basico: {
    planId: 'basico',
    accessRestaurants: 20,
    discountPercentage: 10,
    supportType: 'email',
    couponsFrequency: 'mensal',
    price: 19.90
  },
  premium: {
    planId: 'premium',
    accessRestaurants: -1, // -1 significa acesso a todos
    discountPercentage: 30,
    supportType: 'prioritario',
    couponsFrequency: 'mensal',
    price: 39.90
  },
  familia: {
    planId: 'familia',
    accessRestaurants: -1, // -1 significa acesso a todos
    discountPercentage: 30,
    supportType: '24/7',
    couponsFrequency: 'semanal',
    price: 59.90
  }
};

export const activateSubscription = async (
  userId: string,
  planId: SubscriptionPlan
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const benefits = SUBSCRIPTION_PLANS[planId];
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30); // 30 dias de benefícios

    await updateDoc(userRef, {
      plano: planId,
      beneficiosAtivos: {
        ...benefits,
        expiracao: expirationDate.toISOString()
      },
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao ativar assinatura:', error);
    throw error;
  }
};

export const deactivateSubscription = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      plano: 'gratuito',
      beneficiosAtivos: SUBSCRIPTION_PLANS.gratuito,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao desativar assinatura:', error);
    throw error;
  }
};

export const checkSubscriptionStatus = async (userId: string): Promise<{
  isActive: boolean;
  planId: SubscriptionPlan;
  expirationDate: string | null;
}> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado');
    }

    const userData = userDoc.data();
    const beneficiosAtivos = userData.beneficiosAtivos;
    
    if (!beneficiosAtivos) {
      return {
        isActive: false,
        planId: 'gratuito',
        expirationDate: null
      };
    }

    const expirationDate = new Date(beneficiosAtivos.expiracao);
    const isActive = expirationDate > new Date();

    return {
      isActive,
      planId: beneficiosAtivos.planId,
      expirationDate: beneficiosAtivos.expiracao
    };
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error);
    throw error;
  }
}; 