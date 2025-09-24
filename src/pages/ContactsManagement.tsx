import { useState, useEffect } from 'react';
import { Save, Phone, MessageCircle, Mail, Facebook, Instagram, Music, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/LanguageContext';
import { Contact } from '@/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Helper function to handle API calls
const API_BASE_URL = ' ';

const apiClient = {
  get: async (path: string) => {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },
  post: async (path: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  },
};

const ContactsManagement = () => {
  const [contact, setContact] = useState<Contact>({} as Contact);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { t } = useTranslation();

  // Fetch contact data from the backend on component mount
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const data = await apiClient.get('/api/contacts');
        setContact(data || {});
      } catch (error) {
        console.error('Error fetching contact data:', error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de récupérer les informations de contact.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, []);

  const handleSave = async () => {
    if (isLoading) return; // Prevent saving while loading

    try {
      await apiClient.post('/api/contacts', contact);
      toast({
        title: "Informations sauvegardées",
        description: "Les informations de contact ont été mises à jour avec succès.",
      });
    } catch (error) {
      console.error('Error saving contact data:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les informations de contact.",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: keyof Contact, value: string) => {
    setContact({ ...contact, [field]: value });
  };

  const contactFields = [
    {
      key: 'phone' as keyof Contact,
      label: t('phone'),
      icon: Phone,
      placeholder: '+213 XXX XXX XXX',
      type: 'tel'
    },
    {
      key: 'whatsapp' as keyof Contact,
      label: t('whatsapp'),
      icon: MessageCircle,
      placeholder: '+213 XXX XXX XXX',
      type: 'tel'
    },
    {
      key: 'email' as keyof Contact,
      label: t('email'),
      icon: Mail,
      placeholder: 'contact@monsite.com',
      type: 'email'
    },
    {
      key: 'facebook' as keyof Contact,
      label: t('facebook'),
      icon: Facebook,
      placeholder: 'https://facebook.com/monsite',
      type: 'url'
    },
    {
      key: 'instagram' as keyof Contact,
      label: t('instagram'),
      icon: Instagram,
      placeholder: 'https://instagram.com/monsite',
      type: 'url'
    },
    {
      key: 'tiktok' as keyof Contact,
      label: t('tiktok'),
      icon: Music,
      placeholder: 'https://tiktok.com/@monsite',
      type: 'url'
    },
    {
      key: 'viber' as keyof Contact,
      label: t('viber'),
      icon: MessageCircle,
      placeholder: '+213 XXX XXX XXX',
      type: 'tel'
    },
    {
      key: 'mapUrl' as keyof Contact,
      label: t('mapUrl'),
      icon: MapPin,
      placeholder: 'https://maps.google.com/...',
      type: 'url'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">{t('contacts')}</h2>
        <Button onClick={handleSave} className="management-button" disabled={isLoading}>
          <Save size={20} className={cn("mr-2", isLoading && "animate-spin")} />
          {isLoading ? 'Chargement...' : t('save')}
        </Button>
      </div>

      {/* Contact Form */}
      <Card className="management-card p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Informations de Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactFields.map((field, index) => (
                <div
                  key={field.key}
                  className="space-y-2 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Label htmlFor={field.key} className="flex items-center space-x-2">
                    <field.icon size={16} className="text-primary" />
                    <span>{field.label}</span>
                  </Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={contact[field.key] || ''}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Aperçu des Informations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contactFields.map((field) => (
                contact[field.key] && (
                  <Card key={field.key} className="p-4 border border-primary/20 bg-primary/5">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <field.icon size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {field.label}
                        </p>
                        <p className="text-sm text-foreground truncate">
                          {contact[field.key]}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              ))}
            </div>
          </div>

          {/* Social Media Preview */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {t('socialLinks')}
            </h3>
            <div className="flex flex-wrap gap-4">
              {['facebook', 'instagram', 'tiktok'].map((platform) => (
                contact[platform as keyof Contact] && (
                  <a
                    key={platform}
                    href={contact[platform as keyof Contact]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors duration-200"
                  >
                    {platform === 'facebook' && <Facebook size={20} className="text-blue-600" />}
                    {platform === 'instagram' && <Instagram size={20} className="text-pink-600" />}
                    {platform === 'tiktok' && <Music size={20} className="text-black" />}
                    <span className="text-sm font-medium capitalize">{platform}</span>
                  </a>
                )
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContactsManagement;
