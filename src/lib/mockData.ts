// Mock Data pour Nasser Equipements et Materiel
// Données de test pour la version de démonstration

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  phone?: string;
  address?: string;
  salary?: number;
  hireDate?: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  minStock: number;
  barcode?: string;
  description?: string;
  supplier: string;
  location?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

export interface Invoice {
  id: string;
  type: 'sale' | 'purchase';
  date: string;
  customerId?: string;
  supplierId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: '  Nasser',
    email: ' @Nasser-auto.ma',
    role: 'admin',
    phone: '+212 6 12 34 56 78',
    address: 'Casablanca, Maroc',
    hireDate: '2020-01-15'
  },
  {
    id: '2',
    name: 'Fatima Bennani',
    email: 'fatima@Nasser-auto.ma',
    role: 'employee',
    phone: '+212 6 98 76 54 32',
    address: 'Casablanca, Maroc',
    salary: 4500,
    hireDate: '2021-03-10'
  },
  {
    id: '3',
    name: 'Omar Alami',
    email: 'omar@Nasser-auto.ma',
    role: 'employee',
    phone: '+212 6 11 22 33 44',
    address: 'Casablanca, Maroc',
    salary: 4200,
    hireDate: '2022-07-20'
  }
];

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'AutoParts Maroc',
    contact: 'Hassan Tazi',
    phone: '+212 5 22 33 44 55',
    email: 'contact@autoparts-maroc.ma',
    address: 'Zone Industrielle Ain Sebaa',
    city: 'Casablanca'
  },
  {
    id: '2',
    name: 'Pièces Express',
    contact: 'Khalid Benmoussa',
    phone: '+212 5 37 65 43 21',
    email: 'info@pieces-express.ma',
    address: 'Route de Témara, KM 12',
    city: 'Rabat'
  },
  {
    id: '3',
    name: 'Motor Supply Co',
    contact: 'Youssef Regragui',
    phone: '+212 5 24 88 99 00',
    email: 'sales@motorsupply.ma',
    address: 'Avenue Hassan II',
    city: 'Marrakech'
  }
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Filtre à Huile Standard',
    category: 'Moteur',
    brand: 'Bosch',
      price: 45.00,
      // Prix de gros (wholesale) — shown in the UI in green
      prixDeGros: 35.00,
    stock: 25,
    minStock: 10,
    barcode: '3165143327784',
    description: 'Filtre à huile haute qualité pour moteurs essence et diesel',
    supplier: 'AutoParts Maroc',
    location: 'A1-R2-E3'
  },
  {
    id: '2',
    name: 'Plaquettes de Frein Avant',
    category: 'Freins',
    brand: 'Brembo',
      price: 120.00,
      prixDeGros: 95.00,
    stock: 8,
    minStock: 5,
    barcode: '8020584058404',
    description: 'Plaquettes de frein haute performance pour véhicules légers',
    supplier: 'Pièces Express',
    location: 'B2-R1-E4'
  },
  {
    id: '3',
    name: 'Amortisseur Arrière Gauche',
    category: 'Suspension',
    brand: 'Monroe',
      price: 180.00,
      prixDeGros: 140.00,
    stock: 3,
    minStock: 5,
    barcode: '5412096372847',
    description: 'Amortisseur hydraulique pour essieu arrière',
    supplier: 'Motor Supply Co',
    location: 'C1-R3-E1'
  },
  {
    id: '4',
    name: 'Batterie 12V 70Ah',
    category: 'Électrique',
    brand: 'Varta',
      price: 450.00,
      prixDeGros: 350.00,
    stock: 12,
    minStock: 8,
    barcode: '4016987119518',
    description: 'Batterie de démarrage haute capacité',
    supplier: 'AutoParts Maroc',
    location: 'D1-R1-E2'
  },
  {
    id: '5',
    name: 'Courroie de Distribution',
    category: 'Moteur',
    brand: 'Gates',
      price: 85.00,
      prixDeGros: 65.00,
    stock: 15,
    minStock: 10,
    barcode: '5414465610004',
    description: 'Courroie de distribution renforcée',
    supplier: 'Pièces Express',
    location: 'A2-R2-E1'
  }
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Mohamed Alaoui',
    phone: '+212 6 11 22 33 44',
    email: 'mohamed.alaoui@gmail.com',
    address: 'Maarif, Casablanca'
  },
  {
    id: '2',
    name: 'Garage Central',
    phone: '+212 5 22 44 55 66',
    email: 'contact@garagecentral.ma',
    address: 'Boulevard Zerktouni, Casablanca'
  },
  {
    id: '3',
    name: 'Aicha Benali',
    phone: '+212 6 77 88 99 00',
    address: 'Hay Riad, Rabat'
  }
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: 'FAC-001',
    type: 'sale',
    date: '2024-12-15',
    customerId: '1',
    items: [
      {
        productId: '1',
        productName: 'Filtre à Huile Standard',
        quantity: 2,
        unitPrice: 45.00,
        total: 90.00
      },
      {
        productId: '2',
        productName: 'Plaquettes de Frein Avant',
        quantity: 1,
        unitPrice: 120.00,
        total: 120.00
      }
    ],
    subtotal: 210.00,
    tax: 42.00,
    discount: 0,
    total: 252.00,
    status: 'paid',
    paymentMethod: 'cash'
  },
  {
    id: 'ACH-001',
    type: 'purchase',
    date: '2024-12-10',
    supplierId: '1',
    items: [
      {
        productId: '4',
        productName: 'Batterie 12V 70Ah',
        quantity: 5,
        unitPrice: 350.00,
        total: 1750.00
      }
    ],
    subtotal: 1750.00,
    tax: 350.00,
    discount: 0,
    total: 2100.00,
    status: 'paid',
    paymentMethod: 'bank_transfer'
  }
];

// Dashboard Statistics
export const mockStats = {
  totalSales: 15420.50,
  totalPurchases: 8750.00,
  totalProfit: 6670.50,
  totalProducts: 127,
  lowStockItems: 8,
  totalEmployees: 3,
  totalSuppliers: 15,
  totalCustomers: 45,
  monthlySales: [2100, 2300, 1800, 2800, 3200, 2900, 3100, 2750, 2400, 3300, 2950, 3420],
  monthlyPurchases: [1200, 1400, 1100, 1600, 1800, 1500, 1700, 1450, 1300, 1750, 1550, 1850]
};

// Current user (simulation)
export const currentUser: User = mockUsers[0];
