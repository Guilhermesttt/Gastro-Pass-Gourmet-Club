import { db } from './firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserData } from '@/types/auth';
import { Payment } from './paymentService';
import { validateAuthToken } from './authService';

// Listen to user document changes
export const listenToUserChanges = (
  userId: string,
  callback: (userData: UserData) => void,
  errorCallback: (error: Error) => void
) => {
  // Validate token before setting up listener
  validateAuthToken()
    .then((isValid) => {
      if (!isValid) {
        errorCallback(new Error('Sessão expirada. Por favor, faça login novamente.'));
        return;
      }

      const userRef = doc(db, 'users', userId);
      return onSnapshot(
        userRef,
        (doc) => {
          if (doc.exists()) {
            const userData = { id: doc.id, ...doc.data() } as UserData;
            
            // Log da assinatura para depuração
            if (userData.subscription) {
              console.log('[USER LISTENER] Dados de assinatura atualizados:', {
                planId: userData.subscription.planId,
                status: userData.subscription.status,
                endDate: userData.subscription.endDate
              });
            }
            
            callback(userData);
          } else {
            errorCallback(new Error('Usuário não encontrado'));
          }
        },
        (error) => {
          console.error('Error listening to user changes:', error);
          errorCallback(error);
        }
      );
    })
    .catch((error) => {
      console.error('Error validating token:', error);
      errorCallback(error);
    });
};

// Listen to user payment changes
export const listenToUserPayments = (
  userId: string,
  callback: (payments: Payment[]) => void,
  errorCallback: (error: Error) => void
) => {
  // Validate token before setting up listener
  validateAuthToken()
    .then((isValid) => {
      if (!isValid) {
        errorCallback(new Error('Sessão expirada. Por favor, faça login novamente.'));
        return;
      }

      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', userId)
      );
      
      return onSnapshot(
        paymentsQuery,
        (snapshot) => {
          const payments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Payment[];
          callback(payments);
        },
        (error) => {
          console.error('Error listening to user payments:', error);
          errorCallback(error);
        }
      );
    })
    .catch((error) => {
      console.error('Error validating token:', error);
      errorCallback(error);
    });
};

// Listen to specific payment changes
export const listenToPaymentChanges = (
  paymentId: string,
  callback: (payment: Payment) => void,
  errorCallback: (error: Error) => void
) => {
  // Validate token before setting up listener
  validateAuthToken()
    .then((isValid) => {
      if (!isValid) {
        errorCallback(new Error('Sessão expirada. Por favor, faça login novamente.'));
        return;
      }

      const paymentRef = doc(db, 'payments', paymentId);
      return onSnapshot(
        paymentRef,
        (doc) => {
          if (doc.exists()) {
            const payment = { id: doc.id, ...doc.data() } as Payment;
            callback(payment);
          } else {
            errorCallback(new Error('Pagamento não encontrado'));
          }
        },
        (error) => {
          console.error('Error listening to payment changes:', error);
          errorCallback(error);
        }
      );
    })
    .catch((error) => {
      console.error('Error validating token:', error);
      errorCallback(error);
    });
}; 