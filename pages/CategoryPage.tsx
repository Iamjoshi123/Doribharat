
import React from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

interface CategoryPageProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  wishlist: string[];
}

const CategoryPage: React.FC<CategoryPageProps> = ({ products, onAddToCart, onToggleWishlist, wishlist }) => {
  const { name } = useParams();
  const filteredProducts = products.filter(p => p.category === name);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="mb-12 text-center">
        <span className="text-[#A62C2B] font-bold uppercase tracking-widest text-xs">Curated Selection</span>
        <h1 className="text-6xl serif mt-2">{name}</h1>
        <p className="mt-4 text-stone-500 max-w-xl mx-auto">Explore our finest {name?.toLowerCase()} collection, meticulously crafted with tradition in mind.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart} 
              onToggleWishlist={id => onToggleWishlist(id)} 
              isWishlisted={wishlist.includes(product.id)}
            />
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
             <p className="text-xl text-stone-400">No products found in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
