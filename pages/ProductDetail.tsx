
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { WHATSAPP_NUMBER } from '../constants';

interface ProductDetailProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  wishlist: string[];
}

const ProductDetail: React.FC<ProductDetailProps> = ({ products, onAddToCart, onToggleWishlist, wishlist }) => {
  const { id } = useParams();
  const product = products.find(p => p.id === id);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'care'>('desc');
  const [mainImageIndex, setMainImageIndex] = useState(0);

  if (!product) return <div className="py-24 text-center">Product not found. <Link to="/">Go Home</Link></div>;

  const isWishlisted = wishlist.includes(product.id);

  const handleWhatsAppBuy = () => {
    const message = `Hi Doribharat! I'm interested in buying ${qty}x ${product.name} (Price: ₹${product.sellingPrice}). %0A%0AProduct Link: ${window.location.href}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
      <div className="mb-6 md:mb-8 flex items-center text-stone-400 text-sm gap-2">
        <Link to="/" className="hover:text-stone-900 transition-colors">Home</Link>
        <span>/</span>
        <Link to={`/category/${product.category}`} className="hover:text-stone-900 transition-colors">{product.category}</Link>
        <span>/</span>
        <span className="text-stone-900 font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery */}
        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-stone-100 shadow-sm border border-stone-100 relative group">
            <img 
              key={product.images[mainImageIndex]}
              src={product.images[mainImageIndex]} 
              alt={product.name} 
              className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500" 
            />
            {product.isOnSale && (
               <span className="absolute top-6 left-6 bg-[#A62C2B] text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">Sale</span>
            )}
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setMainImageIndex(i)}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${mainImageIndex === i ? 'border-[#A62C2B] ring-4 ring-[#A62C2B]/10' : 'border-transparent hover:border-stone-200'}`}
                >
                  <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Container */}
        <div className="flex flex-col">
          <div className="mb-4">
            <span className="text-[#3D5A2F] font-bold uppercase tracking-[0.3em] text-[10px]">{product.category}</span>
            <h1 className="text-4xl lg:text-5xl serif mt-2 mb-4 leading-tight text-stone-900">{product.name}</h1>
            
            <div className="flex items-center gap-6 mb-6">
              <span className="font-bold text-3xl text-stone-900">₹{product.sellingPrice}</span>
              <div className="flex flex-col">
                <span className="text-stone-300 line-through text-sm font-light leading-none">₹{product.retailPrice}</span>
                <span className="text-[#3D5A2F] text-[10px] font-bold uppercase tracking-widest mt-1">
                  Save {Math.round(((product.retailPrice - product.sellingPrice) / product.retailPrice) * 100)}%
                </span>
              </div>
            </div>
            
            {/* Tabs for Info */}
            <div className="border-b border-stone-100 mb-6 flex gap-6 md:gap-8">
              {['desc', 'specs', 'care'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all border-b-2 relative ${activeTab === tab ? 'border-[#A62C2B] text-stone-900' : 'border-transparent text-stone-300 hover:text-stone-500'}`}
                >
                  {tab === 'desc' ? 'Narrative' : tab === 'specs' ? 'Details' : 'Care'}
                </button>
              ))}
            </div>

            <div className="mb-8">
              {activeTab === 'desc' && <p className="text-stone-500 leading-relaxed text-base md:text-lg font-light animate-in fade-in duration-500">{product.description}</p>}
              {activeTab === 'specs' && (
                <div className="space-y-3 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                    <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Material</span>
                    <span className="text-stone-800 text-sm font-medium">{product.material}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-stone-50 pb-2">
                    <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Dimensions</span>
                    <span className="text-stone-800 text-sm font-medium">{product.dimensions}</span>
                  </div>
                  {product.specifications?.map((spec, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-stone-50 pb-2">
                      <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{spec.label}</span>
                      <span className="text-stone-800 text-sm font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'care' && (
                <div className="animate-in fade-in duration-500 space-y-4">
                  <p className="text-stone-500 leading-relaxed italic text-base md:text-lg font-light">{product.careInstructions}</p>
                  {product.additionalCare && product.additionalCare.length > 0 && (
                    <ul className="space-y-2">
                      {product.additionalCare.map((tip, i) => (
                        <li key={i} className="flex items-start gap-4 text-sm text-stone-600 font-light">
                          <span className="w-1.5 h-1.5 bg-[#A62C2B] rounded-full mt-2 shrink-0 shadow-sm"></span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-stone-50 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-stone-50 rounded-2xl p-1 border border-stone-100">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors text-xl">-</button>
                <span className="w-8 md:w-12 font-bold text-center text-stone-800">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors text-xl">+</button>
              </div>
              <button 
                onClick={() => onToggleWishlist(product.id)}
                className={`flex-grow h-12 md:h-14 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold text-[10px] md:text-xs uppercase tracking-widest ${isWishlisted ? 'bg-red-50 text-[#A62C2B]' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
              >
                <svg className={`w-4 h-4 md:w-5 md:h-5 ${isWishlisted ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => onAddToCart({ ...product })}
                className="bg-stone-900 text-white py-4 md:py-5 rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] hover:bg-stone-800 transition-all shadow-xl active:scale-[0.98]"
              >
                Add to Cart
              </button>
              <button 
                onClick={handleWhatsAppBuy}
                className="bg-[#25D366] text-white py-4 md:py-5 rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#1ebd5e] transition-all shadow-xl active:scale-[0.98]"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                Order via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
