
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { User, UserRole } from '../types';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  user: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, wishlistCount, user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl font-bold serif text-[#A62C2B]">doribharat</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/" className={({ isActive }) => `font-medium hover:text-[#A62C2B] transition-colors ${isActive ? 'text-[#A62C2B]' : 'text-stone-600'}`}>Home</NavLink>
            <NavLink to="/bulk-order" className={({ isActive }) => `font-medium hover:text-[#A62C2B] transition-colors ${isActive ? 'text-[#A62C2B]' : 'text-stone-600'}`}>Bulk Order</NavLink>
            {user?.role === UserRole.ADMIN && (
              <Link to="/admin" className="px-4 py-2 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 text-sm font-semibold transition-all">Admin Dashboard</Link>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-5">
            <Link to="/wishlist" className="relative p-2 text-stone-600 hover:text-[#A62C2B] transition-colors" title="My Wishlist">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-stone-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{wishlistCount}</span>}
            </Link>

            <Link to="/cart" className="relative p-2 text-stone-600 hover:text-[#A62C2B] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-[#A62C2B] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
            </Link>
            
            {user ? (
               <div className="flex items-center space-x-3">
                 <span className="text-sm font-medium text-stone-600">Hi, {user.username}</span>
                 <button onClick={onLogout} className="text-xs text-stone-400 hover:text-red-500 underline">Logout</button>
               </div>
            ) : (
              <Link to="/admin" className="p-2 text-stone-600 hover:text-[#A62C2B]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </Link>
            )}

            <button className="md:hidden text-stone-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t p-6 space-y-4 shadow-xl">
           <Link to="/" onClick={() => setIsMenuOpen(false)} className="block font-medium">Home</Link>
           <Link to="/bulk-order" onClick={() => setIsMenuOpen(false)} className="block font-medium">Bulk Order</Link>
           <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="block font-medium">Wishlist</Link>
           <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block font-medium text-[#A62C2B]">Admin</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
