import React, { useEffect, useState } from 'react';
import { Payment, getPendingPayments, updatePaymentStatus, refundPayment } from '@/lib/paymentService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const AdminPaymentManager: React.FC = () => {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPendingPayments = async () => {
    try {
      const payments = await getPendingPayments();
      setPendingPayments(payments);
      console.log('[AdminPaymentManager] Pagamentos pendentes carregados:', payments);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pagamentos pendentes.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const handlePaymentAction = async (paymentId: string, action: 'pago' | 'rejeitado') => {
    try {
      if (action === 'rejeitado') {
        // Buscar o pagamento para saber o status
        const payment = pendingPayments.find(p => p.id === paymentId);
        if (payment && (payment.status === 'pago' || payment.status === 'aprovado')) {
          // Chama a função de estorno
          await refundPayment(paymentId);
        }
      }
      await updatePaymentStatus(paymentId, action);
      await loadPendingPayments(); // Recarrega a lista após a ação

      toast({
        title: action === 'pago' ? 'Pagamento Aprovado' : 'Pagamento Rejeitado',
        description: action === 'pago' 
          ? 'O pagamento foi aprovado e os benefícios foram liberados.'
          : 'O pagamento foi rejeitado, o usuário foi movido para o plano gratuito e o valor será estornado se já aprovado.',
        duration: 5000
      });
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar o pagamento.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div>Carregando pagamentos...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gerenciamento de Pagamentos</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {new Date(payment.date).toLocaleDateString()}
              </TableCell>
              <TableCell>{payment.userName || payment.userEmail}</TableCell>
              <TableCell className="capitalize">{
                // Exibe o nome do plano usando o mapeamento PLANS
                (() => {
                  try {
                    // Importação dinâmica para evitar problemas de import recursivo
                    // e garantir que o objeto PLANS está disponível
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { PLANS } = require('@/lib/benefitsService');
                    return PLANS[payment.planId]?.name || payment.planId;
                  } catch {
                    return payment.planId;
                  }
                })()}
              </TableCell>
              <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
              <TableCell className="capitalize">
                {payment.status === 'pago' || payment.status === 'aprovado' ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">Aprovado</span>
                ) : payment.status === 'pendente' ? (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">Pendente</span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">{payment.status}</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  {(payment.status === 'pendente') && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePaymentAction(payment.id, 'pago')}
                    >
                      Aprovar
                    </Button>
                  )}
                  {(payment.status === 'pendente' || payment.status === 'pago' || payment.status === 'aprovado') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePaymentAction(payment.id, 'rejeitado')}
                    >
                      Remover
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {pendingPayments.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Nenhum pagamento pendente
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};