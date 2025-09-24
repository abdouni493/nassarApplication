import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Globe,
  Database,
  User,
  Shield,
  Bell,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Printer,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import axios from 'axios';

export default function Settings() {
  const { toast } = useToast();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const [settings, setSettings] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: true,
    autoBackup: true,
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [backupHistory, setBackupHistory] = useState([]);
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    database: '',
    lastBackup: '',
    diskSpace: '',
    uptime: '',
    networkStatus: 'disconnected'
  });

  const API_URL = ' /api';

  useEffect(() => {
  fetchSystemInfo();
  fetchBackupHistory();
  fetchUserInfo();
}, []);

const fetchUserInfo = async () => {
  try {
    const res = await axios.get(`${API_URL}/users/1`); // 👈 fetch from backend
    setSettings(prev => ({
      ...prev,
      username: res.data.username,
      email: res.data.email,
    }));
  } catch (err) {
    console.error("❌ Failed to fetch user info:", err);
    toast({
      title: "Erreur",
      description: "Impossible de charger les informations du compte.",
      variant: "destructive"
    });
  }
};


  const fetchSystemInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/system-info`);
      setSystemInfo(prev => ({
        ...prev,
        ...response.data,
        diskSpace: `${(response.data.dbSize / 1024 / 1024).toFixed(2)} MB`,
        uptime: formatUptime(response.data.uptime),
        networkStatus: 'connected'
      }));
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations système.",
        variant: "destructive"
      });
      setSystemInfo(prev => ({ ...prev, networkStatus: 'disconnected' }));
    }
  };

  const fetchBackupHistory = async () => {
    // This would require a new backend endpoint to list backup files
    // For now, we'll use a placeholder
    setBackupHistory([]);
  };
  
  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    setSettings(prev => ({ ...prev, language: value }));
    toast({
      title: value === 'ar' ? "تم تغيير اللغة" : "Langue modifiée",
      description: value === 'ar' ? "تم تبديل الواجهة إلى العربية" : "Interface basculée en Français",
    });
  };

  const handleBackup = async () => {
    toast({
      title: "Sauvegarde en cours...",
      description: "Création de la sauvegarde de la base de données",
    });
    try {
      const response = await axios.get(`${API_URL}/backup/export`, {
        responseType: 'blob', // Important for file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'database-backup.sqlite');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      const newBackup = {
        date: new Date().toLocaleString(),
        size: 'N/A', // Size will be determined on the server or manually
        status: 'success'
      };
      setBackupHistory(prev => [newBackup, ...prev]);

      toast({
        title: "Sauvegarde terminée",
        description: "Base de données sauvegardée avec succès",
      });
    } catch (err) {
      console.error("Backup failed:", err);
      toast({
        title: "Erreur de sauvegarde",
        description: "Échec de la création de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('backup', file);

    toast({
      title: "Restauration en cours...",
      description: "Restauration de la base de données",
    });

    try {
      await axios.post(`${API_URL}/backup/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Restauration réussie",
        description: "Base de données restaurée. Redémarrez le serveur pour appliquer les changements.",
      });
    } catch (err) {
      console.error("Restore failed:", err);
      toast({
        title: "Erreur de restauration",
        description: "Échec de la restauration de la base de données.",
        variant: "destructive"
      });
    }
  };

  const handleAccountUpdate = async () => {
    try {
      // Assuming a user ID of 1 for the admin user
      await axios.put(`${API_URL}/users/1`, {
        username: settings.username,
        email: settings.email
      });
      toast({
        title: "Informations sauvegardées",
        description: "Vos informations de compte ont été mises à jour.",
      });
    } catch (err) {
      console.error("Account update failed:", err);
      toast({
        title: "Erreur de mise à jour",
        description: "Échec de la mise à jour de votre compte.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (settings.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return;
    }

    try {
      // Assuming a user ID of 1 for the admin user
      await axios.put(`${API_URL}/users/1`, {
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword,
      });
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
      });
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error("Password change failed:", err);
      const errorMessage = err.response?.data?.message || "Échec de la modification du mot de passe.";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleTogglePassword = (key) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  function handleDownloadBackup(date: any): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="space-y-6 p-4 md:p-8 lg:p-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Paramètres</h1>
          <p className="text-muted-foreground">Configurez votre application</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackup}>
            <Download className="mr-2 h-4 w-4" />
            Sauvegarde
          </Button>
          <Button variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer flex items-center">
              <Upload className="mr-2 h-4 w-4" />
              Restaurer
            </label>
            <Input id="file-upload" type="file" className="hidden" onChange={handleRestore} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-4">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Compte
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="h-4 w-4 mr-2" />
            Sauvegarde
          </TabsTrigger>
          <TabsTrigger value="about">
            <Info className="h-4 w-4 mr-2" />
            À Propos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Language Settings */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Langue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div>
                  <Label>Langue de l'interface</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez la langue d'affichage
                  </p>
                </div>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="ar">🇲🇦 العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications système</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertes de stock, ventes, etc.
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Sauvegarde automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Sauvegarde quotidienne automatique
                  </p>
                </div>
                <Switch
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          {/* User Info */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations du Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={settings.username}
                    onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleAccountUpdate} className="gradient-primary text-primary-foreground">
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder les informations
              </Button>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Changer le Mot de Passe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={settings.currentPassword}
                    onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10"
                    onClick={() => handleTogglePassword('current')}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={settings.newPassword}
                      onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => handleTogglePassword('new')}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={settings.confirmPassword}
                      onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => handleTogglePassword('confirm')}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handlePasswordChange} className="gradient-primary text-primary-foreground">
                <Shield className="mr-2 h-4 w-4" />
                Changer le Mot de Passe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          {/* Backup Settings */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestion des Sauvegardes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-green-500/20 bg-green-500/5">
                  <CardContent className="p-6 text-center">
                    <Download className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="font-semibold mb-2">Créer une Sauvegarde</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sauvegardez toutes vos données en sécurité
                    </p>
                    <Button onClick={handleBackup} className="bg-green-600 hover:bg-green-700 text-white w-full">
                      Créer Sauvegarde
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-yellow-500/20 bg-yellow-500/5">
                  <CardContent className="p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="font-semibold mb-2">Restaurer</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Restaurer depuis une sauvegarde
                    </p>
                    <label htmlFor="file-upload" className="w-full">
                      <Button variant="outline" className="w-full">
                        Choisir Fichier
                      </Button>
                      <Input id="file-upload" type="file" className="hidden" onChange={handleRestore} />
                    </label>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-4">Historique des Sauvegardes</h3>
                <div className="space-y-2">
                  {backupHistory.length > 0 ? (
                    backupHistory.map((backup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${backup.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <div className="font-medium">{backup.date}</div>
                            <div className="text-sm text-muted-foreground">{backup.size}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadBackup(backup.date)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">Aucune sauvegarde trouvée.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          {/* About */}
          <Card className="card-elevated text-center">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Nasser Equipements et Materiel</h2>
                  <p className="text-muted-foreground">Système de Gestion Commercial</p>
                  <Badge variant="outline" className="mt-2">Version {systemInfo.version}</Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">Informations Système</h3>
                    <div className="text-left">
                      <p className="text-muted-foreground">Base de données: <Badge>{systemInfo.database}</Badge></p>
                      <p className="text-muted-foreground">Taille du fichier: <Badge>{systemInfo.diskSpace}</Badge></p>
                      <p className="text-muted-foreground">Temps de fonctionnement: <Badge>{systemInfo.uptime}</Badge></p>
                      <p className="text-muted-foreground">Statut du réseau: <Badge variant={systemInfo.networkStatus === 'connected' ? "default" : "destructive"}>{systemInfo.networkStatus === 'connected' ? 'Connecté' : 'Déconnecté'}</Badge></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Détails de Contact</h3>
                    <p className="text-muted-foreground">Développé par: Youssef Abdouni</p>
                    <p className="text-muted-foreground">Support: youssefabdouni44@gmail.com</p>
                    <p className="text-muted-foreground">WhatsApp: 0791366612</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold">Fonctionnalités</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>• Gestion des stocks</div>
                    <div>• Facturation complète</div>
                    <div>• Suivi des ventes</div>
                    <div>• Gestion fournisseurs</div>
                    <div>• Rapports détaillés</div>
                    <div>• Codes-barres</div>
                    <div>• Caisse POS</div>
                    <div>• Sauvegarde sécurisée</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
