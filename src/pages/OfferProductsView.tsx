import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Eye, Star, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { SpecialOffer, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface OfferProductsViewProps {
  offer: SpecialOffer;
  onBack: () => void;
}

interface OfferProduct extends Omit<Product, 'descriptionFr' | 'descriptionAr' | 'quality' | 'image'> {
  offer_price?: number;
  descriptionFr?: string;
  descriptionAr?: string;
  quality?: number;
  image?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || ' ';
const OfferProductsView = ({ offer, onBack }: OfferProductsViewProps) => {
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OfferProduct | null>(null);
  const [formData, setFormData] = useState({
    offer_price: 0,
    descriptionFr: '',
    descriptionAr: '',
    quality: 5,
    imageFile: null as File | null,
    preview: ''
  });
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    fetchOfferProducts();
    fetchAllProducts();
  }, [offer]);

  const fetchOfferProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers/${offer.id}/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching offer products:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل منتجات العرض' : 'Échec du chargement des produits de l\'offre',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAllProducts(data);
    } catch (error) {
      console.error('Error fetching all products:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل المنتجات' : 'Échec du chargement des produits',
        variant: 'destructive'
      });
    }
  };

  const searchProducts = async () => {
    if (searchTerm.length > 2) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/products?search=${encodeURIComponent(searchTerm)}`
        );
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results.slice(0, 5));
        }
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const selectProductFromSearch = (product: Product) => {
    setSelectedProduct(product as OfferProduct);
    setFormData({
      offer_price: product.selling_price || 0,
      descriptionFr: '',
      descriptionAr: '',
      quality: 5,
      imageFile: null,
      preview: product.image || ''
    });
    setSearchTerm('');
    setSearchResults([]);
  };

  const addProductToOffer = async () => {
    if (!selectedProduct) return;
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('product_id', selectedProduct.id.toString());
      formDataToSend.append('offer_price', formData.offer_price.toString());
      formDataToSend.append('descriptionFr', formData.descriptionFr);
      formDataToSend.append('descriptionAr', formData.descriptionAr);
      formDataToSend.append('quality', formData.quality.toString());
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/special-offers/${offer.id}/products`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: language === 'ar' ? 'تم الإضافة' : 'Ajouté',
        description: language === 'ar' ? 'تمت إضافة المنتج إلى العرض' : 'Produit ajouté à l\'offre',
      });
      setShowAddDialog(false);
      setSelectedProduct(null);
      setFormData({
        offer_price: 0,
        descriptionFr: '',
        descriptionAr: '',
        quality: 5,
        imageFile: null,
        preview: ''
      });
      fetchOfferProducts();
    } catch (error) {
      console.error('Error adding product to offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إضافة المنتج' : 'Échec de l\'ajout du produit',
        variant: 'destructive'
      });
    }
  };

  const updateProductInOffer = async () => {
    if (!selectedProduct) return;
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('offer_price', formData.offer_price.toString());
      formDataToSend.append('descriptionFr', formData.descriptionFr);
      formDataToSend.append('descriptionAr', formData.descriptionAr);
      formDataToSend.append('quality', formData.quality.toString());
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/special-offers/${offer.id}/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Mis à jour',
        description: language === 'ar' ? 'تم تحديث المنتج في العرض' : 'Produit mis à jour dans l\'offre',
      });
      setShowEditDialog(false);
      setSelectedProduct(null);
      setFormData({
        offer_price: 0,
        descriptionFr: '',
        descriptionAr: '',
        quality: 5,
        imageFile: null,
        preview: ''
      });
      fetchOfferProducts();
    } catch (error) {
      console.error('Error updating product in offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحديث المنتج' : 'Échec de la mise à jour du produit',
        variant: 'destructive'
      });
    }
  };

  const removeProductFromOffer = async (productId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers/${offer.id}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Supprimé',
        description: language === 'ar' ? 'تمت إزالة المنتج من العرض' : 'Produit retiré de l\'offre',
      });
      fetchOfferProducts();
    } catch (error) {
      console.error('Error removing product from offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إزالة المنتج' : 'Échec de la suppression du produit',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (product: OfferProduct) => {
    setSelectedProduct(product);
    setFormData({
      offer_price: product.offer_price || product.selling_price || 0,
      descriptionFr: product.descriptionFr || '',
      descriptionAr: product.descriptionAr || '',
      quality: product.quality || 5,
      imageFile: null,
      preview: product.image || ''
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (product: OfferProduct) => {
    setSelectedProduct(product);
    setShowViewDialog(true);
  };

  const calculateSavings = (originalPrice: number, offerPrice: number) => {
    if (originalPrice <= 0 || offerPrice <= 0) return 0;
    return ((originalPrice - offerPrice) / originalPrice) * 100;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-muted-foreground">
          {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={20} className={isRTL ? "ml-2" : "mr-2"} />
          {language === 'ar' ? 'رجوع' : 'Retour'}
        </Button>
        <h2 className="text-2xl font-bold text-foreground">
          {language === 'ar' ? 'منتجات العرض: ' : 'Produits de l\'offre: '}
          {language === 'ar' ? offer.nameAr || offer.name : offer.nameFr || offer.name}
        </h2>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowAddDialog(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus size={20} className={isRTL ? "ml-2" : "mr-2"} />
          {language === 'ar' ? 'إضافة منتج' : 'Ajouter un produit'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <Card
            key={product.id}
            className="p-6 border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-purple-50 hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-4">
              <div className="h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={product.image ? `${API_BASE_URL}${product.image}` : "/placeholder.svg"}
                  alt={product.name || "Product"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {language === 'ar' ? product.nameAr || product.name : product.nameFr || product.name}
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground line-through">
                    {product.selling_price} DZD
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {product.offer_price} DZD
                  </span>
                </div>
                {product.selling_price && product.offer_price && (
                  <div className="mt-1 text-sm text-red-600 font-medium">
                    {language === 'ar' ? 'توفير: ' : 'Économisez: '}
                    {calculateSavings(product.selling_price, product.offer_price).toFixed(0)}%
                  </div>
                )}
                <div className="flex items-center mt-2">
                  <span className="text-sm font-medium mr-2">{language === 'ar' ? 'الجودة:' : 'Qualité:'}</span>
                  {renderStars(product.quality || 5)}
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {language === 'ar' ? product.descriptionAr || product.description : product.descriptionFr || product.description}
                </p>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewDialog(product)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1"
                  >
                    <Eye size={16} className={isRTL ? "ml-1" : "mr-1"} />
                    {language === 'ar' ? 'عرض' : 'Voir'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-1"
                  >
                    <Edit size={16} className={isRTL ? "ml-1" : "mr-1"} />
                    {language === 'ar' ? 'تعديل' : 'Modifier'}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeProductFromOffer(product.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} className={isRTL ? "ml-1" : "mr-1"} />
                  {language === 'ar' ? 'حذف' : 'Supprimer'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {language === 'ar' ? 'لا توجد منتجات في هذا العرض' : 'Aucun produit dans cette offre'}
          </div>
        </div>
      )}

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {language === 'ar' ? 'إضافة منتج إلى العرض' : 'Ajouter un produit à l\'offre'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="searchProduct">{language === 'ar' ? 'بحث عن منتج' : 'Rechercher un produit'}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="searchProduct"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={language === 'ar' ? 'ابحث عن منتج...' : 'Rechercher un produit...'}
                  className="pl-10"
                />
              </div>
              {searchResults.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                  <div className="p-2">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-muted rounded cursor-pointer flex justify-between items-center transition-colors duration-200"
                        onClick={() => selectProductFromSearch(product)}
                      >
                        <div>
                          <div className="font-medium">
                            {language === 'ar' ? product.nameAr || product.name : product.nameFr || product.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {product.selling_price} DZD
                          </div>
                        </div>
                        <Plus size={16} className="text-primary" />
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {selectedProduct && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label>{language === 'ar' ? 'اسم المنتج' : 'Nom du produit'}</Label>
                    <p className="font-medium">
                      {language === 'ar' ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.nameFr || selectedProduct.name}
                    </p>
                  </div>
                  <div className="flex-1">
                    <Label>{language === 'ar' ? 'السعر الأصلي' : 'Prix original'}</Label>
                    <p className="font-medium">{selectedProduct.selling_price} DZD</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="offerPrice">
                      {language === 'ar' ? 'سعر العرض' : 'Prix de l\'offre'} *
                    </Label>
                    <Input
                      id="offerPrice"
                      type="number"
                      value={formData.offer_price}
                      onChange={(e) => setFormData({ ...formData, offer_price: Number(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="quality">
                      {language === 'ar' ? 'الجودة' : 'Qualité'} (1-5)
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="quality"
                        type="number"
                        value={formData.quality}
                        onChange={(e) => setFormData({ ...formData, quality: Math.min(5, Math.max(1, Number(e.target.value))) })}
                        min="1"
                        max="5"
                        className="w-20"
                      />
                      <div className="flex">
                        {renderStars(formData.quality)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="descriptionFr">
                      {language === 'ar' ? 'الوصف بالفرنسية' : 'Description (Français)'}
                    </Label>
                    <Textarea
                      id="descriptionFr"
                      value={formData.descriptionFr}
                      onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل الوصف بالفرنسية...' : 'Entrez la description en français...'}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="descriptionAr">
                      {language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabe)'}
                    </Label>
                    <Textarea
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل الوصف بالعربية...' : 'Entrez la description en arabe...'}
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="image">{language === 'ar' ? 'صورة المنتج' : 'Image du produit'}</Label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              imageFile: file,
                              preview: URL.createObjectURL(file)
                            });
                          }
                        }}
                      />
                    </div>
                    {formData.preview && (
                      <div className="w-20 h-20 border rounded overflow-hidden">
                        <img
                          src={formData.preview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddDialog(false);
                      setSelectedProduct(null);
                    }}
                  >
                    {language === 'ar' ? 'إلغاء' : 'Annuler'}
                  </Button>
                  <Button onClick={addProductToOffer}>
                    {language === 'ar' ? 'إضافة المنتج' : 'Ajouter le produit'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {language === 'ar' ? 'تعديل المنتج في العرض' : 'Modifier le produit dans l\'offre'}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label>{language === 'ar' ? 'اسم المنتج' : 'Nom du produit'}</Label>
                  <p className="font-medium">
                    {language === 'ar' ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.nameFr || selectedProduct.name}
                  </p>
                </div>
                <div className="flex-1">
                  <Label>{language === 'ar' ? 'السعر الأصلي' : 'Prix original'}</Label>
                  <p className="font-medium">{selectedProduct.selling_price} DZD</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editOfferPrice">
                    {language === 'ar' ? 'سعر العرض' : 'Prix de l\'offre'} *
                  </Label>
                  <Input
                    id="editOfferPrice"
                    type="number"
                    value={formData.offer_price}
                    onChange={(e) => setFormData({ ...formData, offer_price: Number(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editQuality">
                    {language === 'ar' ? 'الجودة' : 'Qualité'} (1-5)
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="editQuality"
                      type="number"
                      value={formData.quality}
                      onChange={(e) => setFormData({ ...formData, quality: Math.min(5, Math.max(1, Number(e.target.value))) })}
                      min="1"
                      max="5"
                      className="w-20"
                    />
                    <div className="flex">
                      {renderStars(formData.quality)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editDescriptionFr">
                    {language === 'ar' ? 'الوصف بالفرنسية' : 'Description (Français)'}
                  </Label>
                  <Textarea
                    id="editDescriptionFr"
                    value={formData.descriptionFr}
                    onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل الوصف بالفرنسية...' : 'Entrez la description en français...'}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="editDescriptionAr">
                    {language === 'ar' ? 'الوصف بالعربية' : 'Description (Arabe)'}
                  </Label>
                  <Textarea
                    id="editDescriptionAr"
                    value={formData.descriptionAr}
                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                    placeholder={language === 'ar' ? 'أدخل الوصف بالعربية...' : 'Entrez la description en arabe...'}
                    rows={3}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editImage">{language === 'ar' ? 'صورة المنتج' : 'Image du produit'}</Label>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1">
                    <Input
                      id="editImage"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({
                            ...formData,
                            imageFile: file,
                            preview: URL.createObjectURL(file)
                          });
                        }
                      }}
                    />
                  </div>
                  {formData.preview && (
                    <div className="w-20 h-20 border rounded overflow-hidden">
                      <img
                        src={formData.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedProduct(null);
                  }}
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button onClick={updateProductInOffer}>
                  {language === 'ar' ? 'حفظ التعديلات' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {language === 'ar' ? 'تفاصيل المنتج' : 'Détails du produit'}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-1/2">
                  <div className="h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedProduct.image ? `${API_BASE_URL}${selectedProduct.image}` : "/placeholder.svg"}
                      alt={selectedProduct.name || "Product"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-1/2 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {language === 'ar' ? selectedProduct.nameAr || selectedProduct.name : selectedProduct.nameFr || selectedProduct.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-sm font-medium mr-2">{language === 'ar' ? 'الجودة:' : 'Qualité:'}</span>
                      {renderStars(selectedProduct.quality || 5)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{language === 'ar' ? 'السعر الأصلي:' : 'Prix original:'}</span>
                      <span className="text-lg font-medium line-through">{selectedProduct.selling_price} DZD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{language === 'ar' ? 'سعر العرض:' : 'Prix de l\'offre:'}</span>
                      <span className="text-xl font-bold text-green-600">{selectedProduct.offer_price} DZD</span>
                    </div>
                    {selectedProduct.selling_price && selectedProduct.offer_price && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{language === 'ar' ? 'التوفير:' : 'Économie:'}</span>
                        <span className="text-lg font-bold text-red-600">
                          {calculateSavings(selectedProduct.selling_price, selectedProduct.offer_price).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              
              <div className="flex justify-end">
                <Button onClick={() => setShowViewDialog(false)}>
                  {language === 'ar' ? 'إغلاق' : 'Fermer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfferProductsView;
