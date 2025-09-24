import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Receipt,
  Eye,
  CreditCard,
  X,
  Check,
  Filter,
  Printer,
  Car,
  Trash2,
  User,
  Crown
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

// --- Type Definitions ---
interface Invoice {
 id: number;
  clientId: string | null;
  clientName?: string | null;
  total: number;
  amount_paid: number;
  created_at: string;
  createdBy: string;
  createdByType?: 'admin' | 'employee'; // ⬅️ add this
}

interface SalesStats {
  totalSalesAmount: number;
  totalTransactions: number;
  averageOrder: number;
  paidTransactions: number;
}

interface InvoiceDetails {
  id: number;
  clientId: string;
  total: number;
  amount_paid: number;
  created_at: string;
  items: {
    product_name: string;
    quantity: number;
    selling_price: number;
    total: number;
  }[];
}

const formatCurrencyLocal = (amount: number, language: string) =>
  new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    style: 'currency',
    currency: 'DZD'
  }).format(amount);

const formatDate = (dateString: string, language: string) =>
  new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');

// Separate component for the edit dialog
function EditInvoiceDialog({ isOpen, onClose, invoice, onUpdate }: {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onUpdate: (updatedInvoice: Invoice) => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [additionalPayment, setAdditionalPayment] = useState<number>(0);

  useEffect(() => {
    if (invoice) {
      setAdditionalPayment(0); // Reset additional payment when opening for a new invoice
    }
  }, [invoice]);

  const handleUpdate = async () => {
    if (!invoice) return;

    const newTotalPaid = invoice.amount_paid + additionalPayment;

    if (newTotalPaid < invoice.amount_paid) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'المبلغ المدفوع الجديد لا يمكن أن يكون أقل من المبلغ الحالي.' : 'Le nouveau montant payé ne peut pas être inférieur au montant actuel.',
        variant: 'destructive'
      });
      return;
    }
    if (newTotalPaid > invoice.total) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'المبلغ المدفوع الجديد لا يمكن أن يتجاوز إجمالي الفاتورة.' : 'Le nouveau montant payé ne peut pas dépasser le total de la facture.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(` /api/invoices/${invoice.id}/pay`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount_paid: additionalPayment }),
});


      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }

      const updatedInvoice = await response.json();
      onUpdate(updatedInvoice);
      onClose();
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Mis à jour',
        description: language === 'ar' ? 'تم تحديث الفاتورة بنجاح.' : 'Facture mise à jour avec succès.',
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحديث الفاتورة.' : 'Échec de la mise à jour de la facture.',
        variant: 'destructive'
      });
    }
  };

  const currentTotalPaidAfterAddition = (invoice?.amount_paid || 0) + additionalPayment;
  const remainingDebt = (invoice?.total || 0) - currentTotalPaidAfterAddition;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? `تعديل الفاتورة رقم ${invoice?.id}` : `Modifier la facture #${invoice?.id}`}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'يمكنك هنا إضافة دفعة جديدة للفاتورة.' : 'Vous pouvez ajouter un nouveau paiement à cette facture.'}
          </DialogDescription>
        </DialogHeader>
        {invoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'ar' ? 'الإجمالي' : 'Total'}</Label>
                <p className="text-lg font-bold">{formatCurrencyLocal(invoice.total, language)}</p>
              </div>
              <div>
                <Label>{language === 'ar' ? 'المبلغ المدفوع حاليا' : 'Montant déjà payé'}</Label>
                <p className="text-lg font-bold text-green-600">{formatCurrencyLocal(invoice.amount_paid, language)}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="additionalPayment">{language === 'ar' ? 'مبلغ إضافي للدفع' : 'Nouveau montant à ajouter'}</Label>
              <Input
                id="additionalPayment"
                type="number"
                value={additionalPayment}
                onChange={(e) => setAdditionalPayment(Number(e.target.value))}
                min="0"
                max={(invoice.total - invoice.amount_paid)} // Max additional payment is remaining debt
              />
            </div>

            <div className="flex justify-between items-center border-t pt-2">
                <Label>{language === 'ar' ? 'إجمالي المدفوع بعد الإضافة' : 'Total payé après ajout'}:</Label>
                <p className="text-lg font-bold text-blue-600">{formatCurrencyLocal(currentTotalPaidAfterAddition, language)}</p>
            </div>

            <div className="text-center text-xl font-bold">
              {language === 'ar' ? 'المبلغ المتبقي' : 'Dette restante'}:{' '}
              <span className="text-red-600">{formatCurrencyLocal(Math.max(0, remainingDebt), language)}</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'ar' ? 'إلغاء' : 'Annuler'}</Button>
          <Button
            onClick={handleUpdate}
            disabled={additionalPayment < 0 || currentTotalPaidAfterAddition > invoice?.total}
          >
            {language === 'ar' ? 'تحديث' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Separate component for the print dialog
function PrintInvoiceDialog({ isOpen, onClose, invoice }: {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceDetails | null;
}) {
  const { language } = useLanguage();

  const handlePrint = () => {
    if (!invoice) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceType = language === 'ar' ? 'فاتورة بيع' : 'Facture de Vente';
      const invoiceDate = new Date(invoice.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const clientDisplayedName = invoice.clientId || (language === 'ar' ? 'العميل عابر' : 'Client de passage');
      const debtAmount = invoice.total - invoice.amount_paid;
      const changeAmount = invoice.amount_paid - invoice.total;

      printWindow.document.write(`
        <html>
          <head>
            <title>${invoiceType} #${invoice.id}</title>
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
              .discount-line { color: #d9534f; }
              .debt-line { color: #d9534f; }
              .change-line { color: #28a745; }
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
                  <h2>${invoiceType} - #${invoice.id}</h2>
                  <p>${invoiceDate}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="detail-item">
                    <label>${language === 'ar' ? 'العميل' : 'Client'}:</label>
                    <p class="font-medium">${clientDisplayedName}</p>
                </div>

                <table class="w-full">
                  <thead>
                    <tr>
                      <th>${language === 'ar' ? 'المنتج' : 'Produit'}</th>
                      <th>${language === 'ar' ? 'الكمية' : 'Qté'}</th>
                      <th>${language === 'ar' ? 'السعر' : 'Prix Unitaire'}</th>
                      <th class="text-right">${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${invoice.items.map(item => `
                      <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrencyLocal(item.selling_price, language)}</td>
                        <td class="text-right">${formatCurrencyLocal(item.total, language)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="total-summary">
                  <div class="total-box">
                    <div class="total-line final-total">
                      <span>${language === 'ar' ? 'المبلغ الإجمالي' : 'Total Facture'}:</span>
                      <span>${formatCurrencyLocal(invoice.total, language)}</span>
                    </div>
                    
                    ${debtAmount > 0 ? `
                        <div class="total-line debt-line">
                            <span>${language === 'ar' ? 'المبلغ المتبقي' : 'Dette Restante'}:</span>
                            <span>${formatCurrencyLocal(debtAmount, language)}</span>
                        </div>
                    ` : ''}
                    ${changeAmount > 0 ? `
                        <div class="total-line change-line">
                            <span>${language === 'ar' ? 'المبلغ المسترجع' : 'Monnaie'}:</span>
                            <span>${formatCurrencyLocal(changeAmount, language)}</span>
                        </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'طباعة الفاتورة' : 'Imprimer la facture'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? `هل أنت متأكد من أنك تريد طباعة الفاتورة رقم ${invoice?.id}?` : `Êtes-vous sûr de vouloir imprimer la facture #${invoice?.id}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'ar' ? 'إلغاء' : 'Annuler'}</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'طباعة' : 'Imprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Separate component for delete confirmation
function DeleteInvoiceConfirmationDialog({ isOpen, onClose, invoiceId, onDeleteConfirm }: {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number | null;
  onDeleteConfirm: (id: number) => void;
}) {
  const { language } = useLanguage();

  const handleDelete = () => {
    if (invoiceId !== null) {
      onDeleteConfirm(invoiceId);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirmation de suppression'}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? `هل أنت متأكد أنك تريد حذف الفاتورة رقم ${invoiceId}? لا يمكن التراجع عن هذا الإجراء.` : `Êtes-vous sûr de vouloir supprimer la facture #${invoiceId}? Cette action est irréversible.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{language === 'ar' ? 'إلغاء' : 'Annuler'}</Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'حذف' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function Sales() {
  // ⬇️ who is logged in
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const isEmployee = currentUser?.role === 'employee';

  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]
);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [invoiceToPrint, setInvoiceToPrint] = useState<InvoiceDetails | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [invoiceToDeleteId, setInvoiceToDeleteId] = useState<number | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);


  const fetchSalesData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch(' /api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSalesStats({
          totalSalesAmount: statsData.todayStats.totalSales,
          totalTransactions: statsData.todayStats.salesCount,
          averageOrder: statsData.todayStats.totalSales / (statsData.todayStats.salesCount || 1),
          // Note: paidTransactions data is not available from this endpoint.
          // You may need to modify your backend to include it or calculate it client-side
          // by fetching all invoices and counting the paid ones.
          paidTransactions: 0,
        });
      } else {
        throw new Error('Failed to fetch sales stats');
      }

      // Fetch invoices with filters
      let invoicesUrl = ' /api/invoices?type=sale';
if (searchQuery) {
  invoicesUrl += `&search=${encodeURIComponent(searchQuery)}`;
}
if (filterStatus === 'debts') {
  invoicesUrl += `&status=debts`;
}
// ⬇️ workers only fetch their own invoices
if (isEmployee && currentUser?.id) {
  invoicesUrl += `&createdByType=employee&createdBy=${currentUser.id}`;
}


      const invoicesResponse = await fetch(invoicesUrl);
      if (invoicesResponse.ok) {
  const invoicesData = await invoicesResponse.json();

  // ✅ Normalize backend snake_case to camelCase
  const normalized: Invoice[] = invoicesData.map((inv: any) => ({
  id: inv.id,
  clientId: inv.client_id ?? null,
  clientName: inv.client_name ?? null,
  total: inv.total,
  amount_paid: inv.amount_paid,
  created_at: inv.created_at,
  createdByType: inv.created_by_type, // ⬅️ come from API
  createdBy:
    inv.created_by_display // unified alias (step 6)
    || inv.created_by_username
    || inv.created_by_email
    || inv.admin_username
    || inv.employee_username
    || inv.admin_email
    || inv.employee_email
    || 'N/A',
}));



  setSalesInvoices(normalized);
  const paidCount = normalized.filter(inv => (inv.total - inv.amount_paid) <= 0).length;
setSalesStats(prev => prev
  ? { ...prev, paidTransactions: paidCount }
  : {
      totalSalesAmount: 0,
      totalTransactions: normalized.length,
      averageOrder: 0,
      paidTransactions: paidCount
    }
);

} else {
  throw new Error('Failed to fetch sales invoices');
}

    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل بيانات المبيعات.' : 'Échec du chargement des données de vente.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSalesData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, filterStatus]);

  const handleUpdateInvoice = (updatedInvoice: Invoice) => {
    setSalesInvoices(prevInvoices =>
      prevInvoices.map(inv =>
        inv.id === updatedInvoice.id ? updatedInvoice : inv
      )
    );
    fetchSalesData(); // Re-fetch all data to ensure stats are updated
  };

  const handleOpenEditModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handlePrintInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(` /api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details for printing');
      }
      const invoiceData = await response.json();
      setInvoiceToPrint(invoiceData);
      setIsPrintModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice for printing:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل بيانات الفاتورة للطباعة.' : 'Échec du chargement des données de la facture pour l\'impression.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    try {
      const response = await fetch(` /api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Supprimée',
        description: language === 'ar' ? 'تم حذف الفاتورة بنجاح.' : 'Facture supprimée avec succès.',
      });
      fetchSalesData(); // Refresh data after deletion
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف الفاتورة.' : 'Échec de la suppression de la facture.',
        variant: 'destructive'
      });
    }
  };

  const openDeleteConfirmation = (invoiceId: number) => {
    setInvoiceToDeleteId(invoiceId);
    setIsDeleteConfirmationOpen(true);
  };


  const formatPercentage = (numerator: number, denominator: number) => {
    if (denominator === 0) return '0%';
    return `${Math.round((numerator / denominator) * 100)}%`;
  };

  return (
    <div className={`space-y-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            {language === 'ar' ? 'إدارة المبيعات' : 'Gestion des Ventes'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تحليل وإدارة مبيعاتك' : 'Analysez et gérez vos ventes'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {language === 'ar' ? 'تقرير' : 'Rapport'}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stat-card gradient-success text-success-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'رقم الأعمال' : 'Chiffre d\'Affaires'}
            </CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyLocal(salesStats?.totalSalesAmount || 0, language)}</div>
            <p className="text-xs flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12.5% {language === 'ar' ? 'هذا الشهر' : 'ce mois'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'المعاملات' : 'Transactions'}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesStats?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'إجمالي المبيعات' : 'Ventes totales'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === 'ar' ? 'متوسط السلة' : 'Panier Moyen'}
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyLocal(salesStats?.averageOrder || 0, language)}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'ar' ? 'لكل طلب' : 'Par commande'}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card gradient-primary text-primary-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'ar' ? 'نسبة الدفع' : 'Taux Paiement'}
            </CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(salesStats?.paidTransactions || 0, salesStats?.totalTransactions || 1)}
            </div>
            <p className="text-xs">
              {salesStats?.paidTransactions || 0}/{salesStats?.totalTransactions || 0} {language === 'ar' ? 'تم دفعها' : 'payées'}
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
                  placeholder={language === 'ar' ? 'البحث برقم الفاتورة أو اسم العميل...' : 'Rechercher par numéro de facture ou client...'}
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
                  <SelectItem value="all">{language === 'ar' ? 'كل الفواتير' : 'Toutes les factures'}</SelectItem>
                  <SelectItem value="debts">{language === 'ar' ? 'الديون' : 'Dettes'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sales Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'سجل المبيعات' : 'Historique des Ventes'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° {language === 'ar' ? 'الفاتورة' : 'Facture'}</TableHead>
                  <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead>{language === 'ar' ? 'العميل' : 'Client'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الحالة' : 'Statut'}</TableHead>
                  <TableHead>{language === 'ar' ? 'أنشأ بواسطة' : 'Créé par'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesInvoices.length > 0 ? (
                  salesInvoices.map((sale) => {
                    const remainingDebt = sale.total - sale.amount_paid;
                    const isPaid = remainingDebt <= 0;
                    return (
                      <TableRow key={sale.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">{sale.id}</TableCell>
                        <TableCell>{formatDate(sale.created_at, language)}</TableCell>
                        <TableCell className="font-medium">
  {sale.clientName || (language === 'ar' ? 'العميل عابر' : 'Client de passage')}
</TableCell>

                        <TableCell className="font-bold">{formatCurrencyLocal(sale.total, language)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={isPaid ? 'default' : 'secondary'}
                            className={isPaid ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}
                          >
                            {isPaid ? (language === 'ar' ? 'مدفوعة' : 'Payée') : (language === 'ar' ? 'دين' : 'Dette')}
                          </Badge>
                        </TableCell>
                       <TableCell className="flex items-center gap-2">
                          {sale.createdByType === 'admin' ? (
                            <>
                              <Crown className="w-4 h-4 text-purple-600" />
                              <span className="font-medium text-purple-600">{sale.createdBy}</span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-600">{sale.createdBy}</span>
                            </>
                          )}
                        </TableCell>



                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEditModal(sale)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePrintInvoice(sale.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {!isEmployee && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => openDeleteConfirmation(sale.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                      {language === 'ar' ? 'لا توجد فواتير مبيعات' : 'Aucune facture de vente trouvée.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <EditInvoiceDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        invoice={selectedInvoice}
        onUpdate={handleUpdateInvoice}
      />
      <PrintInvoiceDialog
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={invoiceToPrint}
      />
      <DeleteInvoiceConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        invoiceId={invoiceToDeleteId}
        onDeleteConfirm={handleDeleteInvoice}
      />
    </div>
  );
}
