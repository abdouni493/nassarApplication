import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Eye,
  EyeOff,
  Save,
  Upload,
  Download,
  User,
  Shield,
  X,
  Edit,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    username: user?.username || user?.email || "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: "Erreur", description: "ID utilisateur manquant", variant: "destructive" });
      return;
    }

    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: profileData.username,
          password: profileData.newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Échec de la mise à jour du profil.");
      }

      // Update the user context if needed
      // setUser({ ...user, username: data.user.email }); // Assuming email is the new username
      setIsEditing(false);
      toast({ title: "Succès", description: "Profil mis à jour avec succès." });
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData({
      username: user?.username || user?.email || "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/backup/export');
      if (!res.ok) {
        throw new Error("Échec de l'exportation de la sauvegarde.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backup.sqlite';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Succès", description: "Sauvegarde exportée avec succès." });
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast({ title: "Annulé", description: "Aucun fichier sélectionné." });
      return;
    }

    const formData = new FormData();
    formData.append('backup', file);

    try {
      const res = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Échec de l'importation de la sauvegarde.");
      }

      toast({ 
        title: "Succès", 
        description: data.message 
      });
      // You may want to refresh the page or application state here
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-10">
      {/* Profile Details Card */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Mon Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur / Email</Label>
            <Input
              id="username"
              type="email"
              placeholder="votre_email@exemple.com"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Laissez vide pour ne pas changer"
                value={profileData.newPassword}
                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                disabled={!isEditing}
              />
              <span
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmez le nouveau mot de passe"
                value={profileData.confirmPassword}
                onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                disabled={!isEditing}
              />
              <span
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" /> Annuler
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              <Save className="mr-2 h-4 w-4" /> Enregistrer les changements
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} className="gradient-primary">
            <Edit className="mr-2 h-4 w-4" /> Modifier le profil
          </Button>
        )}
      </div>

      {/* Backup Section */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between">
          <div>
            <input
              type="file"
              accept=".sqlite"
              id="import-backup"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("import-backup")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Importer la sauvegarde
            </Button>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Exporter la sauvegarde
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
