import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, Star, Search, X } from "lucide-react";
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
import { Category } from "@/types";

// ⚡ If you have a proxy in vite.config.ts, you can replace with ""
const API_BASE = " ";

interface ProductsViewProps {
  category: Category;
  onBack: () => void;
}

interface CategoryProduct {
  id: number;
  category_id: number;
  product_id: number | null;
  name: string;
  nameFr: string;
  nameAr: string;
  description: string;
  descriptionFr: string;
  descriptionAr: string;
  selling_price: number;
  quality: number;
  image: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  productId: number | null;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  sellingPrice: number;
  quality: number;
  imageFile: File | null;
  preview: string;
}

const ProductsView = ({ category, onBack }: ProductsViewProps) => {
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CategoryProduct | null>(null);
  const [formData, setFormData] = useState<FormData>({
    productId: null,
    nameFr: "",
    nameAr: "",
    descriptionFr: "",
    descriptionAr: "",
    sellingPrice: 0,
    quality: 5,
    imageFile: null,
    preview: "",
  });

  const { t } = useTranslation();

  // Fetch products for this category
  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/categories/${category.id}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
    }
  };

  // Search products from database
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length > 2) {
        try {
          const response = await fetch(
            `${API_BASE}/api/products?search=${encodeURIComponent(searchQuery)}&forCategory=${category.id}`
          );
          if (response.ok) {
            const results = await response.json();
            setSearchResults(results.slice(0, 5));
          }
        } catch (error) {
          console.error("Error searching products:", error);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, category.id]);

  const selectProductFromSearch = (product: any) => {
    setFormData({
      ...formData,
      productId: product.id,
      nameFr: product.name || "",
      nameAr: product.name || "",
      sellingPrice: product.selling_price || 0,
      preview: product.image || "",
    });
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCreateProduct = async () => {
    try {
      const fd = new FormData();
      fd.append("categoryId", category.id.toString());
      fd.append("productId", formData.productId?.toString() || "");
      fd.append("name", formData.nameFr); // Use nameFr as the main name
      fd.append("nameFr", formData.nameFr);
      fd.append("nameAr", formData.nameAr);
      fd.append("descriptionFr", formData.descriptionFr);
      fd.append("descriptionAr", formData.descriptionAr);
      fd.append("sellingPrice", formData.sellingPrice.toString());
      fd.append("quality", formData.quality.toString());
      
      if (formData.imageFile) {
        fd.append("image", formData.imageFile);
      }

      const res = await fetch(`${API_BASE}/api/category-products`, {
        method: "POST",
        body: fd,
      });
      
      if (!res.ok) throw new Error("Failed to create product");
      
      const newProduct: CategoryProduct = await res.json();
      setProducts([newProduct, ...products]);
      resetForm();
      setShowCreateDialog(false);
    } catch (err) {
      console.error("❌ Create product error:", err);
    }
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;
    
    try {
      const fd = new FormData();
      fd.append("name", formData.nameFr); // Use nameFr as the main name
      fd.append("nameFr", formData.nameFr);
      fd.append("nameAr", formData.nameAr);
      fd.append("descriptionFr", formData.descriptionFr);
      fd.append("descriptionAr", formData.descriptionAr);
      fd.append("sellingPrice", formData.sellingPrice.toString());
      fd.append("quality", formData.quality.toString());
      
      if (formData.imageFile) {
        fd.append("image", formData.imageFile);
      }

      const res = await fetch(
        `${API_BASE}/api/category-products/${selectedProduct.id}`,
        {
          method: "PUT",
          body: fd,
        }
      );
      
      if (!res.ok) throw new Error("Failed to update product");
      
      const updated: CategoryProduct = await res.json();
      setProducts((prev) =>
        prev.map((prod) => (prod.id === updated.id ? updated : prod))
      );

      resetForm();
      setSelectedProduct(null);
      setShowEditDialog(false);
    } catch (err) {
      console.error("❌ Edit product error:", err);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/category-products/${productId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts(products.filter((prod) => prod.id !== productId));
    } catch (err) {
      console.error("❌ Delete product error:", err);
    }
  };

  const openEditDialog = (product: CategoryProduct) => {
    setSelectedProduct(product);
    setFormData({
      productId: product.product_id,
      nameFr: product.nameFr || product.name || "",
      nameAr: product.nameAr || "",
      descriptionFr: product.descriptionFr || product.description || "",
      descriptionAr: product.descriptionAr || "",
      sellingPrice: product.selling_price || 0,
      quality: product.quality || 5,
      imageFile: null,
      preview: product.image || "",
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (product: CategoryProduct) => {
    setSelectedProduct(product);
    setShowViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      productId: null,
      nameFr: "",
      nameAr: "",
      descriptionFr: "",
      descriptionAr: "",
      sellingPrice: 0,
      quality: 5,
      imageFile: null,
      preview: "",
    });
    setSearchQuery("");
    setSearchResults([]);
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            {t("back")}
          </Button>
          <h2 className="text-2xl font-bold text-foreground">
            {category.nameFr} - {t("products")}
          </h2>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="management-button">
              <Plus size={20} className="mr-2" />
              {t("addProduct")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("addProduct")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="searchProduct">{t("searchProduct")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="searchProduct"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchProductPlaceholder")}
                    className="pl-10"
                  />
                </div>
                {searchResults.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
                    <Card className="p-2">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-muted rounded cursor-pointer flex justify-between items-center transition-colors duration-200"
                          onClick={() => selectProductFromSearch(product)}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.barcode}
                            </div>
                          </div>
                          <div className="text-sm text-primary font-medium">
                            {product.selling_price}
                          </div>
                        </div>
                      ))}
                    </Card>
                  </Card>
                )}
              </div>

              <div>
                <Label htmlFor="nameFr">{t("productNameFr")}</Label>
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
                <Label htmlFor="nameAr">{t("productNameAr")}</Label>
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
                <Label htmlFor="descriptionFr">{t("descriptionFr")}</Label>
                <Input
                  id="descriptionFr"
                  value={formData.descriptionFr}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionFr: e.target.value })
                  }
                  placeholder="Description en français"
                />
              </div>
              
              <div>
                <Label htmlFor="descriptionAr">{t("descriptionAr")}</Label>
                <Input
                  id="descriptionAr"
                  value={formData.descriptionAr}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionAr: e.target.value })
                  }
                  placeholder="الوصف بالعربية"
                />
              </div>
              
              <div>
                <Label htmlFor="sellingPrice">{t("sellingPrice")}</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Prix de vente"
                />
              </div>
              
              <div>
                <Label>{t("quality")}</Label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      type="button"
                      variant={formData.quality >= star ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, quality: star })}
                    >
                      <Star size={16} className={formData.quality >= star ? "fill-white" : ""} />
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="image">{t("productImage")}</Label>
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
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button onClick={handleCreateProduct}>{t("create")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product, index) => (
          <Card
            key={product.id}
            className="management-card p-6 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-4">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name || "Product"}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {product.nameFr || product.name}
                </h3>
                <p className="text-muted-foreground">
                  {new Date(product.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center mt-2">
                  <span className="text-sm font-medium mr-2">{t("quality")}:</span>
                  {renderStars(product.quality || 5)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("price")}: {product.selling_price} DZD
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(product)}
                >
                  <Edit size={16} className="mr-1" />
                  {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                  className="text-danger hover:text-danger-foreground hover:bg-danger"
                >
                  <Trash2 size={16} className="mr-1" />
                  {t("delete")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openViewDialog(product)}
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
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("edit")} {selectedProduct?.nameFr || selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editNameFr">{t("productNameFr")}</Label>
              <Input
                id="editNameFr"
                value={formData.nameFr}
                onChange={(e) =>
                  setFormData({ ...formData, nameFr: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="editNameAr">{t("productNameAr")}</Label>
              <Input
                id="editNameAr"
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="editDescriptionFr">{t("descriptionFr")}</Label>
              <Input
                id="editDescriptionFr"
                value={formData.descriptionFr}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionFr: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="editDescriptionAr">{t("descriptionAr")}</Label>
              <Input
                id="editDescriptionAr"
                value={formData.descriptionAr}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionAr: e.target.value })
                }
              />
            </div>
            
            <div>
              <Label htmlFor="editSellingPrice">{t("sellingPrice")}</Label>
              <Input
                id="editSellingPrice"
                type="number"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            
            <div>
              <Label>{t("quality")}</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    variant={formData.quality >= star ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, quality: star })}
                  >
                    <Star size={16} className={formData.quality >= star ? "fill-white" : ""} />
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="editImage">{t("productImage")}</Label>
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
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  resetForm();
                }}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleEditProduct}>{t("update")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.nameFr || selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProduct?.image && (
              <img
                src={selectedProduct.image}
                alt={selectedProduct.nameFr || selectedProduct.name || "Product"}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">{t("productNameFr")}</h4>
                <p className="text-muted-foreground">
                  {selectedProduct?.nameFr || selectedProduct?.name}
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t("productNameAr")}</h4>
                <p className="text-muted-foreground">
                  {selectedProduct?.nameAr}
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t("descriptionFr")}</h4>
                <p className="text-muted-foreground">
                  {selectedProduct?.descriptionFr || selectedProduct?.description}
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t("descriptionAr")}</h4>
                <p className="text-muted-foreground">
                  {selectedProduct?.descriptionAr}
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t("sellingPrice")}</h4>
                <p className="text-muted-foreground">
                  {selectedProduct?.selling_price} DZD
                </p>
              </div>
              <div>
                <h4 className="font-medium">{t("quality")}</h4>
                <div className="mt-1">
                  {renderStars(selectedProduct?.quality || 5)}
                </div>
              </div>
              <div>
                <h4 className="font-medium">{t("createdAt")}</h4>
                <p className="text-muted-foreground">
                  {selectedProduct && new Date(selectedProduct.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsView;
