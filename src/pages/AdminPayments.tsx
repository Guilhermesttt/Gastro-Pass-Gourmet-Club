import { useEffect, useState, useRef } from 'react';
import { Check, X, Search, RefreshCw, Trash2, QrCode, Clock, CreditCard, Loader2 } from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from 'qrcode.react';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Payment, getPendingPayments, updatePaymentStatus, getAllPayments, deletePayment, deleteMultiplePayments } from '@/lib/paymentService';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Adicionar CSS para animações
const animationStyles = `
  @keyframes statusChange {
    0% { background-color: rgba(255, 255, 100, 0.3); }
    50% { background-color: rgba(255, 255, 100, 0.5); }
    100% { background-color: transparent; }
  }
  
  .status-changed {
    animation: statusChange 2s ease-in-out;
  }

  @keyframes newPayment {
    0% { background-color: rgba(0, 255, 0, 0.1); }
    50% { background-color: rgba(0, 255, 0, 0.2); }
    100% { background-color: transparent; }
  }
  
  .payment-new {
    animation: newPayment 2s ease-in-out;
  }
`;

const AdminPayments = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const prevPaymentsLength = useRef(0);
  const [changedPaymentIds, setChangedPaymentIds] = useState<string[]>([]);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [newPaymentIds, setNewPaymentIds] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const autoUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Carregar pagamentos
  const loadPayments = async (showToast = true) => {
    try {
      setIsRefreshing(true);
      const allPayments = await getAllPayments();
      
      // Ordenar por data (mais recente primeiro)
      const sortedPayments = allPayments.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Verificar novos pagamentos
      const currentIds = new Set(payments.map(p => p.id));
      const newPayments = sortedPayments.filter(p => !currentIds.has(p.id));
      
      // Marcar novos pagamentos para animação
      newPayments.forEach(payment => markPaymentAsNew(payment.id));
      
      setPayments(sortedPayments);
      setLastUpdateTime(new Date());

      if (showToast && newPayments.length > 0) {
        toast({
          title: `${newPayments.length} ${newPayments.length === 1 ? 'novo pagamento' : 'novos pagamentos'}`,
          description: "A lista foi atualizada automaticamente.",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      if (error instanceof Error && error.message.includes('Sessão expirada')) {
        toast({
          variant: "destructive",
          title: "Sessão Expirada",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
        });
        navigate('/admin/login');
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao carregar pagamentos",
          description: "Não foi possível atualizar a lista de pagamentos.",
        });
      }
      setAutoUpdateEnabled(false); // Desativa atualização automática em caso de erro
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para marcar um pagamento como novo
  const markPaymentAsNew = (paymentId: string) => {
    setNewPaymentIds(prev => [...prev, paymentId]);
    setTimeout(() => {
      setNewPaymentIds(prev => prev.filter(id => id !== paymentId));
    }, 2000);
  };

  // Configurar atualização automática
  useEffect(() => {
    if (autoUpdateEnabled) {
      if (autoUpdateIntervalRef.current) {
        clearInterval(autoUpdateIntervalRef.current);
      }
      
      autoUpdateIntervalRef.current = setInterval(() => {
        loadPayments(false); // false para não mostrar toast em cada atualização automática
      }, 10000); // Atualiza a cada 10 segundos
      
      return () => {
        if (autoUpdateIntervalRef.current) {
          clearInterval(autoUpdateIntervalRef.current);
        }
      };
    }
  }, [autoUpdateEnabled]);

  // Firebase listener for real-time notifications
  useEffect(() => {
    // Listener para TODOS os pagamentos, não apenas pendentes
    const q = query(collection(db, 'payments'));
    
    let isFirstLoad = true;
    let previousPayments: Record<string, Payment['status']> = {};
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        // Converter documentos para o formato Payment
        const currentPayments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Payment[];

        // Log de depuração
        console.log('Pagamentos recebidos do Firestore:', currentPayments.length);
        if (currentPayments.length > 0) {
          // Mostrar amostra do primeiro pagamento para depuração
          console.log('Exemplo de dados de pagamento:', JSON.stringify(currentPayments[0], null, 2));
        } else {
          console.warn('Nenhum pagamento encontrado no Firestore');
        }
        
        // Ordenar por data (mais recente primeiro)
        const sortedPayments = currentPayments.sort((a, b) => {
          // Verificar se as datas existem para evitar erros
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        
        // Atualizar lista de pagamentos com todos os dados
        setPayments(sortedPayments);
        
        if (!isFirstLoad) {
          // Verificar mudanças nos status para animações
          snapshot.docChanges().forEach(change => {
            const newData = change.doc.data() as Payment;
            const id = change.doc.id;
            
            // Se o status mudou e não é a primeira carga
            if (previousPayments[id] && previousPayments[id] !== newData.status) {
              // Marca para animação
              markPaymentChanged(id);
              console.log(`Pagamento ${id} mudou de ${previousPayments[id]} para ${newData.status}`);
            }
          });
        }
        
        // Armazenar estados atuais para comparação futura
        previousPayments = currentPayments.reduce((acc, payment) => {
          acc[payment.id] = payment.status;
          return acc;
        }, {} as Record<string, Payment['status']>);
        
        // Atualizar contagem de pendentes para comparação futura
        const pendingCount = currentPayments.filter(p => p.status === 'pendente').length;
        prevPaymentsLength.current = pendingCount;
        isFirstLoad = false;
      } catch (error) {
        console.error('Erro ao processar dados de pagamentos:', error);
      }
    }, (error) => {
      console.error('Error in payments listener:', error);
    });
    
    return () => unsubscribe();
  }, []);

  const handlePaymentAction = async (paymentId: string, action: 'approve' | 'reject') => {
    setIsProcessing(true);
    try {
      const newStatus = action === 'approve' ? 'aprovado' : 'rejeitado';
      await updatePaymentStatus(paymentId, newStatus);
      
      // Marcar o pagamento para animação
      markPaymentChanged(paymentId);
      
      // Fechar o modal de QR Code se estiver aberto
      if (selectedPayment?.id === paymentId) {
        setIsQrCodeModalOpen(false);
        setSelectedPayment(null);
      }
      
      // Não vamos mais remover o item da lista, pois o listener já atualizará em tempo real
      // Mostramos apenas o toast de confirmação
      toast({
        title: action === 'approve' ? 'Pagamento aprovado' : 'Pagamento rejeitado',
        description: `O pagamento foi ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: "Ocorreu um erro ao processar o pagamento.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowQRCode = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsQrCodeModalOpen(true);
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="bg-yellow-50">Pendente</Badge>;
      case 'pago':
      case 'aprovado':
        return <Badge variant="default" className="bg-green-50 text-green-700">Aprovado</Badge>;
      case 'cancelado':
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const filteredPayments = payments.filter(payment => 
    (payment.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    payment.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    payment.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    // Garantir que os campos necessários existam para evitar erros
    payment.userId && payment.date && payment.amount
  );

  // Função para marcar um pagamento como recém alterado (para animação)
  const markPaymentChanged = (paymentId: string) => {
    setChangedPaymentIds(prev => [...prev, paymentId]);
    
    // Remover o ID depois de 2 segundos (duração da animação)
    setTimeout(() => {
      setChangedPaymentIds(prev => prev.filter(id => id !== paymentId));
    }, 2000);
  };

  // Função para limpar a lista de pagamentos
  const clearPaymentsList = () => {
    setPayments([]);
    setIsConfirmClearOpen(false);
    toast({
      title: "Lista limpa",
      description: "A lista de pagamentos foi limpa com sucesso",
    });
  };

  // Selecionar/deselecionar um pagamento
  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  // Selecionar/deselecionar todos os pagamentos
  const toggleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      // Se todos estão selecionados, deseleciona todos
      setSelectedPayments(new Set());
    } else {
      // Caso contrário, seleciona todos
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
    }
  };

  // Excluir os pagamentos selecionados
  const deleteSelectedPayments = async () => {
    try {
      setIsProcessing(true);
      setIsConfirmDeleteOpen(false);
      
      const paymentIds = Array.from(selectedPayments);
      
      if (paymentIds.length === 0) {
        toast({
          title: "Nenhum pagamento selecionado",
          description: "Selecione pelo menos um pagamento para excluir.",
          variant: "destructive"
        });
        return;
      }
      
      const count = await deleteMultiplePayments(paymentIds);
      
      toast({
        title: "Pagamentos excluídos",
        description: `${count} pagamento(s) foram excluídos permanentemente.`,
      });
      
      // Atualizar a lista
      await loadPayments();
      
      // Limpar seleções
      setSelectedPayments(new Set());
    } catch (error) {
      console.error("Erro ao excluir pagamentos:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir os pagamentos.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full">
      {/* Estilos CSS para animações */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div className="lg:pl-64">
        <AdminSidebar />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-2xl font-semibold">Gerenciar Pagamentos</h1>
                <p className="mt-2 text-muted-foreground">
                  Lista de todos os pagamentos realizados na plataforma.
                  {lastUpdateTime && (
                    <span className="ml-2 text-sm">
                      Última atualização: {lastUpdateTime.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
                  className={cn(
                    "flex items-center gap-2",
                    autoUpdateEnabled ? "text-green-600" : "text-gray-600"
                  )}
                  title={autoUpdateEnabled ? "Desativar atualização automática" : "Ativar atualização automática"}
                >
                  {autoUpdateEnabled ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Auto Atualização Ativada
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Auto Atualização Desativada
                    </>
                  )}
                </Button>
                {selectedPayments.size > 0 && (
                  <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                        title="Excluir pagamentos selecionados"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir Selecionados ({selectedPayments.size})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Pagamentos</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação excluirá permanentemente {selectedPayments.size} pagamento(s) do banco de dados.
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={deleteSelectedPayments}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "Excluindo..." : "Excluir"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="mt-6 bg-card rounded-xl shadow-sm border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox 
                        checked={filteredPayments.length > 0 && selectedPayments.size === filteredPayments.length} 
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        Nenhum pagamento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow 
                        key={payment.id} 
                        className={cn({
                          'status-changed': changedPaymentIds.includes(payment.id),
                          'payment-new': newPaymentIds.includes(payment.id)
                        })}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={selectedPayments.has(payment.id)} 
                            onCheckedChange={() => togglePaymentSelection(payment.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payment.userName || 'Nome não disponível'}</div>
                            <div className="text-sm text-muted-foreground">{payment.userEmail || 'Email não disponível'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{payment.description || 'Sem descrição'}</TableCell>
                        <TableCell className="font-medium">
                          R$ {payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Ícone Aprovar: só aparece se o status for pendente */}
                            {payment.status === 'pendente' && (
                              <Button
                                variant="ghost" // Usar variant ghost para botões apenas com ícone
                                size="icon" // Usar size icon para botões apenas com ícone
                                onClick={() => handlePaymentAction(payment.id, 'approve')}
                                disabled={isProcessing}
                                title="Aprovar Pagamento" // Adicionado título para acessibilidade
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {/* Ícone Rejeitar: aparece se o status for pendente, pago ou aprovado */}
                            {(payment.status === 'pendente' || payment.status === 'pago' || payment.status === 'aprovado') && (
                               <Button
                                variant="ghost" // Usar variant ghost para botões apenas com ícone
                                size="icon" // Usar size icon para botões apenas com ícone
                                onClick={() => handlePaymentAction(payment.id, 'reject')}
                                disabled={isProcessing}
                                title="Rejeitar Pagamento" // Adicionado título para acessibilidade
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPayments;