import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Settings, 
  Package, 
  Tag, 
  Phone, 
  ArrowLeft,
  Upload,
  Timer,
  Percent,
  X,
  Check,
  Facebook,
  Instagram,
  MessageSquare,
  ChevronRight
} from 'lucide-react';

interface AdminPanelProps {
  onNavigate: (section: string) => void;
}

interface Category {
  id: string;
  name: string;
  nameAr: string;
  image: string;
}

interface Product {
  id: string;
  categoryId: string;
  name: string;
  nameAr: string;
  price: number;
  // prix de gros / wholesale price
  prixDeGros?: number;
  description: string;
  descriptionAr: string;
  image: string;
  inStock: boolean;
}

interface SpecialOffer {
  id: string;
  productId: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  savings: number;
  endTime: string;
  isActive: boolean;
}

interface ContactInfo {
  phone: string;
  phoneDescription: string;
  whatsapp: string;
  whatsappDescription: string;
  email: string;
  emailDescription: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}

interface SiteSettings {
  siteName: string;
  siteNameAr: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const { toast } = useToast();

  // Initial data
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Automotive Parts', nameAr: 'قطع غيار السيارات', image: '/src/assets/automotive-parts.jpg' },
    { id: '2', name: 'Industrial Equipment', nameAr: 'المعدات الصناعية', image: '/src/assets/industrial-parts.jpg' },
    { id: '3', name: 'Tools', nameAr: 'الأدوات', image: '/src/assets/tools.jpg' },
    { id: '4', name: 'Electronics', nameAr: 'الإلكترونيات', image: '/src/assets/electronics.jpg' }
  ]);

  const [products, setProducts] = useState<Product[]>([
    { 
      id: '1', 
      categoryId: '1', 
      name: 'Brake Pads', 
      nameAr: 'مكابح السيارة', 
      price: 2500, 
      prixDeGros: 2000,
      description: 'High quality brake pads', 
      descriptionAr: 'مكابح عالية الجودة للسيارات', 
      image: '/src/assets/automotive-parts.jpg', 
      inStock: true 
    }
  ]);

  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([
    {
      id: '1',
      productId: '1',
      originalPrice: 3000,
      discountedPrice: 2500,
      discountPercentage: 17,
      savings: 500,
      endTime: '2024-12-31T23:59:59',
      isActive: true
    }
  ]);

  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    phone: '0555 123 456',
    phoneDescription: 'متاح من السبت إلى الخميس',
    whatsapp: '0666 789 012',
    whatsappDescription: 'متاح 24/7 للرد السريع',
    email: 'info@nasser-equipments.dz',
    emailDescription: 'للاستفسارات التفصيلية',
    facebook: 'https://facebook.com/nasser-equipment',
    instagram: 'https://instagram.com/nasser_equipment',
    tiktok: 'https://tiktok.com/@nasser_equipment'
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'Nasser Equipment & Materials',
    siteNameAr: 'ناصر للمعدات و العتاد'
  });

  const [newCategory, setNewCategory] = useState({ name: '', nameAr: '', image: '' });
  const [newProduct, setNewProduct] = useState({
    categoryId: '',
    name: '',
    nameAr: '',
    price: 0,
    prixDeGros: 0,
    description: '',
    descriptionAr: '',
    image: '',
    inStock: true
  });
  const [newOffer, setNewOffer] = useState({
    productId: '',
    originalPrice: 0,
    discountedPrice: 0,
    discountPercentage: 0,
    endTime: '',
    isActive: true
  });

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Navigation state for smooth transitions
  const [currentView, setCurrentView] = useState<'main' | 'add-category' | 'edit-category' | 'add-offer' | 'edit-offer'>('main');
  const [activeTab, setActiveTab] = useState('categories');

  // Category management
  const addCategory = () => {
    if (!newCategory.name || !newCategory.nameAr) return;
    
    const category: Category = {
      id: Date.now().toString(),
      ...newCategory
    };
    
    setCategories([...categories, category]);
    setNewCategory({ name: '', nameAr: '', image: '' });
    setShowAddCategory(false);
    toast({ title: 'تم إضافة الفئة بنجاح' });
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
    setProducts(products.filter(prod => prod.categoryId !== id));
    toast({ title: 'تم حذف الفئة بنجاح' });
  };

  // Product management
  const addProduct = () => {
    if (!newProduct.name || !newProduct.nameAr || !newProduct.categoryId) return;
    
    const product: Product = {
      id: Date.now().toString(),
      ...newProduct
    };
    
    setProducts([...products, product]);
    setNewProduct({
      categoryId: '',
      name: '',
      nameAr: '',
      price: 0,
      description: '',
      descriptionAr: '',
      image: '',
      inStock: true
    });
    setEditingProduct(null);
    toast({ title: 'تم إضافة المنتج بنجاح' });
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(prod => prod.id !== id));
    setSpecialOffers(specialOffers.filter(offer => offer.productId !== id));
    toast({ title: 'تم حذف المنتج بنجاح' });
  };

  // Special offers management
  const addSpecialOffer = () => {
    if (!newOffer.productId || !newOffer.originalPrice || !newOffer.discountedPrice) return;
    
    const savings = newOffer.originalPrice - newOffer.discountedPrice;
    const discountPercentage = Math.round((savings / newOffer.originalPrice) * 100);
    
    const offer: SpecialOffer = {
      id: Date.now().toString(),
      ...newOffer,
      savings,
      discountPercentage
    };
    
    setSpecialOffers([...specialOffers, offer]);
    setNewOffer({
      productId: '',
      originalPrice: 0,
      discountedPrice: 0,
      discountPercentage: 0,
      endTime: '',
      isActive: true
    });
    setShowAddOffer(false);
    toast({ title: 'تم إضافة العرض الخاص بنجاح' });
  };

  const deleteSpecialOffer = (id: string) => {
    setSpecialOffers(specialOffers.filter(offer => offer.id !== id));
    toast({ title: 'تم حذف العرض الخاص بنجاح' });
  };

  // Save functions
  const saveContactInfo = () => {
    toast({ title: 'تم حفظ معلومات التواصل بنجاح' });
  };

  const saveSiteSettings = () => {
    toast({ title: 'تم حفظ إعدادات الموقع بنجاح' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              لوحة إدارة الموقع
            </h1>
            <p className="text-muted-foreground text-lg">إدارة محتوى ومنتجات متجر ناصر للمعدات والعتاد</p>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate('home')}
            className="hover-scale bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 hover:border-primary/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            العودة للموقع
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-white/80 backdrop-blur-sm shadow-lg border border-primary/20">
            <TabsTrigger 
              value="categories" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              الفئات
            </TabsTrigger>
            <TabsTrigger 
              value="offers" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white"
            >
              <Percent className="h-4 w-4" />
              العروض الخاصة
            </TabsTrigger>
            <TabsTrigger 
              value="contact" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white"
            >
              <Phone className="h-4 w-4" />
              التواصل
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* Categories Management */}
          <TabsContent value="categories" className="space-y-6">
            <div className="relative overflow-hidden min-h-[600px]">
              {/* Main Categories View */}
              <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
                currentView === 'main' ? 'translate-x-0' : '-translate-x-full'
              }`}>
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-primary/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <Package className="h-7 w-7 mr-3 text-primary" />
                      إدارة الفئات
                    </h2>
                    <Button 
                      onClick={() => setCurrentView('add-category')}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover-scale"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      إضافة فئة جديدة
                    </Button>
                  </div>

                  {/* Categories Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category) => {
                      const categoryProducts = products.filter(p => p.categoryId === category.id);
                      return (
                        <div key={category.id} className="group bg-gradient-to-br from-white to-primary/5 border border-primary/20 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                          <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-4 overflow-hidden shadow-inner">
                            {category.image && (
                              <img 
                                src={category.image} 
                                alt={category.nameAr}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                          </div>
                          <h4 className="font-bold text-xl text-foreground mb-2">{category.nameAr}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{category.name}</p>
                          <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-primary/20">
                            {categoryProducts.length} منتج
                          </Badge>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedCategory(category.id);
                                setCurrentView('edit-category');
                              }}
                              className="flex-1 border-primary/30 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 hover:border-primary/50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              تعديل
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteCategory(category.id)}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              حذف
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Add Category Form - Slide in from right */}
              <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
                currentView === 'add-category' ? 'translate-x-0' : 'translate-x-full'
              }`}>
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-primary/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <Plus className="h-6 w-6 mr-3 text-primary" />
                      إضافة فئة جديدة
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentView('main')}
                      className="hover:bg-primary/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">اسم الفئة (بالعربية)</Label>
                        <Input
                          value={newCategory.nameAr}
                          onChange={(e) => setNewCategory({...newCategory, nameAr: e.target.value})}
                          placeholder="اسم الفئة"
                          className="border-primary/30 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">اسم الفئة (بالإنجليزية)</Label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                          placeholder="Category Name"
                          className="border-primary/30 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">رابط الصورة</Label>
                      <Input
                        value={newCategory.image}
                        onChange={(e) => setNewCategory({...newCategory, image: e.target.value})}
                        placeholder="/src/assets/category-image.jpg"
                        className="border-primary/30 focus:border-primary focus:ring-primary/20"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={() => {
                          addCategory();
                          setCurrentView('main');
                        }}
                        className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover-scale"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        حفظ الفئة
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentView('main')}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Edit Category Form - Slide in from right */}
              <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
                currentView === 'edit-category' ? 'translate-x-0' : 'translate-x-full'
              }`}>
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-primary/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <Edit className="h-6 w-6 mr-3 text-primary" />
                      تعديل فئة: {categories.find(c => c.id === selectedCategory)?.nameAr}
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentView('main')}
                      className="hover:bg-primary/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Category Products Management */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-foreground">منتجات الفئة</h4>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setNewProduct({...newProduct, categoryId: selectedCategory || ''});
                          setEditingProduct('new');
                        }}
                        className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة منتج
                      </Button>
                    </div>

                    {/* Add/Edit Product Form */}
                    {editingProduct === 'new' && (
                      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-xl mb-6 border border-primary/20 animate-fade-in">
                        <h4 className="text-lg font-semibold mb-4 text-primary">إضافة منتج جديد</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">اسم المنتج (بالعربية)</Label>
                            <Input
                              value={newProduct.nameAr}
                              onChange={(e) => setNewProduct({...newProduct, nameAr: e.target.value})}
                              placeholder="اسم المنتج"
                              className="border-primary/30 focus:border-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">اسم المنتج (بالإنجليزية)</Label>
                            <Input
                              value={newProduct.name}
                              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                              placeholder="Product Name"
                              className="border-primary/30 focus:border-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">السعر (دج)</Label>
                            <Input
                              type="number"
                              value={newProduct.price}
                              onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                              placeholder="0"
                              className="border-primary/30 focus:border-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Prix de gros (دج)</Label>
                            <Input
                              type="number"
                              value={newProduct.prixDeGros}
                              onChange={(e) => setNewProduct({...newProduct, prixDeGros: Number(e.target.value)})}
                              placeholder="0"
                              className="border-primary/30 focus:border-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">رابط الصورة</Label>
                            <Input
                              value={newProduct.image}
                              onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                              placeholder="/src/assets/product-image.jpg"
                              className="border-primary/30 focus:border-primary"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-sm font-medium">الوصف (بالعربية)</Label>
                            <Textarea
                              value={newProduct.descriptionAr}
                              onChange={(e) => setNewProduct({...newProduct, descriptionAr: e.target.value})}
                              placeholder="وصف المنتج"
                              className="border-primary/30 focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={addProduct} 
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            حفظ المنتج
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingProduct(null)}
                            className="border-primary/30 hover:bg-primary/10"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Products List */}
                    <div className="space-y-3">
                      {products.filter(p => p.categoryId === selectedCategory).map(product => (
                        <div key={product.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-primary/5 border border-primary/20 rounded-lg hover:shadow-md transition-all duration-200">
                          <div className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden shadow-inner">
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={product.nameAr}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-lg">{product.nameAr}</h5>
                            <p className="text-sm text-muted-foreground">{product.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="border-primary/30 text-primary">{product.price} دج</Badge>
                              {product.prixDeGros !== undefined && (
                                <Badge variant="outline" className="border-green-200 text-green-700">{product.prixDeGros} دج</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="border-primary/30 hover:bg-primary/10">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Special Offers Management */}
          <TabsContent value="offers" className="space-y-6">
            <div className="relative overflow-hidden min-h-[600px]">
              {/* Main Offers View */}
              <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
                currentView === 'main' ? 'translate-x-0' : '-translate-x-full'
              }`}>
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-primary/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <Percent className="h-7 w-7 mr-3 text-primary" />
                      إدارة العروض الخاصة
                    </h2>
                    <Button 
                      onClick={() => setCurrentView('add-offer')}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover-scale"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      إضافة عرض جديد
                    </Button>
                  </div>

                  {/* Offers List */}
                  <div className="space-y-4">
                    {specialOffers.map((offer) => {
                      const product = products.find(p => p.id === offer.productId);
                      return (
                        <div key={offer.id} className="bg-gradient-to-r from-white to-primary/5 border border-primary/20 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden shadow-inner">
                              {product?.image && (
                                <img 
                                  src={product.image} 
                                  alt={product.nameAr}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold">{product?.nameAr}</h4>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="destructive" className="bg-red-500 text-white">
                                  -{offer.discountPercentage}%
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-primary">{offer.discountedPrice} دج</span>
                                  <span className="text-sm text-muted-foreground line-through">{offer.originalPrice} دج</span>
                                </div>
                                <Badge variant="outline" className="border-green-500 text-green-600">
                                  وفر {offer.savings} دج
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                ينتهي في: {new Date(offer.endTime).toLocaleDateString('ar-DZ')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditingOffer(offer.id);
                                  setCurrentView('edit-offer');
                                }}
                                className="border-primary/30 hover:bg-primary/10"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => deleteSpecialOffer(offer.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Add Offer Form */}
              <div className={`absolute top-0 left-0 w-full transition-transform duration-500 ease-in-out ${
                currentView === 'add-offer' ? 'translate-x-0' : 'translate-x-full'
              }`}>
                <Card className="bg-white/90 backdrop-blur-sm shadow-xl border border-primary/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      <Plus className="h-6 w-6 mr-3 text-primary" />
                      إضافة عرض خاص جديد
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCurrentView('main')}
                      className="hover:bg-primary/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">المنتج</Label>
                        <select 
                          value={newOffer.productId}
                          onChange={(e) => setNewOffer({...newOffer, productId: e.target.value})}
                          className="w-full p-2 border border-primary/30 rounded-md focus:border-primary focus:ring-primary/20"
                        >
                          <option value="">اختر المنتج</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.nameAr}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">تاريخ انتهاء العرض</Label>
                        <Input
                          type="datetime-local"
                          value={newOffer.endTime}
                          onChange={(e) => setNewOffer({...newOffer, endTime: e.target.value})}
                          className="border-primary/30 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">السعر الأصلي (دج)</Label>
                        <Input
                          type="number"
                          value={newOffer.originalPrice}
                          onChange={(e) => setNewOffer({...newOffer, originalPrice: Number(e.target.value)})}
                          placeholder="3000"
                          className="border-primary/30 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">السعر بعد التخفيض (دج)</Label>
                        <Input
                          type="number"
                          value={newOffer.discountedPrice}
                          onChange={(e) => setNewOffer({...newOffer, discountedPrice: Number(e.target.value)})}
                          placeholder="2500"
                          className="border-primary/30 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={() => {
                          addSpecialOffer();
                          setCurrentView('main');
                        }}
                        className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover-scale"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        حفظ العرض
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentView('main')}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contact Information Management */}
          <TabsContent value="contact" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-primary/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  <Phone className="h-7 w-7 mr-3 text-primary" />
                  إدارة معلومات التواصل
                </h2>
              </div>

              <div className="space-y-8">
                {/* Contact Details */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">معلومات الاتصال</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">رقم الهاتف</Label>
                        <Input
                          value={contactInfo.phone}
                          onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                          className="border-primary/30 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">وصف الهاتف</Label>
                        <Input
                          value={contactInfo.phoneDescription}
                          onChange={(e) => setContactInfo({...contactInfo, phoneDescription: e.target.value})}
                          className="border-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">رقم الواتساب</Label>
                        <Input
                          value={contactInfo.whatsapp}
                          onChange={(e) => setContactInfo({...contactInfo, whatsapp: e.target.value})}
                          className="border-primary/30 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">وصف الواتساب</Label>
                        <Input
                          value={contactInfo.whatsappDescription}
                          onChange={(e) => setContactInfo({...contactInfo, whatsappDescription: e.target.value})}
                          className="border-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                      <Input
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">وصف البريد الإلكتروني</Label>
                      <Input
                        value={contactInfo.emailDescription}
                        onChange={(e) => setContactInfo({...contactInfo, emailDescription: e.target.value})}
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">روابط وسائل التواصل الاجتماعي</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Facebook className="h-4 w-4" />
                        فيسبوك
                      </Label>
                      <Input
                        value={contactInfo.facebook}
                        onChange={(e) => setContactInfo({...contactInfo, facebook: e.target.value})}
                        placeholder="https://facebook.com/..."
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Instagram className="h-4 w-4" />
                        إنستجرام
                      </Label>
                      <Input
                        value={contactInfo.instagram}
                        onChange={(e) => setContactInfo({...contactInfo, instagram: e.target.value})}
                        placeholder="https://instagram.com/..."
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        تيك توك
                      </Label>
                      <Input
                        value={contactInfo.tiktok}
                        onChange={(e) => setContactInfo({...contactInfo, tiktok: e.target.value})}
                        placeholder="https://tiktok.com/..."
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={saveContactInfo}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover-scale"
                >
                  <Save className="h-4 w-4 mr-2" />
                  حفظ معلومات التواصل
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Site Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-primary/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  <Settings className="h-7 w-7 mr-3 text-primary" />
                  إعدادات الموقع
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">اسم الموقع (بالعربية)</Label>
                    <Input
                      value={siteSettings.siteNameAr}
                      onChange={(e) => setSiteSettings({...siteSettings, siteNameAr: e.target.value})}
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">اسم الموقع (بالإنجليزية)</Label>
                    <Input
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                <Button 
                  onClick={saveSiteSettings}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover-scale"
                >
                  <Save className="h-4 w-4 mr-2" />
                  حفظ الإعدادات
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
