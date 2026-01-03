
export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string; // Keeping for compatibility, but moving to structured specs in UI
  dimensions: string; // Keeping for compatibility
  careInstructions: string; // Primary care text
  additionalCare?: string[]; // Multiple care tips
  specifications: ProductSpec[]; // Structured technical details
  retailPrice: number;
  sellingPrice: number;
  stock: number;
  images: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isVisible: boolean; 
  isOnSale?: boolean; 
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface HomepageConfig {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  role: UserRole;
  username: string;
}
