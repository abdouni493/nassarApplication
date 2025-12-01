import { useState, useRef, useEffect } from 'react';
import { Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { mockProducts } from '@/data/mockData';
import { Product } from '@/types';

interface ProductSearchAutocompleteProps {
  onProductSelect: (product: Product) => void;
  placeholder?: string;
}

const ProductSearchAutocomplete = ({ onProductSelect, placeholder = "Rechercher un produit par nom ou code-barres..." }: ProductSearchAutocompleteProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = mockProducts.filter(product =>
        product.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 5); // Limit to 5 results
      
      setFilteredProducts(filtered);
      setShowDropdown(true);
    } else {
      setFilteredProducts([]);
      setShowDropdown(false);
    }
    setSelectedIndex(-1);
  }, [searchTerm]);

  const handleProductSelect = (product: Product) => {
    setSearchTerm('');
    setShowDropdown(false);
    onProductSelect(product);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
          handleProductSelect(filteredProducts[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      dropdownRef.current && 
      !dropdownRef.current.contains(e.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(e.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="productSearch">Rechercher un produit</Label>
      <div className="relative">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="productSearch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>

        {/* Dropdown */}
        {showDropdown && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in"
          >
            {filteredProducts.length > 0 ? (
              <div className="p-2">
                {filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`product-search-item ${
                      selectedIndex === index ? 'selected' : ''
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-center space-x-3">
                      <Package size={16} className="text-primary" />
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {product.nameFr}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>Code: {product.barcode} •</span>
                          <span>Prix: {product.price.toLocaleString()} DZD</span>
                          {/* prix de gros shown in green when present */}
                          {product.prixDeGros !== undefined && (
                            <span className="text-green-600 font-semibold">Prix de gros: {product.prixDeGros.toLocaleString()} DZD</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <Package size={24} className="mx-auto mb-2 opacity-50" />
                <div className="text-sm">Produit non trouvé</div>
                <div className="text-xs">Essayez un autre nom ou code-barres</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductSearchAutocomplete;
