// Serviço de autenticação usando Firebase
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  getIdToken,
  sendPasswordResetEmail,
  signInWithRedirect,
  getRedirectResult,
  deleteUser
} from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserData } from '@/types/auth';

// Token constants
const AUTH_TOKEN_KEY = 'gastro_pass_auth_token';

// Validation functions
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const register = async (
  email: string,
  password: string,
  name: string,
  estado: string,
  telefone: string,
  cpf?: string,
  cidade?: string,
  profissao?: string,
  dataNascimento?: string
): Promise<UserData> => {
  // Input validation
  if (!validateEmail(email)) {
    throw new Error('Email inválido');
  }

  if (!validatePassword(password)) {
    throw new Error('A senha deve ter pelo menos 6 caracteres');
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get auth token and store it
    const token = await user.getIdToken();
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    const userData: UserData = {
      id: user.uid,
      name,
      email,
      estado,
      telefone,
      cpf: cpf || '',
      cidade: cidade || '',
      profissao: profissao || '',
      dataNascimento: dataNascimento || '',
      createdAt: new Date().toISOString(),
      role: 'user',
      isAdmin: false,
      subscription: {
        planId: '',
        startDate: '',
        endDate: '',
        status: 'inativo'
      },
      paymentPending: null,
      freeCoupons: 3, // Inicializa com 3 cupons gratuitos
      hasActiveSubscription: false // Inicializa sem assinatura ativa
    };

    // Salvando os dados do usuário no Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    // Retorna os dados do usuário para atualizar o contexto
    return userData;
  } catch (error: any) {
    console.error('Erro no registro:', error);
    throw error;
  }
};

export const login = async (email: string, password: string): Promise<UserData> => {
  // Input validation
  if (!validateEmail(email)) {
    throw new Error('Email inválido');
  }

  if (!validatePassword(password)) {
    throw new Error('A senha deve ter pelo menos 6 caracteres');
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get auth token and store it
    const token = await user.getIdToken();
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('Usuário não encontrado no banco de dados');
    }

    return { id: userDoc.id, ...userDoc.data() } as UserData;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const loginWithGoogle = async (): Promise<UserData> => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Adicionar configurações ao provider para melhorar o fluxo de autenticação
    provider.setCustomParameters({
      prompt: 'select_account',  // Força a seleção de conta (evita login automático)
    });
    
    // Configurações adicionais, se necessário
    auth.useDeviceLanguage(); // Usa o idioma do dispositivo
    
    // Usar popup em vez de redirecionamento para evitar problemas com sessionStorage
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Get auth token and store it
    const token = await user.getIdToken();
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    // Check if user exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // User exists, return data
      const userData = { id: userDoc.id, ...userDoc.data() } as UserData;
      return userData;
    } else {
      // User doesn't exist, create new profile
      const userData: UserData = {
        id: user.uid,
        name: user.displayName || 'Usuário Google',
        email: user.email || '',
        estado: '',
        telefone: '', // Add a default empty string for telefone
        cpf: '', // Add a default empty string for cpf
        cidade: '', // Add a default empty string for cidade
        profissao: '', // Add a default empty string for profissao
        dataNascimento: '', // Add a default empty string for dataNascimento
        createdAt: new Date().toISOString(),
        role: 'user',
        isAdmin: false,
        subscription: {
          planId: '',
          startDate: '',
          endDate: '',
          status: 'inativo'
        },
        paymentPending: null,
        freeCoupons: 3, // Inicializa com 3 cupons gratuitos
        hasActiveSubscription: false // Inicializa sem assinatura ativa
      };

      // Save user data to Firestore and wait for the operation to complete
      await setDoc(userDocRef, userData);
      
      // Double check that the data was properly stored before returning
      const verifyDoc = await getDoc(userDocRef);
      if (!verifyDoc.exists()) {
        throw new Error('Falha ao salvar dados do usuário');
      }
      
      return userData;
    }
  } catch (error: any) {
    console.error('Erro no login com Google:', error);
    // Se o erro for relacionado a permissões, forneça uma mensagem mais clara
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Login com Google não está habilitado. Verifique as configurações do Firebase.');
    }
    throw error;
  }
};

export const handleGoogleRedirect = async (): Promise<UserData | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    
    const user = result.user;
    
    // Get auth token and store it
    const token = await user.getIdToken();
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    
    // Checa se o usuário existe no Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserData;
    } else {
      // Cria novo perfil
      const userData: UserData = {
        id: user.uid,
        name: user.displayName || 'Usuário Google',
        email: user.email || '',
        estado: '',
        telefone: '', // Add a default empty string for telefone
        cpf: '', // Add a default empty string for cpf
        cidade: '', // Add a default empty string for cidade
        profissao: '', // Add a default empty string for profissao
        dataNascimento: '', // Add a default empty string for dataNascimento
        createdAt: new Date().toISOString(),
        role: 'user',
        isAdmin: false,
        subscription: {
          planId: '',
          startDate: '',
          endDate: '',
          status: 'inativo'
        },
        paymentPending: null,
        freeCoupons: 3, // Inicializa com 3 cupons gratuitos
        hasActiveSubscription: false // Inicializa sem assinatura ativa
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      return userData;
    }
  } catch (error) {
    console.error('Erro ao processar redirecionamento do Google:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    // Remove the auth token from localStorage
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

// Function to validate the token for each Firestore request
export const validateAuthToken = async (): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }
    
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return false;
    }
    
    // Force token refresh to check validity
    await getIdToken(currentUser, true);
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  if (!validateEmail(email)) {
    throw new Error('Email inválido');
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    // Removendo a validação de token aqui, já que acabou de fazer login
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() } as UserData;
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return null;
  }
};

// The rest of the functions remain the same, but with added token validation
export const updateUserSubscription = async (userId: string, subscription: UserData['subscription']) => {
  // Validate token before making the request
  const isTokenValid = await validateAuthToken();
  if (!isTokenValid) {
    console.error('Token inválido ou expirado');
    await logout();
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }

  try {
    await setDoc(
      doc(db, 'users', userId),
      { subscription },
      { merge: true }
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateUserPaymentPending = async (userId: string, paymentPending: UserData['paymentPending'] | null) => {
  // Validate token before making the request
  const isTokenValid = await validateAuthToken();
  if (!isTokenValid) {
    console.error('Token inválido ou expirado');
    await logout();
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }

  try {
    await setDoc(
      doc(db, 'users', userId),
      { paymentPending },
      { merge: true }
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const updateUserAdminStatus = async (userId: string, isAdmin: boolean) => {
  try {
    await setDoc(
      doc(db, 'users', userId),
      { isAdmin },
      { merge: true }
    );
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const setupDefaultAdmin = async () => {
  try {
    // Buscar usuário pelo email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@gastropass.com'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Usuário admin não encontrado');
      return;
    }

    // Pegar o primeiro documento (deve ser único)
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Se já for admin, não faz nada
    if (userData.isAdmin) {
      console.log('Usuário já é admin');
      return;
    }

    // Atualizar para admin
    await updateUserAdminStatus(userDoc.id, true);
    console.log('Admin configurado com sucesso!');
    
    return true;
  } catch (error) {
    console.error('Erro ao configurar admin:', error);
    throw error;
  }
};

export const createAdminUser = async () => {
  try {
    // Verificar se o admin já existe
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', 'admin@gastropass.com'));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Admin já existe, vamos apenas garantir que ele é admin
      const userDoc = querySnapshot.docs[0];
      await updateUserAdminStatus(userDoc.id, true);
      return { success: true, message: 'Admin já existe e foi atualizado.' };
    }    // Criar novo usuário admin
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@gastropass.com',
      'admin@998'
    );

    const userData: UserData = {
      id: userCredential.user.uid,
      name: 'Administrador',
      email: 'admin@gastropass.com',
      estado: 'SP',
      telefone: '', // Add a default empty string for telefone
      cpf: '', // Add a default empty string for cpf
      cidade: '', // Add a default empty string for cidade
      profissao: '', // Add a default empty string for profissao
      dataNascimento: '', // Add a default empty string for dataNascimento
      createdAt: new Date().toISOString(),
      role: 'admin',
      isAdmin: true,
      subscription: {
        planId: '',
        startDate: '',
        endDate: '',
        status: 'inativo'
      },
      paymentPending: null,
      freeCoupons: 3, // Inicializa com 3 cupons gratuitos
      hasActiveSubscription: false // Inicializa sem assinatura ativa
    };

    // Salvar no Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);

    return { success: true, message: 'Admin criado com sucesso!' };
  } catch (error: any) {
    console.error('Erro ao criar admin:', error);
    if (error.code === 'auth/email-already-in-use') {
      // Se o email existe no Auth mas não no Firestore, vamos tentar fazer login
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          'admin@gastropass.com',
          'admin@998'
        );
        
        const userData: UserData = {
          id: userCredential.user.uid,
          name: 'Administrador',
          email: 'admin@gastropass.com',
          estado: 'SP',
          telefone: '', // Add a default empty string for telefone
          cpf: '', // Add a default empty string for cpf
          cidade: '', // Add a default empty string for cidade
          profissao: '', // Add a default empty string for profissao
          dataNascimento: '', // Add a default empty string for dataNascimento
          createdAt: new Date().toISOString(),
          isAdmin: true,
          subscription: {
            planId: '',
            startDate: '',
            endDate: '',
            status: 'inativo'
          },
          paymentPending: null,
          freeCoupons: 3, // Inicializa com 3 cupons gratuitos
          hasActiveSubscription: false // Inicializa sem assinatura ativa
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        return { success: true, message: 'Admin recuperado e configurado com sucesso!' };
      } catch (loginError) {
        console.error('Erro ao recuperar admin:', loginError);
        throw loginError;
      }
    }
    throw error;
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

// Função para deletar a conta do usuário
export const deleteUserAccount = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuário não está autenticado');
    }
    
    const userId = currentUser.uid;
    
    // Verificar se o usuário existe no Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.warn('Usuário não encontrado no Firestore, mas existe no Authentication');
    }
    
    // 1. Primeiro, excluir o documento do usuário no Firestore
    await deleteDoc(userDocRef);
    
    // 2. Excluir o usuário do Firebase Authentication
    await deleteUser(currentUser);
    
    // 3. Limpar dados locais
    localStorage.removeItem(AUTH_TOKEN_KEY);
    
    return;
  } catch (error: any) {
    console.error('Erro ao excluir a conta:', error);
    
    // Tratamento específico de erros
    if (error.code === 'auth/requires-recent-login') {
      throw new Error('Por motivos de segurança, você precisa fazer login novamente antes de excluir sua conta.');
    }
    
    throw new Error(error.message || 'Não foi possível excluir a conta. Tente novamente.');
  }
};

export const updateUserState = async (userId: string, estado: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', userId), { estado }, { merge: true });
  } catch (error: any) {
    console.error('Erro ao atualizar estado do usuário:', error);
    throw new Error(error.message);
  }
};
