
import { Product, Category, HomepageConfig } from './types';

export const COLORS = {
  primary: '#A62C2B', 
  secondary: '#3D5A2F', 
  accent: '#E6B325', 
  bg: '#FDFCF9', 
  text: '#2D2D2D'
};

export const INITIAL_HOMEPAGE_CONFIG: HomepageConfig = {
  heroImage: 'https://images.unsplash.com/photo-1614179677709-bb37b0abc7ee?auto=format&fit=crop&q=80&w=2000',
  heroTitle: 'Carry your Heritage',
  heroSubtitle: 'Discover a collection of hand-stitched Batwas, Totes, and Backpacks that blend modern utility with timeless Indian threads.',
  heroCtaText: 'Shop Collection',
  heroCtaLink: '/category/Totes'
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Batwas', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600' },
  { id: '2', name: 'Totes', image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=600' },
  { id: '3', name: 'Backpacks', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600' },
  { id: '4', name: 'Slings', image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&q=80&w=600' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Zardosi Embroidered Batwa',
    category: 'Batwas',
    description: 'A classic velvet potli bag featuring intricate zardosi gold-thread embroidery. Perfect for festive evenings.',
    material: 'Premium Velvet',
    dimensions: '8" x 6"',
    careInstructions: 'Dry Clean Only.',
    additionalCare: ['Store in a soft muslin cloth', 'Keep away from moisture', 'Avoid spraying perfume directly'],
    specifications: [
      { label: 'Technique', value: 'Zardosi Hand-embroidery' },
      { label: 'Closure', value: 'Drawstring Potli' },
      { label: 'Inner Lining', value: 'Satin' }
    ],
    retailPrice: 2400,
    sellingPrice: 1899,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'],
    isBestSeller: true,
    isVisible: true,
    isOnSale: true
  },
  {
    id: 'p2',
    name: 'Aari Work Canvas Tote',
    category: 'Totes',
    description: 'Lightweight everyday canvas tote with hand-stitched Aari floral motifs. Spacious and sustainable.',
    material: 'Organic Canvas',
    dimensions: '14" x 16" x 4"',
    careInstructions: 'Gentle hand wash in cold water.',
    additionalCare: ['Use mild detergent', 'Flat dry in shade', 'Do not iron on embroidery'],
    specifications: [
      { label: 'Embroidery', value: 'Aari Needlework' },
      { label: 'Handle Type', value: 'Sturdy Canvas Straps' },
      { label: 'Sustainability', value: 'Plastic-free' }
    ],
    retailPrice: 1500,
    sellingPrice: 999,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=800'],
    isNew: true,
    isVisible: true
  }
];

export const WHATSAPP_NUMBER = '919876543210';
