import { useState, useEffect } from 'react';
import { PenLineIcon, Trash2Icon, Search, PlusCircle, Star, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { restaurantService } from '@/lib/restaurantService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Restaurant, CuisineType, NewRestaurantData, CUISINE_TYPES } from '@/types/admin';
import { formatDate } from '@/utils/formatDate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Lista de estados brasileiros
const ESTADOS_BRASIL = [
 { sigla: "MS", nome: "Mato Grosso do Sul" }
];

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [newRestaurant, setNewRestaurant] = useState<NewRestaurantData>({
    name: '',
    address: '',
    cuisine: 'Outras',
    description: '',
    phone: '',
    discount: '',
    neighborhood: '',
    state: '',
    imageUrl: '',
    openingHours: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    setIsLoading(true);
    // Inicia o listener de restaurantes
    const unsubscribe = restaurantService.onRestaurantsChange((data) => {
      setRestaurants(data);
      setIsLoading(false);
    });

    // Cleanup: remove o listener quando o componente é desmontado
    return () => {
      unsubscribe();
    };
  }, []);  const handleEdit = async (restaurant: Restaurant) => {
    try {
      await restaurantService.updateRestaurant(restaurant.id, restaurant);
      toast({
        title: "Restaurante atualizado",
        description: "O restaurante foi atualizado com sucesso!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o restaurante.",
      });
    }
  };

  const handleDelete = async (restaurant: Restaurant) => {
    try {      await restaurantService.deleteRestaurant(restaurant.id);
      toast({
        title: "Restaurante excluído",
        description: "O restaurante foi excluído com sucesso!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o restaurante.",
      });
    }
  };

  const handleSaveRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.address || !newRestaurant.cuisine || 
        !newRestaurant.state || !newRestaurant.neighborhood || !newRestaurant.discount ||
        !newRestaurant.openingHours) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios: Nome, Endereço, Culinária, Estado, Bairro, Horário e Desconto.",
      });
      return;
    }
    
    if (!newRestaurant.imageUrl) {
      toast({
        variant: "destructive",
        title: "Imagem obrigatória",
        description: "Por favor, faça o upload de uma imagem para o restaurante.",
      });
      return;
    }

    try {
      setIsSaving(true);
      // Cria o restaurante sem gerar QR code automaticamente
      const savedRestaurant = await restaurantService.createRestaurant(newRestaurant);
      setRestaurants(prev => [...prev, savedRestaurant]);
      
      // Fecha o modal e limpa o formulário
      setIsAddModalOpen(false);
      setNewRestaurant({
        name: '',
        address: '',
        cuisine: 'Outras',
        description: '',
        phone: '',
        discount: '',
        neighborhood: '',
        state: '',
        imageUrl: '',
        openingHours: '',
      });
      
      toast({
        title: "Restaurante cadastrado",
        description: "O restaurante foi cadastrado com sucesso!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível cadastrar o restaurante';
      console.error('Erro ao cadastrar restaurante:', err);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setNewRestaurant({
      name: restaurant.name,
      address: restaurant.address,
      cuisine: restaurant.cuisine,
      description: restaurant.description || '',
      phone: restaurant.phone || '',
      discount: restaurant.discount || '',
      neighborhood: restaurant.neighborhood || '',
      state: restaurant.state || '',
      imageUrl: restaurant.imageUrl || '',
      openingHours: restaurant.openingHours || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateRestaurant = async () => {
    if (!selectedRestaurant) return;

    try {
      setIsSaving(true);      await restaurantService.updateRestaurant(selectedRestaurant.id, newRestaurant);

      setIsEditModalOpen(false);
      toast({
        title: "Restaurante atualizado",
        description: "As alterações foram salvas com sucesso!",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o restaurante.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
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
                <p className="text-muted-foreground">Carregando restaurantes...</p>
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
                <h1 className="text-2xl font-semibold">Gerenciar Restaurantes</h1>
                <p className="mt-2 text-muted-foreground">
                  Lista de todos os restaurantes cadastrados na plataforma.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                  Adicionar Restaurante
                </Button>
              </div>
            </div>

            <div className="mt-8 flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, culinária ou endereço..."
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
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Culinária</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestaurants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {error ? 'Erro ao carregar restaurantes' : 'Nenhum restaurante encontrado'}
                      </TableCell>
                    </TableRow>
                  ) : filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-mono text-sm">{restaurant.id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {restaurant.imageUrl && (
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={restaurant.imageUrl} alt={restaurant.name} className="w-full h-full object-cover"/>
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{restaurant.name}</div>
                            {restaurant.description && (
                              <div className="text-sm text-muted-foreground">{restaurant.description.slice(0, 50)}...</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{restaurant.cuisine}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{restaurant.address}</TableCell>
                      <TableCell>
                        <Badge variant={restaurant.isActive ? 'default' : 'secondary'}>
                          {restaurant.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{restaurant.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(restaurant)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <PenLineIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(restaurant)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Restaurante</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Nome do Restaurante *
              </label>
              <Input
                id="edit-name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="Digite o nome do restaurante"
                className="w-full"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="cuisine" className="text-sm font-medium">
                Tipo de Culinária *
              </label>
              <Select
                value={newRestaurant.cuisine}
                onValueChange={(value: CuisineType) => setNewRestaurant(prev => ({
                  ...prev,
                  cuisine: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de culinária" />
                </SelectTrigger>
                <SelectContent>
                  {CUISINE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="address" className="text-sm font-medium">
                Endereço *
              </label>
              <Input
                id="address"
                value={newRestaurant.address}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  address: e.target.value
                }))}
                placeholder="Digite o endereço completo"
                className="w-full"
              />
            </div>            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <textarea
                id="description"
                value={newRestaurant.description}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Descreva brevemente o restaurante"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="voucherLink" className="text-sm font-medium">
                Link do Voucher
              </label>
              <Input
                id="voucherLink"
                value={newRestaurant.voucherLink || ''}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  voucherLink: e.target.value
                }))}
                placeholder="Ex: https://seusite.com/voucher123"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="state" className="text-sm font-medium">
                  Estado *
                </label>
                <Select
                  value={newRestaurant.state}
                  onValueChange={(value: string) => setNewRestaurant(prev => ({
                    ...prev,
                    state: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map(estado => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="neighborhood" className="text-sm font-medium">
                  Bairro/Região *
                </label>
                <Input
                  id="neighborhood"
                  value={newRestaurant.neighborhood}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    neighborhood: e.target.value
                  }))}
                  placeholder="Ex: Centro"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Telefone
                </label>
                <Input
                  id="phone"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                  placeholder="(00) 00000-0000"
                  className="w-full"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="discount" className="text-sm font-medium">
                  Desconto/Benefício *
                </label>
                <Input
                  id="discount"
                  value={newRestaurant.discount}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    discount: e.target.value
                  }))}
                  placeholder="Ex: 15% OFF"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="openingHours" className="text-sm font-medium">
                Horário de Funcionamento *
              </label>
              <Input
                id="openingHours"
                value={newRestaurant.openingHours}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  openingHours: e.target.value
                }))}
                placeholder="Ex: Seg a Sex 10h-22h, Sáb e Dom 11h-23h"
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Imagem do Restaurante
              </label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="restaurant-image"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        // Mostrar loading
                        toast({
                          title: "Processando imagem",
                          description: "Aguarde enquanto enviamos sua imagem...",
                        });

                        const imageUrl = await restaurantService.uploadImage(file);
                        
                        setNewRestaurant(prev => ({
                          ...prev,
                          imageUrl
                        }));

                        toast({
                          title: "Sucesso!",
                          description: "Imagem carregada com sucesso.",
                        });
                      } catch (error) {
                        const message = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
                        toast({
                          variant: "destructive",
                          title: "Erro no upload",
                          description: message,
                        });
                        
                        // Limpar o input
                        const input = document.getElementById('restaurant-image') as HTMLInputElement;
                        if (input) input.value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      document.getElementById('restaurant-image')?.click();
                    }}
                    className="w-full"
                  >
                    Fazer Upload de Imagem
                  </Button>
                </div>
                
                {newRestaurant.imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={newRestaurant.imageUrl}
                      alt="Preview do restaurante"
                      className="object-cover w-full h-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setNewRestaurant(prev => ({
                          ...prev,
                          imageUrl: ''
                        }));
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="rating" className="text-sm font-medium">
                Avaliação (1-5)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={newRestaurant.rating || ''}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    rating: parseFloat(e.target.value)
                  }))}
                  placeholder="Ex: 4.5"
                  className="w-full"
                />
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setNewRestaurant({
                    name: '',
                    address: '',
                    cuisine: 'Outras',
                    description: ''
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleUpdateRestaurant}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Restaurante</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome do Restaurante *
              </label>
              <Input
                id="name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                placeholder="Digite o nome do restaurante"
                className="w-full"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="cuisine" className="text-sm font-medium">
                Tipo de Culinária *
              </label>
              <Select
                value={newRestaurant.cuisine}
                onValueChange={(value: CuisineType) => setNewRestaurant(prev => ({
                  ...prev,
                  cuisine: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de culinária" />
                </SelectTrigger>
                <SelectContent>
                  {CUISINE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="address" className="text-sm font-medium">
                Endereço *
              </label>
              <Input
                id="address"
                value={newRestaurant.address}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  address: e.target.value
                }))}
                placeholder="Digite o endereço completo"
                className="w-full"
              />
            </div>            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <textarea
                id="description"
                value={newRestaurant.description}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Descreva brevemente o restaurante"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="voucherLink" className="text-sm font-medium">
                Link do Voucher
              </label>
              <Input
                id="voucherLink"
                value={newRestaurant.voucherLink || ''}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  voucherLink: e.target.value
                }))}
                placeholder="Ex: https://seusite.com/voucher123"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="state" className="text-sm font-medium">
                  Estado *
                </label>
                <Select
                  value={newRestaurant.state}
                  onValueChange={(value: string) => setNewRestaurant(prev => ({
                    ...prev,
                    state: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map(estado => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="neighborhood" className="text-sm font-medium">
                  Bairro/Região *
                </label>
                <Input
                  id="neighborhood"
                  value={newRestaurant.neighborhood}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    neighborhood: e.target.value
                  }))}
                  placeholder="Ex: Centro"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Telefone
                </label>
                <Input
                  id="phone"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                  placeholder="(00) 00000-0000"
                  className="w-full"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="discount" className="text-sm font-medium">
                  Desconto/Benefício *
                </label>
                <Input
                  id="discount"
                  value={newRestaurant.discount}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    discount: e.target.value
                  }))}
                  placeholder="Ex: 15% OFF"
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="openingHours" className="text-sm font-medium">
                Horário de Funcionamento *
              </label>
              <Input
                id="openingHours"
                value={newRestaurant.openingHours}
                onChange={(e) => setNewRestaurant(prev => ({
                  ...prev,
                  openingHours: e.target.value
                }))}
                placeholder="Ex: Seg a Sex 10h-22h, Sáb e Dom 11h-23h"
                className="w-full"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Imagem do Restaurante
              </label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="restaurant-image"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        // Mostrar loading
                        toast({
                          title: "Processando imagem",
                          description: "Aguarde enquanto enviamos sua imagem...",
                        });

                        const imageUrl = await restaurantService.uploadImage(file);
                        
                        setNewRestaurant(prev => ({
                          ...prev,
                          imageUrl
                        }));

                        toast({
                          title: "Sucesso!",
                          description: "Imagem carregada com sucesso.",
                        });
                      } catch (error) {
                        const message = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
                        toast({
                          variant: "destructive",
                          title: "Erro no upload",
                          description: message,
                        });
                        
                        // Limpar o input
                        const input = document.getElementById('restaurant-image') as HTMLInputElement;
                        if (input) input.value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      document.getElementById('restaurant-image')?.click();
                    }}
                    className="w-full"
                  >
                    Fazer Upload de Imagem
                  </Button>
                </div>
                
                {newRestaurant.imageUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img
                      src={newRestaurant.imageUrl}
                      alt="Preview do restaurante"
                      className="object-cover w-full h-full"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setNewRestaurant(prev => ({
                          ...prev,
                          imageUrl: ''
                        }));
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="rating" className="text-sm font-medium">
                Avaliação (1-5)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={newRestaurant.rating || ''}
                  onChange={(e) => setNewRestaurant(prev => ({
                    ...prev,
                    rating: parseFloat(e.target.value)
                  }))}
                  placeholder="Ex: 4.5"
                  className="w-full"
                />
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewRestaurant({
                    name: '',
                    address: '',
                    cuisine: 'Outras',
                    description: ''
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleSaveRestaurant}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRestaurants;
