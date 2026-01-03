
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  isWishlisted: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onToggleWishlist, isWishlisted }) => {
  return (
    <div className="group flex flex-col h-full bg-white transition-smooth">
      {/* Image Wrap */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] bg-stone-50 mb-6 hover-lift">
        {/* Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {product.isNew && (
            <span className="bg-white/90 backdrop-blur-sm text-stone-800 text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full font-semibold shadow-sm">
              New
            </span>
          )}
          {product.isOnSale && (
            <span className="bg-[#A62C2B] text-white text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-full font-bold shadow-sm">
              Sale
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button 
          onClick={(e) => { e.preventDefault(); onToggleWishlist(product.id); }}
          className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isWishlisted ? 'bg-[#A62C2B] text-white shadow-lg' : 'bg-white/80 backdrop-blur-md text-stone-400 hover:text-red-500'}`}
        >
          <svg className={`w-5 h-5 ${isWishlisted ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <Link to={`/product/${product.id}`} className="block h-full">
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105" 
          />
        </Link>
        
        {/* Quick Add Overlay */}
        <button 
          onClick={() => onAddToCart(product)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-stone-800 px-6 py-3 rounded-full text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 whitespace-nowrap active:scale-95"
        >
          Quick Add +
        </button>
      </div>

      {/* Info - Liteweight Typography */}
      <div className="flex-grow flex flex-col items-center text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#3D5A2F] mb-1 font-semibold">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-medium text-stone-800 group-hover:text-[#A62C2B] transition-colors mb-2">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-3 mt-auto">
          <span className="text-stone-400 text-xs line-through font-light">₹{product.retailPrice}</span>
          <span className="text-lg font-bold text-stone-900">₹{product.sellingPrice}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
