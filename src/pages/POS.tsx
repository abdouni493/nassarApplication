import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus,
  Minus,
  Trash2,
  CreditCard,
  ShoppingCart,
  Package,
  DollarSign,
  Check,
  X,
  Printer,
  Car,
  Store,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

// --- Type Definitions ---
interface Product {
  id: number;
  name: string;
  barcode: string;
  brand: string;
  category: string;
  buying_price: number;
  selling_price: number;
  wholesale_price: number; // Added wholesale price
  margin_percent: number;
  initial_quantity: number;
  current_quantity: number; // Current stock
  min_quantity: number;
  supplier: string;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Fixed amount discount in DA
  total: number; // Total after quantity and discount
}

interface SaleInvoiceItem {
  id: number;
  invoice_id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  purchase_price: number;
  margin_percent: number;
  selling_price: number;
  quantity: number;
  min_quantity: number;
  total: number;
}

interface SaleInvoice {
  id: number;
  type: 'sale';
  client_name: string;
  client_phone: string;
  clientId: string;
  total: number;
  amount_paid: number;
  created_at: string;
  items: SaleInvoiceItem[];
}

// Function to format currency
const formatCurrencyLocal = (amount: number, language: string) => 
  new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { 
    style: 'currency', 
    currency: 'DZD' 
  }).format(amount);

export default function POS() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [printConfirmationDialog, setPrintConfirmationDialog] = useState(false);
  const [lastSaleInvoice, setLastSaleInvoice] = useState<SaleInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [priceMode, setPriceMode] = useState<'retail' | 'wholesale'>('retail'); // New state for price mode
  const [globalDiscount, setGlobalDiscount] = useState(0); // New state for global discount in DA

  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch Products from API ---
  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data.filter((p: Product) => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode?.includes(searchQuery)
        ));
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحميل المنتجات.' : 'Failed to load products.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Use a single useEffect for filtering and barcode scanning
  useEffect(() => {
    const handler = setTimeout(() => {
      // Barcode scanning logic
      const isBarcode = /^\d+$/.test(searchQuery);
      if (isBarcode && searchQuery.length >= 8) {
        const scannedProduct = products.find(p => p.barcode === searchQuery);
        if (scannedProduct) {
          addToCart(scannedProduct);
          setSearchQuery('');
          return;
        } else {
          toast({
            title: language === 'ar' ? 'تحذير' : 'Attention',
            description: language === 'ar' ? `المنتج بالباركود ${searchQuery} غير موجود.` : `Produit avec le code-barres ${searchQuery} introuvable.`,
            variant: 'destructive'
          });
          setSearchQuery('');
          return;
        }
      }

      // Regular search filtering
      const results = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode?.includes(searchQuery)
      );
      setFilteredProducts(results);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, products, language]);

  // Get product price based on current mode
  const getProductPrice = (product: Product) => {
    return priceMode === 'wholesale' ? product.wholesale_price : product.selling_price;
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (getProductPrice(item.product) * item.quantity), 0);
  const totalProductDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalBeforeGlobalDiscount = subtotal - totalProductDiscounts;
  const finalTotal = Math.max(0, totalBeforeGlobalDiscount - globalDiscount);

  const remainingDebt = finalTotal - receivedAmount;
  const change = receivedAmount - finalTotal;

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    const productPrice = getProductPrice(product);
    
    if (product.current_quantity <= 0) {
      toast({
        title: language === 'ar' ? 'تحذير' : 'Attention',
        description: language === 'ar' ? 'المنتج غير متوفر في المخزون.' : 'Ce produit est en rupture de stock.',
        variant: 'destructive'
      });
      return;
    }

    if (existingItem) {
      if (existingItem.quantity + 1 > product.current_quantity) {
        toast({
          title: language === 'ar' ? 'تحذير' : 'Attention',
          description: language === 'ar' ? `لا يوجد ما يكفي من ${product.name} في المخزون. الكمية المتوفرة: ${product.current_quantity}.` : `Pas assez de ${product.name} en stock. Quantité disponible: ${product.current_quantity}.`,
          variant: 'destructive'
        });
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              total: (item.quantity + 1) * productPrice - item.discount
            }
          : item
      ));
    } else {
      setCart([...cart, { 
        product, 
        quantity: 1, 
        discount: 0,
        total: productPrice
      }]);
    }
    
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    const productInStock = products.find(p => p.id === productId);
    if (!productInStock) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > productInStock.current_quantity) {
      toast({
        title: language === 'ar' ? 'تحذير' : 'Attention',
        description: language === 'ar' ? `لا يوجد ما يكفي من ${productInStock.name} في المخزون. الكمية المتوفرة: ${productInStock.current_quantity}.` : `Pas assez de ${productInStock.name} en stock. Quantité disponible: ${productInStock.current_quantity}.`,
        variant: 'destructive'
      });
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { 
            ...item, 
            quantity: newQuantity, 
            total: (newQuantity * getProductPrice(item.product)) - item.discount
          }
        : item
    ));
  };

  const updateDiscount = (productId: number, discount: number) => {
    const item = cart.find(item => item.product.id === productId);
    if (!item) return;
    
    const productPrice = getProductPrice(item.product);
    const maxDiscount = item.quantity * productPrice;
    
    // Ensure discount doesn't exceed item total
    const safeDiscount = Math.max(0, Math.min(discount, maxDiscount));
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { 
            ...item, 
            discount: safeDiscount, 
            total: (item.quantity * productPrice) - safeDiscount
          }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setClientName('');
    setClientPhone('');
    setReceivedAmount(0);
    setGlobalDiscount(0);
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const completeSale = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const invoiceData = {
        type: 'sale',
        client_name: clientName.trim() || null,
        client_phone: clientPhone.trim() || null,
        clientId: null,
        total: finalTotal,
        amount_paid: receivedAmount,
        createdBy: user.id || null,
        createdByType: user.role === "employee" ? "employee" : "admin",
        price_mode: priceMode, // Include price mode in invoice
        global_discount: globalDiscount, // Include global discount
        items: cart.map(({ product, quantity, discount, total }) => ({
          id: product.id,
          name: product.name,
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          buying_price: product.buying_price ?? 0,
          margin_percent: product.margin_percent ?? 0,
          selling_price: priceMode === 'wholesale' ? product.wholesale_price : product.selling_price,
          quantity,
          min_quantity: product.min_quantity ?? 0,
          discount, // Store the discount amount
          total
        }))
      };

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        throw new Error('Failed to create sale invoice');
      }

      const newInvoice = await response.json();
      
      // ✅ SUCCESS: Show success message and reset everything
      setLastSaleInvoice(newInvoice);
      
      toast({
        title: language === 'ar' ? 'نجح' : 'Succès',
        description: language === 'ar' 
          ? `تم إنشاء فاتورة البيع #${newInvoice.id} بنجاح!` 
          : `Facture de vente #${newInvoice.id} créée avec succès!`,
        variant: 'default',
      });

      // Close payment dialog and clear cart
      setPaymentDialog(false);
      clearCart();
      
      // Ask if user wants to print
      setPrintConfirmationDialog(true);
      
      // Refresh products to update stock
      fetchProducts();

    } catch (error) {
      console.error('Error completing sale:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إتمام عملية البيع.' : 'Échec de la finalisation de la vente.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const printSaleInvoice = () => {
    if (!lastSaleInvoice) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'لا توجد فاتورة للطباعة.' : 'Aucune facture à imprimer.',
        variant: 'destructive'
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const invoiceType = language === 'ar' ? 'فاتورة بيع' : 'Facture de Vente';
      const invoiceDate = new Date(lastSaleInvoice.created_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-DZ', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      
      const clientDisplayedName = lastSaleInvoice.client_name || 
                                 lastSaleInvoice.clientId || 
                                 (language === 'ar' ? 'العميل عابر' : 'Client de passage');
      
      const debtAmount = lastSaleInvoice.total - lastSaleInvoice.amount_paid;
      const changeAmount = lastSaleInvoice.amount_paid - lastSaleInvoice.total;

      printWindow.document.write(`
        <html>
          <head>
            <title>${invoiceType} #${lastSaleInvoice.id}</title>
            <style>
              body { font-family: 'Inter', sans-serif; margin: 20px; color: #333; }
              .print-container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
              .invoice-header-print { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 15px; }
              .store-logo-title-print { display: flex; align-items: center; gap: 10px; }
              .logo-circle-print { width: 40px; height: 40px; border-radius: 50%; background-color: #007bff; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
              .logo-circle-print svg { width: 24px; height: 24px; }
              .store-name-print { font-size: 22px; font-weight: bold; color: #333; margin: 0; }
              .invoice-meta-print { text-align: right; }
              .invoice-meta-print h2 { font-size: 20px; margin-bottom: 5px; color: #555; }
              .invoice-meta-print p { margin: 0; font-size: 14px; color: #777; }
              .detail-item label { font-weight: bold; color: #555; display: block; margin-bottom: 3px; }
              .detail-item p { margin: 0; font-size: 16px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #e0e0e0; padding: 10px 12px; text-align: left; }
              th { background-color: #f8f8f8; font-weight: bold; color: #555; }
              td { font-size: 15px; color: #444; }
              .text-right { text-align: right; }
              .font-semibold { font-weight: 600; }
              .text-primary { color: #007bff; }
              .total-summary { display: flex; justify-content: flex-end; margin-top: 30px; }
              .total-box { border-top: 2px solid #ddd; padding-top: 15px; width: 100%; max-width: 250px; }
              .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .total-line span:first-child { color: #555; }
              .total-line span:last-child { font-weight: bold; color: #333; }
              .final-total { font-size: 1.4em; font-weight: bold; color: #007bff; border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px; }
              .discount-line { color: #d9534f; }
              .debt-line { color: #d9534f; }
              .change-line { color: #28a745; }
              @media print { body { margin: 0; } .print-container { border: none; box-shadow: none; } }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="invoice-header-print">
                <div class="store-logo-title-print">
                    <div class="logo-circle-print">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-car"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.3 16.8 10 15 10s-3.7.3-4.5.6c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M14 17H4V5l3-4h7l3 4v2"/><path d="M7 9h11"/></svg>
                    </div>
                    <h1 class="store-name-print">Nasser AUTO PIECES</h1>
                </div>
                <div class="invoice-meta-print">
                  <h2>${invoiceType} - #${lastSaleInvoice.id}</h2>
                  <p>${invoiceDate}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="detail-item">
                    <label>${language === 'ar' ? 'العميل' : 'Client'}:</label>
                    <p class="font-medium">${clientDisplayedName}</p>
                </div>
                
                ${lastSaleInvoice.client_phone ? `
                  <div class="detail-item">
                    <label>${language === 'ar' ? 'هاتف العميل' : 'Téléphone du Client'}:</label>
                    <p class="font-medium">${lastSaleInvoice.client_phone}</p>
                  </div>
                ` : ''}
                
                <table class="w-full">
                  <thead>
                    <tr>
                      <th>${language === 'ar' ? 'المنتج' : 'Produit'}</th>
                      <th>${language === 'ar' ? 'الكمية' : 'Qté'}</th>
                      <th>${language === 'ar' ? 'السعر' : 'Prix Unitaire'}</th>
                      <th class="text-right">${language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lastSaleInvoice.items.map(item => `
                      <tr>
                        <td>${item.product_name}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrencyLocal(item.selling_price, language)}</td>
                        <td class="text-right">${formatCurrencyLocal(item.total, language)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="total-summary">
                  <div class="total-box">
                    <div class="total-line final-total">
                      <span>${language === 'ar' ? 'المبلغ الإجمالي' : 'Total Facture'}:</span>
                      <span>${formatCurrencyLocal(lastSaleInvoice.total, language)}</span>
                    </div>
                    <div class="total-line">
                      <span>${language === 'ar' ? 'المبلغ المدفوع' : 'Montant Payé'}:</span>
                      <span>${formatCurrencyLocal(lastSaleInvoice.amount_paid, language)}</span>
                    </div>
                    ${debtAmount > 0 ? `
                        <div class="total-line debt-line">
                            <span>${language === 'ar' ? 'المبلغ المتبقي' : 'Dette Restante'}:</span>
                            <span>${formatCurrencyLocal(debtAmount, language)}</span>
                        </div>
                    ` : ''}
                    ${changeAmount > 0 ? `
                        <div class="total-line change-line">
                            <span>${language === 'ar' ? 'الباقي' : 'Monnaie'}:</span>
                            <span>${formatCurrencyLocal(changeAmount, language)}</span>
                        </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }
  };

  // Auto-focus on search input
  useEffect(() => {
    const handleFocus = () => {
      const activeElement = document.activeElement;
      const isAnyInputFocused = 
        activeElement instanceof HTMLInputElement || 
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;

      if (!isAnyInputFocused && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    handleFocus();
    const interval = setInterval(handleFocus, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex h-[calc(100vh-2rem)] gap-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Panel - Product Search */}
      <div className="flex-1 space-y-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {language === 'ar' ? 'بحث المنتجات' : 'Recherche de Produits'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={language === 'ar' ? 'البحث بالاسم أو الباركود...' : 'Rechercher par nom ou code-barres...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} search-input`}
              />
            </div>

            {/* Price Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant={priceMode === 'retail' ? 'default' : 'outline'}
                  onClick={() => setPriceMode('retail')}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {language === 'ar' ? 'بيع بالتجزئة' : 'Vente au détail'}
                </Button>
                <Button
                  type="button"
                  variant={priceMode === 'wholesale' ? 'default' : 'outline'}
                  onClick={() => setPriceMode('wholesale')}
                  className="flex items-center gap-2"
                >
                  <Store className="h-4 w-4" />
                  {language === 'ar' ? 'بيع بالجملة' : 'Vente en gros'}
                </Button>
              </div>
              <Badge variant={priceMode === 'retail' ? 'default' : 'secondary'}>
                {priceMode === 'retail' 
                  ? language === 'ar' ? 'سعر التجزئة' : 'Prix détail'
                  : language === 'ar' ? 'سعر الجملة' : 'Prix gros'
                }
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <Card className="card-elevated flex-1">
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? `المنتجات المتوفرة (${filteredProducts.length})` : `Produits Disponibles (${filteredProducts.length})`}
              <Badge variant="outline" className="ml-2">
                {priceMode === 'retail' 
                  ? language === 'ar' ? 'سعر التجزئة' : 'Prix détail'
                  : language === 'ar' ? 'سعر الجملة' : 'Prix gros'
                }
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => {
                const currentPrice = getProductPrice(product);
                return (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 ease-in-out border-2 border-transparent hover:border-blue-400 bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-base line-clamp-2 text-gray-800 dark:text-gray-100">{product.name}</h3>
                          <Badge 
                            variant={product.current_quantity > product.min_quantity ? 'default' : 'destructive'}
                            className="text-xs px-2 py-1 rounded-full"
                          >
                            {product.current_quantity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{product.barcode}</p>
                      </div>
                      <div className="mt-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-3">
                        <div>
                          <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                            {formatCurrencyLocal(currentPrice, language)}
                          </span>
                          {priceMode === 'wholesale' && product.selling_price > currentPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatCurrencyLocal(product.selling_price, language)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Cart and Payment */}
      <div className="w-96 space-y-6">
        {/* Cart */}
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {language === 'ar' ? `السلة (${cart.length})` : `Panier (${cart.length})`}
                <Badge variant="outline" className="text-xs">
                  {priceMode === 'retail' 
                    ? language === 'ar' ? 'تجزئة' : 'détail'
                    : language === 'ar' ? 'جملة' : 'gros'
                  }
                </Badge>
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Information Input */}
            <div className="space-y-3">
              <div>
                <Label>{language === 'ar' ? 'اسم العميل' : 'Nom du Client'}</Label>
                <Input
                  type="text"
                  placeholder={language === 'ar' ? 'اكتب اسم العميل (اختياري)' : 'Taper le nom du client (optionnel)'}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              
              <div>
                <Label>{language === 'ar' ? 'رقم هاتف العميل' : 'Téléphone du Client'}</Label>
                <Input
                  type="tel"
                  placeholder={language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Numéro de téléphone (optionnel)'}
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{language === 'ar' ? 'السلة فارغة' : 'Panier vide'}</p>
                  <p className="text-xs">{language === 'ar' ? 'امسح أو ابحث عن المنتجات' : 'Scannez ou recherchez des produits'}</p>
                </div>
              ) : (
                cart.map((item) => {
                  const productPrice = getProductPrice(item.product);
                  const itemSubtotal = productPrice * item.quantity;
                  return (
                    <div key={item.product.id} className="bg-muted/20 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                          <div className="text-xs text-gray-500">
                            {formatCurrencyLocal(productPrice, language)} × {item.quantity}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.product.id)}
                          className="h-6 w-6"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="h-6 w-6"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="h-6 w-6"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          {item.discount > 0 && (
                            <div className="text-xs text-red-500 line-through">
                              {formatCurrencyLocal(itemSubtotal, language)}
                            </div>
                          )}
                          <span className="font-bold text-success">
                            {formatCurrencyLocal(item.total, language)}
                          </span>
                        </div>
                      </div>

                      {/* Discount Input - Changed from % to DA */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">{language === 'ar' ? 'خصم:' : 'Remise:'}</Label>
                        <Input
                          type="number"
                          placeholder={language === 'ar' ? 'المبلغ بالدينار' : 'Montant en DA'}
                          value={item.discount}
                          onChange={(e) => updateDiscount(item.product.id, Number(e.target.value))}
                          className="h-6 text-xs"
                          min="0"
                          max={itemSubtotal}
                        />
                        <span className="text-xs text-muted-foreground">DA</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cart Summary and Payment */}
        {cart.length > 0 && (
          <Card className="gradient-primary text-primary-foreground">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'المجموع الفرعي' : 'Sous-total'}:</span>
                  <span>{formatCurrencyLocal(subtotal, language)}</span>
                </div>
                
                {totalProductDiscounts > 0 && (
                  <div className="flex justify-between text-yellow-200">
                    <span>{language === 'ar' ? 'خصومات المنتجات' : 'Remises produits'}:</span>
                    <span>-{formatCurrencyLocal(totalProductDiscounts, language)}</span>
                  </div>
                )}
                
                {/* Global Discount Input */}
                <div className="flex items-center justify-between pt-2 border-t border-primary-foreground/20">
                  <div className="flex items-center gap-2">
                    <span>{language === 'ar' ? 'الخصم العام:' : 'Remise générale:'}</span>
                    <Input
                      type="number"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(Math.max(0, Number(e.target.value)))}
                      className="h-6 w-24 text-xs bg-white/10 border-white/20 text-white"
                      min="0"
                      max={totalBeforeGlobalDiscount}
                    />
                    <span className="text-xs">DA</span>
                  </div>
                  {globalDiscount > 0 && (
                    <span className="text-yellow-200">-{formatCurrencyLocal(globalDiscount, language)}</span>
                  )}
                </div>
                
                <hr className="border-primary-foreground/20" />
                
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'المجموع قبل الخصم' : 'Total avant remise'}:</span>
                  <span>{formatCurrencyLocal(totalBeforeGlobalDiscount, language)}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold border-t border-primary-foreground/20 pt-2">
                  <span>{language === 'ar' ? 'الإجمالي النهائي' : 'Total final'}:</span>
                  <span>{formatCurrencyLocal(finalTotal, language)}</span>
                </div>
              </div>

              <Button 
                onClick={() => setPaymentDialog(true)}
                className="w-full bg-white text-primary hover:bg-white/90"
                size="lg"
              >
                <CreditCard className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {language === 'ar' ? `دفع ${formatCurrencyLocal(finalTotal, language)}` : `Payer ${formatCurrencyLocal(finalTotal, language)}`}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'إتمام الدفع نقدا' : 'Finaliser le Paiement en Espèces'}</DialogTitle>
            <DialogDescription>
              {language === 'ar' ? `الإجمالي المطلوب: ${formatCurrencyLocal(finalTotal, language)}` : `Total à payer: ${formatCurrencyLocal(finalTotal, language)}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="receivedAmount">{language === 'ar' ? 'المبلغ المستلم' : 'Montant reçu'}</Label>
              <Input
                id="receivedAmount"
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                placeholder={language === 'ar' ? 'المبلغ نقدا' : 'Montant en espèces'}
                className="mt-1"
              />
            </div>
            
            <Button
              onClick={() => setReceivedAmount(finalTotal)}
              variant="outline"
              className="w-full"
            >
              <DollarSign className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'العميل دفع الكل' : 'Le client a tout payé'}
            </Button>
            
            {receivedAmount !== 0 && (
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="flex justify-between text-lg font-bold">
                  {remainingDebt > 0 ? (
                    <>
                      <span className="text-red-600">{language === 'ar' ? 'المبلغ المتبقي' : 'Dette restante'}:</span>
                      <span className="text-red-600">{formatCurrencyLocal(remainingDebt, language)}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-600">{language === 'ar' ? 'الباقي' : 'Monnaie'}:</span>
                      <span className="text-green-600">{formatCurrencyLocal(Math.abs(change), language)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button 
              onClick={completeSale}
              disabled={receivedAmount < 0 || isProcessing}
              className="gradient-primary text-primary-foreground"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {language === 'ar' ? 'جاري المعالجة...' : 'Traitement...'}
                </div>
              ) : (
                <>
                  <Check className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {language === 'ar' ? 'إتمام البيع' : 'Finaliser'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Confirmation Dialog */}
      <Dialog open={printConfirmationDialog} onOpenChange={setPrintConfirmationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ar' ? 'هل تريد طباعة الفاتورة؟' : 'Voulez-vous imprimer la facture ?'}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintConfirmationDialog(false)}>
              {language === 'ar' ? 'لا' : 'Non'}
            </Button>
            <Button onClick={() => { printSaleInvoice(); setPrintConfirmationDialog(false); }} className="gradient-primary text-primary-foreground">
              <Printer className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'نعم، طباعة' : 'Oui, imprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
