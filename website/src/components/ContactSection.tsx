import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phone, MessageCircle, Mail, MapPin, Clock, Facebook, Instagram, Music } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Contact {
  phone?: string;
  whatsapp?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  viber?: string;
  mapUrl?: string;
}

interface ContactSectionProps {
  onNavigate: (section: string) => void;
}

const API_BASE = ' ';

const ContactSection: React.FC<ContactSectionProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [contact, setContact] = useState<Contact>({} as Contact);
  const [isLoading, setIsLoading] = useState(true);

  const workingHours = [
    { day: 'السبت - الخميس', dayFr: 'Samedi - Jeudi', hours: '08:00 - 18:00' },
    { day: 'الجمعة', dayFr: 'Vendredi', hours: 'مغلق' },
  ];

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/contacts`);
        const data: Contact = await res.json();
        setContact(data || {});
      } catch (error) {
        console.error(error);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les informations de contact.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchContact();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const contactMethods = [
    { icon: Phone, title: 'الهاتف', value: contact.phone, action: contact.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : '#', color: 'text-green-600' },
    { icon: MessageCircle, title: 'واتساب', value: contact.whatsapp, action: contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}` : '#', color: 'text-green-500' },
    { icon: Mail, title: 'البريد الإلكتروني', value: contact.email, action: contact.email ? `mailto:${contact.email}` : '#', color: 'text-blue-600' },
    { icon: Facebook, title: 'فيسبوك', value: contact.facebook, action: contact.facebook || '#', color: 'text-blue-700' },
    { icon: Instagram, title: 'انستغرام', value: contact.instagram, action: contact.instagram || '#', color: 'text-pink-600' },
    { icon: Music, title: 'تيك توك', value: contact.tiktok, action: contact.tiktok || '#', color: 'text-black' },
    { icon: MessageCircle, title: 'فايبر', value: contact.viber, action: contact.viber ? `viber://chat?number=${contact.viber.replace(/\D/g, '')}` : '#', color: 'text-purple-600' },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">{t('contact')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            نحن هنا لمساعدتك في العثور على المنتجات المناسبة وتقديم أفضل خدمة لك
          </p>
          <div className="w-24 h-1 bg-primary mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Methods & Working Hours */}
          <div className="space-y-8 slide-in-left">
            <div className="card-elevated p-8">
              <h3 className="text-2xl font-bold mb-6">طرق التواصل</h3>
              <div className="space-y-6">
                {contactMethods.map(
                  (method, index) =>
                    method.value && (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer"
                        onClick={() => window.open(method.action, '_blank')}
                      >
                        <div className={`p-3 rounded-full bg-background shadow-sm ${method.color}`}>
                          <method.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">{method.title}</h4>
                          <p className="text-lg font-medium text-primary mb-2">{method.value}</p>
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>

            {/* Working Hours */}
            <div className="card-elevated p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                ساعات العمل
              </h3>
              <div className="space-y-3">
                {workingHours.map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">{schedule.day}</span>
                    <span className="text-primary font-bold">{schedule.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About & Location */}
          <div className="space-y-8 slide-in-right">
            <div className="card-elevated p-8">
              <h3 className="text-2xl font-bold mb-6">{t('aboutTitle')}</h3>
              <p className="text-muted-foreground">
                نحن نتميز بتوفير مجموعة واسعة من قطع الغيار والمعدات لجميع القطاعات: السيارات، المعدات الصناعية، الأدوات اليدوية والكهربائية، والمكونات الإلكترونية.
              </p>
            </div>

            <div className="card-elevated p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                موقعنا
              </h3>
              {contact.mapUrl ? (
                <iframe
                  src={contact.mapUrl}
                  className="w-full h-64 rounded-lg border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              ) : (
                <p className="text-muted-foreground">لم يتم توفير رابط الموقع بعد.</p>
              )}
            </div>

            {/* Social Links Preview */}
            <div className="flex flex-wrap gap-4">
              {['facebook', 'instagram', 'tiktok'].map((platform) =>
                contact[platform as keyof Contact] ? (
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
                ) : null
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center fade-in">
          <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">جاهزون لخدمتك</h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              تواصل معنا الآن للحصول على استشارة مجانية أو طلب عرض سعر خاص لمشروعك
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {contact.phone && (
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => window.open(`tel:${contact.phone.replace(/\s+/g, '')}`)}
                  className="px-8 py-3"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  اتصل بنا الآن
                </Button>
              )}
              <Button
                variant="hero"
                size="lg"
                onClick={() => onNavigate('order')}
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:border-white/50 backdrop-blur-sm px-8 py-3"
              >
                تقديم طلب
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
