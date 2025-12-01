import { Product } from '@/contexts/CartContext';

export const products: Product[] = [
  // Automotive Parts
  {
    id: 'auto-1',
    name: 'Brake Pads Set',
    nameAr: 'طقم فحمات الفرامل',
    nameFr: 'Jeu de plaquettes de frein',
    price: 2500,
    prixDeGros: 2000,
    image: '/placeholder.svg',
    category: 'automotive',
    description: 'High-quality brake pads for most car models',
    descriptionAr: 'فحمات فرامل عالية الجودة لمعظم موديلات السيارات',
    descriptionFr: 'Plaquettes de frein de haute qualité pour la plupart des modèles de voitures',
    inStock: true,
    isSpecialOffer: true,
    originalPrice: 3000
  },
  {
    id: 'auto-2',
    name: 'Engine Oil Filter',
    nameAr: 'فلتر زيت المحرك',
    nameFr: 'Filtre à huile moteur',
    price: 800,
    prixDeGros: 650,
    image: '/placeholder.svg',
    category: 'automotive',
    description: 'Premium engine oil filter for optimal performance',
    descriptionAr: 'فلتر زيت محرك ممتاز للأداء الأمثل',
    descriptionFr: 'Filtre à huile moteur premium pour des performances optimales',
    inStock: true
  },
  {
    id: 'auto-3',
    name: 'Spark Plug Set',
    nameAr: 'طقم شمعات الاحتراق',
    nameFr: 'Jeu de bougies d\'allumage',
    price: 1200,
    prixDeGros: 950,
    image: '/placeholder.svg',
    category: 'automotive',
    description: 'Durable spark plugs for efficient combustion',
    descriptionAr: 'شمعات احتراق متينة للاحتراق الفعال',
    descriptionFr: 'Bougies d\'allumage durables pour une combustion efficace',
    inStock: true
  },
  
  // Industrial Parts
  {
    id: 'ind-1',
    name: 'Hydraulic Seal Kit',
    nameAr: 'طقم أختام هيدروليكية',
    nameFr: 'Kit de joints hydrauliques',
    price: 4500,
    prixDeGros: 3500,
    image: '/placeholder.svg',
    category: 'industrial',
    description: 'Complete hydraulic seal kit for heavy machinery',
    descriptionAr: 'طقم أختام هيدروليكية كامل للآلات الثقيلة',
    descriptionFr: 'Kit complet de joints hydrauliques pour machines lourdes',
    inStock: true
  },
  {
    id: 'ind-2',
    name: 'Ball Bearings',
    nameAr: 'محامل كروية',
    nameFr: 'Roulements à billes',
    price: 1800,
    prixDeGros: 1400,
    image: '/placeholder.svg',
    category: 'industrial',
    description: 'High-precision ball bearings for industrial applications',
    descriptionAr: 'محامل كروية عالية الدقة للتطبيقات الصناعية',
    descriptionFr: 'Roulements à billes de haute précision pour applications industrielles',
    inStock: true,
    isSpecialOffer: true,
    originalPrice: 2200
  },
  
  // Tools
  {
    id: 'tool-1',
    name: 'Professional Wrench Set',
    nameAr: 'طقم مفاتيح احترافي',
    nameFr: 'Jeu de clés professionnel',
    price: 3200,
    prixDeGros: 2400,
    image: '/placeholder.svg',
    category: 'tools',
    description: 'Complete set of professional wrenches',
    descriptionAr: 'طقم كامل من المفاتيح الاحترافية',
    descriptionFr: 'Jeu complet de clés professionnelles',
    inStock: true
  },
  {
    id: 'tool-2',
    name: 'Electric Drill',
    nameAr: 'دريل كهربائي',
    nameFr: 'Perceuse électrique',
    price: 5500,
    prixDeGros: 4200,
    image: '/placeholder.svg',
    category: 'tools',
    description: 'Powerful electric drill for all applications',
    descriptionAr: 'دريل كهربائي قوي لجميع التطبيقات',
    descriptionFr: 'Perceuse électrique puissante pour toutes applications',
    inStock: true
  },
  
  // Electronics
  {
    id: 'elec-1',
    name: 'Power Cable Set',
    nameAr: 'طقم كابلات كهربائية',
    nameFr: 'Jeu de câbles d\'alimentation',
    price: 1500,
    prixDeGros: 1100,
    image: '/placeholder.svg',
    category: 'electronics',
    description: 'High-quality power cables for electrical installations',
    descriptionAr: 'كابلات كهربائية عالية الجودة للتركيبات الكهربائية',
    descriptionFr: 'Câbles d\'alimentation de haute qualité pour installations électriques',
    inStock: true,
    isSpecialOffer: true,
    originalPrice: 1800
  },
  {
    id: 'elec-2',
    name: 'Digital Multimeter',
    nameAr: 'جهاز قياس رقمي',
    nameFr: 'Multimètre numérique',
    price: 2800,
    prixDeGros: 2100,
    image: '/placeholder.svg',
    category: 'electronics',
    description: 'Professional digital multimeter for electrical testing',
    descriptionAr: 'جهاز قياس رقمي احترافي للاختبارات الكهربائية',
    descriptionFr: 'Multimètre numérique professionnel pour tests électriques',
    inStock: true
  }
];

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(product => product.category === category);
};

export const getSpecialOffers = (): Product[] => {
  return products.filter(product => product.isSpecialOffer);
};
