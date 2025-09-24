import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart, Product } from "@/contexts/CartContext";
import { ShoppingCart, Star, ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductsSectionProps {
  category?: string; // category id as string
  onBack: () => void;
}

interface CategoryProduct {
  id: number;
  category_id: number;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  selling_price: number;
  originalPrice?: number;
  quality: number; // ✅ stock quantity / rating
  image: string;
}

const API_BASE = "http://localhost:5000";

const ProductsSection: React.FC<ProductsSectionProps> = ({ category, onBack }) => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const url = category
        ? `${API_BASE}/api/categories/${category}/products`
        : `${API_BASE}/api/products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("❌ Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const name = language === "ar" ? product.nameAr : product.nameFr;
    const description =
      language === "ar" ? product.descriptionAr : product.descriptionFr;
    return (
      name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAddToCart = (product: CategoryProduct) => {
  const cartProduct: Product = {
    id: product.id.toString(),
    name: product.nameFr || "",
    nameFr: product.nameFr,
    nameAr: product.nameAr,
    description: product.descriptionFr || "",
    descriptionFr: product.descriptionFr,
    descriptionAr: product.descriptionAr,
    price: product.selling_price,
    image: product.image,
    category: product.category_id.toString(),
    inStock: (product.quality ?? 0) > 0,
    originalPrice: product.originalPrice,
  };

  addToCart(cartProduct);
};


  return (
    <section className="py-12 min-h-screen bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t("categories")}</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {category ? t("products") : t("allProducts") || "All Products"}
              </h1>
              <p className="text-muted-foreground">
                {filteredProducts.length} {t("productsAvailable") || "produits"}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={
                language === "ar"
                  ? "البحث في المنتجات..."
                  : "Rechercher des produits..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center text-muted-foreground py-12">
            {t("loading")}...
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="card-elevated group overflow-hidden fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Product Image */}
                <div className="relative h-48 bg-muted overflow-hidden">
                  <img
                    src={
                      product.image
                        ? `${API_BASE}${product.image}` // ✅ prepend API_BASE
                        : "/placeholder.svg"
                    }
                    alt={language === "ar" ? product.nameAr : product.nameFr}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <Badge
                    className={`absolute bottom-2 left-2 ${
                      (product.quality ?? 0) > 0
                        ? "bg-success text-success-foreground"
                        : "bg-destructive text-destructive-foreground"
                    }`}
                  >
                    {(product.quality ?? 0) > 0
                      ? t("inStock") || "En stock"
                      : t("outOfStock") || "Rupture de stock"}
                  </Badge>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                    {language === "ar" ? product.nameAr : product.nameFr}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {language === "ar"
                      ? product.descriptionAr
                      : product.descriptionFr}
                  </p>

                  {/* Price & Quality */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-primary">
                        {(product.selling_price ?? 0).toLocaleString()} دج
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.originalPrice.toLocaleString()} دج
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={
                            star <= (product.quality ?? 0)
                              ? "h-3 w-3 text-yellow-400 fill-yellow-400"
                              : "h-3 w-3 text-gray-300"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={(product.quality ?? 0) <= 0}
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t("addToCart") || "Ajouter"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Products Found */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                {t("noProductsFound") || "Aucun produit trouvé"}
              </p>
              <p className="text-sm">
                {t("tryAnotherSearchOrCategory") ||
                  "Essayez une autre recherche ou une autre catégorie"}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              {t("clearSearch") || "Effacer"}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsSection;