import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Play, Pause, Clock, Star, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { SpecialOffer } from '@/types';
import OfferProductsView from './OfferProductsView';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || ' ';

const SpecialOffersManagement = () => {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<SpecialOffer | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProductsView, setShowProductsView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOffers, setFilteredOffers] = useState<SpecialOffer[]>([]);
  const [formData, setFormData] = useState({
    nameFr: '',
    nameAr: '',
    descriptionFr: '',
    descriptionAr: '',
    end_time: ''
  });
  const { language, isRTL } = useLanguage();
  const { toast } = useToast();

  // Fetch offers from API
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOffers(data);
      setFilteredOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحميل العروض الخاصة' : 'Échec du chargement des offres spéciales',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = offers.filter(offer => 
        (offer.nameFr && offer.nameFr.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (offer.nameAr && offer.nameAr.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (offer.descriptionFr && offer.descriptionFr.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (offer.descriptionAr && offer.descriptionAr.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOffers(filtered);
    } else {
      setFilteredOffers(offers);
    }
  }, [searchTerm, offers]);

  const handleCreateOffer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          is_active: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: language === 'ar' ? 'تم الإنشاء' : 'Créé',
        description: language === 'ar' ? 'تم إنشاء العرض بنجاح' : 'Offre créée avec succès',
      });
      setFormData({ 
        nameFr: '', 
        nameAr: '', 
        descriptionFr: '', 
        descriptionAr: '', 
        end_time: '' 
      });
      setShowCreateDialog(false);
      fetchOffers(); // Refresh the list
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في إنشاء العرض' : 'Échec de la création de l\'offre',
        variant: 'destructive'
      });
    }
  };

  const handleEditOffer = async () => {
    if (!selectedOffer) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers/${selectedOffer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Mis à jour',
        description: language === 'ar' ? 'تم تحديث العرض بنجاح' : 'Offre mise à jour avec succès',
      });
      setFormData({ 
        nameFr: '', 
        nameAr: '', 
        descriptionFr: '', 
        descriptionAr: '', 
        end_time: '' 
      });
      setShowEditDialog(false);
      setSelectedOffer(null);
      fetchOffers(); // Refresh the list
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تحديث العرض' : 'Échec de la mise à jour de l\'offre',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Êtes-vous sûr de vouloir supprimer cette offre?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers/${offerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Supprimé',
        description: language === 'ar' ? 'تم حذف العرض بنجاح' : 'Offre supprimée avec succès',
      });
      fetchOffers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في حذف العرض' : 'Échec de la suppression de l\'offre',
        variant: 'destructive'
      });
    }
  };

  const toggleOfferStatus = async (offerId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/special-offers/${offerId}/toggle-status`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Mis à jour',
        description: language === 'ar' ? 'تم تغيير حالة العرض' : 'Statut de l\'offre modifié',
      });
      fetchOffers(); // Refresh the list
    } catch (error) {
      console.error('Error toggling offer status:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'فشل في تغيير حالة العرض' : 'Échec du changement de statut de l\'offre',
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (offer: SpecialOffer) => {
    setSelectedOffer(offer);
    setFormData({
      nameFr: offer.nameFr || '',
      nameAr: offer.nameAr || '',
      descriptionFr: offer.descriptionFr || '',
      descriptionAr: offer.descriptionAr || '',
      end_time: offer.end_time || ''
    });
    setShowEditDialog(true);
  };

  const openProductsView = (offer: SpecialOffer) => {
    setSelectedOffer(offer);
    setShowProductsView(true);
  };

  const formatEndTime = (endTime: string) => {
    if (!endTime) {
      return language === 'ar' ? 'غير محدد' : 'Non spécifié';
    }
    return new Date(endTime).toLocaleString(language === 'ar' ? 'ar-MA' : 'fr-FR');
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

  if (showProductsView && selectedOffer) {
    return (
      <OfferProductsView 
        offer={selectedOffer} 
        onBack={() => setShowProductsView(false)} 
      />
    );
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-foreground">
          {language === 'ar' ? 'إدارة العروض الخاصة' : 'Gestion des offres spéciales'}
        </h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              <Plus size={20} className={isRTL ? "ml-2" : "mr-2"} />
              {language === 'ar' ? 'عرض جديد' : 'Nouvelle offre'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary">
                {language === 'ar' ? 'إنشاء عرض خاص جديد' : 'Créer une nouvelle offre spéciale'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nameFr" className="text-sm font-medium">
                  {language === 'ar' ? 'الاسم (فرنسي)' : 'Nom (Français)'}
                </Label>
                <Input
                  id="nameFr"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  placeholder={language === 'ar' ? 'الاسم باللغة الفرنسية' : 'Nom en français'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr" className="text-sm font-medium">
                  {language === 'ar' ? 'الاسم (عربي)' : 'Nom (Arabe)'}
                </Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder={language === 'ar' ? 'الاسم باللغة العربية' : 'Nom en arabe'}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-sm font-medium">
                  {language === 'ar' ? 'وقت الانتهاء' : 'Heure de fin'}
                </Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descriptionFr" className="text-sm font-medium">
                  {language === 'ar' ? 'الوصف (فرنسي)' : 'Description (Français)'}
                </Label>
                <Textarea
                  id="descriptionFr"
                  value={formData.descriptionFr}
                  onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                  placeholder={language === 'ar' ? 'الوصف باللغة الفرنسية' : 'Description en français'}
                  rows={3}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descriptionAr" className="text-sm font-medium">
                  {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabe)'}
                </Label>
                <Textarea
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder={language === 'ar' ? 'الوصف باللغة العربية' : 'Description en arabe'}
                  rows={3}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {language === 'ar' ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button onClick={handleCreateOffer} className="bg-blue-600 hover:bg-blue-700">
                {language === 'ar' ? 'إنشاء' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={language === 'ar' ? 'ابحث عن العروض...' : 'Rechercher des offres...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-muted-foreground">
            {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <Card 
              key={offer.id} 
              className={`p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                offer.is_active 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100' 
                  : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  offer.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {offer.is_active 
                    ? (language === 'ar' ? 'نشط' : 'Actif') 
                    : (language === 'ar' ? 'غير نشط' : 'Inactif')
                  }
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant={offer.is_active ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleOfferStatus(offer.id)}
                    className={offer.is_active ? "text-yellow-600 border-yellow-600 hover:bg-yellow-50" : "bg-green-600 hover:bg-green-700"}
                  >
                    {offer.is_active ? (
                      <>
                        <Pause size={16} className={isRTL ? "ml-1" : "mr-1"} />
                        {language === 'ar' ? 'إيقاف' : 'Désactiver'}
                      </>
                    ) : (
                      <>
                        <Play size={16} className={isRTL ? "ml-1" : "mr-1"} />
                        {language === 'ar' ? 'تفعيل' : 'Activer'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(offer)}
                    title={language === 'ar' ? 'تعديل' : 'Modifier'}
                  >
                    <Edit size={16} className="text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteOffer(offer.id)}
                    title={language === 'ar' ? 'حذف' : 'Supprimer'}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {language === 'ar' ? offer.nameAr || offer.name : offer.nameFr || offer.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {language === 'ar' ? offer.descriptionAr || offer.description : offer.descriptionFr || offer.description}
                </p>
              </div>

              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <Calendar size={16} className={isRTL ? "ml-2" : "mr-2"} />
                <span>{formatEndTime(offer.end_time)}</span>
              </div>

              <div className="flex items-center justify-between mb-4">
                
                <span className="text-sm text-muted-foreground">
                  {offer.products_count || 0} {language === 'ar' ? 'منتج' : 'produit(s)'}
                </span>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                  onClick={() => openProductsView(offer)}
                >
                  <Eye size={16} className={isRTL ? "ml-2" : "mr-2"} />
                  {language === 'ar' ? 'المنتجات' : 'Produits'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredOffers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {language === 'ar' ? 'لا توجد عروض خاصة' : 'Aucune offre spéciale'}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {language === 'ar' ? 'تعديل العرض الخاص' : 'Modifier l\'offre spéciale'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nameFr" className="text-sm font-medium">
                {language === 'ar' ? 'الاسم (فرنسي)' : 'Nom (Français)'}
              </Label>
              <Input
                id="edit-nameFr"
                value={formData.nameFr}
                onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nameAr" className="text-sm font-medium">
                {language === 'ar' ? 'الاسم (عربي)' : 'Nom (Arabe)'}
              </Label>
              <Input
                id="edit-nameAr"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end_time" className="text-sm font-medium">
                {language === 'ar' ? 'وقت الانتهاء' : 'Heure de fin'}
              </Label>
              <Input
                id="edit-end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-descriptionFr" className="text-sm font-medium">
                {language === 'ar' ? 'الوصف (فرنسي)' : 'Description (Français)'}
              </Label>
              <Textarea
                id="edit-descriptionFr"
                value={formData.descriptionFr}
                onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-descriptionAr" className="text-sm font-medium">
                {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabe)'}
              </Label>
              <Textarea
                id="edit-descriptionAr"
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                rows={3}
                dir="rtl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {language === 'ar' ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={handleEditOffer} className="bg-blue-600 hover:bg-blue-700">
              {language === 'ar' ? 'حفظ التغييرات' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpecialOffersManagement;
