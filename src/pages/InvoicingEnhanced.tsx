import { useState, useEffect } from 'react';
import { 
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Package,
  FileText,
  X,
  Printer,
  Car,
  Calendar,
  DollarSign
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

// --- Type Definitions ---
interface Product {
  id: number;
  name: string;
  barcode: string;
  brand: string;
  category: string;
  buying_price: number;
  selling_price: number;
  margin_percent: number;
  initial_quantity: number;
  current_quantity: number;
  min_quantity: number;
  supplier: string;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: number;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceItem {
  id: number | string;
  productId: number;
  productName: string;
  barcode: string;
  purchasePrice: number;
  marginPercent: number;
  sellingPrice: number;
  quantity: number;
  minQuantity: number;
  total: number;
}

interface Invoice {
  productNames: string;
  id: number;
  type: 'purchase' | 'sale';
  supplierId: number;
  total: number;
  created_at: string;
  product_name?: string; // Added product name for list view
  supplier?: Supplier;
  items?: InvoiceItem[];
}

interface InvoiceStats {
  totalPurchaseAmount: number;
  totalToday: number;
  totalThisMonth: number;
}

export default function InvoicingEnhanced() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [isCreatingPurchaseInvoice, setIsCreatingPurchaseInvoice] = useState(false);
  const [isViewingInvoice, setIsViewingInvoice] = useState(false);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<InvoiceItem[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InvoiceStats | null>(null);

  const fetchStats = async () => {
    try {
const res = await fetch(' /api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
  // Adjust the state update to correctly map the server response
  setStats({
      totalPurchaseAmount: data.todayStats.totalPurchases,
      totalToday: data.todayStats.purchasesCount,
      totalThisMonth: data.todayStats.purchasesCount
  });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

const fetchInvoices = async (dateRange: string) => {
  try {
    setLoading(true);
    let url = ' /api/invoices?type=purchase';
    if (dateRange !== 'all') {
      url += `&dateRange=${dateRange}`;
    }
    const res = await fetch(url);
    if (res.ok) {
      const invoicesData = await res.json();

      // For each invoice, fetch its items and join product names
      const enrichedInvoices = await Promise.all(
        invoicesData.map(async (invoice: Invoice) => {
          const supplier = suppliers.find(s => s.id === invoice.supplierId);
          let productNames = '';

          try {
            const itemsRes = await fetch(` /api/invoices/${invoice.id}`);
            if (itemsRes.ok) {
              const fullInvoice = await itemsRes.json();
              productNames = fullInvoice.items.map((it: any) => it.product_name).join(', ');
            }
          } catch (err) {
            console.error('Error fetching invoice items:', err);
          }

          return {
            ...invoice,
            supplierName: supplier ? supplier.name : 'Unknown',
            productNames,
          };
        })
      );

      setInvoices(enrichedInvoices);
    } else {
      throw new Error('Failed to fetch invoices');
    }
  } catch (error) {
    console.error('Error fetching invoices:', error);
    toast({
      title: language === 'ar' ? 'خطأ' : 'Erreur',
      description: language === 'ar'
        ? 'فشل في تحميل الفواتير. يرجى التحقق من اتصال الخادم.'
        : 'Échec du chargement des factures. Veuillez vérifier la connexion au serveur.',
      variant: 'destructive'
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchStats();
    fetchInvoices(dateFilter);
    const fetchSuppliers = async () => {
      try {
        const res = await fetch(' /api/suppliers');
        if (res.ok) {
          const suppliersData = await res.json();
          setSuppliers(suppliersData);
        } else {
          throw new Error('Failed to fetch suppliers');
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };
    fetchSuppliers();
  }, [dateFilter]); // Refetch invoices when filter changes

  useEffect(() => {
    const searchProducts = async () => {
      if (productSearch.length > 2) {
        try {
          const response = await fetch(` /api/products?search=${encodeURIComponent(productSearch)}`);
          if (response.ok) {
            const results = await response.json();
            setSearchResults(results.slice(0, 5));
          }
        } catch (error) {
          console.error('Error searching products:', error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };
    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [productSearch]);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-green-500 text-white',
      sent: 'bg-blue-500 text-white',
      draft: 'bg-yellow-500 text-white',
      overdue: 'bg-red-500 text-white'
    };
    const labels = {
      paid: language === 'ar' ? 'مدفوع' : 'Payée',
      sent: language === 'ar' ? 'مرسلة' : 'Envoyée',
      draft: language === 'ar' ? 'مسودة' : 'Brouillon',
      overdue: language === 'ar' ? 'متأخرة' : 'En retard'
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-500 text-white'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const selectProduct = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.productId === product.id);
    if (existingItem) {
      toast({
        title: language === 'ar' ? "تحذير" : "Attention",
        description: language === 'ar' ? "هذا المنتج موجود بالفعل في الفاتورة." : "Ce produit est déjà ajouté à la facture.",
        variant: "destructive"
      });
      return;
    }

    const newItem: InvoiceItem = {
      id: `new-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      purchasePrice: product.buying_price || 0,
      marginPercent: product.margin_percent || 0,
      sellingPrice: product.selling_price || 0,
      quantity: 1,
      minQuantity: product.min_quantity || 0,
      total: (product.buying_price || 0) * 1
    };
    
    setSelectedProducts(prev => [...prev, newItem]);
    setProductSearch('');
    setSearchResults([]);
  };

  const updateItemField = (itemId: string | number, field: keyof InvoiceItem, value: number) => {
    setSelectedProducts(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          if (field === 'purchasePrice') {
            updatedItem.sellingPrice = updatedItem.purchasePrice * (1 + updatedItem.marginPercent / 100);
          } else if (field === 'marginPercent') {
            updatedItem.sellingPrice = updatedItem.purchasePrice * (1 + updatedItem.marginPercent / 100);
          } else if (field === 'sellingPrice' && updatedItem.purchasePrice > 0) {
            updatedItem.marginPercent = ((updatedItem.sellingPrice - updatedItem.purchasePrice) / updatedItem.purchasePrice) * 100;
          }
          
          updatedItem.total = updatedItem.purchasePrice * updatedItem.quantity;
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string | number) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal;
    return { subtotal, total };
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setSelectedSupplier('');
    setIsCreatingPurchaseInvoice(false);
    setIsEditingInvoice(false);
    setProductSearch('');
    setSelectedInvoice(null);
  };

  const createPurchaseInvoice = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "يجب إضافة منتج واحد على الأقل." : "Veuillez ajouter au moins un produit.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedSupplier) {
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "يجب اختيار مورد." : "Veuillez sélectionner un fournisseur.",
        variant: "destructive"
      });
      return;
    }

    try {
      const supplierName = suppliers.find(s => s.id === parseInt(selectedSupplier))?.name || '';

const invoiceData = {
  type: 'purchase',
  supplierId: parseInt(selectedSupplier, 10),
  total: calculateTotals().total,
  amount_paid: 0,
  items: selectedProducts.map(item => ({
    // Map to real product id/name:
    id: item.productId,
    name: item.productName,
    product_id: item.productId,
    product_name: item.productName,

    barcode: item.barcode,
    purchase_price: item.purchasePrice ?? 0,
    buying_price: item.purchasePrice ?? 0,      // for server variants
    margin_percent: item.marginPercent ?? 0,
    selling_price: item.sellingPrice ?? 0,
    quantity: item.quantity,
    min_quantity: item.minQuantity ?? 0,
    total: item.total,

    supplier: supplierName
  }))
};


      const invoiceResponse = await fetch(' /api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (!invoiceResponse.ok) {
        throw new Error('Failed to create invoice');
      }

      toast({
        title: language === 'ar' ? "تم الحفظ" : "Facture d'achat créée",
        description: language === 'ar' ? "تم إنشاء فاتورة الشراء بنجاح." : "Facture d'achat créée avec succès.",
      });

      fetchInvoices(dateFilter);
      fetchStats();
      resetForm();
    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "فشل في إنشاء الفاتورة." : "Échec de la création de la facture.",
        variant: "destructive"
      });
    }
  };

  const deleteInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(` /api/invoices/${invoiceId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast({
          title: language === 'ar' ? "تم الحذف" : "Supprimée",
          description: language === 'ar' ? "تم حذف الفاتورة بنجاح." : "Facture supprimée avec succès.",
        });
        fetchInvoices(dateFilter);
        fetchStats();
      } else {
        throw new Error('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "فشل في حذف الفاتورة." : "Échec de la suppression de la facture.",
        variant: "destructive"
      });
    }
  };

  const viewInvoice = async (invoice: Invoice) => {
  try {
    const response = await fetch(` /api/invoices/${invoice.id}`);
    if (response.ok) {
      const fullInvoice = await response.json();

      // 🔥 Map DB snake_case fields → camelCase fields
      const mappedInvoice = {
        ...fullInvoice,
        items: fullInvoice.items.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          barcode: item.barcode,
          purchasePrice: item.purchase_price,
          marginPercent: item.margin_percent,
          sellingPrice: item.selling_price,
          quantity: item.quantity,
          minQuantity: item.min_quantity,
          total: item.total
        }))
      };

      setSelectedInvoice(mappedInvoice);
      setIsViewingInvoice(true);
    } else {
      throw new Error('Failed to fetch invoice details');
    }
  } catch (error) {
    toast({
      title: language === 'ar' ? "خطأ" : "Erreur",
      description: language === 'ar' ? "فشل في عرض تفاصيل الفاتورة." : "Échec de l'affichage des détails de la facture.",
      variant: "destructive"
    });
  }
};


  const editInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch(` /api/invoices/${invoice.id}`);
      if (response.ok) {
        const fullInvoice = await response.json();
        setSelectedProducts(fullInvoice.items.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          barcode: item.barcode,
          purchasePrice: item.purchase_price,
          marginPercent: item.margin_percent,
          sellingPrice: item.selling_price,
          quantity: item.quantity,
          minQuantity: item.min_quantity,
          total: item.total
        })));
        setSelectedSupplier(fullInvoice.supplierId.toString());
        setSelectedInvoice(fullInvoice);
        setIsEditingInvoice(true);
      } else {
        throw new Error('Failed to fetch invoice details for editing');
      }
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "فشل في تحميل الفاتورة للتعديل." : "Échec du chargement de la facture pour édition.",
        variant: "destructive"
      });
    }
  };

  const updateInvoice = async () => {
    if (!selectedInvoice?.id || selectedProducts.length === 0 || !selectedSupplier) {
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة." : "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    try {
      const supplierName = suppliers.find(s => s.id === parseInt(selectedSupplier))?.name || '';

      const invoiceData = {
        type: 'purchase',
        supplierId: parseInt(selectedSupplier),
        total: calculateTotals().total,
        items: selectedProducts.map(item => ({
          ...item,
          supplier: supplierName
        }))
      };

      const invoiceResponse = await fetch(` /api/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      
      if (!invoiceResponse.ok) {
        throw new Error('Failed to update invoice');
      }
      
      toast({
        title: language === 'ar' ? "تم التحديث" : "Facture mise à jour",
        description: language === 'ar' ? "تم تحديث الفاتورة بنجاح." : "Facture mise à jour avec succès.",
      });
      fetchInvoices(dateFilter);
      fetchStats();
      resetForm();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "فشل في تحديث الفاتورة." : "Échec de la mise à jour de la facture.",
        variant: "destructive"
      });
    }
  };

  const printInvoice = () => {
    const printContent = document.getElementById('invoice-print-content');
    if (printContent && selectedInvoice) {
      const invoiceType = selectedInvoice.type === 'purchase' ? (language === 'ar' ? 'فاتورة شراء' : 'Facture d\'Achat') : (language === 'ar' ? 'فاتورة بيع' : 'Facture de Vente');
      const invoiceDate = formatDate(selectedInvoice.created_at);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${invoiceType} #${selectedInvoice.id}</title>
              <style>
                body { font-family: 'Inter', sans-serif; margin: 20px; color: #333; }
                .print-container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
                .invoice-header-print { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 15px; }
                .store-logo-title-print { display: flex; align-items: center; gap: 10px; }
                .logo-circle-print { width: 40px; height: 40px; border-radius: 50%; background-color: #007bff; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .logo-circle-print svg { width: 24px; height: 24px; }
                .store-name-print { font-size: 22px; font-weight: bold; color: #333; margin: 0; }
                .invoice-meta-print { text-align: right; }
                .invoice-meta-print h2 { font-size: 20px; margin-bottom: 5px; color: #555; }
                .invoice-meta-print p { margin: 0; font-size: 14px; color: #777; }
                .detail-item label { font-weight: bold; color: #555; display: block; margin-bottom: 3px; }
                .detail-item p { margin: 0; font-size: 16px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #e0e0e0; padding: 10px 12px; text-align: left; }
                th { background-color: #f8f8f8; font-weight: bold; color: #555; }
                td { font-size: 15px; color: #444; }
                .text-right { text-align: right; }
                .font-semibold { font-weight: 600; }
                .text-primary { color: #007bff; }
                .total-summary { display: flex; justify-content: flex-end; margin-top: 30px; }
                .total-box { border-top: 2px solid #ddd; padding-top: 15px; width: 100%; max-width: 250px; }
                .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .total-line span:first-child { color: #555; }
                .total-line span:last-child { font-weight: bold; color: #333; }
                .final-total { font-size: 1.4em; font-weight: bold; color: #007bff; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px; }
                @media print { body { margin: 0; } .print-container { border: none; box-shadow: none; } }
              </style>
            </head>
            <body>
              <div class="print-container">
                <div class="invoice-header-print">
                  <div class="store-logo-title-print">
                      <div class="logo-circle-print">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.3 16.8 10 15 10s-3.7.3-4.5.6c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M14 17H4V5l3-4h7l3 4v2"/><path d="M7 9h11"/></svg>
                      </div>
                      <h1 class="store-name-print">Nasser AUTO PIECES</h1>
                  </div>
                  <div class="invoice-meta-print">
                    <h2>${invoiceType} - #${selectedInvoice.id}</h2>
                    <p>${invoiceDate}</p>
                  </div>
                </div>
                ${printContent.innerHTML}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.onafterprint = () => printWindow.close();
      }
    } else if (!selectedInvoice) {
      toast({
        title: language === 'ar' ? "خطأ" : "Erreur",
        description: language === 'ar' ? "يرجى تحديد فاتورة للطباعة." : "Veuillez sélectionner une facture à imprimer.",
        variant: "destructive"
      });
    }
  };
  
  const text = {
    fr: {
      title: "Gestion des Factures",
      subtitle: "Créez et gérez vos factures d'achat",
      newPurchaseInvoice: "Nouvelle Facture d'Achat",
      searchPlaceholder: "Rechercher par numéro de facture...",
      allStatus: "Tous statuts",
      invoicesList: "Liste des Factures",
      createPurchaseInvoice: "Créer une Facture d'Achat",
      editPurchaseInvoice: "Modifier la Facture d'Achat",
      selectSupplier: "Sélectionner un Fournisseur",
      searchProducts: "Rechercher par nom ou code-barres...",
      addProducts: "Ajouter des Produits",
      product: "Produit",
      barcode: "Code-barres",
      purchasePrice: "Prix d'achat",
      margin: "Marge %",
      sellingPrice: "Prix de vente",
      quantity: "Qté initiale",
      minQuantity: "Qté minimale",
      total: "Total",
      subtotal: "Sous-total",
      totalAmount: "Total",
      create: "Créer",
      cancel: "Annuler",
      save: "Enregistrer",
      remove: "Supprimer",
      view: "Voir",
      edit: "Modifier",
      print: "Imprimer",
      delete: "Supprimer",
      supplier: "Fournisseur",
      date: "Date",
      status: "Statut",
      actions: "Actions",
      invoiceDetails: "Détails de la Facture",
      totalProducts: "Total Produits",
      currentQuantity: "Qté actuelle",
      invoicesToday: "Factures Aujourd'hui",
      invoicesThisMonth: "Factures Ce Mois",
      totalPurchases: "Total Achats",
      today: "Aujourd'hui",
      thisMonth: "Ce Mois",
      allInvoices: "Toutes les Factures"
    },
    ar: {
      title: "إدارة الفواتير",  
      subtitle: "إنشاء وإدارة فواتير الشراء",
      newPurchaseInvoice: "فاتورة شراء جديدة",
      searchPlaceholder: "البحث برقم الفاتورة...",
      allStatus: "جميع الحالات",
      invoicesList: "قائمة الفواتير",
      createPurchaseInvoice: "إنشاء فاتورة شراء",
      editPurchaseInvoice: "تعديل فاتورة الشراء",
      selectSupplier: "اختر مورد",
      searchProducts: "البحث بالاسم أو الباركود...",
      addProducts: "إضافة المنتجات",
      product: "المنتج",
      barcode: "الباركود",
      purchasePrice: "سعر الشراء",
      margin: "الهامش %",
      sellingPrice: "سعر البيع",
      quantity: "الكمية الأولية",
      minQuantity: "الحد الأدنى",
      total: "المجموع",
      subtotal: "المجموع الفرعي",
      totalAmount: "المجموع الإجمالي",
      create: "إنشاء",
      cancel: "إلغاء", 
      save: "حفظ",
      remove: "حذف",
      view: "عرض",
      edit: "تعديل",
      print: "طباعة",
      delete: "حذف",
      supplier: "المورد",
      date: "التاريخ",
      status: "الحالة",
      actions: "الإجراءات",
      invoiceDetails: "تفاصيل الفاتورة",
      totalProducts: "إجمالي المنتجات",
      currentQuantity: "الكمية الحالية",
      invoicesToday: "فواتير اليوم",
      invoicesThisMonth: "فواتير هذا الشهر",
      totalPurchases: "إجمالي المشتريات",
      today: "اليوم",
      thisMonth: "هذا الشهر",
      allInvoices: "كل الفواتير"
    }
  };
  const getText = text[language] || text.fr;

  return (
    <div className={`space-y-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          
          <h2 className="text-3xl font-bold text-gradient">{getText.title}</h2>
          <p className="text-muted-foreground">{getText.subtitle}</p>
        </div>
        <Button 
          className="gradient-primary text-primary-foreground transition-transform duration-300 ease-in-out hover:scale-105"
          onClick={() => setIsCreatingPurchaseInvoice(true)}
        >
          <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
          {getText.newPurchaseInvoice}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {getText.totalPurchases}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalPurchaseAmount || 0)}</div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {getText.invoicesToday}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalToday || 0}</div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {getText.invoicesThisMonth}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalThisMonth || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                type="text"
                placeholder={getText.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} search-input`}
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={getText.allInvoices} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getText.allInvoices}</SelectItem>
                <SelectItem value="today">{getText.today}</SelectItem>
                <SelectItem value="this_month">{getText.thisMonth}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>{getText.invoicesList}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'رقم الفاتورة' : 'N° Facture'}</TableHead>
                  <TableHead>{getText.product}</TableHead>
                  <TableHead>{getText.supplier}</TableHead>
                  <TableHead>{getText.date}</TableHead>
                  <TableHead>{language === 'ar' ? 'المبلغ' : 'Montant'}</TableHead>
                  <TableHead className="text-right">{getText.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {invoices.map((invoice) => (
                    <motion.tr 
                      key={invoice.id} 
                      className="hover:bg-muted/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TableCell className="font-mono font-medium">#{invoice.id}</TableCell>
                      <TableCell className="font-medium">{invoice.productNames || '-'}</TableCell>

                      <TableCell>
                        {suppliers.find(s => s.id === invoice.supplierId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{formatDate(invoice.created_at)}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => viewInvoice(invoice)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => editInvoice(invoice)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteInvoice(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreatingPurchaseInvoice} onOpenChange={setIsCreatingPurchaseInvoice}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle>{getText.createPurchaseInvoice}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-6">
              <div>
                <Label>{getText.selectSupplier}</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder={getText.selectSupplier} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Label>{getText.searchProducts}</Label>
                <div className="relative">
                  <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={getText.searchProducts}
                    className={`${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
                {searchResults.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <CardContent className="p-2">
                      {searchResults.map(product => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-muted rounded cursor-pointer flex justify-between items-center transition-colors duration-200"
                          onClick={() => selectProduct(product)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.barcode} • {product.brand}
                            </div>
                          </div>
                          <div className="text-sm text-primary font-medium">
                            {formatCurrency(product.buying_price)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {selectedProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{getText.addProducts}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{getText.product}</TableHead>
                          <TableHead>{getText.purchasePrice}</TableHead>
                          <TableHead>{getText.margin}</TableHead>
                          <TableHead>{getText.sellingPrice}</TableHead>
                          <TableHead>{getText.quantity}</TableHead>
                          <TableHead>{getText.minQuantity}</TableHead>
                          <TableHead className="text-right">{getText.total}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {selectedProducts.map((item) => (
                            <motion.tr 
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              <TableCell className="font-medium max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">{item.productName}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.purchasePrice}
                                  onChange={(e) => updateItemField(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={item.marginPercent}
                                  onChange={(e) => updateItemField(item.id, 'marginPercent', parseFloat(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.sellingPrice.toFixed(2)}
                                  onChange={(e) => updateItemField(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.minQuantity}
                                  onChange={(e) => updateItemField(item.id, 'minQuantity', parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell className="font-semibold text-right">
                                {formatCurrency(item.total)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              {selectedProducts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2 max-w-sm ml-auto">
                      <div className="flex justify-between">
                        <span>{getText.subtotal}:</span>
                        <span className="font-semibold">{formatCurrency(calculateTotals().subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>{getText.totalAmount}:</span>
                        <span className="text-primary">{formatCurrency(calculateTotals().total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              {getText.cancel}
            </Button>
            <Button onClick={createPurchaseInvoice} className="gradient-primary text-primary-foreground">
              {getText.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditingInvoice} onOpenChange={setIsEditingInvoice}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle>{getText.editPurchaseInvoice} #{selectedInvoice?.id}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-6">
              <div>
                <Label>{getText.selectSupplier}</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder={getText.selectSupplier} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Label>{getText.searchProducts}</Label>
                <div className="relative">
                  <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={getText.searchProducts}
                    className={`${isRTL ? 'pr-10' : 'pl-10'}`}
                  />
                </div>
                {searchResults.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <CardContent className="p-2">
                      {searchResults.map(product => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-muted rounded cursor-pointer flex justify-between items-center transition-colors duration-200"
                          onClick={() => selectProduct(product)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.barcode} • {product.brand}
                            </div>
                          </div>
                          <div className="text-sm text-primary font-medium">
                            {formatCurrency(product.buying_price)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {selectedProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{getText.addProducts}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{getText.product}</TableHead>
                          <TableHead>{getText.purchasePrice}</TableHead>
                          <TableHead>{getText.margin}</TableHead>
                          <TableHead>{getText.sellingPrice}</TableHead>
                          <TableHead>{getText.quantity}</TableHead>
                          <TableHead>{getText.minQuantity}</TableHead>
                          <TableHead className="text-right">{getText.total}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {selectedProducts.map((item) => (
                            <motion.tr 
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                            >
                              <TableCell className="font-medium max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">{item.productName}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.purchasePrice}
                                  onChange={(e) => updateItemField(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={item.marginPercent}
                                  onChange={(e) => updateItemField(item.id, 'marginPercent', parseFloat(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.sellingPrice.toFixed(2)}
                                  onChange={(e) => updateItemField(item.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemField(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.minQuantity}
                                  onChange={(e) => updateItemField(item.id, 'minQuantity', parseInt(e.target.value) || 0)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell className="font-semibold text-right">
                                {formatCurrency(item.total)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(item.id)}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              {selectedProducts.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-2 max-w-sm ml-auto">
                      <div className="flex justify-between">
                        <span>{getText.subtotal}:</span>
                        <span className="font-semibold">{formatCurrency(calculateTotals().subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>{getText.totalAmount}:</span>
                        <span className="text-primary">{formatCurrency(calculateTotals().total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              {getText.cancel}
            </Button>
            <Button onClick={updateInvoice} className="gradient-primary text-primary-foreground">
              {getText.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingInvoice} onOpenChange={setIsViewingInvoice}>
        <DialogContent id="invoice-dialog-content" className="max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle>{getText.invoiceDetails} #{selectedInvoice?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedInvoice && (
            <div id="invoice-print-content" className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="detail-item">
                  <Label>{getText.supplier}</Label>
                  <p className="font-medium">
                    {suppliers.find(s => s.id === selectedInvoice.supplierId)?.name || 'Unknown'}
                  </p>
                </div>
                <div className="detail-item">
                  <Label>{getText.date}</Label>
                  <p className="font-medium">{formatDate(selectedInvoice.created_at)}</p>
                </div>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>{getText.addProducts}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{getText.product}</TableHead>
                        <TableHead>{getText.purchasePrice}</TableHead>
                        <TableHead>{getText.margin}</TableHead>
                        <TableHead>{getText.sellingPrice}</TableHead>
                        <TableHead>{getText.quantity}</TableHead>
                        <TableHead>{getText.minQuantity}</TableHead>
                        <TableHead className="text-right">{getText.total}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice?.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                          <TableCell>{item.marginPercent}%</TableCell>
                          <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.minQuantity}</TableCell>
                          <TableCell className="font-semibold text-right">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <div className="flex justify-end pt-4">
                <div className="space-y-2">
                  <div className="text-lg font-bold">
                    <span>{getText.totalAmount}: </span>
                    <span className="text-primary">{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewingInvoice(false)}>
              {getText.cancel}
            </Button>
            <Button onClick={printInvoice}>
              <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {getText.print}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
