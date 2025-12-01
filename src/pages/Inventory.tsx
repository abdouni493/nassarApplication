import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

type Product = {
  id: number;
  name: string;
  barcode: string;
  brand: string;
  category: string;
  buying_price: number;
  selling_price: number;
  wholesale_price: number;
  margin_percent: number;
  initial_quantity: number;
  current_quantity: number;
  min_quantity: number;
  supplier: string;
  supplierName?: string;
};

const allCategories: Record<string, { fr: string; ar: string }> = {
  industrial_equipment: { fr: "Équipement industriel", ar: "معدات صناعية" },
  construction_materials: { fr: "Matériaux de construction", ar: "مواد البناء" },
  electrical_equipment: { fr: "Équipement électrique", ar: "معدات كهربائية" },
  mechanical_parts: { fr: "Pièces mécaniques", ar: "قطع ميكانيكية" },
  lab_office_equipment: { fr: "Équipement bureau/labo", ar: "معدات المكتب/المختبر" },
  vehicles_transport: { fr: "Véhicules et transport", ar: "مركبات ونقل" },
  safety_ppe: { fr: "Sécurité & EPI", ar: "معدات الحماية الشخصية" },
};

const API = "/api/products";

export default function Inventory() {
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();

  const currency = (n: number) =>
    new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: "currency", currency: "DZD" }).format(n || 0);

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add form (ONLY these 4 fields)
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    barcode: "",
    brand: "",
    category: "",
  });

  // Edit form (ALL fields)
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Product | null>(null);

  // Load
  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const r = await fetch(API);
      const d = await r.json();
      setProducts(d);
    } catch (e) {
      console.error(e);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'غير قادر على تحميل المنتجات' : 'Impossible de charger les produits',
        variant: "destructive"
      });
    }
  }

 async function addProduct() {
  try {
    // Auto-generate barcode if empty
    const productData = {
      ...addForm,
      barcode: addForm.barcode || `P${Date.now()}`, // e.g., P1695032123456
    };

    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    });

    if (!r.ok) throw new Error("Add failed");
    setAddOpen(false);
    setAddForm({ name: "", barcode: "", brand: "", category: "" });
    toast({ title: language === 'ar' ? '✅ تم إضافة المنتج' : "✅ Produit ajouté" });
    await load();
  } catch (e) {
    console.error(e);
    toast({
      title: language === 'ar' ? 'خطأ' : 'Erreur',
      description: language === 'ar' ? 'الاضافة غير ممكنة' : 'Ajout impossible',
      variant: "destructive"
    });
  }
}


  async function updateProduct() {
    if (!editForm) return;
    try {
      const r = await fetch(`${API}/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          // Ensure all required fields are sent
          buying_price: editForm.buying_price || 0,
          selling_price: editForm.selling_price || 0,
          wholesale_price: editForm.wholesale_price || 0, // Make sure this is included
          margin_percent: editForm.margin_percent || 0,
          initial_quantity: editForm.initial_quantity || 0,
          current_quantity: editForm.current_quantity || 0,
          min_quantity: editForm.min_quantity || 0,
          supplier: editForm.supplier || "",
        }),
      });
      if (!r.ok) throw new Error("Update failed");
      setEditOpen(false);
      setEditForm(null);
      toast({ title: language === 'ar' ? '✏️ تم تعديل المنتج' : "✏️ Produit modifié" });
      await load();
    } catch (e) {
      console.error(e);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'التعديل غير ممكن' : 'Modification impossible',
        variant: "destructive"
      });
    }
  }

  async function deleteProduct(id: number) {
    try {
      const r = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      toast({ title: language === 'ar' ? '🗑️ تم حذف المنتج' : "🗑️ Produit supprimé" });
      await load();
    } catch (e) {
      console.error(e);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Erreur',
        description: language === 'ar' ? 'الحذف غير ممكن' : 'Suppression impossible',
        variant: "destructive"
      });
    }
  }

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matches =
      p.name.toLowerCase().includes(q) ||
      (p.brand || "").toLowerCase().includes(q) ||
      (p.barcode || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q);
    const cat = categoryFilter === "all" || p.category === categoryFilter;
    return matches && cat;
  });

  return (
    <div className={`space-y-6 animate-fade-in ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {language === 'ar' ? 'إدارة المخزون' : 'Gestion du stock'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'أضف، عدل أو احذف منتجاتك' : 'Ajoutez, modifiez ou supprimez vos produits'}
          </p>
        </div>

        {/* Add Product */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-lg hover:scale-105">
              <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {language === 'ar' ? 'منتج جديد' : 'Nouveau produit'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'إضافة منتج' : 'Ajouter un produit'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === 'ar' ? 'اسم المنتج' : 'Nom du produit'}</Label>
                <Input
                  placeholder={language === 'ar' ? 'مثال: فلتر زيت' : "ex: Filtre à huile"}
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الرمز الشريطي' : 'Code-barres'}</Label>
                <Input
                  placeholder={language === 'ar' ? 'مثال: 123456789' : "ex: 123456789"}
                  value={addForm.barcode}
                  onChange={(e) => setAddForm({ ...addForm, barcode: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'العلامة التجارية' : 'Marque'}</Label>
                <Input
                  placeholder={language === 'ar' ? 'مثال: بوش' : "ex: Bosch"}
                  value={addForm.brand}
                  onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                />
              </div>
              <div>
                <Label>{language === 'ar' ? 'الفئة' : 'Catégorie'}</Label>
                <Select
                  value={addForm.category}
                  onValueChange={(v) => setAddForm({ ...addForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر فئة' : "Sélectionner"} />
                  </SelectTrigger>
                <SelectContent>
  {Object.entries(allCategories).map(([key, val]) => (
    <SelectItem key={key} value={key}>
      {language === 'ar' ? val.ar : val.fr}
    </SelectItem>
  ))}
</SelectContent>


                </Select>
              </div>
              <Button onClick={addProduct} className="w-full gradient-primary text-white">
                {language === 'ar' ? 'إضافة' : 'Ajouter'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="card-elevated">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`${isRTL ? 'right-3' : 'left-3'} absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                className={`${isRTL ? 'pr-10' : 'pl-10'}`}
                placeholder={language === 'ar' ? 'بحث (الاسم، العلامة التجارية، الرمز الشريطي، الفئة)...' : 'Rechercher (nom, marque, code-barres, catégorie)…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? (language === 'ar' ? 'كل الفئات' : "Toutes les catégories") : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={filtered.length} // reflow animation when list changes
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <Card className="card-elevated hover:shadow-xl transition">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    {p.current_quantity <= (p.min_quantity || 0) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className={`${isRTL ? 'ml-1' : 'mr-1'} h-3 w-3`} />
                        {language === 'ar' ? 'مخزون منخفض' : 'Stock bas'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.brand || "—"} • {p.category || "—"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الرمز الشريطي:' : 'Code-barres:'}
                    </span>
                    <span className="font-medium">{p.barcode || "—"}</span>

                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'المورد:' : 'Fournisseur:'}
                    </span>
                    <span className="font-medium">{p.supplierName || "—"}</span>

                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'سعر الشراء:' : 'Prix achat:'}
                    </span>
                    <span className="font-medium">{currency(p.buying_price)}</span>

                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'هامش %:' : 'Marge %:'}
                    </span>
                    <span className="font-medium">{p.margin_percent ?? 0}%</span>

                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'سعر البيع:' : 'Prix vente:'}
                    </span>
                    <span className="font-semibold text-primary">
                      {currency(p.selling_price)}
                    </span>

                    {/* Changed from "سعر البيع بالجملة" to "سعر الجملة" */}
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'سعر الجملة:' : 'Prix de gros:'}
                    </span>
                    <span className="font-semibold text-green-600">
                      {currency(p.wholesale_price ?? 0)}
                    </span>

                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الكمية الأولية:' : 'Qté initiale:'}
                    </span>
                    <span className="font-medium">{p.initial_quantity ?? 0}</span>

                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الكمية الحالية:' : 'Qté actuelle:'}
                    </span>
                    <span className="font-medium">{p.current_quantity ?? 0}</span>

                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'الحد الأدنى للكمية:' : 'Qté minimale:'}
                    </span>
                    <span className="font-medium">{p.min_quantity ?? 0}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {/* Edit */}
                    <Dialog open={editOpen && editForm?.id === p.id} onOpenChange={(open) => {
                      setEditOpen(open);
                      if (!open) setEditForm(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditForm(p);
                            setEditOpen(true);
                          }}
                        >
                          <Edit className={`${isRTL ? 'ml-1' : 'mr-1'} h-4 w-4`} />
                          {language === 'ar' ? 'تعديل' : 'Modifier'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle>
                            {language === 'ar' ? 'تعديل المنتج' : 'Modifier le produit'}
                          </DialogTitle>
                        </DialogHeader>

                        {editForm && (
                          <div className="space-y-4">
                            {/* Identity */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>{language === 'ar' ? 'الاسم' : 'Nom'}</Label>
                                <Input
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'الرمز الشريطي' : 'Code-barres'}</Label>
                                <Input
                                  value={editForm.barcode || ""}
                                  onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'العلامة التجارية' : 'Marque'}</Label>
                                <Input
                                  value={editForm.brand || ""}
                                  onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'الفئة' : 'Catégorie'}</Label>
                                <Input
                                  value={editForm.category || ""}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                />
                              </div>
                            </div>

                            {/* Commerce */}
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <Label>{language === 'ar' ? 'سعر الشراء' : 'Prix achat'}</Label>
                                <Input
                                  type="number"
                                  value={editForm.buying_price ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, buying_price: Number(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'هامش %' : 'Marge %'}</Label>
                                <Input
                                  type="number"
                                  value={editForm.margin_percent ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, margin_percent: Number(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'سعر البيع' : 'Prix vente'}</Label>
                                <Input
                                  type="number"
                                  value={editForm.selling_price ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, selling_price: Number(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                {/* Changed from "سعر البيع بالجملة" to "سعر الجملة" */}
                                <Label>{language === 'ar' ? 'سعر الجملة' : 'Prix de gros'}</Label>
                                <Input
                                  type="number"
                                  value={editForm.wholesale_price ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, wholesale_price: Number(e.target.value) })
                                  }
                                  className="border-green-300 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>

                            {/* Stock */}
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label>{language === 'ar' ? 'الكمية الأولية' : 'Qté initiale'}</Label>
                                <Input
                                  type="number"
                                  value={editForm.initial_quantity ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, initial_quantity: Number(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'الكمية الحالية' : 'Qté actuelle'}</Label>
                                <Input
                                  type="number"
                                  value={editForm.current_quantity ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, current_quantity: Number(e.target.value) })
                                  }
                                />
                              </div>
                              <div>
                                <Label>{language === 'ar' ? 'الحد الأدنى للكمية' : 'Qté minimale'}</Label>
                                <Input
                                  type="number"
                                  value={editForm.min_quantity ?? 0}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, min_quantity: Number(e.target.value) })
                                  }
                                />
                              </div>
                            </div>

                            {/* Supplier */}
                            <div>
                              <Label>{language === 'ar' ? 'المورد' : 'Fournisseur'}</Label>
                              <Input
                                value={editForm.supplier || ""}
                                onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                              />
                            </div>

                            <Button onClick={updateProduct} className="w-full gradient-primary text-white">
                              {language === 'ar' ? 'حفظ' : 'Sauvegarder'}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* Delete */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteProduct(p.id)}
                    >
                      <Trash2 className={`${isRTL ? 'ml-1' : 'mr-1'} h-4 w-4`} />
                      {language === 'ar' ? 'حذف' : 'Supprimer'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="card-elevated">
            <CardContent className="p-12 text-center text-muted-foreground">
              {language === 'ar' ? 'لا يوجد منتج' : 'Aucun produit'}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
