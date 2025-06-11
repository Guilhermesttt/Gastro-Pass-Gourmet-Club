import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import RestaurantCard from '@/components/RestaurantCard';
import Footer from '@/components/Footer';
import UserAccountSection from '@/components/UserAccountSection';
import PlanNotification from '@/components/PlanNotification';
import ActivePlanInfo from '@/components/ActivePlanInfo';
import FreePlanNotification from '@/components/FreePlanNotification';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, User, Store, Info, AlertTriangle, X, Gift, CreditCard, Clock, ArrowRight, QrCode, ArrowLeft, Check, Calendar, Shield, Loader2, RefreshCw, Copy, AlertOctagon, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { restaurantService } from '@/lib/restaurantService';
import { Restaurant, CuisineType, CUISINE_TYPES } from '@/types/admin';
import { reopenPaymentQRCode, checkPaymentStatus, createPayment, getUserPayments, Payment } from '@/lib/paymentService';
import { PLANS } from '@/lib/benefitsService';
import { SavedPayment, loadPaymentFromLocalStorage, savePaymentToLocalStorage, clearPaymentFromLocalStorage } from '@/lib/pixService';
import { Timestamp } from 'firebase/firestore';
import { validateAuthToken } from '@/lib/authService';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { syncUserData } from '@/lib/firestoreService';
import { PaymentRejectionModal } from '@/components/PaymentRejectionModal';
import { UserData } from '@/types/auth';

// Interface para planos
interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

// Interface for pending payment state in Dashboard
interface PaymentPending {
  paymentId: string;
  planId: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'pago' | 'cancelado';
  createdAt: string;
  expiresAt: string;
  amount: number;
  qrCode?: string; // Include qrCode as optional
  rejectionReason?: string; // Added rejectionReason field
  onQrCodeClick?: (event: React.MouseEvent) => void;
}

// Utility function to calculate expiration date for annual plan
// This adds exactly one year to the given date (or current date if none provided)
// For example: 2023-06-15 becomes 2024-06-15
const calculateAnnualPlanExpiryDate = (startDate: Date = new Date()): string => {
  const expiryDate = new Date(startDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  return expiryDate.toISOString();
};

// Planos disponíveis
const plans: Plan[] = [
  {
    id: 'annual',
    name: 'Anual',
    price: 150.00,
    description: 'Acesso completo por um ano',
    features: [
      'Acesso ilimitado a todos os restaurantes',
      'Todos os benefícios premium',
      'Suporte prioritário 24/7',
      'Cupons exclusivos mensais'
    ]
  }
];

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [noRestaurants, setNoRestaurants] = useState(false);
  const [noRestaurantsInArea] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVoucherRestaurant, setSelectedVoucherRestaurant] = useState<Restaurant | null>(null);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(true);
  const [showStateSelectionMessage, setShowStateSelectionMessage] = useState(false);
  const [showPlanCancelledNotice, setShowPlanCancelledNotice] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  // Estados para gerenciar assinaturas (copiaveis de ManageSubscription.tsx)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [savedPayment, setSavedPayment] = useState<SavedPayment | null>(null);
  const [isPaymentApprovedModalOpen, setIsPaymentApprovedModalOpen] = useState(false);
  const [isPaymentRejectedModalOpen, setIsPaymentRejectedModalOpen] = useState(false);
  
  // Estados para cancelamento de plano (copiaveis de ManageSubscription.tsx)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const [isPaymentRejectionModalOpen, setIsPaymentRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [isRetrying, setIsRetrying] = useState(false);
  const retryCountRef = useRef(0);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Verificar se há um parâmetro de plano cancelado na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planCancelled = params.get('planCancelled');
    
    if (planCancelled === 'true') {
      setShowPlanCancelledNotice(true);
      
      // Remove o parâmetro da URL sem recarregar a página
      const newUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, document.title, newUrl);
      
      // Esconder a notificação após 5 segundos
      setTimeout(() => {
        setShowPlanCancelledNotice(false);
      }, 5000);
    }
  }, []);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  // Função para formatar data de expiração
  const formatExpirationDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23' // Use 24-hour format
    }).format(date);
  };

  // Verificar se há pagamento pendente
  const hasPendingPayment = user?.paymentPending && user.paymentPending.status === 'pendente';
  
  // Verificar se o pagamento expirou
  const isPaymentExpired = user?.paymentPending?.expiresAt && 
    new Date(user.paymentPending.expiresAt) < new Date();

  // Definição de loadUserData
  const loadUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const isTokenValid = await validateAuthToken();
      if (!isTokenValid) {
        toast({
          variant: 'destructive',
          title: 'Sessão Expirada',
          description: 'Sua sessão expirou. Por favor, faça login novamente.',
        });
        navigate('/login');
        return;
      }
      const userDocRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userDataFromDb = { id: userSnap.id, ...userSnap.data() } as any;
        localStorage.setItem('user', JSON.stringify(userDataFromDb));
        setUser(userDataFromDb);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  }, [user?.id, setUser, navigate, toast]);

  // Função para lidar com a rejeição do pagamento
  const handlePaymentRejection = useCallback((reason?: string) => {
    setIsPaymentDialogOpen(false); // Fecha o modal de QR Code
    setRejectionReason(reason);
    setIsPaymentRejectionModalOpen(true);
  }, []);

  // Função para tentar o pagamento novamente
  const handleRetryPayment = async () => {
    if (retryCountRef.current >= 3) {
      toast({
        title: "Limite de tentativas excedido",
        description: "Por favor, tente outro método de pagamento ou entre em contato com o suporte.",
        variant: "destructive"
      });
      setIsPaymentRejectionModalOpen(false);
      return;
    }

    setIsRetrying(true);
    retryCountRef.current += 1;

    try {
      if (!selectedPlanId) {
        throw new Error("Nenhum plano selecionado");
      }

      await handleGeneratePayment(selectedPlanId);
      setIsPaymentRejectionModalOpen(false);
    } catch (error) {
      console.error("Erro ao tentar novamente:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Não foi possível processar seu pagamento. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsRetrying(false);
    }
  };

  // Modificar o startPaymentCheck para incluir o tratamento de rejeição
  const startPaymentCheck = useCallback(() => {
    if (statusCheckRef.current) clearInterval(statusCheckRef.current);

    statusCheckRef.current = setInterval(async () => {
      try {
        const isTokenValid = await validateAuthToken();
        if (!isTokenValid) {
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
          toast({
            variant: 'destructive',
            title: 'Sessão Expirada',
            description: 'Sua sessão expirou. Por favor, faça login novamente.',
          });
          navigate('/login');
          return;
        }

        const paymentToCheckId = savedPayment?.id || user?.paymentPending?.paymentId;
        if (!paymentToCheckId) {
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
          return;
        }

        const paymentStatus = await checkPaymentStatus(paymentToCheckId);

                  if (paymentStatus.status === 'pago' || paymentStatus.status === 'aprovado') {
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
          toast({ title: 'Pagamento aprovado!', description: 'Seu plano foi atualizado com sucesso.' });
          setIsPaymentDialogOpen(false);
          clearPaymentFromLocalStorage(); 
          setSavedPayment(null);
          
          // Atualizar a subscription do usuário com a nova data de expiração
          const startDate = new Date();
          const endDate = calculateAnnualPlanExpiryDate(startDate);
          
          if (user && setUser) {
            // Atualizar o usuário localmente
            setUser({ 
              ...user, 
              paymentPending: null,
              subscription: {
                planId: savedPayment?.planId || 'annual',
                status: 'ativo',
                startDate: startDate.toISOString(),
                endDate: endDate
              }
            });
            
            // Sincronizar com o banco de dados
            if (user.id) {
              syncUserData(user.id, {
                subscription: {
                  planId: savedPayment?.planId || 'annual',
                  status: 'ativo',
                  startDate: startDate.toISOString(),
                  endDate: endDate
                },
                paymentPending: null
              });
            }
          }
          
          setIsPaymentApprovedModalOpen(true);
          setIsPaymentRejectedModalOpen(false);
          await loadUserData();  
        } else if (paymentStatus.status === 'cancelado' || paymentStatus.status === 'rejeitado') {
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
          
          clearPaymentFromLocalStorage();
          setSavedPayment(null);
          if (user && setUser) {
            setUser({ ...user, paymentPending: null });
          }

          // Novo fluxo de rejeição
          handlePaymentRejection(paymentStatus.rejectionReason);
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        if (error instanceof Error && error.message.includes('Sessão expirada')) {
          if (statusCheckRef.current) clearInterval(statusCheckRef.current);
          toast({
            variant: 'destructive',
            title: 'Sessão Expirada',
            description: 'Sua sessão expirou. Por favor, faça login novamente.',
          });
          navigate('/login');
        }
      }
    }, 5000);
    return () => { if (statusCheckRef.current) clearInterval(statusCheckRef.current); };
  }, [user?.paymentPending, savedPayment, toast, navigate, setUser, loadUserData, handlePaymentRejection]);

  // Mover handleReopenQRCode para antes do useEffect que o utiliza
  const handleReopenQRCode = useCallback(() => {
    // 1. Verificar savedPayment local
    if (savedPayment && savedPayment.status === 'pendente' && savedPayment.qrCode && new Date(savedPayment.expiresAt) > new Date()) {
      const expiresAtDate = new Date(savedPayment.expiresAt);
      if (expiresAtDate > new Date()) {
        setIsPaymentDialogOpen(true);
        setIsPaymentApprovedModalOpen(false);
        setIsPaymentRejectedModalOpen(false);
        if (!statusCheckRef.current) {
          startPaymentCheck();
        }
        return;
      } else {
        // Se o savedPayment local expirou, limpe-o e avise.
        toast({ title: "Pagamento Expirado", description: "Este QR Code (local) expirou. Verificando se há outros...", variant: "default" });
        clearPaymentFromLocalStorage();
        setSavedPayment(null); // Importante para que a próxima condição seja avaliada corretamente
      }
    }

    // 2. Se não há savedPayment local válido, verificar user.paymentPending do backend
    if (user?.paymentPending && user.paymentPending.status === 'pendente' && user.paymentPending.qrCode && user.paymentPending.expiresAt && new Date(user.paymentPending.expiresAt) > new Date()) {
      const expiresAtDate = user.paymentPending.expiresAt ? new Date(user.paymentPending.expiresAt) : new Date(0);
      if (expiresAtDate > new Date()) {
        const tempSavedPayment: SavedPayment = {
          id: user.paymentPending.paymentId,
          planId: user.paymentPending.planId,
          amount: user.paymentPending.amount || 0,
          qrCode: user.paymentPending.qrCode,
          status: 'pendente', 
          expiresAt: user.paymentPending.expiresAt || '',
        };
        setSavedPayment(tempSavedPayment); 
        setIsPaymentDialogOpen(true);
        setIsPaymentApprovedModalOpen(false);
        setIsPaymentRejectedModalOpen(false);
        if (!statusCheckRef.current) {
          startPaymentCheck();
        }
        return;
      }
    }
    
    // 3. Se chegou aqui, não há nenhum pagamento pendente válido conhecido para reabrir.
    // A notificação fixa (se visível) já deve indicar isso, ou o botão flutuante não aparecerá.
    // Mas, em geral, as condições de visibilidade dos botões devem prevenir isso.
    // Considerar se este toast final é realmente necessário ou se as UIs (notificação/botão flutuante) já cobrem.
    // toast({ title: "Nenhum QR Code Pendente", description: "Não há pagamento pendente válido para reabrir.", variant: "default" });
  }, [user?.paymentPending, savedPayment, toast, startPaymentCheck, setIsPaymentDialogOpen, setSavedPayment]);
  
  // Escutar eventos para abrir o modal de pagamento vindo de outras páginas
  useEffect(() => {
    const handleExternalOpenPaymentModal = () => {
      if (user?.paymentPending && user.paymentPending.status === 'pendente'){
          handleReopenQRCode();
      } else {
        const localPayment = loadPaymentFromLocalStorage();
        if (localPayment && localPayment.status === 'pendente' && new Date(localPayment.expiresAt) > new Date()) {
            setSavedPayment(localPayment);
            setIsPaymentDialogOpen(true);
            if(!statusCheckRef.current) startPaymentCheck();
        } 
      }
    };
    document.addEventListener('open-payment-modal', handleExternalOpenPaymentModal);
    return () => {
      document.removeEventListener('open-payment-modal', handleExternalOpenPaymentModal);
    };
  }, [user, handleReopenQRCode, startPaymentCheck]);
  
  // Carregar pagamento salvo ao iniciar
  useEffect(() => {
    const payment = loadPaymentFromLocalStorage();
    if (payment) {
      setSavedPayment(payment);
      // Se o pagamento salvo for pendente e válido, poderia iniciar a checagem ou abrir o modal
      // Mas vamos deixar que o usuário clique para reabrir ou que a notificação o faça.
    }
  }, []);

  // Carregar restaurantes ao montar o componente
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await restaurantService.getAllRestaurants();
        if (data && data.length > 0) {
          setRestaurants(data);
          setFilteredRestaurants(data);
        } else {
          setNoRestaurants(true);
        }
      } catch (error) {
        console.error('Erro ao carregar restaurantes:', error);
        setNoRestaurants(true);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os restaurantes."
        });
      }
    };

    loadRestaurants();
  }, [toast]);

  // Filter restaurants based on search query, category, and location
  useEffect(() => {
    if (restaurants.length > 0) {
      setIsLoadingRestaurants(true);
      
      const filtered = restaurants.filter(restaurant => {
        // Filter by search query (name, cuisine, address)
        const matchesSearch = searchQuery === '' || 
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (restaurant.cuisine && restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())) || 
          (restaurant.address && restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()));
        
        // Filter by category
        const matchesCategory = selectedCategory === 'all' || 
          (restaurant.cuisine && restaurant.cuisine === selectedCategory);
        
        // Filter by location (neighborhood or state)
        // No location filtering needed
        return matchesSearch && matchesCategory;
      });
      
      setFilteredRestaurants(filtered);
      // setNoRestaurantsInArea(filtered.length === 0); // This state is only used for the state-based message, keep it false unless needed for neighborhood
      setIsLoadingRestaurants(false);
    }
  }, [restaurants, searchQuery, selectedCategory]);

  const handleGeneratePayment = async (planId: string) => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }

    if (savedPayment && savedPayment.planId === planId && savedPayment.status === 'pendente') {
      const expiresAtDate = new Date(savedPayment.expiresAt);
      if (expiresAtDate > new Date()) {
        setIsPaymentDialogOpen(true); 
        setIsPaymentApprovedModalOpen(false);
        setIsPaymentRejectedModalOpen(false);
        if (!statusCheckRef.current) { 
            startPaymentCheck();
        }
        return;
      }
    }

    setIsLoadingPayment(true);
    setSelectedPlanId(planId); 

    try {
      const currentPlan = plans.find(p => p.id === planId);
      if (!currentPlan) {
        toast({ title: "Erro", description: "Plano não encontrado.", variant: "destructive" });
        setIsLoadingPayment(false);
        return;
      }

      const paymentDetailsForCreation: Omit<Payment, 'id' | 'qrCode' | 'paymentProvider' | 'createdAt' | 'expiresAt' | 'qrCodeExpiracao'> & { status: 'pendente' } = {
        userId: user.id,
        userName: user.name || 'N/A',
        userEmail: user.email || 'N/A',
        planId: currentPlan.id,
        amount: currentPlan.price,
        description: `Assinatura do plano ${currentPlan.name}`,
        date: new Date().toISOString(),
        status: 'pendente', // Adicionado status para satisfazer o tipo Omit<Payment, ...>
      };

      const paymentDataFromService: { 
        id: string; 
        qrCode?: string; 
        expiresAt?: string;
        [key: string]: any; 
      } = await createPayment(paymentDetailsForCreation as any); // Usando as any temporariamente devido à complexidade do tipo Omit
      
      const newSavedPayment: SavedPayment = {
        id: paymentDataFromService.id, 
        planId: currentPlan.id,
        amount: currentPlan.price,
        qrCode: paymentDataFromService.qrCode || '', 
        status: 'pendente', 
        expiresAt: paymentDataFromService.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), 
      };

      setSavedPayment(newSavedPayment);
      savePaymentToLocalStorage(newSavedPayment);

      // Adicionar atualização do estado local do usuário com o pagamento pendente
      if (user && setUser) {
        // Criar um objeto paymentPending temporário no formato esperado
        const pendingDetailsForUser: PaymentPending = {
            paymentId: newSavedPayment.id,
            planId: newSavedPayment.planId,
            status: 'pendente', // Status inicial como pendente
            createdAt: new Date().toISOString(), // Use a data atual de criação
            expiresAt: newSavedPayment.expiresAt || '', // Use a data de expiração do newSavedPayment
            amount: newSavedPayment.amount,
            qrCode: newSavedPayment.qrCode,
            // Outros campos necessários se houver
        };

        setUser({
          ...user,
          paymentPending: pendingDetailsForUser // Atualiza paymentPending no estado local do usuário
        });
      }

      setIsPaymentDialogOpen(true);
      setIsPaymentApprovedModalOpen(false);
      setIsPaymentRejectedModalOpen(false);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current); 
      startPaymentCheck(); 

    } catch (error: any) {
      console.error("Erro ao gerar pagamento:", error);
      toast({
        title: "Erro ao gerar pagamento",
        description: error.message || "Não foi possível iniciar o processo de pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    console.log("Restaurante clicado:", restaurant);
    setSelectedRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRestaurant(null);
  };

  const handleRedeemBenefitClick = (restaurant: Restaurant, event: React.MouseEvent) => {
    event.stopPropagation(); 
    if (!user) {
      toast({ title: "Login Necessário", description: "Faça login para resgatar benefícios.", variant: "default" });
      navigate('/login');
      return;
    }

    const hasActivePlan = user.subscription?.status === 'ativo' && user.subscription?.planId !== 'free';

    // Verificar se tem plano ativo ou cupons gratuitos disponíveis
    if (!hasActivePlan && (user.freeCoupons ?? 0) <= 0) {
      toast({
        title: "Sem cupons disponíveis",
        description: "Você não possui mais cupons disponíveis. Assine um plano para ter benefícios ilimitados!",
        variant: "default"
      });
      setActiveTab('subscriptions');
      return;
    }

    // Se tiver plano ativo, pode resgatar sem limites
    // Se não tiver, usa um cupom gratuito
    const updateData: Partial<UserData> = {
      vouchersRedeemed: (user.vouchersRedeemed ?? 0) + 1
    };

    // Decrementar cupons gratuitos apenas se não tiver plano ativo
    if (!hasActivePlan) {
      updateData.freeCoupons = (user.freeCoupons ?? 0) - 1;
    }
    
    // Open the voucher confirmation modal
    setSelectedVoucherRestaurant(restaurant);
    setIsVoucherModalOpen(true);
  };

  // Função para cancelar o plano
  const cancelPlan = useCallback(async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado. Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCanceling(true);
    
    try {
      await syncUserData(user.id, {
        subscription: {
          planId: 'free',
          status: 'ativo' as const,
          startDate: new Date().toISOString(),
          endDate: '' // Fim do plano é indefinido para o gratuito
        },
        paymentPending: null, // Limpa qualquer pagamento pendente ao cancelar e ir para o free
      });
      
      if (setUser) {
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            subscription: { 
              planId: 'free', 
              status: 'ativo', 
              startDate: new Date().toISOString(), 
              endDate: '' 
            },
            paymentPending: null,
          };
        });
      }
      
      toast({
        title: "Plano Cancelado",
        description: "Seu plano foi cancelado. Você retornou ao plano gratuito.",
        variant: "success"
      });
      
      setIsCancelModalOpen(false);
      clearPaymentFromLocalStorage();
      setSavedPayment(null);

    } catch (error: any) {
      console.error("Erro ao cancelar plano:", error);
      toast({
        title: "Erro ao cancelar plano",
        description: error.message || "Não foi possível cancelar seu plano. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsCanceling(false);
    }
  }, [user, setUser, toast, setIsCanceling, setIsCancelModalOpen, setSavedPayment, syncUserData]);

  // Para a notificação fixa e o botão flutuante
  const activePaymentForNotice = useMemo(() => {
    // DEBUG: Log dos inputs do useMemo
    console.log('useMemo activePaymentForNotice inputs: savedPayment =', savedPayment, ', user?.paymentPending =', user?.paymentPending);

    if (savedPayment && savedPayment.status === 'pendente' && savedPayment.qrCode && new Date(savedPayment.expiresAt) > new Date()) {
      return {
        id: savedPayment.id,
        planId: savedPayment.planId,
        expiresAt: savedPayment.expiresAt,
        source: 'local' // Para debug ou diferenciação se necessário
      };
    }
    if (user?.paymentPending && user.paymentPending.status === 'pendente' && user.paymentPending.qrCode && user.paymentPending.expiresAt && new Date(user.paymentPending.expiresAt) > new Date()) {
      return {
        id: user.paymentPending.paymentId,
        planId: user.paymentPending.planId,
        expiresAt: user.paymentPending.expiresAt,
        source: 'backend'
      };
    }
    return null;
  }, [savedPayment, user?.paymentPending]);

  // Adicionar listener de tempo real para o status do pagamento pendente
  useEffect(() => {
    let unsubscribe: () => void;

    // Ativar o listener apenas se houver um pagamento pendente conhecido
    if (activePaymentForNotice?.id) {
      const paymentDocRef = doc(db, 'payments', activePaymentForNotice.id);

      unsubscribe = onSnapshot(paymentDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const paymentData = docSnap.data() as Payment; // Use a interface Payment
          console.log('Real-time payment update:', paymentData.status);

          // Se o status mudar para rejeitado ou cancelado, trate imediatamente
          if (paymentData.status === 'rejeitado' || paymentData.status === 'cancelado') {
            console.log('Pagamento rejeitado via real-time listener.');
            // Limpar o savedPayment local e paymentPending no usuário, como faz em startPaymentCheck
            clearPaymentFromLocalStorage();
            setSavedPayment(null);
             if (user && setUser) {
               setUser(prevUser => prevUser ? { ...prevUser, paymentPending: null } : null);
             }

            // Chamar a função que abre o modal de rejeição
            handlePaymentRejection(paymentData.rejectionReason);

            // Parar o polling, se estiver ativo, pois o status final foi alcançado via listener
            if (statusCheckRef.current) {
              clearInterval(statusCheckRef.current);
              statusCheckRef.current = null;
            }

            else if (['aprovado', 'pago'].includes(paymentData.status)) { // Adicionar lógica para aprovação
              console.log('Pagamento aprovado via real-time listener. Fechando modal.');
              setIsPaymentDialogOpen(false); // Fecha o modal instantaneamente
            
              // Parar o polling, se estiver ativo
              if (statusCheckRef.current) {
                clearInterval(statusCheckRef.current);
                statusCheckRef.current = null;
              }
              // O restante da lógica de aprovação (limpar savedPayment, atualizar user state/DB, mostrar toast de sucesso)
              // é tratada pela função startPaymentCheck e pela chamada a loadUserData.
            }

            
          }
          // Nota: Poderíamos adicionar lógica para 'aprovado'/'pago' aqui também,
          // mas manteremos a lógica principal de aprovação no polling por enquanto
          // para simplificar e não duplicar toda a lógica de atualização de plano.
        }
      }, (error) => {
        console.error('Erro no listener de pagamento em tempo real:', error);
        // Tratar erro, talvez desativar o listener ou mostrar um toast
      });
    }

    // Função de limpeza: desativar o listener quando o componente desmontar ou activePaymentForNotice mudar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };

  // As dependências garantem que o listener seja re-configurado se o ID do pagamento pendente mudar
  }, [activePaymentForNotice?.id, handlePaymentRejection, user, setUser]); // Adicionar user e setUser como dependências, pois são usados no callback

  // DEBUG: Verificar estado do plano e cupons
  console.log('[Dashboard] User plan:', user?.subscription?.planId, 'Free Coupons:', user?.freeCoupons);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar user={user} />
      
      <main className="flex-grow pt-60 pb-16">
        <div className="container-custom px-4 sm:px-6 lg:px-8">
          {/* User welcome section */}
          <div className="mb-10">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Olá, {user?.name}!</h1>
            <p className="text-foreground-light flex items-center">
              Bem-vindo ao seu espaço exclusivo no Gastro Pass.
              {user?.location && (
                <span className="ml-2 flex items-center text-primary">
                  <MapPin size={16} className="mr-1" />
                  {user.location}
                </span>
              )}
            </p>
            
            {/* Informação de plano ativo */}
            <ActivePlanInfo />
            
            {/* Indicador de pagamento pendente - AGORA CONSIDERA activePaymentForNotice */}
            {activePaymentForNotice && user?.subscription?.status !== 'ativo' && (
              <div className="mt-3">
                <div className="flex items-center bg-red-50 text-red-700 p-3 rounded-md">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Pagamento Pendente</p>
                    <p className="text-sm">Você tem um pagamento pendente para o plano {activePaymentForNotice.planId}.</p>
                    <p className="text-sm">Válido até: {formatExpirationDate(activePaymentForNotice.expiresAt)}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="ml-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={handleReopenQRCode}
                    disabled={isLoadingPayment}
                  >
                    {isLoadingPayment ? (
                      <span className="flex items-center">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent mr-2"></span>
                        Carregando...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Reabrir QR Code <ArrowRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Aviso de pagamento expirado (mantém a lógica original baseada em user.paymentPending, mas poderia ser expandido) */}
            {user?.paymentPending && user.paymentPending.status !== 'pendente' && user.paymentPending.expiresAt && new Date(user.paymentPending.expiresAt) < new Date() && (
              <div className="mt-3">
                <div className="flex items-center bg-yellow-50 text-yellow-700 p-3 rounded-md">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Pagamento Expirado</p>
                    <p className="text-sm">Seu pagamento anterior expirou. Por favor, gere um novo se necessário.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="ml-auto text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                    onClick={() => navigate('/manage-subscription')} // Leva para a página de planos
                  >
                    Ver Planos <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Aviso de pagamento rejeitado */}
            {user?.paymentPending?.status === 'rejeitado' && (
              <div className="mt-3">
                <div className="flex items-center bg-red-50 text-red-700 p-3 rounded-md">
                  <AlertOctagon className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Pagamento Rejeitado</p>
                    <p className="text-sm">Seu pagamento foi rejeitado. Por favor, gere um novo pagamento ou entre em contato com o suporte.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="ml-auto text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => navigate('/manage-subscription')}
                  >
                    Tentar Novamente <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex flex-wrap border-b border-border mb-8 gap-2">
            <button
              onClick={() => setActiveTab('restaurants')}
              className={cn(
                "flex items-center px-4 sm:px-6 py-3 font-medium transition-all duration-300",
                activeTab === 'restaurants'
                  ? "text-primary border-b-2 border-primary -mb-px hover:bg-primary/5"
                  : "text-foreground-light hover:text-primary hover:-translate-y-0.5"
              )}
            >
              <Store className="w-5 h-5 mr-2" />
              Restaurantes
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={cn(
                "flex items-center px-4 sm:px-6 py-3 font-medium transition-all duration-300",
                activeTab === 'account'
                  ? "text-primary border-b-2 border-primary -mb-px hover:bg-primary/5"
                  : "text-foreground-light hover:text-primary hover:-translate-y-0.5"
              )}
            >
              <User className="w-5 h-5 mr-2" />
              Minha Conta
            </button>
            {/* Add Minhas Assinaturas tab button */}
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={cn(
                "flex items-center px-4 sm:px-6 py-3 font-medium transition-all duration-300 mx-auto md:mx-0",
                activeTab === 'subscriptions'
                  ? "text-primary border-b-2 border-primary -mb-px hover:bg-primary/5"
                  : "text-foreground-light hover:text-primary hover:-translate-y-0.5"
              )}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Minhas Assinaturas
            </button>
          </div>
          
          {activeTab === 'account' ? (
            <UserAccountSection />
          ) : activeTab === 'subscriptions' ? (
            // Conteúdo das minhas assinaturas (copiado de ManageSubscription.tsx)
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-8 border border-gray-100">
               {/* Botão de pagamento pendente, visível apenas se houver um pagamento pendente */}
            {user.paymentPending && user.paymentPending.status === 'pendente' && (
              <button
                onClick={() => {
                  // Emitir um evento personalizado para abrir o modal de pagamento
                  const event = new CustomEvent('open-payment-modal');
                  document.dispatchEvent(event);
                  // Navegue para o dashboard caso já não esteja nele
                  if (window.location.pathname !== '/dashboard') {
                    navigate('/dashboard');
                  }
                }}
                className="w-full flex items-center justify-between p-3 sm:p-5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex items-center">
                  <div className="bg-amber-400/20 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 group-hover:bg-amber-400/30 transition-colors">
                    <QrCode className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-amber-800 mb-1">Ver QR Code de pagamento</h4>
                    <p className="text-xs sm:text-sm text-amber-700">Conclua seu pagamento pendente</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 group-hover:text-amber-600 group-hover:translate-x-1 transition-all duration-300" />
              </button>
            )}

              {/* Informações do Plano Atual */}
              <div className="mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-gray-100 bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner">
                <h3 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5 text-gray-700 flex items-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary" strokeWidth={2} />
                  Plano Atual
                </h3>
                {user?.subscription?.planId !== 'free' && user?.subscription?.status === 'ativo' ? (
                  <div className="flex items-start bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl shadow-sm">
                    <div className="bg-green-500 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg sm:text-xl font-semibold text-green-800 mb-1">
                        {user?.subscription?.planId === 'annual' ? 'Plano Anual' : 
                         user?.subscription?.planId.charAt(0).toUpperCase() + user?.subscription?.planId.slice(1)}
                      </p>
                      <p className="text-sm sm:text-base text-green-700 mb-3">Acesso completo à plataforma</p>
                      <div className="flex items-center bg-white bg-opacity-50 py-2 px-4 rounded-lg w-fit">
                        <Calendar className="w-4 h-4 mr-2 text-green-600" />
                        <p className="text-sm text-green-800">
                          Válido até: <span className="font-medium">{formatExpirationDate(user?.subscription?.endDate)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl shadow-sm">
                    <div className="bg-blue-500 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                      <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg sm:text-xl font-semibold text-blue-800 mb-1">Plano Gratuito</p>
                      <p className="text-sm sm:text-base text-blue-700 mb-3">Acesso limitado à plataforma</p>
                      <div className="mt-4">
                      </div>
                    </div>
                  </div>
                )}
                
                {user?.subscription?.planId !== 'free' && user?.subscription?.status === 'ativo' && ( /* Mostrar botão de cancelar apenas se não for plano gratuito e estiver ativo */
                  <div className="mt-4 sm:mt-6 flex justify-end">
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-sm sm:text-base"
                      onClick={() => setIsCancelModalOpen(true)}
                      disabled={isCanceling}
                    >
                      {isCanceling ? (
                        <span className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Cancelando...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <X className="mr-2 h-4 w-4" />
                          Cancelar Plano
                        </span>
                      )}
                    </Button>
                  </div>
                )}

                {/* Botão para reabrir QR Code de pagamento pendente (dentro da seção Minhas Assinaturas) */}
                {activePaymentForNotice && !isPaymentDialogOpen && user?.subscription?.status !== 'ativo' && user?.subscription?.planId === 'free' && ( /* Exibir apenas se houver pagamento pendente, o modal não estiver já aberto, não estiver ativo E for plano gratuito */
                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <Button
                      onClick={handleReopenQRCode}
                      disabled={isLoadingPayment}
                      className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3"
                    >
                      {isLoadingPayment ? (
                        <span className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Carregando...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <QrCode className="mr-2 h-5 w-5" />
                          Reabrir QR Code de Pagamento
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Opções de Planos */}
              <div className="mb-6 sm:mb-8 bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner" id="plans-section">
                <h3 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5 text-gray-700 flex items-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary" strokeWidth={2} />
                  Escolha seu Plano
                </h3>
                <div className={cn(
                  "grid gap-6 sm:gap-8",
                  plans.length === 1 ? "grid-cols-1 justify-items-center" : "grid-cols-1 md:grid-cols-3"
                )}>
                  {plans.map(plan => (
                    <div
                      key={plan.id}
                      className={cn(
                        "relative rounded-xl transition-all duration-300 overflow-hidden",
                        selectedPlanId === plan.id
                          ? "shadow-lg border-2 border-primary transform hover:-translate-y-1"
                          : "border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1"
                      )}
                    >
                      {user?.subscription?.planId === plan.id && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-primary text-white text-xs font-bold py-0.5 px-2 sm:py-1 sm:px-3 rounded-full">
                          Plano Atual
                        </div>
                      )}
                      <div className="p-4 sm:p-6 pt-6 sm:pt-8">
                        <div className="bg-primary/10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <h4 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-gray-800">{plan.name}</h4>
                        <p className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">
                          R$ {plan.price.toFixed(2)}
                          <span className="text-sm font-normal text-gray-500 ml-1">/ ano</span>
                        </p>
                        <p className="text-gray-600 mb-4 sm:mb-6 text-sm">{plan.description}</p>
                      </div>
                      <div className="bg-gray-50 p-4 sm:p-6">
                        <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700">
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500 shrink-0" strokeWidth={3} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          onClick={() => handleGeneratePayment(plan.id)}
                          className={cn(
                            "w-full text-sm sm:text-base",
                            user?.subscription?.planId === plan.id
                              ? "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"
                              : "bg-primary hover:bg-primary/90"
                          )}
                          disabled={isCheckingStatus || user?.subscription?.planId === plan.id}
                        >
                          {isCheckingStatus && selectedPlanId === plan.id ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Gerando...
                            </span>
                          ) : (
                            user?.subscription?.planId === plan.id ? 'Plano Atual' : 'Assinar Plano'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Filtros e busca */}
              {!noRestaurants && (
                <div className="bg-gradient-to-r from-white to-blue-50 shadow-lg rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-100">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 sm:gap-4 md:gap-6">
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" size={20} />
                      <input
                        type="text"
                        placeholder="Buscar por nome, tipo de cozinha ou endereço..."
                        className="pl-12 pr-4 py-2 sm:py-3 border-2 border-blue-100 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:shadow-md focus:shadow-lg text-gray-700"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                      <div className="relative w-full sm:w-auto">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="appearance-none pl-4 pr-10 py-2 sm:py-3 border-2 border-blue-100 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 hover:shadow-md text-gray-700 bg-white"
                        >
                          <option value="all">Todas as categorias</option>
                          {CUISINE_TYPES.map(type => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Filter results summary */}
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 w-full">
                    <p className="text-sm text-gray-600">
                      {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'restaurante encontrado' : 'restaurantes encontrados'}
                    </p>
                    {(selectedCategory !== 'all' || searchQuery !== '') && (
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchQuery('');
                        }}
                        className="text-sm text-primary hover:text-primary-dark flex items-center"
                      >
                        <RefreshCw size={14} className="mr-1" />
                        Limpar filtros
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mensagem de seleção de estado */}
              {showStateSelectionMessage && (
                <div className="text-center py-8 sm:py-10 px-4">
                  <Info className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Seleção de Estado Pendente
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Por favor, selecione um estado para visualizar os restaurantes disponíveis.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Você pode definir seu estado na <a href="/login" className="text-primary hover:underline">página de login</a> ou no seu perfil.
                  </p>
                </div>
              )}

              {/* Mensagem de nenhum restaurante na área do usuário (estado) */}
              {noRestaurantsInArea && !showStateSelectionMessage && !isLoadingRestaurants && (
                 <div className="text-center py-8 sm:py-10 px-4 bg-yellow-50 rounded-xl border border-yellow-100 shadow-sm">
                    <MapPin className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-yellow-500" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                        Nenhum Restaurante em Seu Estado
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Ainda não há restaurantes cadastrados para o estado de {user?.estado}.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                        Explore outras áreas ou verifique novamente mais tarde.
                    </p>
                 </div>
              )}

                            {/* Loading state - Further Enhanced Visuals */}
                            {isLoadingRestaurants && (
                // Refined container styling, spacing, and added subtle entrance animation
                <div className="flex flex-col items-center justify-center py-20 px-4 sm:px-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 min-h-[400px] animate-fade-in opacity-0 fade-in-delay-300">
                  {/* Static icon above the spinner - slightly adjusted size and color */}
                  <div className="mb-8">
                     {/* Using Store icon, can be replaced or combined */} {/* Consider using a different icon for variety if desired */}
                     <Store className="h-14 w-14 sm:h-16 sm:w-16 text-primary animate-float" /> {/* Example with a subtle float animation */}
                  </div>

                  {/* Spinner container with refined border color and size */}\
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-6">
                    <div className="w-full h-full rounded-full border-8 border-t-8 border-gray-300 border-t-primary animate-spin-slow"></div> {/* Adjusted border, slower spin */}
                    {/* Centered icon inside the spinner - slightly adjusted size */}\
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <Store className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" /> {/* Adjusted color */}\
                    </div>
                  </div>
                  {/* Loading text with improved typography and subtle animation */}\
                  <p className="mt-4 text-xl sm:text-2xl text-gray-700 font-semibold tracking-wide animate-fade-in delay-500">Carregando restaurantes...</p> {/* Adjusted color and weight */}\

                  {/* Optional: Add a subtle loading bar or dots here if needed */}\
                </div>
              )}


              {/* Lista de Restaurantes ou mensagem de "Nenhum restaurante encontrado" geral */}
              {!showStateSelectionMessage && !noRestaurantsInArea && !isLoadingRestaurants && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {filteredRestaurants.length > 0 ? (
                    filteredRestaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        id={restaurant.id}
                        name={restaurant.name}
                        imageUrl={restaurant.imageUrl || '/restaurant-placeholder.svg'}
                        category={restaurant.cuisine}
                        location={restaurant.neighborhood || restaurant.state || 'Local não informado'}
                        address={restaurant.address}
                        rating={restaurant.rating || 0}
                        discount={restaurant.discount || 'Sem desconto'}
                        voucherLink={restaurant.voucherLink}
                        description={restaurant.description}
                        onClick={() => handleRestaurantClick(restaurant)}
                        onQrCodeClick={(event) => handleRedeemBenefitClick(restaurant, event)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10 sm:py-16 px-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                      <Search className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      <h3 className="mt-3 text-lg font-medium text-gray-900">Nenhum restaurante encontrado</h3>
                      <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                        Não encontramos restaurantes com os filtros selecionados. Tente ajustar sua busca, categorias ou localidades.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSearchQuery('');
                        }}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors duration-300"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de Detalhes do Restaurante */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {selectedRestaurant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl">
              <div className="relative">
                <img
                  src={selectedRestaurant.imageUrl}
                  alt={selectedRestaurant.name}
                  className="w-full h-48 sm:h-56 object-cover rounded-t-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-gradient-to-t from-black to-transparent">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary text-white font-semibold px-4 py-1.5 rounded-full text-sm shadow-md">
                      {selectedRestaurant.discount}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 bg-white/70 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all duration-200 z-10"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">{selectedRestaurant.name}</h3>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm text-gray-600 gap-4 sm:gap-6">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-medium text-gray-800">{selectedRestaurant.rating}</span>
                  </span>
                  <span className="flex items-center">
                     <span className="font-medium text-gray-800">{selectedRestaurant.cuisine}</span>
                  </span>
                </div>
                
                <div className="flex items-start text-gray-700">
                  <MapPin className="w-5 h-5 text-primary mr-3 shrink-0" />
                  <div>
                    <p className="font-medium">{selectedRestaurant.neighborhood || selectedRestaurant.state}</p>
                    <p className="text-gray-600">{selectedRestaurant.address}</p>
                  </div>
                </div>
                
                {selectedRestaurant.description && (
                  <div className="border-t border-gray-100 pt-6">
                    <h4 className="font-semibold mb-3 text-gray-800 text-lg">Sobre o restaurante</h4>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{selectedRestaurant.description}</p>
                  </div>
                )}
                
                <div className="bg-primary-50 border border-primary-100 p-4 sm:p-6 rounded-lg shadow-inner">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-primary-900 text-base sm:text-lg mb-1">Benefício exclusivo</h4>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{selectedRestaurant.discount}</p>
                    </div>
                    <Button
                      onClick={(e) => handleRedeemBenefitClick(selectedRestaurant, e)}
                      className="bg-white hover:bg-gray-50 w-full sm:w-auto"
                    >
                      <Gift className="w-5 h-5 mr-2" />
                      Resgatar Benefício
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modal de Confirmação de Voucher - Improved Visuals */}
      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        {/* Adjusted max-width and padding for better appearance */}
        <DialogContent className="sm:max-w-md md:max-w-lg p-6 sm:p-8">
          <DialogHeader>
            {/* Centered title and slightly larger font */}
            <DialogTitle className="text-center text-xl sm:text-2xl font-bold mb-4">Resgatar Benefício</DialogTitle>
          </DialogHeader>
          
          {/* Increased vertical padding and adjusted text styling */}
          <div className="text-center py-4 sm:py-6">
            <p className="text-gray-700 mb-6 text-base sm:text-lg">
              Deseja resgatar o benefício exclusivo oferecido por <span className="font-semibold text-primary">{selectedVoucherRestaurant?.name}</span>?
            </p>

            {/* Adjusted button spacing and size for better interaction */}
            <div className="flex justify-center gap-4 sm:gap-6 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsVoucherModalOpen(false)}
                className="min-w-[120px] text-base"
              >
                Não
              </Button>
              <Button
                onClick={async () => {
                  if (!user) {
                    toast({
                      title: "Erro",
                      description: "Você precisa estar logado para resgatar benefícios.",
                      variant: "destructive"
                    });
                    return;
                  }

                  const hasActivePlan = user.subscription?.status === 'ativo' && user.subscription?.planId !== 'free';
                  
                  // Se não tem plano ativo, verifica os cupons gratuitos
                  if (!hasActivePlan && user.freeCoupons <= 0) {
                    toast({
                      title: "Sem cupons disponíveis",
                      description: "Você não possui mais cupons disponíveis. Assine um plano para ter benefícios ilimitados!",
                      variant: "destructive"
                    });
                    return;
                  }

                  if (selectedVoucherRestaurant?.voucherLink) {
                    window.open(selectedVoucherRestaurant.voucherLink, '_blank');

                    // Atualizar dados apenas se não tiver plano ativo
                    const vouchersRedeemed = (user.vouchersRedeemed || 0) + 1;
                    const freeCoupons = !hasActivePlan ? user.freeCoupons - 1 : user.freeCoupons;

                    const updateData: Partial<UserData> = {
                      vouchersRedeemed,
                      freeCoupons
                    };

                    try {
                      // Atualiza o banco de dados primeiro
                      await syncUserData(user.id, updateData);

                      // Depois atualiza o estado local
                      setUser({
                        ...user,
                        vouchersRedeemed,
                        freeCoupons
                      });

                      const successMessage = hasActivePlan 
                        ? "Benefício resgatado com sucesso!" 
                        : `Benefício resgatado! Você ainda possui ${updateData.freeCoupons} cupom(ns) disponível(is).`;

                      toast({
                        title: "Sucesso",
                        description: successMessage,
                      });
                    } catch (error) {
                      console.error("Erro ao atualizar dados do usuário:", error);
                      toast({
                        title: "Erro ao resgatar benefício",
                        description: "Ocorreu um erro ao processar seu resgate. Tente novamente.",
                        variant: "destructive"
                      });
                    }
                  } else {
                    toast({
                      title: "Link não disponível",
                      description: "O link do voucher para este restaurante não foi fornecido.",
                      variant: "destructive"
                    });
                  }
                  setIsVoucherModalOpen(false);
                }}
                className="min-w-[120px] text-base"
              >
                Sim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento PIX - Enhanced Visuals */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => {
        setIsPaymentDialogOpen(open);
        console.log('Payment Dialog onOpenChange. Open:', open, 'Saved payment:', savedPayment, 'user?.paymentPending:', user?.paymentPending);
      }}>
        {/* Adjusted max-width and padding for a cleaner look */}
        <DialogContent className="sm:max-w-sm md:max-w-md p-6 sm:p-8">
          <DialogHeader>
            {/* Improved title styling */}
            <DialogTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              Pagamento Seguro
            </DialogTitle>
            {/* Centered and slightly larger description text */}
            <DialogDescription className="text-center text-base text-gray-600">
              {savedPayment?.status === 'rejeitado'
                ? 'Este pagamento foi rejeitado pelo administrador.'
                : 'Escaneie o código QR ou copie o código PIX para pagar:'}
            </DialogDescription>
          </DialogHeader>
          
          {savedPayment && savedPayment.status !== 'rejeitado' ? (
            <div className="flex flex-col items-center space-y-6 py-4">
              {/* Container with white background and shadow for QR Code */}
              <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
                {/* Always display the static QR code image */}
                 <img
                   src="/img/GASTROPASS_PIX.png"
                   alt="QR Code PIX"
                   width={220}
                   height={220}
                   className="rounded-sm mx-auto"
                 />
              </div>

              {/* Payment details section with improved spacing and typography */}
              <div className="w-full space-y-3 text-gray-700">
                 {/* Added name of the PIX key holder with clearer styling */}
                <p className="text-center text-sm text-gray-500">
                  Nome da chave PIX: <span className="font-semibold text-gray-700">Frank Davi Souza da Rocha</span>
                </p>
                <div className="flex justify-between items-center font-medium">
                  <span>Plano:</span>
                  <span className="font-semibold text-gray-800">{plans.find(p => p.id === savedPayment.planId)?.name}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Valor:</span>
                  <span className="font-semibold text-gray-800">R$ {savedPayment.amount.toFixed(2)}</span>
                </div>
                {/* Expiration date with distinct styling */}
                <div className="flex items-center justify-between p-3 bg-muted/50 border border-muted rounded-lg text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Válido até:</span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {formatExpirationDate(savedPayment.expiresAt)}
                  </span>
                </div>
              </div>

              {/* Copy PIX number button with updated styling */}
              <Button
                onClick={() => {
                  navigator.clipboard.writeText("(67) 99835-4747");
                  toast({
                    title: "Número copiado!",
                    description: "Cole o número no seu app de pagamento.",
                  });
                }}
                variant="secondary"
                className="w-full text-sm sm:text-base bg-gray-100 hover:bg-gray-200 text-gray-800"
              >
                <Copy className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Copiar código PIX
              </Button>

              {/* Status indicator with clearer visual feedback */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className={cn("w-4 h-4", {
                  "animate-spin text-primary": isCheckingStatus
                })} />
                <span>{isCheckingStatus ? 'Verificando status...' : 'Aguardando pagamento...'}</span>
              </div>
            </div>
          ) : (
            // Mostrar mensagem quando o pagamento for rejeitado - Improved styling
            <div className="text-center p-6 space-y-4">
              <AlertOctagon className="h-12 w-12 sm:h-14 sm:w-14 text-red-500 mx-auto" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                Pagamento Rejeitado
              </h3>
              <p className="text-sm text-gray-500">
                O pagamento foi rejeitado pelo administrador. Por favor, tente gerar um novo pagamento ou entre em contato com o suporte para mais informações.
              </p>
              <Button 
                onClick={() => {
                  setIsPaymentDialogOpen(false);
                  // Limpar o pagamento rejeitado do localStorage e do estado do usuário
                  clearPaymentFromLocalStorage();
                  setSavedPayment(null);
                  // Se desejar também atualizar o estado do usuário, pode fazer isso aqui
                }}
                className="w-full text-sm sm:text-base"
              >
                Entendi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de cancelamento do plano - Enhanced Visuals */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        {/* Adjusted max-width and padding for better appearance */}
        <DialogContent className="sm:max-w-md md:max-w-lg p-6 sm:p-8">
          <DialogHeader>
            {/* Improved title styling with a more prominent icon */}
            <DialogTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-red-600 mb-4">
              <AlertOctagon className="h-6 w-6 sm:h-7 sm:w-7" />
              Cancelar Plano
            </DialogTitle>
            {/* Centered and slightly larger description text */}
            <DialogDescription className="text-center text-base text-gray-600">
              Tem certeza que deseja cancelar seu plano? Você perderá todos os benefícios e voltará ao modo gratuito.
            </DialogDescription>
          </DialogHeader>
          
          {/* Increased vertical padding and adjusted text styling */}
          <div className="space-y-4 py-4">
            <p className="text-base font-semibold text-gray-700 mb-2">
              Ao cancelar seu plano:
            </p>
            {/* Improved list styling with checkmarks and slightly larger text */}
            <ul className="list-none pl-0 space-y-2 text-gray-700">
              <li className="flex items-start text-sm sm:text-base"><X className="h-4 w-4 text-red-500 mr-2 shrink-0 mt-1"/>Perderá todos os descontos e benefícios exclusivos</li>
              <li className="flex items-start text-sm sm:text-base"><X className="h-4 w-4 text-red-500 mr-2 shrink-0 mt-1"/>Terá acesso limitado aos restaurantes</li>
              <li className="flex items-start text-sm sm:text-base"><Check className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-1"/>Receberá 3 cupons gratuitos para experimentar o serviço</li>
            </ul>
          </div>
          
          {/* Adjusted button layout and styling for better clarity and action hierarchy */}
          <DialogFooter className="flex flex-col sm:flex-row-reverse gap-3 sm:gap-4 mt-4">
            <Button
              variant="destructive"
              className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 text-base font-semibold"
              onClick={() => {
                setIsCancelModalOpen(false);
                cancelPlan();
              }}
              disabled={isCanceling}
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  Confirmar Cancelamento
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full sm:w-auto text-gray-700 border-gray-300 hover:bg-gray-100 text-base"
              onClick={() => setIsCancelModalOpen(false)}
            >
              Voltar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento Aprovado - Enhanced Visuals */}
      <Dialog open={isPaymentApprovedModalOpen} onOpenChange={setIsPaymentApprovedModalOpen}>
        {/* Adjusted max-width and padding for better appearance */}
        <DialogContent className="sm:max-w-sm md:max-w-md p-6 sm:p-8">
          <DialogHeader>
            {/* Improved title styling with a more prominent icon */}
            <DialogTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-green-600 mb-4">
              <Check className="h-6 w-6 sm:h-7 sm:w-7" />
              Pagamento Aprovado!
            </DialogTitle>
          </DialogHeader>
          {/* Centered and slightly larger description text with increased padding */}
          <DialogDescription className="text-center py-4 text-base text-gray-700">
            Seu plano foi atualizado com sucesso. Você já pode aproveitar todos os benefícios!
          </DialogDescription>
          {/* Centered footer button */}
          <DialogFooter className="flex justify-center mt-4">
            <Button onClick={() => setIsPaymentApprovedModalOpen(false)} className="text-base px-6 py-2">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento Rejeitado - Enhanced Visuals */}
      <Dialog open={isPaymentRejectedModalOpen} onOpenChange={setIsPaymentRejectedModalOpen}>
        {/* Adjusted max-width and padding for better appearance */}
        <DialogContent className="sm:max-w-sm md:max-w-md p-6 sm:p-8">
          <DialogHeader>
            {/* Improved title styling with a more prominent icon */}
            <DialogTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7" />
              Pagamento Rejeitado
            </DialogTitle>
          </DialogHeader>
          {/* Centered and slightly larger description text with increased padding */}
          <DialogDescription className="text-center py-4 text-base text-gray-700">
            Seu pagamento foi rejeitado. Por favor, verifique os dados do pagamento ou entre em contato com o suporte para mais informações.
          </DialogDescription>
          {/* Centered footer button with improved styling */}
          <DialogFooter className="flex justify-center mt-4">
            <Button variant="destructive" onClick={() => setIsPaymentRejectedModalOpen(false)} className="text-base px-6 py-2 bg-red-600 hover:bg-red-700">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adicionar o novo modal de rejeição */}
      <PaymentRejectionModal
        isOpen={isPaymentRejectionModalOpen}
        onClose={() => {
          setIsPaymentRejectionModalOpen(false);
          retryCountRef.current = 0; // Resetar contador de tentativas
        }}
        onRetry={handleRetryPayment}
        rejectionReason={rejectionReason}
        isRetrying={isRetrying}
      />

      <Footer />

      {/* Botão flutuante para reabrir pagamento */}
      { !isPaymentDialogOpen && activePaymentForNotice && user?.subscription?.status !== 'ativo' && user?.subscription?.planId === 'free' && (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50">
          <button
            onClick={handleReopenQRCode}
            className="bg-primary text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-primary-dark transition-all duration-300 flex items-center justify-center"
            title="Reabrir pagamento"
          >
            <QrCode className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
