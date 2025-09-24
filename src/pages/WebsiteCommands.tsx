import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  ShoppingCart,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { Textarea } from '@/components/ui/textarea';

// --- Type Definitions ---
interface Order {
  id: number;
  client_name: string;
  client_email: string | null;
  client_phone: string;
  wilaya: string;
  address: string;
  notes: string | null;
  payment_method: 'cod' | 'dahabia';
  total: number;
  status: 'pending' | 'confirmed' | 'completed';
  payment_status: 'unpaid' | 'partial' | 'paid';
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

const API_BASE = ' ';

const formatCurrencyLocal = (amount: number, language: string) =>
  new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    style: 'currency',
    currency: 'DZD'
  }).format(amount);

const formatDate = (dateString: string, language: string) =>
  new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

// Order Details Dialog Component
function OrderDetailsDialog({ isOpen, onClose, order }: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}) {
  const { language, isRTL } = useLanguage();

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? `تفاصيل الطلب #${order.id}` : `Détails de la commande #${order.id}`}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'معلومات كاملة حول الطلب' : 'Informations complètes sur la commande'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'معلومات العميل' : 'Informations client'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>{language === 'ar' ? 'الاسم:' : 'Nom:'}</strong> {order.client_name}</p>
                  <p><strong>{language === 'ar' ? 'الهاتف:' : 'Téléphone:'}</strong> {order.client_phone}</p>
                  {order.client_email && (
                    <p><strong>Email:</strong> {order.client_email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'عنوان التوصيل' : 'Adresse de livraison'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>{language === 'ar' ? 'الولاية:' : 'Wilaya:'}</strong> {order.wilaya}</p>
                  <p><strong>{language === 'ar' ? 'العنوان:' : 'Adresse:'}</strong> {order.address}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'معلومات الطلب' : 'Informations commande'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>{language === 'ar' ? 'طريقة الدفع:' : 'Méthode de paiement:'}</strong></p>
                  <p>{order.payment_method === 'cod' 
                    ? (language === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison')
                    : (language === 'ar' ? 'بطاقة ذهبية' : 'Carte Dahabia')}
                  </p>
                </div>
                <div>
                  <p><strong>{language === 'ar' ? 'الحالة:' : 'Statut:'}</strong></p>
                  <Badge
                    variant={
                      order.status === 'completed' ? 'default' : 
                      order.status === 'confirmed' ? 'secondary' : 'outline'
                    }
                    className={
                      order.status === 'completed' ? 'bg-green-500' : 
                      order.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'
                    }
                  >
                    {order.status === 'pending' 
                      ? (language === 'ar' ? 'قيد الانتظار' : 'En attente')
                      : order.status === 'confirmed' 
                        ? (language === 'ar' ? 'تم التأكيد' : 'Confirmée')
                        : (language === 'ar' ? 'مكتمل' : 'Terminée')
                    }
                  </Badge>
                </div>
                <div>
                  <p><strong>{language === 'ar' ? 'تاريخ الإنشاء:' : 'Date de création:'}</strong></p>
                  <p>{formatDate(order.created_at, language)}</p>
                </div>
                <div>
                  <p><strong>{language === 'ar' ? 'آخر تحديث:' : 'Dernière mise à jour:'}</strong></p>
                  <p>{formatDate(order.updated_at, language)}</p>
                </div>
              </div>
              {order.notes && (
                <div className="mt-4">
                  <p><strong>{language === 'ar' ? 'ملاحظات:' : 'Notes:'}</strong></p>
                  <Textarea value={order.notes} readOnly className="mt-1" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Package className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'المنتجات' : 'Produits'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'المنتج' : 'Produit'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الكمية' : 'Quantité'}</TableHead>
                    <TableHead>{language === 'ar' ? 'السعر' : 'Prix'}</TableHead>
                    <TableHead className="text-right">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrencyLocal(item.price, language)}</TableCell>
                      <TableCell className="text-right">{formatCurrencyLocal(item.total, language)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell colSpan={3} className="text-right">
                      {language === 'ar' ? 'المجموع الكلي:' : 'Total général:'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrencyLocal(order.total, language)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إغلاق' : 'Fermer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Edit Order Status Dialog Component
function EditOrderStatusDialog({ isOpen, onClose, order, onUpdate }: {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onUpdate: (updatedOrder: Order) => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [status, setStatus] = useState(order?.status || 'pending');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
    }
  }, [order]);

  const handleUpdate = async () => {
    if (!order) return;

    try {
      const response = await fetch(`${API_BASE}/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const updatedOrder = await response.json();
      onUpdate(updatedOrder);
      onClose();
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Mis à jour',
        description: language === 'ar' ? 'تم تحديث حالة الطلب بنجاح.' : 'Statut de commande mis à jour avec succès.',
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحديث حالة الطلب.' : 'Échec de la mise à jour du statut de commande.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? `تغيير حالة الطلب #${order?.id}` : `Changer le statut de la commande #${order?.id}`}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'اختر الحالة الجديدة للطلب' : 'Sélectionnez le nouveau statut de la commande'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="status">{language === 'ar' ? 'الحالة:' : 'Statut:'}</Label>
           <Select
  value={status}
  onValueChange={(value) => setStatus(value as 'pending' | 'confirmed' | 'completed')}
>
  <SelectTrigger className="w-full mt-1">
    <SelectValue placeholder={language === 'ar' ? 'اختر الحالة' : 'Sélectionnez un statut'} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="pending">
      {language === 'ar' ? 'قيد الانتظار' : 'En attente'}
    </SelectItem>
    <SelectItem value="confirmed">
      {language === 'ar' ? 'تم التأكيد' : 'Confirmée'}
    </SelectItem>
    <SelectItem value="completed">
      {language === 'ar' ? 'مكتمل' : 'Terminée'}
    </SelectItem>
  </SelectContent>
</Select>

          </div>

          {status === 'completed' && order?.status !== 'completed' && (
            <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm">
              {language === 'ar' 
                ? 'عند تأكيد إكتمال الطلب، سيتم خصم كميات المنتجات تلقائياً من المخزون.'
                : 'Lorsque vous confirmez la complétion de la commande, les quantités de produits seront automatiquement déduites du stock.'
              }
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Annuler'}
          </Button>
          <Button onClick={handleUpdate}>
            {language === 'ar' ? 'تحديث' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete Order Confirmation Dialog
function DeleteOrderConfirmationDialog({ isOpen, onClose, orderId, onDeleteConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onDeleteConfirm: (id: number) => void;
}) {
  const { language } = useLanguage();

  const handleDelete = () => {
    if (orderId !== null) {
      onDeleteConfirm(orderId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirmation de suppression'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? `هل أنت متأكد أنك تريد حذف الطلب رقم ${orderId}? لا يمكن التراجع عن هذا الإجراء.`
              : `Êtes-vous sûr de vouloir supprimer la commande #${orderId}? Cette action est irréversible.`
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'ar' ? 'إلغاء' : 'Annuler'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'حذف' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WebsiteCommands() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [orderToDeleteId, setOrderToDeleteId] = useState<number | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  const fetchOrdersData = async () => {
    try {
      // Fetch orders
      let ordersUrl = `${API_BASE}/api/orders`;
      if (searchQuery) {
        ordersUrl += `?search=${encodeURIComponent(searchQuery)}`;
      }
      
      const ordersResponse = await fetch(ordersUrl);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
        
        // Calculate stats
        const totalOrders = ordersData.length;
        const pendingOrders = ordersData.filter((order: Order) => order.status === 'pending').length;
        const confirmedOrders = ordersData.filter((order: Order) => order.status === 'confirmed').length;
        const completedOrders = ordersData.filter((order: Order) => order.status === 'completed').length;
        const totalRevenue = ordersData.reduce((sum: number, order: Order) => sum + order.total, 0);
        
        setOrderStats({
          totalOrders,
          pendingOrders,
          confirmedOrders,
          completedOrders,
          totalRevenue
        });
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل بيانات الطلبات.' : 'Échec du chargement des données de commande.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOrdersData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, filterStatus]);

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    fetchOrdersData(); // Refresh data to ensure stats are updated
  };

  const handleOpenDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleOpenEditStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setIsEditStatusModalOpen(true);
  };

  const handleDeleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Supprimée',
        description: language === 'ar' ? 'تم حذف الطلب بنجاح.' : 'Commande supprimée avec succès.',
      });
      fetchOrdersData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف الطلب.' : 'Échec de la suppression de la commande.',
        variant: 'destructive'
      });
    }
  };

  const openDeleteConfirmation = (orderId: number) => {
    setOrderToDeleteId(orderId);
    setIsDeleteConfirmationOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            {language === 'ar' ? 'قيد الانتظار' : 'En attente'}
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            {language === 'ar' ? 'تم التأكيد' : 'Confirmée'}
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <Truck className="h-3 w-3 mr-1" />
            {language === 'ar' ? 'مكتمل' : 'Terminée'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodText = (method: string) => {
    return method === 'cod' 
      ? (language === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison')
      : (language === 'ar' ? 'بطاقة ذهبية' : 'Carte Dahabia');
  };

  return (
    <div className={`space-y-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            {language === 'ar' ? 'إدارة طلبات الموقع' : 'Gestion des Commandes Web'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة وتتبع طلبات المتجر الإلكتروني' : 'Gérez et suivez les commandes de la boutique en ligne'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="stat-card gradient-primary text-primary-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الطلبات' : 'Total Commandes'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats?.totalOrders || 0}</div>
            <p className="text-xs">
              {language === 'ar' ? 'جميع الطلبات' : 'Toutes les commandes'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'قيد الانتظار' : 'En attente'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats?.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'طلبات بانتظار المعالجة' : 'Commandes en attente'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'تم التأكيد' : 'Confirmées'}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats?.confirmedOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'طلبات مؤكدة' : 'Commandes confirmées'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'مكتملة' : 'Terminées'}
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats?.completedOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'طلبات منجزة' : 'Commandes terminées'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card gradient-success text-success-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'إجمالي الإيرادات' : 'Revenus Totaux'}
            </CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyLocal(orderStats?.totalRevenue || 0, language)}</div>
            <p className="text-xs">
              {language === 'ar' ? 'من الطلبات' : 'Des commandes'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  type="text"
                  placeholder={language === 'ar' ? 'البحث برقم الطلب أو اسم العميل...' : 'Rechercher par numéro de commande ou client...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} search-input`}
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={language === 'ar' ? 'الحالة' : 'Statut'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'كل الطلبات' : 'Toutes les commandes'}</SelectItem>
                  <SelectItem value="pending">{language === 'ar' ? 'قيد الانتظار' : 'En attente'}</SelectItem>
                  <SelectItem value="confirmed">{language === 'ar' ? 'تم التأكيد' : 'Confirmées'}</SelectItem>
                  <SelectItem value="completed">{language === 'ar' ? 'مكتملة' : 'Terminées'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'قائمة الطلبات' : 'Liste des Commandes'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° {language === 'ar' ? 'الطلب' : 'Commande'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الهاتف' : 'Téléphone'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الولاية' : 'Wilaya'}</TableHead>
                  <TableHead>{language === 'ar' ? 'طريقة الدفع' : 'Paiement'}</TableHead>
                  <TableHead>{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Statut'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length > 0 ? (
                  orders
                    .filter(order => filterStatus === 'all' || order.status === filterStatus)
                    .map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                        <TableCell>{formatDate(order.created_at, language)}</TableCell>
                        <TableCell className="font-medium">{order.client_name}</TableCell>
                        <TableCell>{order.client_phone}</TableCell>
                        <TableCell>{order.wilaya}</TableCell>
                        <TableCell>{getPaymentMethodText(order.payment_method)}</TableCell>
                        <TableCell className="font-bold">{formatCurrencyLocal(order.total, language)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenDetailsModal(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEditStatusModal(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => openDeleteConfirmation(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
                      {language === 'ar' ? 'لا توجد طلبات' : 'Aucune commande trouvée.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <OrderDetailsDialog
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        order={selectedOrder}
      />

      <EditOrderStatusDialog
        isOpen={isEditStatusModalOpen}
        onClose={() => setIsEditStatusModalOpen(false)}
        order={selectedOrder}
        onUpdate={handleUpdateOrder}
      />

      <DeleteOrderConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        orderId={orderToDeleteId}
        onDeleteConfirm={handleDeleteOrder}
      />
    </div>
  );
}
