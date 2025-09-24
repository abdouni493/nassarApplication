import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Truck,
  Phone,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  TrendingUp,
  Building,
  Loader2,
  Filter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

// Define the API URL
const API_URL = ' /api';

interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  total_purchases: number;
  last_purchase_date: string;
  status: 'active' | 'inactive';
}

interface Stats {
  totalSuppliers: number;
  totalPurchaseOrders: number;
  totalPurchaseAmount: number;
  totalPaidAmount: number;
  pendingPayments: number;
}

export default function Suppliers() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const fetchSuppliersAndStats = async () => {
    setIsLoading(true);
    try {
      const suppliersRes = await axios.get(`${API_URL}/suppliers`);
      const statsRes = await axios.get(`${API_URL}/suppliers/stats`);
      setSuppliers(suppliersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في جلب بيانات الموردين. تحقق من الخادم.' : 'Échec du chargement des données des fournisseurs. Vérifiez le serveur.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliersAndStats();
  }, []);

  const handleFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentSupplier) {
        await axios.put(`${API_URL}/suppliers/${currentSupplier.id}`, formData);
        toast({
          title: language === 'ar' ? 'نجاح' : 'Succès',
          description: language === 'ar' ? 'تم تحديث المورد بنجاح.' : 'Fournisseur mis à jour avec succès.',
        });
      } else {
        await axios.post(`${API_URL}/suppliers`, formData);
        toast({
          title: language === 'ar' ? 'نجاح' : 'Succès',
          description: language === 'ar' ? 'تم إضافة مورد جديد بنجاح.' : 'Nouveau fournisseur ajouté avec succès.',
        });
      }
      setIsDialogOpen(false);
      fetchSuppliersAndStats();
    } catch (error) {
      console.error('Failed to save supplier:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حفظ بيانات المورد.' : 'Échec de l\'enregistrement des données du fournisseur.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = async (id: number) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد أنك تريد حذف هذا المورد؟' : 'Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
      try {
        await axios.delete(`${API_URL}/suppliers/${id}`);
        toast({
          title: language === 'ar' ? 'تم الحذف' : 'Supprimé',
          description: language === 'ar' ? 'تم حذف المورد بنجاح.' : 'Fournisseur supprimé avec succès.',
        });
        fetchSuppliersAndStats();
      } catch (error) {
        console.error('Failed to delete supplier:', error);
        toast({
          title: language === 'ar' ? 'خطأ في الحذف' : 'Erreur de suppression',
          description: language === 'ar' ? 'فشل في حذف المورد.' : 'Échec de la suppression du fournisseur.',
          variant: 'destructive',
        });
      }
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD',
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR');

  const getStatusBadge = (status: 'active' | 'inactive') => {
    if (status === 'active') {
      return (
        <Badge className="bg-success text-success-foreground">
          {language === 'ar' ? 'نشط' : 'Actif'}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {language === 'ar' ? 'غير نشط' : 'Inactif'}
      </Badge>
    );
  };

  if (isLoading || !stats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>{language === 'ar' ? 'جارٍ تحميل البيانات...' : 'Chargement des données...'}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">{language === 'ar' ? 'إدارة الموردين' : 'Gestion des Fournisseurs'}</h1>
          <p className="text-muted-foreground">{language === 'ar' ? 'إدارة الموردين، الطلبات والمدفوعات.' : 'Gérez les fournisseurs, les commandes et les paiements.'}</p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          onClick={() => {
            setCurrentSupplier(null);
            setFormData({ name: '', phone: '', address: '' });
            setIsDialogOpen(true);
          }}
        >
          <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
          {language === 'ar' ? 'مورد جديد' : 'Nouveau Fournisseur'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stat-card gradient-primary text-primary-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الموردين' : 'Total Fournisseurs'}</CardTitle>
            <Truck className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
            <p className="text-xs">{language === 'ar' ? 'شركاء تجاريين' : 'Partenaires commerciaux'}</p>
          </CardContent>
        </Card>

        <Card className="stat-card gradient-success text-success-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي المشتريات' : 'Total Achats'}</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPurchaseAmount)}</div>
            <p className="text-xs">{stats.totalPurchaseOrders} {language === 'ar' ? 'طلبية' : 'commandes'}</p>
          </CardContent>
        </Card>

        <Card className="stat-card gradient-warning text-warning-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'مدفوعات معلقة' : 'Paiements en Attente'}</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingPayments)}</div>
            <p className="text-xs">{language === 'ar' ? 'مستحق للموردين' : 'Dû aux fournisseurs'}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'متوسط قيمة الطلب' : 'Valeur moyenne de la commande'}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPurchaseOrders > 0
                ? formatCurrency(stats.totalPurchaseAmount / stats.totalPurchaseOrders)
                : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'على جميع الطلبات' : 'Sur toutes les commandes'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة الموردين' : 'Liste des Fournisseurs'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="relative flex-1">
              <Search className={`${isRTL ? 'right-3' : 'left-3'} absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                type="text"
                placeholder={language === 'ar' ? 'بحث بالاسم أو الهاتف...' : 'Rechercher par nom ou téléphone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} search-input`}
              />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'ar' ? 'المورد' : 'Fournisseur'}</TableHead>
                <TableHead>{language === 'ar' ? 'الاتصال' : 'Contact'}</TableHead>
                <TableHead>{language === 'ar' ? 'إجمالي المشتريات' : 'Total Achats'}</TableHead>
                <TableHead>{language === 'ar' ? 'آخر شراء' : 'Dernier Achat'}</TableHead>
                <TableHead>{language === 'ar' ? 'الحالة' : 'Statut'}</TableHead>
                <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" /> {supplier.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3 w-3" /> {supplier.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{supplier.contact_person}</div>
                      <div className="text-xs text-muted-foreground">{supplier.phone}</div>
                    </TableCell>
                    <TableCell className="font-bold text-success">
                      {formatCurrency(supplier.total_purchases)}
                    </TableCell>
                    <TableCell>
                      {supplier.last_purchase_date
                        ? formatDate(supplier.last_purchase_date)
                        : language === 'ar' ? 'لا يوجد' : 'Aucun'}
                    </TableCell>
                    <TableCell>{getStatusBadge(supplier.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSupplier(supplier)}
                          className="h-8 w-8"
                          title={language === 'ar' ? 'تعديل' : 'Modifier'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSupplier(supplier.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title={language === 'ar' ? 'حذف' : 'Supprimer'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    {language === 'ar' ? 'لم يتم العثور على موردين مطابقين.' : 'Aucun fournisseur correspondant n\'a été trouvé.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentSupplier
                ? (language === 'ar' ? 'تعديل المورد' : 'Modifier le Fournisseur')
                : (language === 'ar' ? 'مورد جديد' : 'Nouveau Fournisseur')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {language === 'ar' ? 'الاسم' : 'Nom'}
              </Label>
              <Input id="name" value={formData.name} onChange={handleFormChange} required className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                {language === 'ar' ? 'الهاتف' : 'Téléphone'}
              </Label>
              <Input id="phone" value={formData.phone} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                {language === 'ar' ? 'العنوان' : 'Adresse'}
              </Label>
              <Input id="address" value={formData.address} onChange={handleFormChange} className="col-span-3" />
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} />
                ) : (
                  language === 'ar' ? 'حفظ' : 'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
