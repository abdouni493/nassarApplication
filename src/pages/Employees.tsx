import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  User, 
  DollarSign, 
  Clock, 
  Shield,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Filter
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';

interface Employee {
  id: number;
  name: string;
  phone: string;
  role: 'admin' | 'employee';
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive';
  address: string;
  username: string;
  hasAccount: boolean;
  lastPayment?: {
    amount: number;
    date: string;
    type: 'salary' | 'bonus' | 'commission';
  };
}

interface Payment {
  id: number;
  employee_id: number;
  amount: number;
  date: string;
  type: 'salary' | 'bonus' | 'commission';
}

export default function Employees() {
  const { language, isRTL } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'payment'>('create');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'employee' as Employee['role'],
    salary: 0,
    address: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: 0,
    type: 'salary' as 'salary' | 'bonus' | 'commission',
    date: new Date().toISOString().split('T')[0]
  });

  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(' /api/employees');
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      setError(language === 'ar' ? 'فشل في جلب بيانات الموظفين. يرجى التحقق من اتصال الخادم.' : 'Failed to fetch employees. Please check the server connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentHistory = async (employeeId: number) => {
    try {
      const response = await axios.get(` /api/employees/${employeeId}/payments`);
      setPaymentHistory(response.data);
      setError(null);
    } catch (err) {
      setError(language === 'ar' ? 'فشل في جلب سجل الدفع.' : 'Failed to fetch payment history.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || employee.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { 
      style: 'currency', 
      currency: 'DZD' 
    }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR');

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'gradient-primary text-primary-foreground';
      case 'employee': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleCreateEmployee = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      phone: '',
      role: 'employee',
      salary: 0,
      address: '',
      username: '',
      password: '',
      confirmPassword: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogMode('edit');
    setFormData({
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
      salary: employee.salary,
      address: employee.address,
      username: employee.username,
      password: '',
      confirmPassword: ''
    });
    setIsDialogOpen(true);
  };

  const handlePayment = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDialogMode('payment');
    setPaymentData({
      amount: employee.salary,
      type: 'salary',
      date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleViewHistory = async (employee: Employee) => {
    setSelectedEmployee(employee);
    await fetchPaymentHistory(employee.id);
    setIsHistoryDialogOpen(true);
  };

  const handleDeleteEmployee = async (id: number) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من أنك تريد حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(` /api/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        setError(language === 'ar' ? 'فشل في حذف الموظف.' : 'Failed to delete employee.');
        console.error(err);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (dialogMode === 'create') {
        const newEmployeeData = {
          ...formData,
          hasAccount: formData.username && formData.password ? true : false
        };
        await axios.post(' /api/employees', newEmployeeData);
      } else if (dialogMode === 'edit' && selectedEmployee) {
        const updatedEmployeeData = {
          ...formData,
          hasAccount: formData.username && formData.password ? true : false
        };
        await axios.put(` /api/employees/${selectedEmployee.id}`, updatedEmployeeData);
      } else if (dialogMode === 'payment' && selectedEmployee) {
        await axios.post(` /api/employees/${selectedEmployee.id}/pay`, paymentData);
      }
      setIsDialogOpen(false);
      fetchEmployees();
    } catch (err) {
      setError(language === 'ar' ? 'فشل في حفظ بيانات الموظف.' : 'Failed to save employee data.');
      console.error(err);
    }
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const totalSalaryBudget = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const employeesWithAccounts = employees.filter(emp => emp.hasAccount).length;

  return (
    <div className={`space-y-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">{language === 'ar' ? 'إدارة الموظفين' : 'Gestion des Employés'}</h1>
          <p className="text-muted-foreground">{language === 'ar' ? 'إدارة فريقك وحسابات الوصول الخاصة بهم' : 'Gérez votre équipe et leurs comptes d\'accès'}</p>
        </div>
        <Button onClick={handleCreateEmployee} className="gradient-primary text-primary-foreground">
          <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
          {language === 'ar' ? 'موظف جديد' : 'Nouvel Employé'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stat-card gradient-primary text-primary-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'إجمالي الموظفين' : 'Total Employés'}</CardTitle>
            <User className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs">{activeEmployees} {language === 'ar' ? 'نشطين' : 'actifs'}</p>
          </CardContent>
        </Card>

        <Card className="stat-card gradient-success text-success-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'ميزانية الرواتب' : 'Budget Salaires'}</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSalaryBudget)}</div>
            <p className="text-xs">{language === 'ar' ? 'شهريا' : 'Par mois'}</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'الحسابات النشطة' : 'Comptes Actifs'}</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeesWithAccounts}</div>
            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'وصول للنظام' : 'Accès système'}</p>
          </CardContent>
        </Card>

        <Card className="stat-card gradient-warning text-warning-foreground [&_.text-2xl]:text-white [&_.text-sm]:text-white/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{language === 'ar' ? 'المدفوعات المعلقة' : 'Paiements en Attente'}</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            {/* This data should be dynamic */}
            <div className="text-2xl font-bold">2</div> 
            <p className="text-xs">{language === 'ar' ? 'للإنجاز' : 'À traiter'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
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
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'ar' ? 'الدور' : 'Rôle'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'جميع الأدوار' : 'Tous les rôles'}</SelectItem>
                <SelectItem value="admin">{language === 'ar' ? 'مسؤول' : 'Administrateur'}</SelectItem>
                <SelectItem value="employee">{language === 'ar' ? 'موظف' : 'Employé'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة الموظفين' : 'Liste des Employés'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{language === 'ar' ? 'جارٍ التحميل...' : 'Chargement...'}</div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الموظف' : 'Employé'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الدور' : 'Rôle'}</TableHead>
                  <TableHead>{language === 'ar' ? 'الراتب' : 'Salaire'}</TableHead>
                  <TableHead>{language === 'ar' ? 'تاريخ التوظيف' : 'Date d\'embauche'}</TableHead>
                  <TableHead>{language === 'ar' ? 'آخر دفعة' : 'Dernier Paiement'}</TableHead>
                  <TableHead className="text-right">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {employee.role === 'admin' ? (language === 'ar' ? 'مسؤول' : 'Administrateur') : (language === 'ar' ? 'موظف' : 'Employé')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-success">
                      {formatCurrency(employee.salary)}
                    </TableCell>
                    <TableCell>{formatDate(employee.hireDate)}</TableCell>
                    <TableCell>
                      {employee.lastPayment && employee.lastPayment.amount > 0 ? (
                        <div className="text-sm">
                          <div className="font-medium text-success">
                            {formatCurrency(employee.lastPayment.amount)}
                          </div>
                          <div className="text-muted-foreground">
                            {formatDate(employee.lastPayment.date)}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-warning">
                          {language === 'ar' ? 'لا توجد مدفوعات' : 'Aucun paiement'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(employee)}
                          className="h-8 w-8 text-primary hover:text-primary"
                          title={language === 'ar' ? 'سجل الدفع' : 'Historique de paiements'}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePayment(employee)}
                          className="h-8 w-8 text-success hover:text-success"
                          title={language === 'ar' ? 'تسجيل دفعة' : 'Enregistrer un paiement'}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEmployee(employee)}
                          className="h-8 w-8"
                          title={language === 'ar' ? 'تعديل الموظف' : 'Modifier l\'employé'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title={language === 'ar' ? 'حذف الموظف' : 'Supprimer l\'employé'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit/Payment */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && (language === 'ar' ? 'موظف جديد' : 'Nouvel Employé')}
              {dialogMode === 'edit' && (language === 'ar' ? 'تعديل الموظف' : 'Modifier Employé')}
              {dialogMode === 'payment' && (language === 'ar' ? 'تسجيل دفعة' : 'Enregistrer Paiement')}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' && (language === 'ar' ? 'أنشئ حساب موظف جديد مع وصول للنظام' : 'Créez un nouveau compte employé avec accès système')}
              {dialogMode === 'edit' && (language === 'ar' ? 'عدّل معلومات الموظف والصلاحيات' : 'Modifiez les informations et permissions de l\'employé')}
              {dialogMode === 'payment' && (language === 'ar' ? 'سجل دفعة جديدة للموظف' : 'Enregistrez un nouveau paiement pour l\'employé')}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'payment' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">{language === 'ar' ? 'المبلغ' : 'Montant'}</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="paymentType">{language === 'ar' ? 'نوع الدفعة' : 'Type de Paiement'}</Label>
                  <Select value={paymentData.type} onValueChange={(value: any) => setPaymentData({...paymentData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">{language === 'ar' ? 'راتب' : 'Salaire'}</SelectItem>
                      <SelectItem value="bonus">{language === 'ar' ? 'مكافأة' : 'Prime'}</SelectItem>
                      <SelectItem value="commission">{language === 'ar' ? 'عمولة' : 'Commission'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="paymentDate">{language === 'ar' ? 'تاريخ الدفعة' : 'Date de Paiement'}</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.date}
                  onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">{language === 'ar' ? 'شخصي' : 'Personnel'}</TabsTrigger>
                <TabsTrigger value="job">{language === 'ar' ? 'المنصب' : 'Poste'}</TabsTrigger>
                <TabsTrigger value="account">{language === 'ar' ? 'الحساب' : 'Compte'}</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div>
                  <Label htmlFor="name">{language === 'ar' ? 'الاسم الكامل *' : 'Nom Complet *'}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={language === 'ar' ? 'مثال: محمد علامي' : 'Ex: Mohamed Alami'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{language === 'ar' ? 'الهاتف' : 'Téléphone'}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder={language === 'ar' ? 'مثال: +212 6 12 34 56 78' : 'Ex: +212 6 12 34 56 78'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">{language === 'ar' ? 'العنوان' : 'Adresse'}</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder={language === 'ar' ? 'مثال: حي الرياض، الرباط' : 'Ex: Hay Riad, Rabat'}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="job" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">{language === 'ar' ? 'الدور *' : 'Rôle *'}</Label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{language === 'ar' ? 'مسؤول' : 'Administrateur'}</SelectItem>
                        <SelectItem value="employee">{language === 'ar' ? 'موظف' : 'Employé'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="salary">{language === 'ar' ? 'الراتب (د.ج/شهر) *' : 'Salaire (DZD/mois) *'}</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})}
                    placeholder={language === 'ar' ? 'مثال: 8000' : 'Ex: 8000'}
                  />
                </div>
              </TabsContent>

              <TabsContent value="account" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">{language === 'ar' ? 'اسم المستخدم' : 'Nom d\'utilisateur'}</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder={language === 'ar' ? 'مثال: malami' : 'Ex: malami'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Mot de passe'}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={language === 'ar' ? 'كلمة مرور آمنة' : 'Mot de passe sécurisé'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`${isRTL ? 'left-0' : 'right-0'} absolute top-0 h-full w-10`}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirmez le mot de passe'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`${isRTL ? 'left-0' : 'right-0'} absolute top-0 h-full w-10`}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={handleSubmit} className="gradient-primary text-primary-foreground">
              {dialogMode === 'create' && (language === 'ar' ? 'إنشاء' : 'Créer')}
              {dialogMode === 'edit' && (language === 'ar' ? 'تعديل' : 'Modifier')}
              {dialogMode === 'payment' && (language === 'ar' ? 'تسجيل دفعة' : 'Enregistrer Paiement')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'سجل الدفع' : 'Historique de paiements'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? 'سجل كامل للمدفوعات لـ' : 'Historique complet des paiements pour'} <strong>{selectedEmployee?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {paymentHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                    <TableHead className="text-right">{language === 'ar' ? 'المبلغ' : 'Montant'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.type === 'salary' ? (language === 'ar' ? 'راتب' : 'Salaire') : payment.type === 'bonus' ? (language === 'ar' ? 'مكافأة' : 'Prime') : (language === 'ar' ? 'عمولة' : 'Commission')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {language === 'ar' ? 'لم يتم تسجيل أي مدفوعات لهذا الموظف.' : 'Aucun paiement enregistré pour cet employé.'}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDialogOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Fermer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
