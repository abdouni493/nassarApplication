import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { algerianWilayas } from '@/data/wilayas';
import { ShoppingCart, User } from 'lucide-react';

interface OrderFormProps {
  onOrderSubmit: (orderData: any) => void;
}

interface OrderFormData {
  fullName: string;
  phone: string;
  email: string;
  wilaya: string;
  address: string;
  notes: string;
  paymentMethod: 'cod' | 'dahabia';
}

const API_BASE = 'http://localhost:5000';

const OrderForm: React.FC<OrderFormProps> = ({ onOrderSubmit }) => {
  const { t, language } = useLanguage();
  const { items, clearCart } = useCart();

  const [formData, setFormData] = useState<OrderFormData>({
    fullName: '',
    phone: '',
    email: '',
    wilaya: '',
    address: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map cart items safely
  const safeItems = items.map((item) => {
    const price = Number(item.price ?? item.selling_price ?? 0);
    const quantity = Number(item.quantity ?? 1);
    return {
      ...item,
      price,
      quantity,
      total: price * quantity,
      nameAr: item.nameAr,
      nameFr: item.nameFr,
      imageUrl: item.image ? `${API_BASE}${item.image}` : '/placeholder.svg',
    };
  });

  const computedTotalPrice = safeItems.reduce((sum, item) => sum + item.total, 0);

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.wilaya || !formData.address) {
      alert('الرجاء ملء جميع الحقول المطلوبة!');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderDataToSend = {
        client_name: formData.fullName,
        client_phone: formData.phone,
        client_email: formData.email,
        wilaya: formData.wilaya,
        address: formData.address,
        notes: formData.notes,
        payment_method: formData.paymentMethod,
        items: safeItems.map((item) => ({
          product_id: item.id,
          product_name: language === 'ar' ? item.nameAr : item.nameFr,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        total: computedTotalPrice,
      };

      const response = await axios.post(`${API_BASE}/api/orders`, orderDataToSend);

      if (response.status === 201) {
        const createdOrder = response.data;

        // Clear cart
        clearCart();

        // Prepare data for ThankYouPage
        const thankYouData = {
          orderNumber: createdOrder.id ?? '---',
          orderDate: createdOrder.created_at ?? new Date().toISOString(),
          totalPrice: computedTotalPrice,
          fullName: formData.fullName,
          phone: formData.phone,
          wilaya: formData.wilaya,
          items: safeItems,
        };

        // Send data to parent to switch section
        onOrderSubmit(thankYouData);

        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          wilaya: '',
          address: '',
          notes: '',
          paymentMethod: 'cod',
        });
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال الطلب.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 min-h-screen bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Order Form */}
          <div className="card-elevated p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              {t('personalInfo')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="fullName">{t('fullName')} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('phone')} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="wilaya">{t('wilaya')} *</Label>
                <Select
                  value={formData.wilaya}
                  onValueChange={(val) => handleInputChange('wilaya', val)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الولاية" />
                  </SelectTrigger>
                  <SelectContent>
                    {algerianWilayas.map((wilaya) => (
                      <SelectItem key={wilaya.code} value={wilaya.code}>
                        {wilaya.code} - {language === 'ar' ? wilaya.name : wilaya.nameFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address">{t('address')} *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
              <div>
                <Label>{t('paymentMethod')} *</Label>
                <div className="flex flex-col space-y-2 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() => handleInputChange('paymentMethod', 'cod')}
                    />
                    <span>الدفع عند الاستلام</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="dahabia"
                      checked={formData.paymentMethod === 'dahabia'}
                      onChange={() => handleInputChange('paymentMethod', 'dahabia')}
                    />
                    <span>بطاقة ذهبية (Dahabia Card)</span>
                  </label>
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'جاري المعالجة...' : t('submitOrder')}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <div className="card-elevated p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                {t('orderSummary')}
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {safeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.nameFr}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {language === 'ar' ? item.nameAr : item.nameFr}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        الكمية: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {item.total.toLocaleString()} دج
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mt-4 flex justify-between items-center">
                <span className="text-lg font-bold">المجموع الكلي:</span>
                <span className="text-2xl font-bold text-primary">
                  {computedTotalPrice.toLocaleString()} دج
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderForm;
