
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Product, CartItem, User, UserRole, Category, HomepageConfig } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_HOMEPAGE_CONFIG, WHATSAPP_NUMBER } from './constants';
import { 
  clearStoredSession,
  fetchCategoriesFromApi,
  fetchHomepageConfigFromApi,
  fetchProductsFromApi,
  getStoredUser,
  loginAdmin,
  refreshSession
} from './services/api';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import CategoryPage from './pages/CategoryPage';
import ProductCard from './components/ProductCard';

// Helper component to scroll to top on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('doribharat_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('doribharat_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [homepageConfig, setHomepageConfig] = useState<HomepageConfig>(() => {
    const saved = localStorage.getItem('doribharat_homepage');
    return saved ? JSON.parse(saved) : INITIAL_HOMEPAGE_CONFIG;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('doribharat_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('doribharat_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    localStorage.setItem('doribharat_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('doribharat_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('doribharat_homepage', JSON.stringify(homepageConfig));
  }, [homepageConfig]);

  useEffect(() => {
    localStorage.setItem('doribharat_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('doribharat_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const hydrateSession = async () => {
      try {
        const refreshedUser = await refreshSession();
        if (refreshedUser) {
          setUser(refreshedUser);
        }
      } catch (error) {
        console.error('Failed to refresh admin session', error);
        clearStoredSession();
        setUser(null);
      }
    };
    hydrateSession();
  }, []);

  useEffect(() => {
    const fetchRemoteContent = async () => {
      try {
        const [remoteProducts, remoteCategories, remoteHomepage] = await Promise.all([
          fetchProductsFromApi(),
          fetchCategoriesFromApi(),
          fetchHomepageConfigFromApi()
        ]);

        if (remoteProducts?.length) setProducts(remoteProducts);
        if (remoteCategories?.length) setCategories(remoteCategories);
        if (remoteHomepage) setHomepageConfig(remoteHomepage);
      } catch (error) {
        console.error('Failed to load storefront content from API', error);
      }
    };

    fetchRemoteContent();
  }, []);

  // Only show visible products to users
  const visibleProducts = useMemo(() => products.filter(p => p.isVisible), [products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));
  };

  const toggleWishlist = (id: string) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleAdminLogin = useCallback(async (username: string, password: string) => {
    const authenticatedUser = await loginAdmin(username, password);
    setUser(authenticatedUser);
  }, []);

  const handleLogout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-[#FDFCF9]">
        <Navbar 
          cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
          wishlistCount={wishlist.length}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home products={visibleProducts} categories={categories} homepageConfig={homepageConfig} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/product/:id" element={<ProductDetail products={visibleProducts} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/category/:name" element={<CategoryPage products={visibleProducts} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/wishlist" element={<WishlistPage products={visibleProducts} wishlist={wishlist} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} />} />
            <Route path="/cart" element={<CartPage cart={cart} updateQty={updateCartQty} remove={removeFromCart} />} />
            <Route path="/bulk-order" element={<BulkOrderPage />} />
            <Route path="/admin" element={
              <Admin 
                user={user} 
                products={products} 
                categories={categories}
                homepageConfig={homepageConfig}
                onLogin={handleAdminLogin} 
                onUpdateProducts={setProducts} 
                onUpdateCategories={setCategories}
                onUpdateHomepage={setHomepageConfig}
              />
            } />
          </Routes>
        </main>

        <footer className="bg-white border-t border-stone-100 py-16 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-3xl font-bold mb-4 serif text-[#A62C2B]">doribharat</h2>
              <p className="max-w-md text-stone-400 font-light leading-relaxed">
                We believe that bags are more than accessories—they are vessels of culture. Every Doribharat bag is handcrafted by artisans who have perfected the art of Dori work over generations.
              </p>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-6 text-stone-900">Collections</h3>
              <ul className="space-y-4 text-stone-500 font-light text-sm">
                {categories.slice(0, 4).map(cat => (
                  <li key={cat.id}><Link to={`/category/${cat.name}`} className="hover:text-[#A62C2B] transition-colors">{cat.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold mb-6 text-stone-900">Contact Us</h3>
              <p className="text-stone-500 font-light text-sm mb-2">WhatsApp: +91 98765 43210</p>
              <p className="text-stone-500 font-light text-sm mb-4">Email: hello@doribharat.com</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-stone-50 text-center text-[10px] uppercase tracking-widest text-stone-300">
            © {new Date().getFullYear()} Doribharat Artisanal Bags. Crafted with Love in India.
          </div>
        </footer>
      </div>
    </Router>
  );
};

const WishlistPage: React.FC<{ products: Product[], wishlist: string[], onAddToCart: (p: Product) => void, onToggleWishlist: (id: string) => void }> = ({ products, wishlist, onAddToCart, onToggleWishlist }) => {
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <header className="mb-12 text-center">
        <span className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 block">Curation</span>
        <h2 className="text-5xl serif">My Favorites</h2>
        <p className="text-stone-400 font-light mt-4">The treasures you've discovered and held close.</p>
      </header>
      
      {wishlistedProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-400 text-lg font-light mb-8">Your wishlist is waiting to be filled with heritage.</p>
          <Link to="/" className="inline-block bg-stone-900 text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-all">Start Discovering</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {wishlistedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart} 
              onToggleWishlist={onToggleWishlist} 
              isWishlisted={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BulkOrderPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    occasion: 'Wedding',
    quantity: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Bulk Inquiry from Doribharat:%0AName: ${formData.name}%0AOccasion: ${formData.occasion}%0AQuantity: ${formData.quantity}%0AMessage: ${formData.message}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <span className="text-[#A62C2B] font-bold uppercase tracking-[0.3em] text-xs mb-4 block">Artisanal Gifting</span>
        <h1 className="text-5xl md:text-6xl serif mb-6">Heritage for Every Guest</h1>
        <p className="text-stone-500 font-light text-lg max-w-2xl mx-auto leading-relaxed">
          From grand weddings to corporate milestones, share the soul of Indian craftsmanship. Our artisans curate bespoke collections for your special occasions.
        </p>
      </div>

      {!submitted ? (
        <div className="bg-white rounded-[3rem] border border-stone-100 p-8 md:p-12 shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="col-span-1">
              <label className="text-[10px] uppercase font-bold text-stone-800 mb-3 block tracking-widest">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Arjun Sharma"
                className="w-full bg-stone-50 rounded-2xl px-6 py-4 outline-none border border-transparent focus:border-[#A62C2B] transition-all" 
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] uppercase font-bold text-stone-800 mb-3 block tracking-widest">WhatsApp Number</label>
              <input 
                required
                type="tel" 
                value={formData.whatsapp}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                placeholder="+91 98XXX XXXXX"
                className="w-full bg-stone-50 rounded-2xl px-6 py-4 outline-none border border-transparent focus:border-[#A62C2B] transition-all" 
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] uppercase font-bold text-stone-800 mb-3 block tracking-widest">Type of Occasion</label>
              <select 
                value={formData.occasion}
                onChange={e => setFormData({...formData, occasion: e.target.value})}
                className="w-full bg-stone-50 rounded-2xl px-6 py-4 outline-none border border-transparent focus:border-[#A62C2B] appearance-none cursor-pointer"
              >
                <option>Wedding</option>
                <option>Corporate Gifting</option>
                <option>Festive Celebration</option>
                <option>Retail Bulk</option>
                <option>Other Event</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="text-[10px] uppercase font-bold text-stone-800 mb-3 block tracking-widest">Estimated Quantity</label>
              <input 
                required
                type="number" 
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
                placeholder="e.g. 50"
                className="w-full bg-stone-50 rounded-2xl px-6 py-4 outline-none border border-transparent focus:border-[#A62C2B] transition-all" 
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase font-bold text-stone-800 mb-3 block tracking-widest">Tell us your requirements</label>
              <textarea 
                rows={4}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="Preferred colors, designs, or specific deadline..."
                className="w-full bg-stone-50 rounded-3xl px-6 py-4 outline-none border border-transparent focus:border-[#A62C2B] transition-all resize-none" 
              />
            </div>
            <div className="col-span-2 mt-4">
              <button 
                type="submit"
                className="w-full bg-[#A62C2B] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-[#8e2525] transition-all transform active:scale-[0.98]"
              >
                Request Heritage Quote
              </button>
              <p className="text-center text-[10px] text-stone-300 uppercase tracking-widest mt-6">Our team will reach out within 24 business hours</p>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-stone-100 p-16 text-center shadow-sm animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl serif mb-4">Inquiry Initiated</h2>
          <p className="text-stone-500 font-light mb-10 max-w-sm mx-auto">Thank you for choosing Doribharat. We have received your request and will contact you via WhatsApp shortly.</p>
          <Link to="/" className="inline-block border-b-2 border-stone-900 pb-1 font-bold text-xs uppercase tracking-widest hover:text-[#A62C2B] hover:border-[#A62C2B] transition-all">Back to Collection</Link>
        </div>
      )}
    </div>
  );
};

const CartPage: React.FC<{ cart: CartItem[], updateQty: (id: string, qty: number) => void, remove: (id: string) => void }> = ({ cart, updateQty, remove }) => {
  const total = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  
  const handleWhatsAppCheckout = () => {
    const itemsText = cart.map(item => `• ${item.name} (${item.quantity}x) - ₹${item.sellingPrice}`).join('%0A');
    const message = `Hello Doribharat! I would like to order these bags:%0A%0A${itemsText}%0A%0ATotal Amount: ₹${total}%0A%0APlease let me know the next steps for delivery.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-20 text-center">
        <h2 className="text-4xl serif mb-6">Your bag is empty</h2>
        <p className="text-stone-400 font-light mb-12">Carry your heritage. Start your collection today.</p>
        <Link to="/" className="inline-block border-b-2 border-[#A62C2B] text-stone-900 pb-1 font-semibold hover:text-[#A62C2B] transition-colors">Go Back to Shop</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <h2 className="text-4xl serif mb-12 border-b border-stone-100 pb-8">Your Collection</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-8">
          {cart.map(item => (
            <div key={item.id} className="group flex gap-8 items-center pb-8 border-b border-stone-50">
              <div className="w-24 h-32 rounded-2xl overflow-hidden bg-stone-50">
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-lg text-stone-800">{item.name}</h3>
                <p className="text-stone-400 text-xs uppercase tracking-widest mt-1">{item.category}</p>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center bg-stone-50 rounded-full px-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors">-</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors">+</button>
                  </div>
                  <span className="font-bold text-stone-900">₹{item.sellingPrice * item.quantity}</span>
                </div>
              </div>
              <button onClick={() => remove(item.id)} className="text-stone-300 hover:text-red-400 p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
        
        <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm h-fit sticky top-28">
          <h3 className="text-xl serif mb-8">Summary</h3>
          <div className="space-y-4 text-stone-500 font-light">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-stone-900">₹{total}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Complimentary</span>
            </div>
            <div className="border-t border-stone-50 pt-6 mt-6 flex justify-between text-xl text-stone-900 font-bold">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
          <button 
            onClick={handleWhatsAppCheckout}
            className="w-full mt-10 bg-[#A62C2B] text-white py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-[#8e2525] transition-all shadow-xl active:scale-95"
          >
            Order via WhatsApp
          </button>
          <p className="mt-6 text-[10px] text-stone-300 text-center uppercase tracking-widest">Secure Handcrafted Delivery</p>
        </div>
      </div>
    </div>
  );
};

export default App;
