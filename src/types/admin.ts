export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  estado?: string;
  location?: string;
  freeCoupons?: number; // Adicionando campo para cupons gratuitos
  hasActiveSubscription?: boolean; // Adicionando campo para status de assinatura
  telefone?: string; // Adicionando campo para telefone
  cpf?: string; // Adicionando campo para CPF
  cidade?: string; // Adicionando campo para cidade
  profissao?: string; // Adicionando campo para profissao
  dataNascimento?: string; // Adicionando campo para data de nascimento
  subscription?: {
    planId: string;
    status?: string; // Adicionado status, se não existir
    startDate?: string; // Adicionado startDate, se não existir
    endDate?: string; // Adicionado endDate, se não existir
  };
  status?: string; // Adicionando campo para status
  vouchersRedeemed?: number; // Adicionado esta linha
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: CuisineType;  
  rating?: number;
  isActive: boolean;
  imageUrl?: string;
  description?: string;
  voucherLink?: string;
  createdAt: string;
  updatedAt: string;
  openingHours?: string;
  phone?: string;
  discount?: string;
  neighborhood?: string;
  state?: string;
}

export const CUISINE_TYPES = [
  'Italiana', 'Japonesa', 'Brasileira', 'Mexicana', 'Árabe', 
  'Indiana', 'Chinesa', 'Francesa', 'Vegetariana', 'Vegana',
  'Fast Food', 'Cafeteria', 'Portuguesa', 'Contemporânea', 'Outras'
] as const;

export type CUISINE_TYPES_ARRAY = typeof CUISINE_TYPES;
export type CuisineType = CUISINE_TYPES_ARRAY[number];

export interface NewRestaurantData {
  name: string;
  address: string;
  cuisine: CuisineType;
  description?: string;
  imageUrl?: string;
  openingHours?: string;
  phone?: string;
  discount?: string;
  rating?: number;
  neighborhood?: string;
  state?: string;
  voucherLink?: string;
}

export interface AdminTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T;
    cell?: (row: T) => React.ReactNode;
  }[];
  isLoading: boolean;
  error: Error | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  amount: number;
  description: string;
  date: string;
  status: 'pendente' | 'pago' | 'aprovado' | 'rejeitado' | 'cancelado';
  qrCode?: string;
  paymentProvider?: string;
  createdAt?: string;
  expiresAt?: string;
  qrCodeExpiracao?: string;
  rejectionReason?: string; // Adicionando o campo para razão da rejeição
}

export interface SavedPayment {
  id: string;
  planId: string;
  amount: number;
  qrCode: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'pago' | 'cancelado'; // Incluindo status aqui
  expiresAt: string;
}

export interface PaymentPending {
  paymentId: string;
  planId: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'pago' | 'cancelado';
  createdAt: string;
  expiresAt: string;
  amount: number;
  qrCode?: string;
  rejectionReason?: string;
  onQrCodeClick?: (event: React.MouseEvent) => void;
}
