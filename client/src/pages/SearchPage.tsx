import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { Page, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';

interface Props {
  query: string;
  onNavigate: (page: Page) => void;
}

export function SearchPage({ query, onNavigate }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setCurrentPage(1);
      try {
        const data = await api.searchProducts(query);
        setProducts(data);
      } catch (err) {
        console.error('Failed to search products:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [query]);

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Search size={24} className="text-accent-500" />
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-ink-900">
          Kết quả tìm kiếm cho "{query}"
        </h1>
      </div>
      <p className="text-ink-400 mb-8">
        {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${products.length} sản phẩm phù hợp`}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="aspect-square bg-cream-200 rounded-xl mb-4" />
              <div className="h-3 bg-cream-200 rounded mb-2" />
              <div className="h-3 bg-cream-200 rounded w-2/3 mb-4" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-400 mb-4">Không tìm thấy sản phẩm máy ảnh nào phù hợp với từ khóa "{query}"</p>
          <button onClick={() => onNavigate({ name: 'catalog' })} className="btn-secondary">
            Xem tất cả sản phẩm
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {paginatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onView={(slug) => onNavigate({ name: 'product', slug })} />
            ))}
          </div>

          {/* Search Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                ‹ Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-ink-800 text-cream-50 shadow-xs'
                      : 'bg-white text-ink-700 border border-ink-200 hover:border-ink-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sau ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
