export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isAdmin?: boolean;
  createdAt?: string;
  status: 'ativo' | 'inativo';
}

export interface Payment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  date: string;
  description: string;
  amount: number;
  planId: string;
  planName?: string;
  status: 'pendente' | 'pago' | 'cancelado';
} 