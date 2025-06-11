import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { enableNetwork, disableNetwork, getFirestore } from 'firebase/firestore';
import { useToast } from './use-toast';

export const useFirestoreConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const { toast } = useToast();

  const checkConnection = async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      // Try to enable network to check connection
      await enableNetwork(db);
      setIsConnected(true);
      setIsChecking(false);
      return true;
    } catch (error) {
      console.error('Erro ao verificar conexão com o Firestore:', error);
      setIsConnected(false);
      setIsChecking(false);
      
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
        variant: 'destructive',
        duration: 5000
      });
      
      return false;
    }
  };

  const reconnect = async () => {
    setIsChecking(true);
    try {
      await enableNetwork(db);
      setIsConnected(true);
      
      toast({
        title: 'Conexão restaurada',
        description: 'Sua conexão com o servidor foi restabelecida.',
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao reconectar com o Firestore:', error);
      setIsConnected(false);
      
      toast({
        title: 'Falha na reconexão',
        description: 'Não foi possível restabelecer a conexão. Tente novamente mais tarde.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    
    // Setup periodic connection check (every 30 seconds)
    const interval = setInterval(() => {
      if (!isChecking && !isConnected) {
        reconnect();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    isChecking,
    checkConnection,
    reconnect
  };
}; 