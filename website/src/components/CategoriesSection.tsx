import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface CategoriesSectionProps {
  onNavigate: (section: string, category?: string) => void;
}

interface Category {
  id: number;
  nameFr: string;
  nameAr: string;
  image: string | null;
  description_fr?: string;
  description_ar?: string;
}

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
 // ✅ same pattern as HeroSection
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les catégories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground animate-pulse">{t("loading")}...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("categoriesTitle")}
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto"></div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => {
            const categoryName = language === "fr" ? category.nameFr : category.nameAr;
            const categoryDescription =
              language === "fr"
                ? category.description_fr || "Description non fournie"
                : category.description_ar || "لا يوجد وصف";

            return (
              <div
                key={category.id}
                className="card-elevated group cursor-pointer overflow-hidden slide-in-left"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => onNavigate("products", String(category.id))}
              >
                {/* Category Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image ? `http://localhost:5000${category.image}` : "/placeholder.svg"}
                    alt={categoryName}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary-hover opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 text-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {categoryName}
                    </span>
                  </div>
                </div>

                {/* Category Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {categoryName}
                  </h3>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {categoryDescription}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                  >
                    {t("viewCategories")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Order Section */}
        <div className="mt-16 text-center fade-in">
          <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              هل تحتاج مساعدة في العثور على المنتج المناسب؟
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              فريقنا من الخبراء جاهز لمساعدتك في العثور على قطع الغيار والمعدات المناسبة لاحتياجاتك
            </p>
            <Button
              variant="accent"
              size="lg"
              onClick={() => onNavigate("contact")}
              className="px-8 py-3"
            >
              {t("contact")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
