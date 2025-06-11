interface UserBenefits {
  freeBenefitsRemaining: number;
  totalBenefitsUsed: number;
  lastBenefitDate?: string;
}

export const MAX_FREE_BENEFITS = 3;

export const getUserBenefits = (): UserBenefits => {
  const storedBenefits = localStorage.getItem('userBenefits');
  if (storedBenefits) {
    return JSON.parse(storedBenefits);
  }
  
  // Se não existir, cria um novo registro com benefícios gratuitos
  const newBenefits: UserBenefits = {
    freeBenefitsRemaining: MAX_FREE_BENEFITS,
    totalBenefitsUsed: 0
  };
  localStorage.setItem('userBenefits', JSON.stringify(newBenefits));
  return newBenefits;
};

export const useBenefit = (): { success: boolean; message: string } => {
  const benefits = getUserBenefits();
  
  if (benefits.freeBenefitsRemaining > 0) {
    benefits.freeBenefitsRemaining--;
    benefits.totalBenefitsUsed++;
    benefits.lastBenefitDate = new Date().toISOString();
    localStorage.setItem('userBenefits', JSON.stringify(benefits));
    
    return {
      success: true,
      message: `Benefício resgatado com sucesso! Você ainda tem ${benefits.freeBenefitsRemaining} benefícios gratuitos restantes.`
    };
  }
  
  return {
    success: false,
    message: 'Você já utilizou todos os seus benefícios gratuitos. Assine um plano para continuar aproveitando!'
  };
};

export const resetUserBenefits = () => {
  const newBenefits: UserBenefits = {
    freeBenefitsRemaining: MAX_FREE_BENEFITS,
    totalBenefitsUsed: 0
  };
  localStorage.setItem('userBenefits', JSON.stringify(newBenefits));
}; 