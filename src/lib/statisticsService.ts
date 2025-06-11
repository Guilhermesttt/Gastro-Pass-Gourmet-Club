import { collection, query, where, getDocs, startOfMonth, endOfMonth, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

interface MonthlyStats {
  totalBenefits: number;
  conversionRate: number;
  monthStart: Date;
}

export const statisticsService = {
  async getMonthlyStats(date: Date = new Date()): Promise<MonthlyStats> {
    try {
      // Início e fim do mês atual
      const currentMonthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const currentMonthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      // Início e fim do mês anterior
      const lastMonthStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      const lastMonthEnd = new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59);

      // Buscar usuários ativos no mês atual
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calcular total de benefícios resgatados no mês atual
      let totalBenefits = 0;
      let totalPaidUsers = 0;

      users.forEach(user => {
        // Contar benefícios resgatados
        if (user.vouchersRedeemed) {
          totalBenefits += user.vouchersRedeemed;
        }

        // Contar usuários com plano pago
        if (user.subscription?.planId === 'annual' && user.subscription?.status === 'ativo') {
          totalPaidUsers++;
        }
      });

      // Calcular taxa de conversão
      const conversionRate = users.length > 0 ? (totalPaidUsers / users.length) * 100 : 0;

      return {
        totalBenefits,
        conversionRate,
        monthStart: currentMonthStart
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Não foi possível carregar as estatísticas');
    }
  },

  async getMonthlyGrowth(): Promise<{ benefitsGrowth: number; conversionGrowth: number }> {
    try {
      const currentDate = new Date();
      const currentStats = await this.getMonthlyStats(currentDate);
      
      // Pegar stats do mês anterior
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonthStats = await this.getMonthlyStats(lastMonthDate);

      // Calcular crescimento de benefícios
      const benefitsGrowth = lastMonthStats.totalBenefits === 0 ? 0 :
        ((currentStats.totalBenefits - lastMonthStats.totalBenefits) / lastMonthStats.totalBenefits) * 100;

      // Calcular crescimento da taxa de conversão
      const conversionGrowth = lastMonthStats.conversionRate === 0 ? 0 :
        ((currentStats.conversionRate - lastMonthStats.conversionRate) / lastMonthStats.conversionRate) * 100;

      return {
        benefitsGrowth,
        conversionGrowth
      };
    } catch (error) {
      console.error('Erro ao calcular crescimento:', error);
      throw new Error('Não foi possível calcular o crescimento');
    }
  }
};
