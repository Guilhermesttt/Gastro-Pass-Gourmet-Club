import { collection, addDoc, getDocs, query, updateDoc, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types/admin';
import { UserData } from '@/types/auth';

const COLLECTION_NAME = 'users';

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error('Não foi possível carregar os usuários');
    }
  },

  onUsersChange(callback: (users: User[]) => void): () => void {
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    
    // Criar listener para mudanças na coleção
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      callback(users);
    }, (error) => {
      console.error('Erro ao ouvir mudanças nos usuários:', error);
    });
    
    return unsubscribe;
  },

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(userRef, data);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Não foi possível atualizar o usuário');
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      throw new Error('Não foi possível excluir o usuário');
    }
  },

  async getTotalRedeemedBenefits(): Promise<number> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.reduce((total, doc) => {
        const userData = doc.data();
        return total + (userData.vouchersRedeemed || 0);
      }, 0);
    } catch (error) {
      console.error('Erro ao buscar total de benefícios resgatados:', error);
      throw new Error('Não foi possível carregar o total de benefícios');
    }
  }
};