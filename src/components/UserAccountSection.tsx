import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, CreditCard, Calendar, Lock, Mail, Trash2, AlertTriangle, QrCode, Settings, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const UserAccountSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, deleteAccount } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Você saiu',
        description: 'Sua sessão foi encerrada com sucesso.',
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: 'Erro ao sair',
        description: 'Não foi possível encerrar sua sessão.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount();
      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso.',
      });
      navigate('/login');
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);
      setDeleteError(error.message || 'Ocorreu um erro ao tentar excluir sua conta.');
      toast({
        title: 'Erro ao excluir conta',
        description: error.message || 'Não foi possível excluir sua conta.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    console.warn("[UserAccountSection] Renderizado sem usuário, apesar de esperado. Verifique o ProtectedRoute.");
    return (
      <div className="p-6 text-center">
        Carregando dados do usuário ou erro ao carregar...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mr-3 sm:mr-5 shadow-md">
            <User className="w-7 h-7 sm:w-10 sm:h-10 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-xs sm:text-base text-gray-500 flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-300 hover:-translate-y-0.5 transform shadow-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sair da conta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-gray-50 rounded-xl p-3 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-xl font-bold mb-4 sm:mb-5 text-gray-800 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" strokeWidth={2.5} />
            Dados Pessoais
          </h3>
          
          <div className="space-y-3 sm:space-y-5">
            <div className="group bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300">
              <div className="flex items-center text-gray-500 mb-0.5 sm:mb-1 group-hover:text-primary">
                <User className="w-4 h-4 mr-2 opacity-70" />
                <span className="text-sm font-medium">Nome completo</span>
              </div>
              <p className="font-semibold text-gray-800">{user.name}</p>
            </div>
            
            <div className="group bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300">
              <div className="flex items-center text-gray-500 mb-0.5 sm:mb-1 group-hover:text-primary">
                <Mail className="w-4 h-4 mr-2 opacity-70" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="font-semibold text-gray-800 text-xs sm:text-base">{user.email}</p>
            </div>

            {/* Exibir número de telefone */}
            {user.telefone && (
              <div className="group bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300">
                <div className="flex items-center text-gray-500 mb-0.5 sm:mb-1 group-hover:text-primary">
                  <span className="inline-block opacity-70">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zm12-12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zm0 12a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </span>
                  <span className="text-sm font-medium">Telefone</span>
                </div>
                <p className="font-semibold text-gray-800">{user.telefone}</p>
              </div>
            )}
            
            {user.createdAt && (
              <div className="group bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300">
                <div className="flex items-center text-gray-500 mb-0.5 sm:mb-1 group-hover:text-primary">
                  <Calendar className="w-4 h-4 mr-2 opacity-70" />
                  <span className="text-sm font-medium">Membro desde</span>
                </div>
                <p className="font-semibold text-gray-800">{formatDate(user.createdAt)}</p>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-base sm:text-xl font-bold mb-4 sm:mb-5 text-gray-800 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-primary" strokeWidth={2.5} />
            Ações da Conta
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <Link
              to="/change-password"
              className="flex items-center justify-between p-3 sm:p-5 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 group-hover:bg-primary/20 transition-colors">
                  <Lock className="w-5 h-5 text-primary" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-800 mb-1">Alterar senha</h4>
                  <p className="text-xs sm:text-sm text-gray-500">Atualize suas credenciais de acesso</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
            </Link>


            <button
              onClick={handleOpenDeleteDialog}
              className="w-full flex items-center justify-between p-3 sm:p-5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 hover:border-red-200 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center">
                <div className="bg-red-400/10 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 group-hover:bg-red-400/20 transition-colors">
                  <Trash2 className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm sm:text-base text-red-800 mb-1">Excluir minha conta</h4>
                  <p className="text-xs sm:text-sm text-red-600">Remover todos os dados permanentemente</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação para exclusão de conta */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Excluir conta
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todos os seus dados serão excluídos permanentemente do nosso sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-3 sm:py-4">
            <p className="text-sm text-foreground-light mb-3 sm:mb-4">
              Ao excluir sua conta:
            </p>
            <ul className="text-sm space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Seus dados pessoais serão removidos</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Você perderá acesso ao histórico de cupons</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                <span>Qualquer assinatura ativa será cancelada</span>
              </li>
            </ul>
            
            {deleteError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
                {deleteError}
              </div>
            )}
            
            <p className="font-medium text-sm">
              Você tem certeza que deseja excluir sua conta?
            </p>
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </span>
              ) : (
                "Sim, excluir minha conta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserAccountSection;