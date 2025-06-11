// Serviço para manipulação de dados no Firestore
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { UserData } from '@/types/auth';

// Função para adicionar dados a uma coleção
export const addData = async (collectionName: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef;
  } catch (error) {
    console.error('Erro ao adicionar dados:', error);
    throw error;
  }
};

// Função para buscar todos os documentos de uma coleção
export const getAllData = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    throw error;
  }
};

// Função para buscar um documento específico
export const getDataById = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    throw error;
  }
};

// Função para atualizar dados de um documento
export const updateData = async (collectionName: string, id: string, data: any) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    throw error;
  }
};

// Função para sincronizar dados do usuário
export const syncUserData = async (userId: string, data: Partial<UserData>) => {
  try {
    // Usa updateDoc em vez de setDoc para garantir que apenas os campos fornecidos sejam atualizados
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao sincronizar dados do usuário:', error);
    throw error;
  }
};

// Função para buscar pagamentos do usuário
export const getUserPayments = async (userId: string) => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    throw error;
  }
};

// Função para atualizar status do pagamento
export const updatePaymentStatus = async (paymentId: string, status: 'pendente' | 'pago' | 'cancelado') => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pagamento:', error);
    throw error;
  }
};

// Função para buscar pagamentos pendentes
export const getAllPendingPayments = async () => {
  try {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef, where('status', '==', 'pendente'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    throw error;
  }
};

// Função para buscar assinaturas ativas
export const getAllActiveSubscriptions = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('subscription.status', '==', 'ativo'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserData[];
  } catch (error) {
    console.error('Erro ao buscar assinaturas ativas:', error);
    throw error;
  }
};
