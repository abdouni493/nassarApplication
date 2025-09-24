import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/contexts/LanguageContext";
import ProductsView from "./ProductsView";

// ✅ Use shared Category type
import { Category } from "@/types";

interface FormData {
  nameFr: string;
  nameAr: string;
  imageFile: File | null;
  preview: string;
}

// ⚡ If you have a proxy in vite.config.ts, you can replace with ""
const API_BASE = " ";

const CategoriesManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProductsView, setShowProductsView] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nameFr: "",
    nameAr: "",
    imageFile: null,
    preview: "",
  });

  const { t } = useTranslation();

  // Fetch categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("❌ Failed to fetch categories:", err);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const fd = new FormData();
      fd.append("nameFr", formData.nameFr);
      fd.append("nameAr", formData.nameAr);
      if (formData.imageFile) {
        fd.append("image", formData.imageFile);
      }

      const res = await fetch(`${API_BASE}/api/categories`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Failed to create category");
      const newCat: Category = await res.json();
      setCategories([newCat, ...categories]);
      resetForm();
      setShowCreateDialog(false);
    } catch (err) {
      console.error("❌ Create category error:", err);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;
    try {
      const fd = new FormData();
      fd.append("nameFr", formData.nameFr);
      fd.append("nameAr", formData.nameAr);
      if (formData.imageFile) {
        fd.append("image", formData.imageFile);
      }

      const res = await fetch(
        `${API_BASE}/api/categories/${selectedCategory.id}`,
        {
          method: "PUT",
          body: fd,
        }
      );
      if (!res.ok) throw new Error("Failed to update category");
      const updated: Category = await res.json();

      setCategories((prev) =>
        prev.map((cat) => (cat.id === updated.id ? updated : cat))
      );

      resetForm();
      setSelectedCategory(null);
      setShowEditDialog(false);
    } catch (err) {
      console.error("❌ Edit category error:", err);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${categoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");

      setCategories(categories.filter((cat) => cat.id !== categoryId));
    } catch (err) {
      console.error("❌ Delete category error:", err);
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      nameFr: category.nameFr,
      nameAr: category.nameAr,
      imageFile: null,
      preview: category.image || "",
    });
    setShowEditDialog(true);
  };

  const openProductsView = (category: Category) => {
    setSelectedCategory(category);
    setShowProductsView(true);
  };

  const resetForm = () => {
    setFormData({ nameFr: "", nameAr: "", imageFile: null, preview: "" });
  };

  // 👇 Correct typing: ProductsView expects Category with id:number
  if (showProductsView && selectedCategory) {
    return (
      <ProductsView
        category={selectedCategory}
        onBack={() => setShowProductsView(false)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          {t("categories")}
        </h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="management-button">
              <Plus size={20} className="mr-2" />
              {t("createCategory")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("createCategory")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nameFr">{t("categoryNameFr")}</Label>
                <Input
                  id="nameFr"
                  value={formData.nameFr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameFr: e.target.value })
                  }
                  placeholder="Nom en français"
                />
              </div>
              <div>
                <Label htmlFor="nameAr">{t("categoryNameAr")}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) =>
                    setFormData({ ...formData, nameAr: e.target.value })
                  }
                  placeholder="الاسم بالعربية"
                />
              </div>
              <div>
                <Label htmlFor="image">{t("categoryImage")}</Label>
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
                        preview: URL.createObjectURL(file),
                      });
                    }
                  }}
                />
                {formData.preview && (
                  <img
                    src={formData.preview}
                    alt="preview"
                    className="mt-2 w-32 h-32 object-cover rounded"
                  />
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  {t("cancel")}
                </Button>
                <Button onClick={handleCreateCategory}>{t("create")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <Card
            key={category.id}
            className="management-card p-6 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-4">
              <img
                src={category.image || "/placeholder.svg"}
                alt={category.nameFr}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {category.nameFr}
                </h3>
                <p className="text-muted-foreground">{category.nameAr}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {category.productsCount} produits
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(category)}
                >
                  <Edit size={16} className="mr-1" />
                  {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-danger hover:text-danger-foreground hover:bg-danger"
                >
                  <Trash2 size={16} className="mr-1" />
                  {t("delete")}
                </Button>
              </div>
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openProductsView(category)}
                >
                  <Eye size={16} className="mr-1" />
                  {t("view")}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("edit")} {selectedCategory?.nameFr}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editNameFr">{t("categoryNameFr")}</Label>
              <Input
                id="editNameFr"
                value={formData.nameFr}
                onChange={(e) =>
                  setFormData({ ...formData, nameFr: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="editNameAr">{t("categoryNameAr")}</Label>
              <Input
                id="editNameAr"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="editImage">{t("categoryImage")}</Label>
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
                      preview: URL.createObjectURL(file),
                    });
                  }
                }}
              />
              {formData.preview && (
                <img
                  src={formData.preview}
                  alt="preview"
                  className="mt-2 w-32 h-32 object-cover rounded"
                />
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleEditCategory}>{t("save")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManagement;
