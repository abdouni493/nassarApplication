import { useState } from 'react';
import { 
  Grid, 
  Tag, 
  Percent,  
  Phone, 
  Settings as SettingsIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/contexts/LanguageContext';
import CategoriesManagement from './CategoriesManagement';
import SpecialOffersManagement from './SpecialOffersManagement';
import ContactsManagement from './ContactsManagement';
import SettingsManagement from './SettingsManagement';

type ActiveSection = 'overview' | 'categories' | 'offers' | 'contacts' | 'settings';

const WebsiteManagement = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('categories');
  const { t } = useTranslation();

  const menuItems = [
    {
      id: 'categories' as const,
      label: t('categories'),
      icon: Grid,
      description: 'Gérer les catégories de produits'
    },
    {
      id: 'offers' as const,
      label: t('specialOffers'),
      icon: Percent,
      description: 'Créer et gérer les offres spéciales'
    },
    {
      id: 'contacts' as const,
      label: t('contacts'),
      icon: Phone,
      description: 'Configurer les informations de contact'
    },
    {
      id: 'settings' as const,
      label: t('settings'),
      icon: SettingsIcon,
      description: 'Paramètres généraux du site'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'categories':
        return <CategoriesManagement />;
      case 'offers':
        return <SpecialOffersManagement />;
      case 'contacts':
        return <ContactsManagement />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return <CategoriesManagement />;
    }
  };

  return (
    <div className="space-y-1">
      {/* Modern Navigation Bar */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-lg backdrop-blur-sm animate-fade-in">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border/30">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t('websiteManagement')}
          </h1>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-6 py-4">
          <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-xl">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                className={`relative flex items-center space-x-3 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeSection === item.id 
                    ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon size={18} className={`${
                  activeSection === item.id ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} />
                <span className="font-semibold">{item.label}</span>
                {activeSection === item.id && (
                  <div className="absolute inset-0 bg-primary/20 rounded-lg animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Section Content */}
      <div className="animate-slide-in-right">
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default WebsiteManagement;
