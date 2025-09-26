import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { CheckCircle, Package, Home, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface OrderItem {
  id: string;
  nameAr?: string;
  nameFr?: string; 
  quantity: number;
  price: number;
  total?: number;
}

interface OrderData {
  orderNumber: string;
  orderDate: string;
  totalPrice: number;
  fullName: string;
  phone: string;
  wilaya: string;
  items: OrderItem[];
}

interface ThankYouPageProps {
  orderData?: OrderData;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ orderData }) => {
  const { t } = useLanguage();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Use prop if provided, else fallback to location.state
  const data: OrderData | undefined = orderData ?? (location.state as OrderData | undefined);

  useEffect(() => {
    clearCart(); // clear cart on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <section className="py-12 min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">جاري تحميل تفاصيل الطلب...</p>
      </section>
    );
  }

  const totalItems =
    data.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;

  const handlePrint = () => window.print();

  return (
    <section className="py-12 min-h-screen bg-gradient-to-br from-success/5 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          
          {/* Success Animation */}
          <div className="mb-8 fade-in">
            <div className="relative">
              <div className="w-32 h-32 bg-success/10 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                <CheckCircle className="w-20 h-20 text-success animate-bounce" />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
                <Sparkles className="w-6 h-6 text-accent animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>

          {/* Thank You Message */}
          <div className="mb-8 slide-in-right">
            <h1 className="text-4xl md:text-5xl font-bold text-success mb-4">{t('thankYou')}!</h1>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-6">{t('orderSuccess')}</h2>
            <p className="text-muted-foreground text-lg mb-8">{t('contactSoon')}</p>
          </div>

          {/* Order Details Card */}
          <div className="card-elevated p-8 mb-8 text-right slide-in-left">
            <h3 className="text-xl font-bold mb-6 flex items-center justify-center">
              <Package className="h-6 w-6 mr-3 text-primary" />
              تفاصيل الطلب
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">رقم الطلب</p>
                  <p className="text-lg font-bold text-primary">{data.orderNumber}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                  <p className="font-medium">
                    {data.orderDate
                      ? new Date(data.orderDate).toLocaleDateString('ar-DZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">المجموع الكلي</p>
                  <p className="text-xl font-bold text-success">{data.totalPrice.toLocaleString()} دج</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-medium">{data.fullName}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                  <p className="font-medium">{data.phone}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">الولاية</p>
                  <p className="font-medium">{data.wilaya}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-4">المنتجات المطلوبة ({totalItems} منتج)</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {data.items.length ? (
                  data.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <div>
                        <span className="font-medium">{item.nameAr ?? item.nameFr ?? 'منتج'}</span>
                        <span className="text-sm text-muted-foreground"> x{item.quantity}</span>
                      </div>
                      <span className="font-medium">
                        {(item.total ?? item.price * item.quantity).toLocaleString()} دج
                      </span>
                    </div>
                  ))
                ) : (
                  <p>لا توجد منتجات</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center slide-in-left">
            <Button variant="hero" size="lg" onClick={() => navigate('/')} className="px-8">
              <Home className="h-5 w-5 mr-2" />
              العودة للرئيسية
            </Button>
            <Button variant="outline" size="lg" onClick={handlePrint} className="px-8">
              <Package className="h-5 w-5 mr-2" />
              طباعة تفاصيل الطلب
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThankYouPage;
