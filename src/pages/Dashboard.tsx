import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Truck,
  Plus,
  ClipboardList,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowRight } from 'lucide-react';

// Component for displaying key statistics
const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  className = ""
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  className?: string;
}) => (
  <Card className={`stat-card transition-transform duration-300 hover:scale-[1.02] shadow-sm ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs flex items-center gap-1 mt-1 ${
          changeType === 'increase' ? 'text-green-500' : 'text-red-500'
        }`}>
          {changeType === 'increase' ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
        </p>
      )}
    </CardContent>
  </Card>
);

// Component for showing low stock alerts - Now simplified to use the count directly
const LowStockAlert = ({ lowStockCount }: { lowStockCount: number }) => {
  const isAlert = lowStockCount > 0;
  return (
    <Card className="animate-fade-in h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alertes Stock Bas
          </CardTitle>
          <Badge variant="destructive">{lowStockCount}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4">
        {isAlert ? (
          <div className="text-center text-warning-foreground py-10">
            <p className="font-semibold">⚠️ Attention : {lowStockCount} article(s) en stock bas !</p>
            <p className="text-sm text-muted-foreground mt-2">Pensez à faire le point sur ces produits.</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>🎉 Pas d'alertes de stock bas. Tout est en ordre !</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Component for displaying recent activity
const RecentActivity = ({ activity }: { activity: any[] }) => (
  <Card className="h-full animate-fade-in">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary" />
        Activité Récente
      </CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="space-y-4">
        {activity.length > 0 ? (
          activity.map((item, index) => (
            <li key={item.id} className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${item.type === 'sale' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {item.type === 'sale' ? <ShoppingCart className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                </div>
              </div>
              <div className="flex-grow">
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString('fr-FR')} par {item.createdBy}</p>
              </div>
            </li>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>Aucune activité récente à afficher.</p>
          </div>
        )}
      </ul>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await fetch("  /api/dashboard/stats", {
        headers: { "x-user-email": user?.email || "" }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      setStats(data); // Set the entire data object
      setRecentActivity(data.recentActivity);
    } catch (err) {
      console.error("❌ Failed to fetch dashboard data:", err);
      setStats(null);
      setRecentActivity([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Chargement des données...</h2>
        <Progress value={50} className="w-64" />
      </div>
    );
  }

  // Définir des données par défaut si `stats` est nul (en cas d'erreur)
  const defaultStats = {
    todayStats: { totalSales: 0, salesCount: 0, totalPurchases: 0, purchasesCount: 0, profit: 0 },
    generalStats: { totalProducts: 0, lowStockCount: 0, totalEmployees: 0, totalSuppliers: 0, totalCustomers: 0 },
    recentActivity: [],
  };
  const currentStats = stats || defaultStats;

  const quickActions = [
    {
      title: "Nouvelle Vente",
      description: "Enregistrer une nouvelle transaction de vente.",
      icon: ShoppingCart,
      href: "/sales",
      color: "text-green-500"
    },
    {
      title: "Ajouter Produit",
      description: "Ajouter un nouveau produit à l'inventaire.",
      icon: Plus,
      href: "/inventory",
      color: "text-blue-500"
    },
    {
      title: "Nouveau Fournisseur",
      description: "Ajouter un nouveau fournisseur.",
      icon: Truck,
      href: "/suppliers",
      color: "text-orange-500"
    },
    {
      title: "Point de Vente",
      description: "Lancer l'interface de point de vente.",
      icon: DollarSign,
      href: "/pos",
      color: "text-rose-500"
    },
    {
      title: "Rapports",
      description: "Consulter les rapports financiers et de stock.",
      icon: ClipboardList,
      href: "/reports",
      color: "text-purple-500"
    },
    {
      title: "Gérer Employés",
      description: "Gérer les comptes et les accès des employés.",
      icon: Briefcase,
      href: "/employees",
      color: "text-yellow-500"
    }
  ];

  return (
    <div className="space-y-10 py-6 px-4 md:px-6 lg:px-8 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border">
        <div>
          <h1 className="text-4xl font-extrabold text-gradient tracking-tight">
            Nasser Equipements et Materiel
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            {language === 'ar'
              ? 'لوحة التحكم - نظرة شاملة على نشاطك'
              : "Tableau de Bord - Vue d'ensemble de votre activité"}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
            <p className="font-semibold text-base">{new Date().toLocaleString('fr-FR')}</p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {hasError && (
        <div className="flex items-center justify-center p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 gap-4">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-medium">Impossible de récupérer les statistiques. Affichage des valeurs par défaut.</p>
        </div>
      )}

      {/* Main Stats and Financial Overview */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventes du Mois"
            value={formatCurrency(currentStats.todayStats.totalSales)}
            change={`${currentStats.todayStats.salesCount} ventes`}
            changeType="increase"
            icon={DollarSign}
            className="bg-gradient-to-r from-green-600 to-green-500 text-white [&_.text-2xl]:text-white [&_.text-sm]:text-white/80 [&_.text-xs]:text-white/90"
          />
          <StatCard
            title="Achats du Mois"
            value={formatCurrency(currentStats.todayStats.totalPurchases)}
            change={`${currentStats.todayStats.purchasesCount} achats`}
            changeType="increase"
            icon={ShoppingCart}
          />
          <StatCard
            title="Bénéfices du Mois"
            value={formatCurrency(currentStats.todayStats.profit)}
            change="+ Calculé"
            changeType="increase"
            icon={TrendingUp}
          />
          <StatCard
            title="Produits en Stock"
            value={currentStats.generalStats.totalProducts}
            change={`${currentStats.generalStats.lowStockCount} en rupture`}
            changeType="decrease"
            icon={Package}
          />
        </div>
      </section>

      {/* Quick Actions and Additional Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Actions Rapides
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link to={action.href} key={action.title}>
                  <div className="flex flex-col items-center justify-center p-6 bg-secondary rounded-xl hover:bg-secondary/80 transition-transform duration-300 hover:scale-[1.03] shadow-md">
                    <div className={`p-3 rounded-full bg-background mb-4`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-center">{action.title}</h3>
                    <p className="text-sm text-muted-foreground text-center mt-1">{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="Employés" value={currentStats.generalStats.totalEmployees || 0} icon={Users} />
          <StatCard title="Fournisseurs" value={currentStats.generalStats.totalSuppliers} icon={Truck} />
          <StatCard title="Clients" value={currentStats.generalStats.totalCustomers} change="+" changeType="increase" icon={Users} />
        </div>
      </section>

      {/* Alerts and Recent Activity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockAlert lowStockCount={currentStats.generalStats.lowStockCount} />
        <RecentActivity activity={recentActivity} />
      </section>
    </div>
  );
}
