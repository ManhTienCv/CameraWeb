import { useState, useEffect, useCallback } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminPage } from './pages/AdminPage';
import { api } from './lib/api';
import type { Page, Category } from './types';

export default function App() {
  const [page, setPage] = useState<Page>(() => {
    if (window.location.pathname.startsWith('/admin')) {
      return { name: 'admin', tab: 'dashboard' };
    }
    return { name: 'home' };
  });

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getCategories();
        setCategories(data || []);
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      }
    })();
  }, []);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (page.name === 'admin') {
    return <AdminPage onNavigate={navigate} initialTab={page.tab || 'dashboard'} />;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-cream-50">
          <Header onNavigate={navigate} currentPage={page} categories={categories} />

          <main className="flex-1">
            {page.name === 'home' && <HomePage onNavigate={navigate} categories={categories} />}
            {page.name === 'catalog' && (
              <CatalogPage onNavigate={navigate} categories={categories} categorySlug={page.categorySlug} />
            )}
            {page.name === 'product' && (
              <ProductDetailPage slug={page.slug} onNavigate={navigate} categories={categories} />
            )}
            {page.name === 'cart' && <CartPage onNavigate={navigate} />}
            {page.name === 'checkout' && <CheckoutPage onNavigate={navigate} />}
            {page.name === 'order-success' && <OrderSuccessPage orderId={page.orderId} onNavigate={navigate} />}
            {page.name === 'search' && <SearchPage query={page.query} onNavigate={navigate} />}
            {page.name === 'orders' && <OrdersPage onNavigate={navigate} />}
            {page.name === 'profile' && <ProfilePage initialTab={page.tab || 'profile'} onNavigate={navigate} />}
          </main>

          <Footer onNavigate={navigate} categories={categories} />
          <AuthModal />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
