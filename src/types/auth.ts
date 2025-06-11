export interface UserSubscription {
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

export interface PaymentPending {
  paymentId: string;
  planId: string;
  qrCode?: string;  // Field to store QR code data
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'pago' | 'cancelado'; // Payment status
  createdAt?: string;
  expiresAt?: string;
  amount?: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  estado?: string;
  telefone?: string;
  cpf?: string;
  cidade?: string;
  profissao?: string;
  dataNascimento?: string;
  location?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'user';
  createdAt?: string;
  subscription?: UserSubscription;
  paymentPending?: PaymentPending | null;
  freeCoupons?: number; // Quantidade de cupons gratuitos disponíveis
  hasActiveSubscription?: boolean; // Status de assinatura ativa
  vouchersRedeemed?: number; // Quantidade de vouchers já resgatados pelo usuário
}

export interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserData>;
  loginWithGoogle: () => Promise<UserData>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  error: string | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
}
