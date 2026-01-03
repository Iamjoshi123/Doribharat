
import React from 'react';
import { Link } from 'react-router-dom';
import { Product, Category, HomepageConfig } from '../types';
import ProductCard from '../components/ProductCard';

interface HomeProps {
  products: Product[];
  categories: Category[];
  homepageConfig: HomepageConfig;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  wishlist: string[];
}

const Home: React.FC<HomeProps> = ({ products, categories, homepageConfig, onAddToCart, onToggleWishlist, wishlist }) => {
  // Show all best sellers as requested
  const featured = products.filter(p => p.isBestSeller);

  return (
    <div>
      {/* Dynamic Hero Section */}
      <section className="relative h-[90vh] flex items-center overflow-hidden bg-[#F7F4F0]">
        <div className="absolute inset-0 z-0">
          <img 
            src={homepageConfig.heroImage} 
            className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
            alt="Hero Background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/20 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div className="max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000">
            <span className="uppercase tracking-[0.4em] text-xs font-semibold mb-6 block text-[#A62C2B]">The Embroidered Edit</span>
            <h1 className="text-6xl md:text-8xl serif mb-8 leading-[1.1] text-stone-800">{homepageConfig.heroTitle}</h1>
            <p className="text-lg text-stone-600 mb-10 font-light leading-relaxed">
              {homepageConfig.heroSubtitle}
            </p>
            <div className="flex gap-6">
               <Link to={homepageConfig.heroCtaLink} className="bg-[#A62C2B] text-white px-10 py-4 rounded-full font-medium hover:shadow-xl hover:bg-[#8e2525] transition-all duration-300">{homepageConfig.heroCtaText}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Liteweight Categories */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl serif mb-4">Curated Silhouettes</h2>
          <p className="text-stone-400 font-light max-w-lg mx-auto">From daily commutes to evening galas, find the perfect bag rooted in tradition.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map(cat => (
            <Link key={cat.id} to={`/category/${cat.name}`} className="group block text-center">
              <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-stone-50 mb-6 hover-lift">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/5 transition-colors" />
              </div>
              <h3 className="text-xl font-medium text-stone-800 group-hover:text-[#A62C2B] transition-colors">{cat.name}</h3>
              <span className="text-[10px] uppercase tracking-widest text-stone-400 mt-2 block">Discover More</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Bags */}
      <section className="bg-white py-20 border-y border-stone-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-[#A62C2B] font-semibold uppercase tracking-widest text-[10px] mb-2 block">Our Favorites</span>
              <h2 className="text-4xl serif">Signature Pieces</h2>
            </div>
            <Link to="/category/Totes" className="text-stone-400 hover:text-stone-900 text-sm font-medium border-b border-stone-100 pb-1">View Collection</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {featured.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart} 
                onToggleWishlist={onToggleWishlist} 
                isWishlisted={wishlist.includes(product.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
