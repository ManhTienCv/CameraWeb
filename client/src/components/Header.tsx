import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Search,
  ShoppingBag,
  Menu,
  X,
  Home,
  Grid3x3,
  User as UserIcon,
  Package,
  LogOut,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import type { Page, Category, Product } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  categories: Category[];
}

export function Header({ onNavigate, currentPage, categories }: Props) {
  const { itemCount } = useCart();
  const { user, openAuthModal, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search suggestions with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchProducts(searchQuery.trim());
        setSuggestions(results.slice(0, 5));
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching live suggestions:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      onNavigate({ name: 'search', query: searchQuery.trim() });
      setMobileOpen(false);
    }
  };

  const handleSelectProduct = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    onNavigate({ name: 'product', slug });
  };

  const userInitial = user?.fullName ? user.fullName.trim().charAt(0).toUpperCase() : 'U';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-cream-200'
            : 'bg-white/90 backdrop-blur-xs border-b border-cream-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 lg:h-22">
            {/* 1. Logo & Left Navigation (Bigger & Clearer) */}
            <div className="flex items-center gap-6 lg:gap-10">
              <button
                onClick={() => onNavigate({ name: 'home' })}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <div className="w-11 h-11 bg-accent-500 text-white rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                  <Camera size={22} />
                </div>
                <span className="font-display font-bold text-2xl lg:text-3xl text-ink-900 leading-none tracking-tight">
                  Camera<span className="text-accent-500">Hub</span>
                </span>
              </button>

              {/* Desktop Navigation Links with Framer Motion Shared Layout Gliding Pill */}
              <nav className="hidden lg:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'home' })}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-200 cursor-pointer ${
                    currentPage.name === 'home'
                      ? 'text-white'
                      : 'text-ink-700 hover:text-ink-900 hover:bg-cream-100/70'
                  }`}
                >
                  {currentPage.name === 'home' && (
                    <motion.div
                      layoutId="header-navbar-pill"
                      className="absolute inset-0 bg-accent-500 rounded-full shadow-xs z-0"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <Home
                    size={17}
                    className={`relative z-10 transition-colors duration-200 ${
                      currentPage.name === 'home' ? 'text-white' : 'text-ink-400'
                    }`}
                  />
                  <span className="relative z-10">Trang chủ</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate({ name: 'catalog' })}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-200 cursor-pointer ${
                    currentPage.name === 'catalog'
                      ? 'text-white'
                      : 'text-ink-700 hover:text-ink-900 hover:bg-cream-100/70'
                  }`}
                >
                  {currentPage.name === 'catalog' && (
                    <motion.div
                      layoutId="header-navbar-pill"
                      className="absolute inset-0 bg-accent-500 rounded-full shadow-xs z-0"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <ShoppingBag
                    size={17}
                    className={`relative z-10 transition-colors duration-200 ${
                      currentPage.name === 'catalog' ? 'text-white' : 'text-ink-400'
                    }`}
                  />
                  <span className="relative z-10">Sản phẩm</span>
                </button>
              </nav>
            </div>

            {/* 2. Middle & Right: Search, Cart & Prominent Login / User Pill */}
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Desktop Live Search Container */}
              <div ref={searchContainerRef} className="hidden md:block relative">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim() && suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    placeholder="Tìm kiếm máy ảnh, ống kính..."
                    className="w-56 lg:w-72 pl-10 pr-8 py-2.5 bg-cream-50/80 border border-cream-200 rounded-full text-sm focus:outline-none focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-500/20 transition-all text-ink-800 placeholder:text-ink-400"
                  />
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setShowSuggestions(false);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                    >
                      <X size={14} />
                    </button>
                  )}
                </form>

                {/* Live Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-xl border border-cream-200 overflow-hidden z-50 animate-scale-up">
                    <div className="p-3 border-b border-cream-100 flex items-center justify-between text-[11px] font-bold text-ink-400 uppercase tracking-wider px-4">
                      <span>Gợi ý sản phẩm</span>
                      {isSearching && (
                        <span className="text-accent-500 lowercase font-normal flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-ping" />
                          đang tìm...
                        </span>
                      )}
                    </div>

                    {suggestions.length === 0 ? (
                      <div className="p-5 text-center text-xs text-ink-500">
                        Không tìm thấy sản phẩm nào khớp với "<strong>{searchQuery}</strong>"
                      </div>
                    ) : (
                      <div className="divide-y divide-cream-100 max-h-80 overflow-y-auto">
                        {suggestions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProduct(p.slug)}
                            className="w-full p-3 hover:bg-cream-50 flex items-center gap-3 text-left transition-colors cursor-pointer group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-cream-100 border border-cream-200 overflow-hidden shrink-0">
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-ink-900 group-hover:text-accent-600 transition-colors truncate">
                                {p.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-accent-700 bg-accent-50 px-1.5 py-0.2 rounded">
                                  {p.brand}
                                </span>
                                <span className="text-xs font-bold text-ink-900">
                                  {formatCurrency(p.price)}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {suggestions.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => handleSearchSubmit(e)}
                        className="w-full p-3 bg-cream-50 hover:bg-accent-50/60 text-xs font-bold text-accent-600 border-t border-cream-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Xem tất cả kết quả cho "{searchQuery}"</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Button */}
              <button
                onClick={() => onNavigate({ name: 'cart' })}
                className="relative p-3 hover:bg-cream-100 rounded-full transition-colors group cursor-pointer border border-cream-200 shadow-2xs"
                aria-label="Giỏ hàng"
              >
                <ShoppingBag size={21} className="text-ink-800 group-hover:text-accent-500 transition-colors" />
                <span
                  className={`absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center shadow-2xs transition-all ${
                    itemCount > 0
                      ? 'bg-accent-500 text-white scale-110'
                      : 'bg-cream-300 text-ink-600 border border-cream-200'
                  }`}
                >
                  {itemCount}
                </span>
              </button>

              {/* 3. User Authentication Pill & Dropdown (Larger & Prominent matching Image 1) */}
              <div ref={userMenuRef} className="relative">
                {user ? (
                  // Logged In User Pill
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 bg-white hover:bg-cream-50 border border-cream-300 rounded-full shadow-2xs transition-all cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-full bg-accent-50 text-accent-700 flex items-center justify-center font-bold text-base border border-accent-200 group-hover:scale-105 transition-transform">
                      {userInitial}
                    </div>
                    <span className="font-bold text-sm text-ink-900 max-w-[140px] truncate">
                      {user.fullName || 'Tài khoản'}
                    </span>
                  </button>
                ) : (
                  // Prominent Login Button (Larger, rounded-full pill matching Image 1)
                  <button
                    onClick={() => openAuthModal('login')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-full font-bold text-sm shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <UserIcon size={17} />
                    <span>Đăng Nhập</span>
                  </button>
                )}

                {/* User Dropdown Menu */}
                {user && userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-xl border border-cream-200 overflow-hidden z-50 animate-scale-up p-2">
                    <div className="p-3.5 border-b border-cream-100">
                      <p className="font-bold text-sm text-ink-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-ink-400 mt-0.5 truncate">{user.email}</p>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate({ name: 'orders' });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl hover:bg-cream-50 flex items-center gap-3 text-xs font-bold text-ink-700 hover:text-accent-600 transition-colors text-left cursor-pointer"
                      >
                        <Package size={16} className="text-ink-400" />
                        <span>Lịch sử đơn hàng</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate({ name: 'profile', tab: 'profile' });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl hover:bg-cream-50 flex items-center gap-3 text-xs font-bold text-ink-700 hover:text-accent-600 transition-colors text-left cursor-pointer"
                      >
                        <UserIcon size={16} className="text-ink-400" />
                        <span>Hồ sơ cá nhân</span>
                      </button>

                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onNavigate({ name: 'admin' });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl hover:bg-purple-50 flex items-center gap-3 text-xs font-bold text-purple-700 transition-colors text-left cursor-pointer"
                        >
                          <Sparkles size={16} className="text-purple-500" />
                          <span>Trang Quản trị Admin</span>
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-cream-100">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl hover:bg-rose-50 flex items-center gap-3 text-xs font-bold text-rose-600 transition-colors text-left cursor-pointer"
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2.5 hover:bg-cream-100 rounded-2xl transition-colors cursor-pointer"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-cream-200 animate-slide-up px-4 py-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm máy ảnh, ống kính..."
                className="w-full pl-10 pr-4 py-2.5 bg-cream-50 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500"
              />
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            </form>

            <button
              onClick={() => {
                onNavigate({ name: 'home' });
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                currentPage.name === 'home'
                  ? 'bg-accent-500 text-white'
                  : 'text-ink-700 hover:bg-cream-100'
              }`}
            >
              <Home size={18} /> Trang chủ
            </button>
            <button
              onClick={() => {
                onNavigate({ name: 'catalog' });
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                currentPage.name === 'catalog'
                  ? 'bg-accent-500 text-white'
                  : 'text-ink-700 hover:bg-cream-100'
              }`}
            >
              <ShoppingBag size={18} /> Tất cả sản phẩm
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onNavigate({ name: 'catalog', categorySlug: cat.slug });
                  setMobileOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-ink-600 hover:bg-cream-100 rounded-xl text-xs"
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="h-18 lg:h-22" />
    </>
  );
}
