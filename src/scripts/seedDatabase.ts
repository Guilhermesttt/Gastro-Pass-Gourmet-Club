import { db } from '../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Restaurant, User } from '../types/admin';
import { UserData } from '../types/auth';

const RESTAURANTES = [
  {
    name: "Fogo de Chão",
    address: "Av. dos Bandeirantes, 538 - Vila Olímpia",
    cuisine: "Brasileira",
    description: "Churrascaria premium com cortes nobres e rodízio de carnes.",
    phone: "(11) 3045-6599",
    discount: "10% OFF no jantar",
    neighborhood: "Vila Olímpia",
    state: "SP",
    imageUrl: "https://example.com/fogo-de-chao.jpg",
    openingHours: "Seg a Dom 12h-23h",
    rating: 4.8,
    isActive: true
  },
  {
    name: "Famiglia Mancini",
    address: "R. Avanhandava, 81 - Bela Vista",
    cuisine: "Italiana",
    description: "Restaurante italiano tradicional desde 1980.",
    phone: "(11) 3256-4320",
    discount: "15% OFF no almoço",
    neighborhood: "Bela Vista",
    state: "SP",
    imageUrl: "https://example.com/famiglia.jpg",
    openingHours: "Ter a Dom 12h-23h",
    rating: 4.6,
    isActive: true
  },
  {
    name: "Ryo Gastronomia",
    address: "R. Pedroso Alvarenga, 665 - Itaim Bibi",
    cuisine: "Japonesa",
    description: "Sushi de alta gastronomia e pratos contemporâneos.",
    phone: "(11) 3079-3343",
    discount: "20% OFF em pratos principais",
    neighborhood: "Itaim Bibi",
    state: "SP",
    imageUrl: "https://example.com/ryo.jpg",
    openingHours: "Seg a Sáb 12h-15h, 19h-23h",
    rating: 4.9,
    isActive: true
  }
];

const USUARIOS = [
  {
    name: "João Silva",
    email: "joao.silva@email.com",
    estado: "SP",
    role: "user",
    isAdmin: false,
    subscription: {
      planId: "plano-mensal",
      startDate: "2024-03-01",
      endDate: "2024-04-01",
      status: "ativo"
    },
    paymentPending: null
  },
  {
    name: "Maria Santos",
    email: "maria.santos@email.com",
    estado: "SP",
    role: "user",
    isAdmin: false,
    subscription: {
      planId: "plano-mensal",
      startDate: "2024-03-19",
      endDate: "2024-04-19",
      status: "ativo"
    },
    paymentPending: null
  }
];

const PAGAMENTOS = [
  {
    userId: "", // será preenchido dinamicamente
    userName: "João Silva",
    amount: 99.90,
    status: "pago",
    date: "2024-03-20T10:00:00",
    planId: "plano-mensal",
    type: "subscription"
  },
  {
    userId: "", // será preenchido dinamicamente
    userName: "Maria Santos",
    amount: 99.90,
    status: "pago",
    date: "2024-03-19T15:30:00",
    planId: "plano-mensal",
    type: "subscription"
  }
];

export const seedDatabase = async () => {
  try {
    // Adicionar restaurantes
    for (const restaurante of RESTAURANTES) {
      await addDoc(collection(db, 'restaurants'), {
        ...restaurante,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`Restaurante ${restaurante.name} adicionado com sucesso!`);
    }

    // Adicionar usuários e seus pagamentos
    for (let i = 0; i < USUARIOS.length; i++) {
      // Adicionar usuário
      const userRef = await addDoc(collection(db, 'users'), {
        ...USUARIOS[i],
        createdAt: serverTimestamp()
      });
      console.log(`Usuário ${USUARIOS[i].name} adicionado com sucesso!`);

      // Adicionar pagamento correspondente
      const pagamento = {
        ...PAGAMENTOS[i],
        userId: userRef.id
      };
      await addDoc(collection(db, 'payments'), {
        ...pagamento,
        createdAt: serverTimestamp()
      });
      console.log(`Pagamento para ${USUARIOS[i].name} adicionado com sucesso!`);
    }

    console.log('Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('Erro ao popular banco de dados:', error);
    throw error;
  }
};

// Função para executar o seed
seedDatabase();
