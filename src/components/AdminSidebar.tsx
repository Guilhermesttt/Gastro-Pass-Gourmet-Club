import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  Utensils, 
  Users, 
  ChevronLeft,
  LogOut,
  CreditCard,
  Menu,
  X
} from 'lucide-react';
import { getPendingPayments } from '@/lib/paymentService';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import { validateAuthToken } from '@/lib/authService';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive: boolean;
  isCollapsed: boolean;
  count?: number;
}

const NavItem = ({ icon, label, to, isActive, isCollapsed, count }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center justify-between gap-3 px-3 py-3 rounded-md transition-all duration-300",
      isActive 
        ? "bg-primary text-white" 
        : "text-gray-700 hover:bg-gray-100 hover:text-primary"
    )}
  >
    <div className="flex items-center gap-3">
      {icon}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
    {!isCollapsed && count !== undefined && count > 0 && (
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.2 }}
        className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-0.5 leading-tight"
      >
        {count}
      </motion.span>
    )}
  </Link>
);

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const activePath = location.pathname;

  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const isPlayingSound = useState(false);

  const playNotificationSound = () => {
    if (isPlayingSound[0]) {
      console.log("Som já está sendo reproduzido, ignorando nova chamada");
      return;
    }

    try {
      isPlayingSound[0] = true;
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.1;
      
      audio.play()
        .then(() => {
          audio.onended = () => {
            isPlayingSound[0] = false;
          };
        })
        .catch(error => {
          console.warn("Error playing notification sound:", error);
          isPlayingSound[0] = false;
        });
    } catch (error) {
      console.error("Erro crítico ao reproduzir som:", error);
      isPlayingSound[0] = false;
    }
  };

  useEffect(() => {
    const setupPaymentsListener = async () => {
      const isTokenValid = await validateAuthToken();
      if (!isTokenValid) {
        console.log('Token inválido ou expirado. Não foi possível configurar listener de pagamentos.');
        return;
      }

      const q = query(collection(db, 'payments'), where('status', '==', 'pendente'));
      
      let firstSnapshot = true;
      let localPrevCount = 0;

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const currentCount = snapshot.size;
        setPendingPaymentsCount(currentCount);

        if (!firstSnapshot) {
          const newAdditions = snapshot.docChanges().filter(change => change.type === 'added');
          if (newAdditions.length > 0) {
            playNotificationSound();
          }
        } else {
          setInitialLoadDone(true);
          firstSnapshot = false;
        }
        localPrevCount = currentCount;

      }, (error) => {
        if (error instanceof Error && error.message.includes('sessão expirada')) {
          console.log('Sessão expirada durante o listener de pagamentos.');
        } else {
          console.error("Error listening to pending payments:", error);
          toast({
            title: "Erro de Sincronização",
            description: "Não foi possível carregar atualizações de pagamentos.",
            variant: "destructive",
          });
        }
      });

      return () => unsubscribe();
    };

    setupPaymentsListener();
    
  }, [toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
      navigate('/admin/login');
    } catch (error) {
      toast({
        title: "Erro ao deslogar",
        description: "Ocorreu um erro ao tentar deslogar.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const staticNavItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      to: '/admin'
    },    
    {
      icon: <Utensils size={20} />,
      label: 'Restaurantes',
      to: '/admin/restaurants'
    },
    {
      icon: <Users size={20} />,
      label: 'Parceiros',
      to: '/admin/users'
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Pagamentos',
      to: '/admin/payments',
      id: 'paymentsLink'
    }
  ];

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="block lg:hidden fixed right-4 top-4 z-50 p-2 rounded-md bg-background border border-border hover:bg-accent"
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      <motion.div
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 w-64 bg-background border-r border-border transition-transform lg:translate-x-0",
          {
            "translate-x-0": isMobileMenuOpen,
            "-translate-x-full": !isMobileMenuOpen,
          }
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xl font-bold">Painel Admin</span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="lg:flex hidden p-2 rounded-md hover:bg-accent"
            >
              <ChevronLeft
                size={20}
                className={cn("transition-transform", {
                  "rotate-180": isCollapsed,
                })}
              />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {staticNavItems.map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                isActive={activePath === item.to}
                isCollapsed={isCollapsed}
                count={item.id === 'paymentsLink' ? pendingPaymentsCount : undefined}
              />
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors mt-auto"
          >
            <LogOut size={20} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              key="mobile-menu-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-background border-r border-border z-50 shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-xl font-bold">Painel Admin</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-accent"
                  aria-label="Fechar menu mobile"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
                {staticNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 rounded-md transition-all duration-200 w-full text-left text-sm font-medium",
                      activePath === item.to
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.id === 'paymentsLink' && pendingPaymentsCount > 0 && (
                      <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-tight">
                        {pendingPaymentsCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-border">
                <button
                  onClick={async () => {
                    await handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors w-full text-sm font-medium"
                >
                  <LogOut size={18} /> 
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
