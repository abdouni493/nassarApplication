import { useState, useEffect } from 'react';
import { Save, Globe, FileText, Upload, Image, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { WebsiteSettings } from '@/types';

interface WebsiteSettingsResponse {
  id: number;
  site_name_fr: string;
  site_name_ar: string;
  description_fr: string;
  description_ar: string;
  logo_url: string | null;
  favicon_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- MOCK API DATA AND FUNCTIONS ---
// This simulates the back-end API to make the front-end component functional.
let mockSettings: WebsiteSettingsResponse = {
  id: 1,
  site_name_fr: 'AutoParts',
  site_name_ar: 'قطع غيار السيارات',
  description_fr: 'Votre destination pour toutes les pièces automobiles.',
  description_ar: 'وجهتك لجميع قطع غيار السيارات.',
  logo_url: null,
  favicon_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockFetchSettings = async (): Promise<WebsiteSettingsResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSettings);
    }, 500); // Simulate network delay
  });
};

const mockSaveSettings = async (formData: FormData): Promise<WebsiteSettingsResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockSettings = {
        ...mockSettings,
        site_name_fr: formData.get('site_name_fr') as string,
        site_name_ar: formData.get('site_name_ar') as string,
        description_fr: formData.get('description_fr') as string,
        description_ar: formData.get('description_ar') as string,
        logo_url: formData.get('logo') ? URL.createObjectURL(formData.get('logo') as File) : mockSettings.logo_url,
        favicon_url: formData.get('favicon') ? URL.createObjectURL(formData.get('favicon') as File) : mockSettings.favicon_url,
        updated_at: new Date().toISOString(),
      };
      resolve(mockSettings);
    }, 500); // Simulate network delay
  });
};
// --- END MOCK API ---

const SettingsManagement = () => {
  const [settings, setSettings] = useState<WebsiteSettings>({
    site_name_fr: '',
    site_name_ar: '',
    description_fr: '',
    description_ar: '',
    logo_url: null,
    favicon_url: null
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Replaced fetch with mock API call
      const res = await fetch(" /api/settings");
const data: WebsiteSettingsResponse = await res.json();
      setSettings({
        site_name_fr: data.site_name_fr || '',
        site_name_ar: data.site_name_ar || '',
        description_fr: data.description_fr || '',
        description_ar: data.description_ar || '',
        logo_url: data.logo_url,
        favicon_url: data.favicon_url
      });
      
     if (data.logo_url) {
  setLogoPreview(` ${data.logo_url}`);
}
if (data.favicon_url) {
  setFaviconPreview(` ${data.favicon_url}`);
}

    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('site_name_fr', settings.site_name_fr);
      formData.append('site_name_ar', settings.site_name_ar);
      formData.append('description_fr', settings.description_fr);
      formData.append('description_ar', settings.description_ar);
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (faviconFile) {
        formData.append('favicon', faviconFile);
      }

      // Replaced fetch with mock API call
      const res = await fetch(" /api/settings", {
  method: "PUT",
  body: formData,
});
const updatedSettings: WebsiteSettingsResponse = await res.json();

      setSettings({
        site_name_fr: updatedSettings.site_name_fr,
        site_name_ar: updatedSettings.site_name_ar,
        description_fr: updatedSettings.description_fr,
        description_ar: updatedSettings.description_ar,
        logo_url: updatedSettings.logo_url,
        favicon_url: updatedSettings.favicon_url
      });
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres du site ont été mis à jour avec succès.",
      });
      
      // Reset file states
      setLogoFile(null);
      setFaviconFile(null);
      
      // Refresh previews
     if (updatedSettings.logo_url) {
  setLogoPreview(` ${updatedSettings.logo_url}`);
}
if (updatedSettings.favicon_url) {
  setFaviconPreview(` ${updatedSettings.favicon_url}`);
}

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFaviconPreview(previewUrl);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    // Note: To actually remove the logo from server, you'd need to implement a DELETE endpoint
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview('');
    // Note: To actually remove the favicon from server, you'd need to implement a DELETE endpoint
  };

  const updateField = (field: keyof WebsiteSettings, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">{t('settings')}</h2>
        <Button onClick={handleSave} className="management-button" disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sauvegarde...
            </>
          ) : (
            <>
              <Save size={20} className="mr-2" />
              {t('save')}
            </>
          )}
        </Button>
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Site Names */}
        <Card className="management-card p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Globe size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Nom du Site Web
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="animate-fade-in">
                <Label htmlFor="site_name_fr">{t('siteNameFr')}</Label>
                <Input
                  id="site_name_fr"
                  value={settings.site_name_fr}
                  onChange={(e) => updateField('site_name_fr', e.target.value)}
                  placeholder="Nom du site en français"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <Label htmlFor="site_name_ar">{t('siteNameAr')}</Label>
                <Input
                  id="site_name_ar"
                  value={settings.site_name_ar}
                  onChange={(e) => updateField('site_name_ar', e.target.value)}
                  placeholder="اسم الموقع بالعربية"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Site Descriptions */}
        <Card className="management-card p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileText size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Description du Site
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                <Label htmlFor="description_fr">Description (Français)</Label>
                <Textarea
                  id="description_fr"
                  value={settings.description_fr}
                  onChange={(e) => updateField('description_fr', e.target.value)}
                  placeholder="Description du site web en français"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                />
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                <Label htmlFor="description_ar">Description (العربية)</Label>
                <Textarea
                  id="description_ar"
                  value={settings.description_ar}
                  onChange={(e) => updateField('description_ar', e.target.value)}
                  placeholder="وصف الموقع الإلكتروني بالعربية"
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Media Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo Upload */}
        <Card className="management-card p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Image size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Logo du Site
              </h3>
            </div>
            
            <div className="space-y-4">
              {logoPreview && (
                <div className="flex flex-col items-center">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="max-h-32 object-contain mb-2"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeLogo}
                    className="text-destructive"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Supprimer
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Label 
                  htmlFor="logo-upload" 
                  className="flex items-center cursor-pointer p-2 border border-dashed border-primary/30 rounded-md hover:bg-primary/5 transition-colors"
                >
                  <Upload size={16} className="mr-2" />
                  Choisir un logo
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Favicon Upload */}
        <Card className="management-card p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Image size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Favicon
              </h3>
            </div>
            
            <div className="space-y-4">
              {faviconPreview && (
                <div className="flex flex-col items-center">
                  <img 
                    src={faviconPreview} 
                    alt="Favicon preview" 
                    className="w-16 h-16 object-contain mb-2"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={removeFavicon}
                    className="text-destructive"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Supprimer
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Label 
                  htmlFor="favicon-upload" 
                  className="flex items-center cursor-pointer p-2 border border-dashed border-primary/30 rounded-md hover:bg-primary/5 transition-colors"
                >
                  <Upload size={16} className="mr-2" />
                  Choisir un favicon
                </Label>
                <Input
                  id="favicon-upload"
                  type="file"
                  accept="image/x-icon,image/png,image/jpeg"
                  onChange={handleFaviconChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="management-card p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">
            Aperçu du Site Web
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* French Preview */}
            <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">Version Française</span>
              </div>
              <div>
                <h4 className="text-xl font-bold text-foreground mb-2">
                  {settings.site_name_fr || 'Nom du site'}
                </h4>
                <p className="text-muted-foreground">
                  {settings.description_fr || 'Description du site web'}
                </p>
              </div>
            </div>

            {/* Arabic Preview */}
            <div className="space-y-4 p-4 border border-primary/20 rounded-lg bg-primary/5" dir="rtl">
              <div className="flex items-center space-x-2 justify-end">
                <span className="text-sm font-medium text-primary">النسخة العربية</span>
                <Globe size={16} className="text-primary" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-foreground mb-2">
                  {settings.site_name_ar || 'اسم الموقع'}
                </h4>
                <p className="text-muted-foreground">
                  {settings.description_ar || 'وصف الموقع الإلكتروني'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsManagement;
