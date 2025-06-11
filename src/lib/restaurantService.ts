import { collection, addDoc, getDocs, query, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Restaurant, NewRestaurantData } from '@/types/admin';

const COLLECTION_NAME = 'restaurants';

export const restaurantService = {
  async compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calcular as novas dimensões mantendo a proporção
        const maxDimension = 800;
        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível criar o contexto do canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha ao comprimir a imagem'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.7 // qualidade da compressão (70%)
        );
      };
      
      img.onerror = () => {
        reject(new Error('Erro ao carregar a imagem'));
      };
    });
  },

  async uploadImage(file: File): Promise<string> {
    try {
      // Validações básicas
      if (!file.type.startsWith('image/')) {
        throw new Error('O arquivo deve ser uma imagem (PNG, JPEG ou WebP).');
      }

      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        throw new Error('A imagem deve ter menos que 2MB.');
      }

      // Comprimir a imagem
      const compressedBlob = await this.compressImage(file);
      
      // Converter para Base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedBlob);
        reader.onload = () => {
          const base64String = reader.result as string;
          // Validar tamanho após conversão
          if (base64String.length > 900 * 1024) { // ~900KB após conversão
            reject(new Error('A imagem ainda está muito grande após a compressão. Tente uma imagem menor.'));
            return;
          }
          resolve(base64String);
        };
        reader.onerror = () => {
          reject(new Error('Erro ao processar a imagem'));
        };
      });
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      throw error instanceof Error ? error : new Error('Erro desconhecido ao processar imagem');
    }
  },

  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      const restaurantsRef = collection(db, COLLECTION_NAME);
      const q = query(restaurantsRef);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];
    } catch (error) {
      console.error('Erro ao buscar restaurantes:', error);
      throw new Error('Não foi possível carregar os restaurantes');
    }
  },

  generateQRCodeLink(restaurantId: string): string {
    // Gera um link único para o restaurante que pode ser acessado pelos clientes
    return `${window.location.origin}/restaurant/${restaurantId}`;
  },

  async createRestaurant(restaurantData: NewRestaurantData): Promise<Restaurant> {
    try {
      const restaurantsRef = collection(db, COLLECTION_NAME);
      const newRestaurant = {
        ...restaurantData,
        isActive: true,
        rating: restaurantData.rating || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(restaurantsRef, newRestaurant);
      
      return {
        id: docRef.id,
        ...newRestaurant
      } as Restaurant;
    } catch (error) {
      console.error('Erro ao criar restaurante:', error);
      throw new Error('Não foi possível cadastrar o restaurante');
    }
  },

  async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<void> {
    try {
      const restaurantRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(restaurantRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar restaurante:', error);
      throw new Error('Não foi possível atualizar o restaurante');
    }
  },

  async deleteRestaurant(id: string): Promise<void> {
    try {
      const restaurantRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(restaurantRef);
    } catch (error) {
      console.error('Erro ao deletar restaurante:', error);
      throw new Error('Não foi possível excluir o restaurante');
    }
  },

  onRestaurantsChange(callback: (restaurants: Restaurant[]) => void): () => void {
    const restaurantsRef = collection(db, COLLECTION_NAME);
    const q = query(restaurantsRef);
    
    // Retorna a função de cleanup do listener
    return onSnapshot(q, (querySnapshot) => {
      const restaurants = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Restaurant[];
      
      callback(restaurants);
    }, (error) => {
      console.error('Erro ao monitorar restaurantes:', error);
    });
  }
};
