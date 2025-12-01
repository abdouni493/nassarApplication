// Types for the management system

import { ReactNode } from "react";

export interface Category {
  id: number; // changed from string → number
  nameFr: string;
  nameAr: string;
  image: string | null; // backend may return null
  productsCount: number;
}
export interface WebsiteSettings {
  site_name_fr: string;
  site_name_ar: string;
  description_fr: string;
  description_ar: string;
  logo_url: string | null;
  favicon_url: string | null;
}
export interface Product {
  reference: ReactNode;
  description: string;
  initial_quantity: number;
  current_quantity: number;
  category: string;
  min_quantity: number;
  selling_price: any;
  brand: string; // Changed from ReactNode to string
  supplier: null;
  name: string; // Changed from ReactNode to string
  margin_percent: number;
  buying_price: number;
  id: number; // changed from string → number
  nameFr: string;
  nameAr?: string;
  price: number;
  // prix de gros (wholesale price) — optional and displayed in the UI
  prixDeGros?: number;
  descriptionFr: string;
  descriptionAr?: string;
  image: string | null;
  quality: number; // 1-5 stars
  barcode: string;
  categoryId: number; // changed from string → number
}

export interface SpecialOffer {
  quality: number;
  products_count: ReactNode;
  end_time: string;
  descriptionAr: string;
  is_active: any;
  nameAr: string;
  descriptionFr: string;
  nameFr: string;
  id: number; // changed from string → number
  name: string;
  description: string;
  endTime: string; // ISO datetime string
  isActive: boolean;
  productsCount: number;
}

export interface OfferProduct extends Product {
  newPrice: number;
  savings: number;
  percentage: number;
  offerId: number; // changed from string → number
}

export interface Contact {
  phone: string;
  whatsapp: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  viber: string;
  mapUrl: string;
}

export interface Settings {
  siteNameFr: string;
  siteNameAr: string;
  descriptionFr: string;
  descriptionAr: string;
}

export interface Order {
  id: number; // changed from string → number
  clientName: string;
  phone: string;
  status: "pending" | "confirmed" | "completed";
  items: OrderItem[];
  total: number;
  date: string; // ISO date string
  discount?: number;
}

export interface OrderItem {
  productId: number; // changed from string → number
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export type Language = "fr" | "ar";
