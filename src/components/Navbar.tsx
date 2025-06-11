import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserData } from '@/types/auth';
import { getPendingPayments } from '@/lib/paymentService';
import { validateAuthToken } from '@/lib/authService';

interface NavbarProps {
  user?: UserData | null;
}

interface NavItemProps {
  label: string;
  count?: number;
}

const Navbar = ({ user }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [seenPaymentIds, setSeenPaymentIds] = useState<Set<string>>(new Set());
  const isPlayingSoundRef = useRef(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path === '/' && location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsOpen(false);
      document.body.style.overflow = '';
      return;
    }

    if (path.startsWith('/') && path.includes('#')) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate(path);
        setIsOpen(false);
        document.body.style.overflow = '';
        return;
      }
      const targetId = path.substring(path.indexOf('#'));
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const navbarElement = document.querySelector('nav');
        const navbarHeight = navbarElement ? navbarElement.offsetHeight : 0;
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - navbarHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        setIsOpen(false);
        document.body.style.overflow = '';
      } else {
        console.warn(`Element with id ${targetId} not found for smooth scroll.`);
      }
      return;
    }
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Benefícios', path: '/#benefits' },
    { name: 'Como Funciona', path: '/#how-it-works' },
    { name: 'Restaurantes', path: '/#restaurants' },
    { name: 'Contato', path: '/#contact' },
  ];

  useEffect(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
  }, [location.pathname]);

  useEffect(() => {
    const fetchInitialCount = async () => {
      try {
        const isTokenValid = await validateAuthToken();
        if (!isTokenValid) {
          console.log('Token inválido ou expirado. Não foi possível buscar contagem de pagamentos pendentes.');
          return;
        }

        const pending = await getPendingPayments();
        setPendingPaymentsCount(pending.length);
        setSeenPaymentIds(new Set(pending.map(p => p.id)));
      } catch (error) {
        if (error instanceof Error && error.message.includes('sessão expirada')) {
          console.log('Sessão expirada ao buscar contagem de pagamentos pendentes.');
        } else {
          console.error("Error fetching initial pending payments count:", error);
        }
      }
    };

    if (user && user.isAdmin) {
      fetchInitialCount();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const playNotificationSound = () => {
    if (isPlayingSoundRef.current) {
      console.log("Som já está sendo reproduzido, ignorando nova chamada");
      return;
    }

    try {
      isPlayingSoundRef.current = true;
      const audio = new Audio('/sounds/admin-notification.mp3');
      audio.volume = 0.1;
      
      audio.play()
        .then(() => {
          audio.onended = () => {
            isPlayingSoundRef.current = false;
          };
        })
        .catch(error => {
          console.warn("Error playing sound:", error);
          isPlayingSoundRef.current = false;
        });
    } catch (error) {
      console.error("Erro crítico ao tentar reproduzir som:", error);
      isPlayingSoundRef.current = false;
    }
  };

  return (
    <nav className="bg-card/90 backdrop-blur-md shadow-custom fixed w-full z-50 border-b border-border/30">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/img/Gastro pass Branco.png" 
              alt="Gastro Pass Logo" 
              className="h-40 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={(e) => handleSmoothScroll(e, item.path)}
                  className="text-foreground hover:text-primary font-medium transition-all duration-300 hover:-translate-y-0.5"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to={user.isAdmin ? '/admin' : '/dashboard'}
                    className="flex items-center text-primary hover:text-primary-dark transition-all duration-300 font-medium hover:-translate-y-0.5"
                  >
                    {user.isAdmin ? (
                      <>
                        <ShieldCheck size={20} className="mr-1" />
                        <span>Painel Admin</span>
                      </>
                    ) : (
                      <>
                        <User size={20} className="mr-1" />
                        <span>{user.name || 'Minha Conta'}</span>
                      </>
                    )}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-foreground hover:text-primary transition-all duration-300 font-medium hover:-translate-y-0.5"
                  >
                    <LogOut size={20} className="mr-1" />
                    Sair
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/auth" 
                    className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:-translate-y-0.5"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/auth"
                    className="btn btn-primary transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 shine-effect"
                  >
                    Cadastre-se
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center z-50">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-custom text-foreground hover:text-primary focus:outline-none transition-all duration-200 hover:scale-110 hover:bg-background"
              aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div
            className="md:hidden fixed inset-0 top-16 left-0 right-0 bottom-0 bg-card/95 backdrop-blur-md z-30 border-t border-border/30 overflow-y-auto h-[calc(100vh-4rem)]"
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex flex-col space-y-6 mb-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={(e) => handleSmoothScroll(e, item.path)}
                    className="text-lg font-medium text-foreground hover:text-primary transition-all duration-300 block py-2 hover:translate-x-1"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col space-y-4 mt-auto pb-6">
                {user ? (
                  <>
                    <Link
                      to={user.isAdmin ? '/admin' : '/dashboard'}
                      className="btn btn-primary w-full flex justify-center items-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:translate-y-0 shine-effect"
                      onClick={(e) => handleSmoothScroll(e, user.isAdmin ? '/admin' : '/dashboard')}
                    >
                      {user.isAdmin ? (
                        <>
                          <ShieldCheck size={20} className="mr-2" />
                          Painel Admin
                        </>
                      ) : (
                        <>
                          <User size={20} className="mr-2" />
                          {user.name || 'Minha Conta'}
                        </>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="btn btn-outline w-full text-center transition-all duration-300 hover:shadow-sm hover:-translate-y-1 active:translate-y-0 shine-effect flex justify-center items-center"
                    >
                      <LogOut size={20} className="mr-2" />
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      className="btn btn-outline w-full text-center transition-all duration-300 hover:shadow-sm hover:-translate-y-1 active:translate-y-0 shine-effect"
                      onClick={(e) => handleSmoothScroll(e, '/auth')}
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/auth"
                      className="btn btn-primary w-full text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1 active:translate-y-0 shine-effect"
                      onClick={(e) => handleSmoothScroll(e, '/auth')}
                    >
                      Cadastre-se
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
