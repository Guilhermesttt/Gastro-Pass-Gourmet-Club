import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Tipos de planos
export const PLANS = {
  basic: {
    id: 'basic',
    name: 'Básico',
    price: 19.90,
    features: {
      restaurantAccess: 20, // Número máximo de restaurantes
      discountLevel: 'basic', // Nível de desconto
      supportLevel: 'email', // Nível de suporte
      hasCoupons: false // Tem cupons exclusivos
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 39.90,
    features: {
      restaurantAccess: 'all', // Acesso a todos restaurantes
      discountLevel: 'premium', // Descontos premium
      supportLevel: 'priority', // Suporte prioritário
      hasCoupons: true, // Tem cupons exclusivos
      couponFrequency: 'monthly' // Frequência de cupons
    }
  },
  family: {
    id: 'family',
    name: 'Família',
    price: 59.90,
    features: {
      restaurantAccess: 'all', // Acesso a todos restaurantes
      discountLevel: 'premium', // Descontos premium
      supportLevel: '24/7', // Suporte 24/7
      hasCoupons: true, // Tem cupons exclusivos
      couponFrequency: 'weekly', // Frequência de cupons
      maxUsers: 4 // Máximo de usuários
    }
  },
  annual: {
    id: 'annual',
    name: 'Anual',
    price: 150.00,
    features: {
      restaurantAccess: 'all',
      discountLevel: 'premium',
      supportLevel: '24/7',
      hasCoupons: true,
      couponFrequency: 'weekly'
    }
  }
};

// Função para ativar benefícios com base no plano
export const activateBenefits = async (userId: string, planId: string, expirationDateStr?: string) => {
  try {
    // Verificar se o plano existe
    if (!PLANS[planId]) {
      throw new Error(`Plano não encontrado: ${planId}`);
    }
    
    // Utilizar data de expiração fornecida ou calcular (30 dias a partir de agora)
    const now = new Date();
    let expirationDate: Date;
    
    if (expirationDateStr) {
      expirationDate = new Date(expirationDateStr);
    } else {
      expirationDate = new Date(now);
      
      // Se for plano anual, definir expiração para 1 ano
      if (planId === 'annual') {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      } else {
        // Outros planos expiram em 30 dias
        expirationDate.setDate(expirationDate.getDate() + 30);
      }
    }
    
    // Características do plano
    const planFeatures = PLANS[planId].features;
    
    // Obter referência ao documento do usuário
    const userRef = doc(db, 'users', userId);
    
    // Verificar se o usuário existe
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error(`Usuário não encontrado: ${userId}`);
    }
    
    // Atualizar documento do usuário com os benefícios ativos
    await updateDoc(userRef, {
      subscription: {
        planId: planId,
        startDate: now.toISOString(),
        endDate: expirationDate.toISOString(),
        status: 'ativo'
      },
      activeFeatures: planFeatures,
      hasActiveSubscription: true,
      paymentPending: null, // Limpar pagamento pendente
      
      // Configurar cupons gratuitos com base no plano
      freeCoupons: planId === 'basic' ? 3 : 
                  planId === 'premium' ? 5 : 
                  planId === 'family' ? 10 : 0
    });
    
    // Registrar log de ativação
    console.log(`Benefícios do plano ${planId} ativados para o usuário ${userId}. Expira em ${expirationDate.toISOString()}`);
    
    return {
      success: true,
      planId,
      expirationDate: expirationDate.toISOString()
    };
  } catch (error) {
    console.error('Erro ao ativar benefícios:', error);
    throw error;
  }
}; 