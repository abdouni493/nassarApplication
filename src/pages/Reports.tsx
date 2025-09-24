import { useState, useEffect } from 'react';
import {
  Download,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  FileText,
  Eye,
  RefreshCw,
  Clock,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';

// --- Type Definitions ---
interface ReportData {
  id: number;
  name: string;
  type: 'sales' | 'purchases' | 'inventory' | 'financial' | 'employees';
  period_start: string;
  period_end: string;
  generated_at: string;
  status: 'completed' | 'processing' | 'error';
  size: string;
  creator: string;
}

interface TodayStats {
  totalSales: number;
  totalPurchases: number;
  salesCount: number;
  purchasesCount: number;
  profit: number;
}

interface GeneralStats {
  totalRevenue: number;
  totalExpenses: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalSuppliers: number;
  netProfit: number;
}

interface Transaction {
  id: number;
  type: 'sale' | 'purchase';
  entityName: string;
  total: number;
  amount_paid: number;
  status: 'paid' | 'pending' | 'partial';
  created_at: string;
}

// Assumed Report Details interface, could be anything really
interface ReportDetails {
  id: number;
  name: string;
  period: string;
  type: string;
  creator: string;
  summary: string;
  data: any; // Simplified for this example
}

export default function Reports() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('sales');
  const [customPeriod, setCustomPeriod] = useState('today');
  const [isReportDetailsModalOpen, setIsReportDetailsModalOpen] = useState(false);
  const [selectedReportDetails, setSelectedReportDetails] = useState<ReportDetails | null>(null);
  const API_URL = ' /api';

  const fetchReportsData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, transactionsRes, reportsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`),
        fetch(`${API_URL}/reports/today_transactions`),
        fetch(`${API_URL}/reports`),
      ]);
      const statsData = await statsRes.json();
      const transactionsData = await transactionsRes.json();
      const reportsData = await reportsRes.json();
      setTodayStats(statsData.todayStats);
      setGeneralStats(statsData.generalStats);
      setTodayTransactions(transactionsData);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل بيانات التقرير. يرجى التحقق من أن الخادم يعمل.' : 'Échec du chargement des données de rapport. Veuillez vérifier que le serveur est bien démarré.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD'
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString(language === 'ar' ? 'ar-DZ' : 'fr-DZ');

  const generateReport = async () => {
    const newReport = {
      name: `${language === 'ar' ? 'تقرير' : 'Rapport'} ${getReportTypeLabel(reportType)} - ${language === 'ar' ? 'من' : 'du'} ${formatDate(selectedDateRange.start)} ${language === 'ar' ? 'إلى' : 'au'} ${formatDate(selectedDateRange.end)}`,
      type: reportType,
      period: `${selectedDateRange.start}_${selectedDateRange.end}`,
      generatedAt: new Date().toISOString(),
      status: 'processing',
      size: language === 'ar' ? 'جارٍ العمل...' : 'En cours...'
    };

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'admin@Nasser.ma',
        },
        body: JSON.stringify(newReport),
      });

      if (res.ok) {
        const addedReport = await res.json();
        setReports(prev => [addedReport, ...prev]);
        setTimeout(() => {
          setReports(prev => prev.map(report =>
            report.id === addedReport.id
              ? { ...report, status: 'completed', size: `${(Math.random() * 3 + 1).toFixed(1)} MB` }
              : report
          ));
        }, 3000);
      } else {
        console.error('Failed to generate report on server');
        toast({
          title: language === 'ar' ? 'خطأ في الإنشاء' : 'Erreur de génération',
          description: language === 'ar' ? 'فشل في إنشاء التقرير على الخادم.' : 'Échec de la génération du rapport sur le serveur.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إنشاء التقرير بسبب خطأ في الاتصال.' : 'Échec de la génération du rapport en raison d\'une erreur de connexion.',
        variant: 'destructive',
      });
    }
  };

  const fetchReportDetails = async (reportId: number) => {
    // This is a placeholder for a real API call
    console.log(`Fetching details for report ID: ${reportId}`);
    try {
      // In a real app, you would fetch from an endpoint like /api/reports/:id
      // const res = await fetch(`${API_URL}/reports/${reportId}`);
      // const data = await res.json();
      const mockDetails = {
        id: reportId,
        name: `${language === 'ar' ? 'تقرير المبيعات' : 'Rapport des ventes'} (ID: ${reportId})`,
        period: '01/01/2024 - 31/01/2024',
        type: language === 'ar' ? 'المبيعات' : 'Ventes',
        creator: 'admin@Nasser.ma',
        summary: language === 'ar' ? 'ملخص مفصل للمبيعات للفترة المحددة، يشمل المنتجات الأكثر مبيعًا وأهم العملاء.' : 'Un résumé détaillé des ventes pour la période spécifiée, incluant les produits les plus vendus et les clients les plus importants.',
        data: {
          totalSales: 54000,
          totalItemsSold: 250,
          topProducts: ['Laptop', 'Souris', 'Clavier'],
        }
      };
      setSelectedReportDetails(mockDetails);
      setIsReportDetailsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch report details:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في استرداد تفاصيل التقرير.' : 'Échec de la récupération des détails du rapport.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReport = (reportId: number) => {
    // Placeholder function for downloading the report
    console.log(`Downloading report with ID: ${reportId}`);
    toast({
      title: language === 'ar' ? 'تحميل' : 'Téléchargement',
      description: `${language === 'ar' ? 'يتم الآن تنزيل التقرير' : 'Le rapport'} ${reportId} ${language === 'ar' ? '.' : 'est en cours de téléchargement.'}`,
    });
  };

  const getReportTypeLabel = (type: string) => {
    const labels = {
      sales: language === 'ar' ? 'مبيعات' : 'Ventes',
      purchases: language === 'ar' ? 'مشتريات' : 'Achats',
      inventory: language === 'ar' ? 'المخزون' : 'Inventaire',
      financial: language === 'ar' ? 'مالي' : 'Financier',
      employees: language === 'ar' ? 'موظفين' : 'Employés'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: ReportData['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success text-success-foreground">{language === 'ar' ? 'مكتمل' : 'Terminé'}</Badge>;
      case 'processing':
        return <Badge className="bg-warning text-warning-foreground">{language === 'ar' ? 'قيد المعالجة' : 'En cours'}</Badge>;
      case 'error':
        return <Badge className="bg-destructive text-destructive-foreground">{language === 'ar' ? 'خطأ' : 'Erreur'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const quickDateRanges = {
    today: {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: language === 'ar' ? 'اليوم' : 'Aujourd\'hui'
    },
    yesterday: {
      start: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      end: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      label: language === 'ar' ? 'أمس' : 'Hier'
    },
    thisWeek: {
      start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: language === 'ar' ? 'هذا الأسبوع' : 'Cette semaine'
    },
    thisMonth: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      label: language === 'ar' ? 'هذا الشهر' : 'Ce mois'
    },
    lastMonth: {
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0],
      label: language === 'ar' ? 'الشهر الماضي' : 'Mois dernier'
    }
  };

  // Ensure that stats data is available before rendering
  if (!todayStats || !generalStats || isLoading) {
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
          <h1 className="text-3xl font-bold text-gradient">{language === 'ar' ? 'التقارير والتحليلات' : 'Rapports & Analyses'}</h1>
          <p className="text-muted-foreground">{language === 'ar' ? 'أنشئ واعرض تقاريرك المفصلة' : 'Générez et consultez vos rapports détaillés'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReportsData}>
            <RefreshCw className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {language === 'ar' ? 'تحديث' : 'Actualiser'}
          </Button>
          <Button className="gradient-primary text-primary-foreground" onClick={generateReport}>
            <FileText className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
            {language === 'ar' ? 'إنشاء تقرير' : 'Générer Rapport'}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">{language === 'ar' ? 'اليوم' : 'Aujourd\'hui'}</TabsTrigger>
          <TabsTrigger value="generate">{language === 'ar' ? 'إنشاء تقرير' : 'Générer Rapport'}</TabsTrigger>
          <TabsTrigger value="history">{language === 'ar' ? 'السجل' : 'Historique'}</TabsTrigger>
          <TabsTrigger value="analytics">{language === 'ar' ? 'التحليلات' : 'Analyses'}</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="space-y-6">
          {/* Today's Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="stat-card gradient-success text-success-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'مبيعات اليوم' : 'Ventes Aujourd\'hui'}</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(todayStats.totalSales)}</div>
                <p className="text-xs">{todayStats.salesCount} {language === 'ar' ? 'معاملة' : 'transactions'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card gradient-warning text-warning-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'مشتريات اليوم' : 'Achats Aujourd\'hui'}</CardTitle>
                <Package className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(todayStats.totalPurchases)}</div>
                <p className="text-xs">{todayStats.purchasesCount} {language === 'ar' ? 'فاتورة' : 'factures'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card gradient-primary text-primary-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'ربح اليوم' : 'Profit Aujourd\'hui'}</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(todayStats.profit)}</div>
                <p className="text-xs">{language === 'ar' ? 'صافي الربح' : 'Bénéfice net'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'مخزون منخفض' : 'Stock Bas'}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{generalStats.lowStockCount}</div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'منتجات' : 'Produits'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الوقت الحالي' : 'Heure Actuelle'}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date().toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(new Date().toISOString())}</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Transactions */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'معاملات اليوم' : 'Transactions d\'Aujourd\'hui'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'رقم الفاتورة' : 'N° Facture'}</TableHead>
                    <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{language === 'ar' ? 'العميل/المورد' : 'Client/Fournisseur'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الإجمالي' : 'Montant'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحالة' : 'Statut'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الوقت' : 'Heure'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayTransactions.length > 0 ? (
                    todayTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono">{transaction.id}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'sale' ? 'default' : 'secondary'}>
                            {transaction.type === 'sale' ? (language === 'ar' ? 'بيع' : 'Vente') : (language === 'ar' ? 'شراء' : 'Achat')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.entityName}
                        </TableCell>
                        <TableCell className="font-bold text-success">
                          {formatCurrency(transaction.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transaction.status === 'paid' ? 'default' : 'secondary'}
                            className={transaction.status === 'paid' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}
                          >
                            {transaction.status === 'paid' ? (language === 'ar' ? 'مدفوعة' : 'Payée') : (language === 'ar' ? 'قيد الانتظار' : 'En attente')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleTimeString(language === 'ar' ? 'ar-DZ' : 'fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                        {language === 'ar' ? 'لم يتم العثور على أي معاملات اليوم.' : 'Aucune transaction trouvée pour aujourd\'hui.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="generate" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'إنشاء تقرير جديد' : 'Générer Nouveau Rapport'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reportType">{language === 'ar' ? 'نوع التقرير' : 'Type de Rapport'}</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'ar' ? 'اختر النوع' : 'Sélectionner le type'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">{language === 'ar' ? 'تقرير المبيعات' : 'Rapport des Ventes'}</SelectItem>
                        <SelectItem value="purchases">{language === 'ar' ? 'تقرير المشتريات' : 'Rapport des Achats'}</SelectItem>
                        <SelectItem value="inventory">{language === 'ar' ? 'تقرير المخزون' : 'Rapport d\'Inventaire'}</SelectItem>
                        <SelectItem value="financial">{language === 'ar' ? 'تقرير مالي' : 'Rapport Financier'}</SelectItem>
                        <SelectItem value="employees">{language === 'ar' ? 'تقرير الموظفين' : 'Rapport des Employés'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{language === 'ar' ? 'فترة محددة مسبقًا' : 'Période Prédéfinie'}</Label>
                    <Select value={customPeriod} onValueChange={(value) => {
                      setCustomPeriod(value);
                      if (value !== 'custom') {
                        const range = quickDateRanges[value as keyof typeof quickDateRanges];
                        setSelectedDateRange({ start: range.start, end: range.end });
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(quickDateRanges).map(([key, range]) => (
                          <SelectItem key={key} value={key}>{range.label}</SelectItem>
                        ))}
                        <SelectItem value="custom">{language === 'ar' ? 'فترة مخصصة' : 'Période personnalisée'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">{language === 'ar' ? 'تاريخ البدء' : 'Date de Début'}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={selectedDateRange.start}
                      onChange={(e) => setSelectedDateRange({ ...selectedDateRange, start: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">{language === 'ar' ? 'تاريخ الانتهاء' : 'Date de Fin'}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={selectedDateRange.end}
                      onChange={(e) => setSelectedDateRange({ ...selectedDateRange, end: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={generateReport}
                  className="gradient-primary text-primary-foreground w-full md:w-auto"
                >
                  <FileText className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {language === 'ar' ? 'إنشاء التقرير' : 'Générer le Rapport'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>{language === 'ar' ? 'سجل التقارير' : 'Historique des Rapports'}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'اسم التقرير' : 'Nom du Rapport'}</TableHead>
                    <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الفترة' : 'Période'}</TableHead>
                    <TableHead>{language === 'ar' ? 'تم الإنشاء في' : 'Généré le'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحالة' : 'Statut'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحجم' : 'Taille'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المنشئ' : 'Créateur'}</TableHead>
                    <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length > 0 ? (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getReportTypeLabel(report.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.period_start} {language === 'ar' ? 'إلى' : 'au'} {report.period_end}</TableCell>
                        <TableCell>{formatDateTime(report.generated_at)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>{report.creator}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => fetchReportDetails(report.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.status === 'completed' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success"
                                onClick={() => handleDownloadReport(report.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                        {language === 'ar' ? 'لم يتم العثور على أي تقارير.' : 'Aucun rapport trouvé.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          {/* Global Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="stat-card gradient-success text-success-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الإيرادات' : 'Chiffre d\'Affaires Total'}</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(generalStats.totalRevenue)}</div>
                <p className="text-xs">{language === 'ar' ? 'جميع الفترات' : 'Toutes périodes'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card gradient-warning text-warning-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي المصروفات' : 'Dépenses Totales'}</CardTitle>
                <Package className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(generalStats.totalExpenses)}</div>
                <p className="text-xs">{language === 'ar' ? 'المشتريات والتكاليف' : 'Achats & charges'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card gradient-primary text-primary-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{language === 'ar' ? 'صافي الربح' : 'Bénéfice Net'}</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(generalStats.netProfit)}
                </div>
                <p className="text-xs">{language === 'ar' ? 'الربح الإجمالي' : 'Profit global'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Business Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'المنتجات' : 'Produits'}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generalStats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'في الكتالوج' : 'En catalogue'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'العملاء' : 'Clients'}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generalStats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'عملاء نشطون' : 'Clients actifs'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الموردين' : 'Fournisseurs'}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{generalStats.totalSuppliers}</div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'شركاء' : 'Partenaires'}</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'تنبيهات المخزون' : 'Alertes Stock'}</CardTitle>
                <Package className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{generalStats.lowStockCount}</div>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مخزون منخفض' : 'Stock bas'}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={isReportDetailsModalOpen} onOpenChange={setIsReportDetailsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'تفاصيل التقرير' : 'Détails du Rapport'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'نظرة عامة على معلومات التقرير المحدد.' : 'Aperçu des informations pour le rapport sélectionné.'}
            </DialogDescription>
          </DialogHeader>
          {selectedReportDetails && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="font-semibold">{language === 'ar' ? 'الاسم:' : 'Nom:'}</div>
                <div>{selectedReportDetails.name}</div>
                <div className="font-semibold">{language === 'ar' ? 'النوع:' : 'Type:'}</div>
                <div>{selectedReportDetails.type}</div>
                <div className="font-semibold">{language === 'ar' ? 'الفترة:' : 'Période:'}</div>
                <div>{selectedReportDetails.period}</div>
                <div className="font-semibold">{language === 'ar' ? 'المنشئ:' : 'Créateur:'}</div>
                <div>{selectedReportDetails.creator}</div>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">{language === 'ar' ? 'ملخص' : 'Résumé'}</h3>
                <p>{selectedReportDetails.summary}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
