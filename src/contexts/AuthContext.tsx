import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  login as authLogin, 
  logout as authLogout, 
  loginWithGoogle as authLoginWithGoogle,
  deleteUserAccount as authDeleteUserAccount,
  handleGoogleRedirect
} from '@/lib/authService';
import { AuthContextType, UserData } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error('Login function not provided'); },
  loginWithGoogle: async () => { throw new Error('LoginWithGoogle function not provided'); },
  logout: async () => {},
  deleteAccount: async () => false,
  error: null,
  setUser: () => {}
});

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  // Flag para evitar verificações desnecessárias no onAuthStateChanged após login com Google
  const [isProcessingGoogleLogin, setIsProcessingGoogleLogin] = useState(false);

  // Observer para mudanças no estado de autenticação
  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | undefined = undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc(); // Unsubscribe from previous user doc listener
        unsubscribeUserDoc = undefined;
      }

      if (isProcessingGoogleLogin) {
        return;
      }
      
      setLoading(true);
      try {
        console.log('AuthState changed:', authUser?.uid);
        
        if (authUser) {
          // Set up a real-time listener for the user's document in Firestore
          const userDocRef = doc(db, 'users', authUser.uid);
          unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const userDataFromSnap = { id: docSnap.id, ...docSnap.data() } as UserData;
              console.log('[AuthContext] Dados do usuário do snapshot:', userDataFromSnap);
              setUser(userDataFromSnap);

              // Optional: If user data is fetched for the first time via snapshot
              // and user is on login/register, redirect.
              const currentPath = window.location.pathname;
              if (loading && (currentPath === '/login' || currentPath === '/register')) {
                 // Check loading state to ensure this redirect only happens once on initial load
                navigate('/dashboard');
              }

            } else {
              console.error('Authenticated user has no data in Firestore. Signing out.');
              authLogout().catch(err => console.error("Error during sign out:", err)); // Perform logout
              setUser(null); 
            }
            setLoading(false); // Set loading to false after first data retrieval or if doc doesn't exist
          }, (error) => {
            console.error("Error listening to user document:", error);
            setUser(null);
            setError('Erro ao carregar dados do usuário em tempo real.');
            setLoading(false);
          });

        } else { // No authUser
          setUser(null);
          setLoading(false);
          const currentPath = window.location.pathname;
          const protectedRoutes = ['/dashboard', '/manage-subscription', '/change-password'];
          if (protectedRoutes.includes(currentPath)) {
            navigate('/login');
          }
        }
      } catch (e) {
        console.error('Error in onAuthStateChanged processing:', e);
        setUser(null);
        setError('Erro ao processar o estado de autenticação.');
        setLoading(false);
      }
      // setLoading(false) // Moved inside snapshot logic or else block
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, [navigate, isProcessingGoogleLogin]); // Removed setUser from dependencies as it's stable

  const login = async (email: string, password: string): Promise<UserData> => {
    setLoading(true);
    setError(null);
    try {
      const userData = await authLogin(email, password);
      setUser(userData);
      return userData;
    } catch (error: any) {
      console.error('Erro no login (AuthContext):', error);
      setError(error.message || 'Falha no login.');
      setUser(null);
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<UserData> => {
    setLoading(true);
    setError(null);
    // Ativar flag para evitar que onAuthStateChanged processe o usuário durante o login
    setIsProcessingGoogleLogin(true);
    
    try {
      const userData = await authLoginWithGoogle();
      if (!userData) {
        throw new Error('Falha ao obter dados do usuário');
      }

      setUser(userData);
      navigate('/dashboard');
      return userData;
    } catch (error: any) {
      console.error('Erro no login com Google (AuthContext):', error);
      setError(error.message || 'Falha no login com Google.');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
      // Desativar flag após o processamento completo
      setTimeout(() => setIsProcessingGoogleLogin(false), 1000);
    }
  };

  const logout = async () => {
    try {
      await authLogout();
      // Redirect to login page after logout
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      setError(error.message || 'Erro ao sair.');
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await authDeleteUserAccount();
      setUser(null);
      navigate('/login');
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar conta:', error);
      setError(error.message || 'Não foi possível excluir a conta.');
      setLoading(false);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    deleteAccount,
    error,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
