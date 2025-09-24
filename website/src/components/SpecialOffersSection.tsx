import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Clock, Star, Zap } from 'lucide-react';
import { SpecialOffer, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface SpecialOffersSectionProps {
  onNavigate: (section: string) => void;
}

interface OfferProduct extends Omit<Product, 'descriptionFr' | 'descriptionAr' | 'quality' | 'image'> {
  offer_price?: number;
  descriptionFr?: string;
  descriptionAr?: string;
  quality?: number;
  image?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SpecialOffersSection: React.FC<SpecialOffersSectionProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [offerProducts, setOfferProducts] = useState<Record<number, OfferProduct[]>>({});
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  });

  useEffect(() => {
    fetchActiveOffers();
  }, []);

  useEffect(() => {
    // Set up countdown timer for the first active offer
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [offers]);
// In SpecialOffersSection.tsx, modify the fetchActiveOffers function:
const fetchActiveOffers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/special-offers`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // Filter offers client-side to only include active ones
    const activeOffers = data.filter((offer: SpecialOffer) => offer.is_active);
    setOffers(activeOffers);
    
    // Fetch products for each active offer
    activeOffers.forEach((offer: SpecialOffer) => {
      fetchOfferProducts(offer.id);
    });
  } catch (error) {
    console.error('Error fetching active offers:', error);
    toast({
      title: language === 'ar' ? 'خطأ' : 'Erreur',
      description: language === 'ar' ? 'فشل في تحميل العروض' : 'Échec du chargement des offres',
      variant: 'destructive'
    });
  } finally {
    setLoading(false);
  }
};

  const fetchOfferProducts = async (offerId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers/${offerId}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOfferProducts(prev => ({
        ...prev,
        [offerId]: data
      }));
    } catch (error) {
      console.error(`Error fetching products for offer ${offerId}:`, error);
    }
  };

  const updateCountdown = () => {
    if (offers.length === 0) return;

    // Use the first offer's end time for the countdown
    const firstOffer = offers[0];
    if (!firstOffer.end_time) return;

    const now = new Date().getTime();
    const endTime = new Date(firstOffer.end_time).getTime();
    const distance = endTime - now;

    if (distance < 0) {
      setCountdown({ days: '00', hours: '00', minutes: '00', seconds: '00' });
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    setCountdown({
      days: days.toString().padStart(2, '0'),
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    });
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast({
      title: language === 'ar' ? 'تم الإضافة' : 'Ajouté',
      description: language === 'ar' ? 'تمت إضافة المنتج إلى السلة' : 'Produit ajouté au panier',
    });
  };

  const renderStars = (quality: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= quality ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  const calculateSavings = (originalPrice: number, offerPrice: number) => {
    if (originalPrice <= 0 || offerPrice <= 0) return 0;
    return ((originalPrice - offerPrice) / originalPrice) * 100;
  };

  if (loading) {
    return (
      <section className="py-12 min-h-screen bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-muted-foreground">
              {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 min-h-screen bg-gradient-to-br from-accent/5 to-primary/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 fade-in">
          <div className="flex justify-center mb-4">
            <div className="bg-accent text-accent-foreground px-4 py-2 rounded-full inline-flex items-center space-x-2 pulse-glow">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">{language === 'ar' ? 'وقت محدود' : 'Limited Time'}</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {language === 'ar' ? 'العروض الخاصة' : 'Special Offers'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'اكتشف أفضل العروض والخصومات الحصرية على منتجاتنا المختارة'
              : 'Découvrez les meilleures offres et remises exclusives sur nos produits sélectionnés'}
          </p>
          <div className="w-24 h-1 bg-accent mx-auto mt-6"></div>
        </div>

        {/* Countdown Timer - Only show if there are active offers */}
        {offers.length > 0 && (
          <div className="text-center mb-12 slide-in-right">
            <div className="bg-card border border-accent/20 rounded-2xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-accent mr-2" />
                <span className="text-lg font-semibold">
                  {language === 'ar' ? 'ينتهي العرض خلال:' : 'L\'offre se termine dans:'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { value: countdown.days, label: language === 'ar' ? 'أيام' : 'Jours' },
                  { value: countdown.hours, label: language === 'ar' ? 'ساعات' : 'Heures' },
                  { value: countdown.minutes, label: language === 'ar' ? 'دقائق' : 'Minutes' },
                  { value: countdown.seconds, label: language === 'ar' ? 'ثواني' : 'Secondes' }
                ].map((item, index) => (
                  <div key={index} className="bg-accent text-accent-foreground rounded-lg p-3">
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-xs">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Special Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {offers.map((offer, offerIndex) => (
            offerProducts[offer.id]?.map((product, productIndex) => (
              <div
                key={`${offer.id}-${product.id}`}
                className="card-elevated group overflow-hidden pulse-glow"
                style={{ animationDelay: `${(offerIndex + productIndex) * 0.2}s` }}
              >
                {/* Product Image */}
                <div className="relative h-56 bg-muted overflow-hidden">
                  <img
                    src={product.image ? `${API_BASE_URL}${product.image}` : "/placeholder.svg"}
                    alt={language === 'ar' ? product.nameAr || product.name : product.nameFr || product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  
                  {/* Discount Badge */}
                  {product.selling_price && product.offer_price && (
                    <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground text-lg px-3 py-2 pulse-glow">
                      -{calculateSavings(product.selling_price, product.offer_price).toFixed(0)}%
                    </Badge>
                  )}

                  {/* Limited Time Badge */}
                  <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground animate-pulse">
                    <Clock className="h-3 w-3 mr-1" />
                    {language === 'ar' ? 'عرض محدود' : 'Limited Offer'}
                  </Badge>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                    {language === 'ar' ? product.nameAr || product.name : product.nameFr || product.name}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {language === 'ar' ? product.descriptionAr || product.description : product.descriptionFr || product.description}
                  </p>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-4">
                    {renderStars(product.quality || 5)}
                    <span className="text-sm text-muted-foreground mr-2">(4.8)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-accent">
                          {product.offer_price} دج
                        </span>
                        {product.selling_price && (
                          <span className="text-lg text-muted-foreground line-through">
                            {product.selling_price} دج
                          </span>
                        )}
                      </div>
                      {product.selling_price && product.offer_price && (
                        <div className="text-sm text-success font-semibold">
                          {language === 'ar' ? 'وفر' : 'Économisez'} {(product.selling_price - product.offer_price).toLocaleString()} دج
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <Button
                    variant="offer"
                    size="lg"
                    onClick={() => handleAddToCart({
                      ...product,
                      price: product.offer_price || product.selling_price
                    })}
                    className="w-full text-lg font-semibold"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {language === 'ar' ? 'اشتر الآن' : 'Acheter maintenant'}
                  </Button>
                </div>
              </div>
            ))
          ))}
        </div>

        {offers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              {language === 'ar' ? 'لا توجد عروض خاصة حالياً' : 'Aucune offre spéciale pour le moment'}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center fade-in">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">
              {language === 'ar' ? 'لا تفوت هذه الفرصة الذهبية!' : 'Ne manquez pas cette opportunité en or!'}
            </h3>
            <p className="text-white/90 mb-6 text-lg max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'عروض حصرية ومحدودة على أفضل منتجاتنا. اطلب الآن واحصل على شحن مجاني لجميع أنحاء الجزائر'
                : 'Offres exclusives et limitées sur nos meilleurs produits. Commandez maintenant et bénéficiez de la livraison gratuite dans toute l\'Algérie'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="hero"
                size="lg"
                onClick={() => onNavigate('categories')}
                className="bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:border-white/50 backdrop-blur-sm px-8"
              >
                {language === 'ar' ? 'تصفح جميع المنتجات' : 'Parcourir tous les produits'}
              </Button>
              <Button
                size="lg"
                onClick={() => onNavigate('cart')}
                className="px-8 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg border-2 border-yellow-400"
              >
                {language === 'ar' ? 'لا تفوت هذه الفرصة الذهبية!' : 'Ne manquez pas cette opportunité!'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpecialOffersSection;