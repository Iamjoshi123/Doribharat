
import React, { useState, useEffect } from 'react';
import { Product, User, UserRole, Category, HomepageConfig, ProductSpec } from '../types';
import { generateProductDescription } from '../services/geminiService';

interface AdminProps {
  user: User | null;
  products: Product[];
  categories: Category[];
  homepageConfig: HomepageConfig;
  onLogin: (username: string, password: string) => Promise<void>;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateHomepage: (config: HomepageConfig) => void;
}

type AdminTab = 'products' | 'categories' | 'homepage';

const Admin: React.FC<AdminProps> = ({ 
  user, products, categories, homepageConfig, 
  onLogin, onUpdateProducts, onUpdateCategories, onUpdateHomepage 
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState<Partial<Product>>({});
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({});
  const [hpFormData, setHpFormData] = useState<HomepageConfig>(homepageConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingId || editingCatId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [editingId, editingCatId]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      await onLogin(username, password);
    } catch (error) {
      console.error('Admin login failed', error);
      setAuthError(
        error instanceof Error
          ? error.message
          : 'Unable to authenticate. Please verify your credentials and try again.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- Product Management ---
  const handleEditProduct = (p: Product) => {
    setErrors({});
    setEditingId(p.id);
    setProductFormData({
      ...p,
      specifications: p.specifications || [],
      additionalCare: p.additionalCare || [],
      images: p.images || []
    });
  };

  const handleAdjustStock = (id: string, delta: number) => {
    onUpdateProducts(products.map(p => 
      p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
    ));
  };

  const validateProductForm = () => {
    const newErrors: Record<string, string> = {};
    if (!productFormData.name?.trim()) newErrors.name = "Product name is required";
    if (!productFormData.category) newErrors.category = "Please select a category";
    if (!productFormData.description?.trim()) newErrors.description = "Product description is required";
    if (productFormData.retailPrice === undefined || productFormData.retailPrice < 0) newErrors.retailPrice = "Valid retail price is required";
    if (productFormData.sellingPrice === undefined || productFormData.sellingPrice <= 0) newErrors.sellingPrice = "Valid selling price is required";
    if (productFormData.stock === undefined || productFormData.stock < 0) newErrors.stock = "Stock cannot be negative";
    if (!productFormData.material?.trim()) newErrors.material = "Base material is required";
    if (!productFormData.dimensions?.trim()) newErrors.dimensions = "Dimensions are required";
    
    const validImages = (productFormData.images || []).filter(img => img.trim() !== '');
    if (validImages.length === 0) newErrors.images = "At least one product image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProduct = () => {
    if (!validateProductForm()) {
      const firstErrorField = Object.keys(errors)[0];
      // Optional: scroll to first error in the modal
      return;
    }

    const finalImages = (productFormData.images || []).filter(img => img.trim() !== '');

    if (editingId === 'new') {
      const newProduct = { 
        ...productFormData, 
        id: Date.now().toString(),
        isVisible: productFormData.isVisible ?? true,
        images: finalImages,
        specifications: productFormData.specifications || [],
        additionalCare: productFormData.additionalCare || []
      } as Product;
      onUpdateProducts([newProduct, ...products]);
    } else {
      onUpdateProducts(products.map(p => p.id === editingId ? ({ ...productFormData, images: finalImages } as Product) : p));
    }
    setEditingId(null);
    setProductFormData({});
    setErrors({});
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      onUpdateProducts(products.filter(p => p.id !== id));
    }
  };

  // --- Spec Management ---
  const addSpec = () => {
    const specs = [...(productFormData.specifications || []), { label: '', value: '' }];
    setProductFormData({ ...productFormData, specifications: specs });
  };

  const updateSpec = (index: number, field: keyof ProductSpec, val: string) => {
    const specs = [...(productFormData.specifications || [])];
    specs[index] = { ...specs[index], [field]: val };
    setProductFormData({ ...productFormData, specifications: specs });
  };

  const removeSpec = (index: number) => {
    const specs = (productFormData.specifications || []).filter((_, i) => i !== index);
    setProductFormData({ ...productFormData, specifications: specs });
  };

  // --- Care Management ---
  const addCareTip = () => {
    const care = [...(productFormData.additionalCare || []), ''];
    setProductFormData({ ...productFormData, additionalCare: care });
  };

  const updateCareTip = (index: number, val: string) => {
    const care = [...(productFormData.additionalCare || [])];
    care[index] = val;
    setProductFormData({ ...productFormData, additionalCare: care });
  };

  const removeCareTip = (index: number) => {
    const care = (productFormData.additionalCare || []).filter((_, i) => i !== index);
    setProductFormData({ ...productFormData, additionalCare: care });
  };

  // --- Image Management ---
  const addImageUrl = () => {
    const imgs = [...(productFormData.images || []), ''];
    setProductFormData({ ...productFormData, images: imgs });
  };

  const updateImageUrl = (index: number, val: string) => {
    const imgs = [...(productFormData.images || [])];
    imgs[index] = val;
    setProductFormData({ ...productFormData, images: imgs });
  };

  const removeImageUrl = (index: number) => {
    const imgs = (productFormData.images || []).filter((_, i) => i !== index);
    setProductFormData({ ...productFormData, images: imgs });
  };

  // --- Category Management ---
  const handleEditCategory = (c: Category) => {
    setEditingCatId(c.id);
    setCategoryFormData(c);
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name) return;
    if (editingCatId === 'new') {
      const newCat = { ...categoryFormData, id: Date.now().toString() } as Category;
      onUpdateCategories([...categories, newCat]);
    } else {
      onUpdateCategories(categories.map(c => c.id === editingCatId ? (categoryFormData as Category) : c));
    }
    setEditingCatId(null);
    setCategoryFormData({});
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this collection?')) {
      onUpdateCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleGenerateAI = async () => {
    if (!productFormData.name || !productFormData.category) {
      alert("Please enter a name and category first!");
      return;
    }
    setIsGenerating(true);
    const desc = await generateProductDescription(productFormData.name, productFormData.category);
    setProductFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  if (!user || user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-stone-50">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-stone-100 max-w-md w-full">
          <h2 className="text-4xl serif text-center mb-2">Admin Login</h2>
          <p className="text-center text-stone-400 mb-8 font-light">Enter credentials to manage your boutique</p>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input 
              type="text" placeholder="Username" value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 outline-none ring-[#A62C2B] focus:ring-1 border border-stone-100" 
            />
            <input 
              type="password" placeholder="Password" value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-stone-50 rounded-xl px-4 py-3 outline-none ring-[#A62C2B] focus:ring-1 border border-stone-100" 
            />
            {authError && <p className="text-[11px] text-red-500 font-semibold text-center">{authError}</p>}
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className={`w-full bg-[#A62C2B] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-[#8e2525] transition-all transform hover:-translate-y-0.5 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoggingIn ? 'Signing you in...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
        <div>
          <h1 className="text-5xl serif mb-2">Inventory Hub</h1>
          <p className="text-stone-400 font-light">Manage your artisanal collection and store presence</p>
        </div>
        <div className="flex bg-stone-100 p-1.5 rounded-2xl">
          {(['products', 'categories', 'homepage'] as AdminTab[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl serif">Product Catalog</h2>
            <button 
              onClick={() => { 
                setErrors({});
                setEditingId('new'); 
                setProductFormData({ images: [''], stock: 1, isVisible: true, specifications: [], additionalCare: [] }); 
              }}
              className="bg-[#A62C2B] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#8e2525] transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              New Treasure
            </button>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.2em] text-stone-400 font-bold border-b border-stone-100">
                  <tr>
                    <th className="px-8 py-5">Product Details</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5">Inventory</th>
                    <th className="px-8 py-5">Value</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-8 py-5 flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-stone-50 overflow-hidden shrink-0 border border-stone-100">
                          <img src={p.images[0]} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{p.name}</div>
                          <div className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold">{p.category}</div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${p.isVisible ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                            {p.isVisible ? 'Public' : 'Hidden'}
                          </span>
                          {p.isOnSale && <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-amber-50 text-amber-600">Sale</span>}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleAdjustStock(p.id, -1)} className="w-8 h-8 rounded-xl border border-stone-200 text-stone-400 hover:text-[#A62C2B] hover:border-[#A62C2B] transition-all flex items-center justify-center">-</button>
                          <span className={`font-bold text-sm min-w-[1.5rem] text-center ${p.stock <= 5 ? 'text-red-500 underline decoration-2' : 'text-stone-800'}`}>{p.stock}</span>
                          <button onClick={() => handleAdjustStock(p.id, 1)} className="w-8 h-8 rounded-xl border border-stone-200 text-stone-400 hover:text-[#A62C2B] hover:border-[#A62C2B] transition-all flex items-center justify-center">+</button>
                        </div>
                      </td>
                      <td className="px-8 py-5 font-bold text-stone-700">₹{p.sellingPrice}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEditProduct(p)} className="p-2.5 text-stone-300 hover:text-stone-900 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 text-stone-300 hover:text-red-500 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Editor Modal */}
      {editingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl h-[90vh] overflow-hidden shadow-2xl flex flex-col relative">
            <header className="shrink-0 bg-white z-20 px-10 py-8 border-b border-stone-100 flex justify-between items-center">
              <div>
                <h3 className="text-3xl serif">{editingId === 'new' ? 'New Treasure' : 'Refine Creation'}</h3>
                <p className="text-stone-400 text-xs font-light mt-1">Fill in the details to curate your product presentation.</p>
              </div>
              <button onClick={() => setEditingId(null)} className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:text-stone-900 transition-colors text-2xl">&times;</button>
            </header>
            
            <div className="flex-grow overflow-y-auto px-10 py-12 space-y-12">
              {/* Section 1: Identity */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#A62C2B]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Identity & Category</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Product Name <span className="text-[#A62C2B]">*</span></label>
                    <input 
                      type="text" placeholder="e.g. Zardosi Velvet Potli Bag" value={productFormData.name || ''} 
                      onChange={e => {
                        setProductFormData({...productFormData, name: e.target.value});
                        if(errors.name) setErrors(prev => ({...prev, name: ''}));
                      }}
                      className={`w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border transition-all ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`} 
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Collection Category <span className="text-[#A62C2B]">*</span></label>
                    <select 
                      value={productFormData.category || ''} 
                      onChange={e => {
                        setProductFormData({...productFormData, category: e.target.value});
                        if(errors.category) setErrors(prev => ({...prev, category: ''}));
                      }}
                      className={`w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border transition-all appearance-none cursor-pointer ${errors.category ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`}
                    >
                      <option value="">Choose a category...</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    {errors.category && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{errors.category}</p>}
                  </div>
                </div>
              </section>

              {/* Section 2: Narrative */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#A62C2B]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Narrative & Description</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-stone-800">The Story <span className="text-[#A62C2B]">*</span></label>
                    <button 
                      onClick={handleGenerateAI} 
                      disabled={isGenerating} 
                      className={`text-[10px] font-bold text-[#A62C2B] uppercase flex items-center gap-1.5 transition-all ${isGenerating ? 'animate-pulse' : 'hover:underline'}`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2h7.6l-6.15 4.47 2.35 7.33-6.2-4.5-6.2 4.5 2.35-7.33-6.15-4.47h7.6z"/></svg>
                      {isGenerating ? 'Drafting...' : '✨ Use AI Muse'}
                    </button>
                  </div>
                  <textarea 
                    rows={4} 
                    placeholder="Tell the story of this piece... (Artisan details, fabric feel, heritage inspiration)"
                    value={productFormData.description || ''} 
                    onChange={e => {
                      setProductFormData({...productFormData, description: e.target.value});
                      if(errors.description) setErrors(prev => ({...prev, description: ''}));
                    }}
                    className={`w-full bg-stone-50 rounded-2xl px-5 py-4 outline-none border transition-all resize-none leading-relaxed text-sm font-light ${errors.description ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`} 
                  />
                  {errors.description && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-widest">{errors.description}</p>}
                </div>
              </section>

              {/* Section 3: Value & Availability */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#A62C2B]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Value & Availability</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Original MRP (₹) <span className="text-[#A62C2B]">*</span></label>
                    <input 
                      type="number" placeholder="2400" value={productFormData.retailPrice ?? ''} 
                      onChange={e => {
                        setProductFormData({...productFormData, retailPrice: parseInt(e.target.value) || 0});
                        if(errors.retailPrice) setErrors(prev => ({...prev, retailPrice: ''}));
                      }}
                      className={`w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border ${errors.retailPrice ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`} 
                    />
                    {errors.retailPrice && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{errors.retailPrice}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Selling Price (₹) <span className="text-[#A62C2B]">*</span></label>
                    <input 
                      type="number" placeholder="1899" value={productFormData.sellingPrice ?? ''} 
                      onChange={e => {
                        setProductFormData({...productFormData, sellingPrice: parseInt(e.target.value) || 0});
                        if(errors.sellingPrice) setErrors(prev => ({...prev, sellingPrice: ''}));
                      }}
                      className={`w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border ${errors.sellingPrice ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`} 
                    />
                    {errors.sellingPrice && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{errors.sellingPrice}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Units in Stock <span className="text-[#A62C2B]">*</span></label>
                    <input 
                      type="number" placeholder="10" value={productFormData.stock ?? ''} 
                      onChange={e => {
                        setProductFormData({...productFormData, stock: parseInt(e.target.value) || 0});
                        if(errors.stock) setErrors(prev => ({...prev, stock: ''}));
                      }}
                      className={`w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border ${errors.stock ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`} 
                    />
                    {errors.stock && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{errors.stock}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl cursor-pointer hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200">
                    <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">Public Display</span>
                    <input type="checkbox" checked={productFormData.isVisible} onChange={e => setProductFormData({...productFormData, isVisible: e.target.checked})} className="accent-[#A62C2B] w-5 h-5" />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl cursor-pointer hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200">
                    <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">Sale Badge</span>
                    <input type="checkbox" checked={productFormData.isOnSale} onChange={e => setProductFormData({...productFormData, isOnSale: e.target.checked})} className="accent-[#A62C2B] w-5 h-5" />
                  </label>
                  <label className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl cursor-pointer hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200">
                    <span className="text-xs font-bold text-stone-600 uppercase tracking-widest">Bestseller</span>
                    <input type="checkbox" checked={productFormData.isBestSeller} onChange={e => setProductFormData({...productFormData, isBestSeller: e.target.checked})} className="accent-[#A62C2B] w-5 h-5" />
                  </label>
                </div>
              </section>

              {/* Section 4: Specifications */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#A62C2B]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Technical Specifications</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Base Material <span className="text-[#A62C2B]">*</span></label>
                    <input 
                      type="text" placeholder="e.g. Premium Silk, 100% Organic Canvas" value={productFormData.material || ''} 
                      onChange={e => {
                        setProductFormData({...productFormData, material: e.target.value});
                        if(errors.material) setErrors(prev => ({...prev, material: ''}));
                      }}
                      className={`w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border ${errors.material ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`} 
                    />
                    {errors.material && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{errors.material}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Dimensions (H x W x D) <span className="text-[#A62C2B]">*</span></label>
                    <input 
                      type="text" placeholder="e.g. 10 x 8 x 2 inches" value={productFormData.dimensions || ''} 
                      onChange={e => {
                        setProductFormData({...productFormData, dimensions: e.target.value});
                        if(errors.dimensions) setErrors(prev => ({...prev, dimensions: ''}));
                      }}
                      className={`w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border ${errors.dimensions ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-[#A62C2B]'}`} 
                    />
                    {errors.dimensions && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest">{errors.dimensions}</p>}
                  </div>
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-stone-800">Additional Details</label>
                    <button onClick={addSpec} className="text-[10px] text-[#A62C2B] font-bold flex items-center gap-1 hover:underline">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                      ADD ROW
                    </button>
                  </div>
                  <div className="space-y-3">
                    {productFormData.specifications?.map((spec, i) => (
                      <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-300">
                        <input type="text" placeholder="Label (e.g. Closure)" value={spec.label} onChange={e => updateSpec(i, 'label', e.target.value)} className="w-1/2 bg-stone-50 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-stone-200" />
                        <input type="text" placeholder="Value (e.g. Zipper)" value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} className="w-1/2 bg-stone-50 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-stone-200" />
                        <button onClick={() => removeSpec(i)} className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors">&times;</button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Section 5: Media */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#A62C2B]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Product Media</h4>
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-stone-800">Image Assets <span className="text-[#A62C2B]">*</span></label>
                    <button onClick={addImageUrl} className="text-[10px] text-[#A62C2B] font-bold flex items-center gap-1 hover:underline">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                      ADD PHOTO URL
                    </button>
                  </div>
                  
                  {errors.images && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-widest">{errors.images}</p>}
                  
                  <div className="space-y-4">
                    {productFormData.images?.map((url, i) => (
                      <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-300">
                        <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden shrink-0 border border-stone-200">
                           <img src={url} className="w-full h-full object-cover" alt="" onError={(e) => (e.currentTarget.src = "https://placehold.co/100?text=...")}/>
                        </div>
                        <input 
                          type="text" 
                          placeholder="https://images.unsplash.com/..." 
                          value={url} 
                          onChange={e => {
                            updateImageUrl(i, e.target.value);
                            if(errors.images) setErrors(prev => ({...prev, images: ''}));
                          }} 
                          className={`flex-grow bg-stone-50 rounded-xl px-4 py-3 text-xs font-mono outline-none border transition-all ${errors.images ? 'border-red-400 focus:border-red-500' : 'border-transparent focus:border-stone-200'}`} 
                        />
                        <button onClick={() => removeImageUrl(i)} className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors">&times;</button>
                      </div>
                    ))}
                  </div>

                  {productFormData.images && productFormData.images.length > 0 && (
                    <div className="p-6 bg-stone-50 rounded-[2.5rem] border border-stone-100">
                       <label className="text-[9px] uppercase font-bold text-stone-400 block mb-4">Gallery Preview</label>
                       <div className="grid grid-cols-6 gap-4">
                         {productFormData.images.filter(url => url.trim() !== '').map((img, i) => (
                           <div key={i} className="aspect-square bg-white rounded-xl overflow-hidden shadow-sm border border-white">
                             <img src={img} className="w-full h-full object-cover" alt="" />
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 6: Care Guide */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#A62C2B]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400">Heritage Care Guide</h4>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-800 block mb-2">Primary Care Instructions</label>
                    <textarea 
                      placeholder="e.g. Professional Dry Clean Only. Avoid moisture." 
                      value={productFormData.careInstructions || ''} 
                      onChange={e => setProductFormData({...productFormData, careInstructions: e.target.value})}
                      className="w-full bg-stone-50 rounded-2xl px-5 py-4 outline-none text-sm resize-none h-24 border border-transparent focus:border-stone-200"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] uppercase font-bold text-stone-800">Additional Care Tips</label>
                      <button onClick={addCareTip} className="text-[10px] text-[#A62C2B] font-bold flex items-center gap-1 hover:underline">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                        ADD TIP
                      </button>
                    </div>
                    <div className="space-y-3">
                      {productFormData.additionalCare?.map((tip, i) => (
                        <div key={i} className="flex gap-4 items-start animate-in slide-in-from-left-2 duration-300">
                          <textarea 
                            value={tip} 
                            onChange={e => updateCareTip(i, e.target.value)} 
                            className="flex-grow bg-stone-50 rounded-xl px-5 py-3 text-sm outline-none resize-none h-12 border border-transparent focus:border-stone-200" 
                            placeholder="e.g. Store in muslin cloth."
                          />
                          <button onClick={() => removeCareTip(i)} className="w-10 h-10 flex items-center justify-center text-stone-300 hover:text-red-400 transition-colors mt-1">&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <footer className="shrink-0 bg-white z-20 px-10 py-8 border-t border-stone-100 flex gap-4">
              <button 
                onClick={handleSaveProduct}
                className="flex-grow bg-[#A62C2B] text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-[#8e2525] transition-all transform active:scale-95"
              >
                Save Creation to Boutique
              </button>
              <button 
                onClick={() => setEditingId(null)}
                className="px-10 bg-stone-100 text-stone-500 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-all"
              >
                Discard Changes
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Category Management */}
      {activeTab === 'categories' && (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl serif">Collection Management</h2>
            <button 
              onClick={() => { setEditingCatId('new'); setCategoryFormData({}); }}
              className="bg-stone-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-stone-800 transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              New Collection
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-50 border border-stone-50">
                    <img src={cat.image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <span className="font-bold text-stone-800 text-lg">{cat.name}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleEditCategory(cat)} className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-[#A62C2B] transition-colors">Refine</button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-[10px] font-bold uppercase tracking-widest text-stone-300 hover:text-red-500 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {editingCatId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl serif">{editingCatId === 'new' ? 'New Collection' : 'Refine Collection'}</h3>
              <button onClick={() => setEditingCatId(null)} className="text-stone-300 hover:text-stone-900 text-3xl">&times;</button>
            </div>
            <div className="space-y-8">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-3">Collection Name</label>
                <input 
                  type="text" placeholder="e.g. Vintage Potlis" value={categoryFormData.name || ''} 
                  onChange={e => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  className="w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border border-transparent focus:border-[#A62C2B] transition-all" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-3">Cover Image URL</label>
                <input 
                  type="text" placeholder="https://unsplash.com/photo-..." value={categoryFormData.image || ''} 
                  onChange={e => setCategoryFormData({...categoryFormData, image: e.target.value})}
                  className="w-full bg-stone-50 rounded-xl px-5 py-3.5 outline-none border border-transparent focus:border-[#A62C2B] transition-all" 
                />
              </div>
              <button 
                onClick={handleSaveCategory}
                className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg active:scale-95"
              >
                Establish Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Homepage Management */}
      {activeTab === 'homepage' && (
        <div className="max-w-3xl mx-auto bg-white p-12 rounded-[3.5rem] border border-stone-100 shadow-sm animate-in fade-in duration-500">
          <div className="mb-10">
            <h2 className="text-3xl serif mb-2">Storefront Curation</h2>
            <p className="text-stone-400 font-light text-sm">Design the first impression of Doribharat.</p>
          </div>
          
          <div className="space-y-10">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-3">Hero Presence (Image URL)</label>
              <input 
                type="text" value={hpFormData.heroImage} 
                onChange={e => setHpFormData({...hpFormData, heroImage: e.target.value})}
                className="w-full bg-stone-50 rounded-xl px-5 py-4 outline-none border border-transparent focus:border-[#A62C2B]" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-3">Welcome Headline</label>
              <input 
                type="text" value={hpFormData.heroTitle} 
                onChange={e => setHpFormData({...hpFormData, heroTitle: e.target.value})}
                className="w-full bg-stone-50 rounded-xl px-5 py-4 outline-none border border-transparent focus:border-[#A62C2B]" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-3">Supporting Narrative</label>
              <textarea 
                rows={4} value={hpFormData.heroSubtitle} 
                onChange={e => setHpFormData({...hpFormData, heroSubtitle: e.target.value})}
                className="w-full bg-stone-50 rounded-2xl px-5 py-4 outline-none border border-transparent focus:border-[#A62C2B] resize-none leading-relaxed" 
              />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-3">CTA Button Text</label>
                <input 
                  type="text" value={hpFormData.heroCtaText} 
                  onChange={e => setHpFormData({...hpFormData, heroCtaText: e.target.value})}
                  className="w-full bg-stone-50 rounded-xl px-5 py-4 outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block mb-3">CTA Destination (Link)</label>
                <input 
                  type="text" value={hpFormData.heroCtaLink} 
                  onChange={e => setHpFormData({...hpFormData, heroCtaLink: e.target.value})}
                  className="w-full bg-stone-50 rounded-xl px-5 py-4 outline-none" 
                />
              </div>
            </div>
            <button 
              onClick={() => { onUpdateHomepage(hpFormData); alert('Storefront aesthetic updated successfully.'); }}
              className="w-full bg-[#A62C2B] text-white py-5 rounded-2xl font-bold shadow-xl hover:bg-[#8e2525] transition-all transform active:scale-[0.98]"
            >
              Apply Curation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
