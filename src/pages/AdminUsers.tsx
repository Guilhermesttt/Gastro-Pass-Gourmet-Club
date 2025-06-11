import { useState, useEffect, useRef } from 'react';
import { PenLineIcon, Trash2Icon, Search, PlusCircle, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/lib/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AdminSidebar from '@/components/AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/admin';
import { formatDate } from '@/utils/formatDate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface VoucherModalData {
  userName: string;
  vouchersCount: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedUserVouchers, setSelectedUserVouchers] = useState<VoucherModalData | null>(null);

  useEffect(() => {
    // Configurar um listener para atualizações em tempo real
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const updatedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      // Filtrar apenas usuários não-admin
      const filteredUsers = updatedUsers.filter(user => user.role !== 'admin');
      setUsers(filteredUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao ouvir mudanças nos usuários:", error);
      toast({
        variant: "destructive",
        title: "Erro ao monitorar usuários",
        description: "Não foi possível receber atualizações dos usuários em tempo real.",
      });
    });

    // Limpar o listener quando o componente for desmontado
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (editingUser) {
      setEditFormData({
        name: editingUser.name,
        email: editingUser.email,
        telefone: editingUser.telefone || '',
        cpf: editingUser.cpf || '',
        cidade: editingUser.cidade || '',
        profissao: editingUser.profissao || '',
        dataNascimento: editingUser.dataNascimento || '',
      });
    } else {
      setEditFormData({});
    }
  }, [editingUser]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o usuário.",
      });
    }
  };

  const handleViewVouchers = (user: User) => {
    setSelectedUserVouchers({
      userName: user.name,
      vouchersCount: user.vouchersRedeemed || 0
    });
    setIsVoucherModalOpen(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="lg:pl-64">
          <AdminSidebar />
          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-center h-[50vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Carregando usuários...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="lg:pl-64">
        <AdminSidebar />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <h1 className="text-2xl font-semibold">Gerenciar Parceiros</h1>
                <p className="mt-2 text-muted-foreground">
                  Lista de todos os usuários registrados na plataforma.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16">
                <Button className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Usuário
                </Button>
              </div>
            </div>

            <div className="mt-8 flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou papel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="mt-6 bg-card rounded-xl shadow-sm border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead>ID</TableHead> */}
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    {/* <TableHead>Papel</TableHead> */}
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                    {/* <TableHead>Cidade</TableHead> */}
                    {/* <TableHead>Profissão</TableHead> */}
                    {/* <TableHead>Data de Nascimento</TableHead> */}
                    {/* <TableHead>Data de Cadastro</TableHead> */}
                    {/* Add Plano Atual header */}
                    <TableHead>Plano Atual</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      {/* Ajustar colSpan para o número correto de colunas visíveis (4 + 1 de ações + 1 de plano = 6) */}
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {error ? 'Erro ao carregar usuários' : 'Nenhum usuário encontrado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        {/* Célula ID removida */}
                        {/* <TableCell className="font-mono text-sm">
                          {user.id.slice(0, 8)}...
                        </TableCell> */}
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            {user.location && (
                              <div className="text-sm text-muted-foreground">{user.location}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        {/* Célula Papel removida */}
                        {/* <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                          </Badge>
                        </TableCell> */}
                        <TableCell>{user.telefone || 'N/A'}</TableCell>
                        <TableCell>{user.cpf || 'N/A'}</TableCell>
                        {/* Célula Cidade removida */}
                        {/* <TableCell>{user.cidade || user.location || 'N/A'}</TableCell> */}
                        {/* Célula Profissão removida */}
                        {/* <TableCell>{user.profissao || 'N/A'}</TableCell> */}
                        {/* Célula Data de Nascimento removida */}
                        {/* <TableCell>{user.dataNascimento || 'N/A'}</TableCell> */}
                        {/* Célula Data de Cadastro removida */}
                        {/* <TableCell>{formatDate(user.createdAt)}</TableCell> */}
                        {/* Add Plano Atual cell */}
                        <TableCell className={user?.subscription?.planId === 'annual' ? 'text-green-600' : 'text-gray-500'}>
                          {user?.subscription?.planId === 'annual' ? 'Plano Anual' : 'Plano Grátis'}
                        </TableCell>
                        <TableCell>
                          {user.role !== 'admin' && (
                            <div className="flex items-center gap-2">
                              {user?.subscription?.planId === 'annual' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title={`Vouchers Resgatados: ${user.vouchersRedeemed || 0}`}
                                  className="text-purple-600 hover:text-purple-700"
                                  onClick={() => handleViewVouchers(user)}
                                >
                                  <Ticket className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <PenLineIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Edite as informações do usuário selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="col-span-3"
                type="email"
                disabled
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone"
                value={editFormData.telefone || ''}
                onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cpf" className="text-right">
                CPF
              </Label>
              <Input
                id="cpf"
                value={editFormData.cpf || ''}
                onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plan" className="text-right">
                Plano Atual
              </Label>
              <Input
                id="plan"
                value={editingUser?.subscription?.planId === 'annual' ? 'Plano Anual' : 'Plano Grátis'}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cidade" className="text-right">
                Cidade
              </Label>
              <Input
                id="cidade"
                value={editFormData.cidade || ''}
                onChange={(e) => setEditFormData({ ...editFormData, cidade: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profissao" className="text-right">
                Profissão
              </Label>
              <Input
                id="profissao"
                value={editFormData.profissao || ''}
                onChange={(e) => setEditFormData({ ...editFormData, profissao: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dataNascimento" className="text-right">
                Data de Nascimento
              </Label>
              <Input
                id="dataNascimento"
                value={editFormData.dataNascimento || ''}
                onChange={(e) => setEditFormData({ ...editFormData, dataNascimento: e.target.value })}
                className="col-span-3"
                type="date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
            <Button type="button">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-500" />
              Vouchers Resgatados
            </DialogTitle>
            <DialogDescription>
              Detalhes dos vouchers de {selectedUserVouchers?.userName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-6">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {selectedUserVouchers?.vouchersCount}
            </div>
            <p className="text-gray-600 text-center">
              {selectedUserVouchers?.vouchersCount === 1 
                ? "Voucher resgatado"
                : "Vouchers resgatados"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;