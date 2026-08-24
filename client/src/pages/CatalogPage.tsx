import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import type { Page, Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';

interface Props {
  onNavigate: (page: Page) => void;
  categories: Category[];
  categorySlug?: string;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const sortLabels: Record<SortOption, string> = {
  featured: 'Nổi bật',
  'price-asc': 'Giá thấp đến cao',
  'price-desc': 'Giá cao đến thấp',
  rating: 'Đánh giá cao',
  newest: 'Mới nhất',
};

export function CatalogPage({ onNavigate, categories, categorySlug }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categorySlug || null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>('featured');
  const [, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000000]);

  useEffect(() => {
    setSelectedCategory(categorySlug || null);
  }, [categorySlug]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getProducts({
          sort: sort,
        });
        setProducts(data || []);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [sort]);

  const [allBrands, setAllBrands] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const bList = await api.getBrands();
        if (bList && bList.length > 0) {
          setAllBrands(bList.map((b) => b.name));
        }
      } catch (e) {
        console.error('Failed to load brands:', e);
      }
    })();
  }, []);

  const brands = useMemo(() => {
    if (allBrands.length > 0) return allBrands;
    return Array.from(new Set(products.map((p) => p.brand))).filter(Boolean).sort();
  }, [allBrands, products]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.slug === selectedCategory);
  }, [categories, selectedCategory]);

  const categoryFiltered = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter((p) => {
      if (activeCategory) {
        return (
          p.category_id === activeCategory.id ||
          (p.category_name && p.category_name.toLowerCase() === activeCategory.name.toLowerCase())
        );
      }
      return true;
    });
  }, [products, selectedCategory, activeCategory]);

  const filtered = useMemo(() => {
    let result = [...categoryFiltered];
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    return result;
  }, [categoryFiltered, selectedBrands, priceRange]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrands, priceRange, sort]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedFiltered = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-400 mb-4">
        <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-ink-700">
          Trang chủ
        </button>
        <span>/</span>
        <button onClick={() => onNavigate({ name: 'catalog' })} className="hover:text-ink-700">
          Sản phẩm
        </button>
        {activeCategory && (
          <>
            <span>/</span>
            <span className="text-ink-700">{activeCategory.name}</span>
          </>
        )}
      </div>

      <h1 className="font-display font-bold text-3xl text-ink-900 mb-2">
        {activeCategory ? activeCategory.name : 'Tất cả sản phẩm Máy ảnh'}
      </h1>
      <p className="text-ink-400 mb-8">
        {activeCategory?.description || 'Khám phá bộ sưu tập máy ảnh, ống kính và phụ kiện chuyên nghiệp'}
      </p>

      {/* Category pills with Framer Motion Shared Layout Gliding Capsule */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`relative px-5 py-2.5 rounded-full text-sm font-bold border transition-colors duration-200 cursor-pointer ${
            !selectedCategory
              ? 'text-white border-transparent'
              : 'bg-white text-ink-700 border-cream-200 hover:border-cream-300 hover:bg-cream-50 shadow-2xs'
          }`}
        >
          {!selectedCategory && (
            <motion.div
              layoutId="category-pills-active-capsule"
              className="absolute inset-0 bg-ink-900 rounded-full shadow-xs z-0"
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 30,
                mass: 0.8,
              }}
            />
          )}
          <span className="relative z-10">Tất cả</span>
        </button>
        {categories.map((cat) => (
          <button
            type="button"
            key={cat.id}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`relative px-5 py-2.5 rounded-full text-sm font-bold border transition-colors duration-200 cursor-pointer ${
              selectedCategory === cat.slug
                ? 'text-white border-transparent'
                : 'bg-white text-ink-700 border-cream-200 hover:border-cream-300 hover:bg-cream-50 shadow-2xs'
            }`}
          >
            {selectedCategory === cat.slug && (
              <motion.div
                layoutId="category-pills-active-capsule"
                className="absolute inset-0 bg-ink-900 rounded-full shadow-xs z-0"
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                  mass: 0.8,
                }}
              />
            )}
            <span className="relative z-10">{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink-800 mb-4">Thương hiệu</h3>
              <div className="space-y-2.5">
                {brands.length === 0 ? (
                  <p className="text-xs text-ink-400">Đang cập nhật thương hiệu...</p>
                ) : (
                  brands.map((brand) => (
                    <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        className="w-4 h-4 rounded border-ink-300 text-accent-500 focus:ring-accent-400"
                      />
                      <span className="text-sm text-ink-600 group-hover:text-ink-800">{brand}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold text-ink-800 mb-4">Khoảng giá</h3>
              <div className="space-y-3">
                {[
                  { label: 'Dưới 25 triệu', min: 0, max: 25000000 },
                  { label: '25 - 50 triệu', min: 25000000, max: 50000000 },
                  { label: '50 - 70 triệu', min: 50000000, max: 70000000 },
                  { label: 'Trên 70 triệu', min: 70000000, max: 200000000 },
                ].map((range) => (
                  <label key={range.label} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange[0] === range.min && priceRange[1] === range.max}
                      onChange={() => setPriceRange([range.min, range.max])}
                      className="w-4 h-4 border-ink-300 text-accent-500 focus:ring-accent-400"
                    />
                    <span className="text-sm text-ink-600 group-hover:text-ink-800">{range.label}</span>
                  </label>
                ))}
                <button
                  onClick={() => setPriceRange([0, 200000000])}
                  className="text-xs text-accent-500 hover:underline pt-2 block"
                >
                  Xóa bộ lọc giá
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-ink-500">
              {loading ? 'Đang tải...' : `Hiển thị ${paginatedFiltered.length} / ${filtered.length} sản phẩm`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium"
              >
                <SlidersHorizontal size={16} /> Lọc
              </button>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-ink-200 rounded-xl text-sm font-medium focus:outline-none focus:border-ink-400 cursor-pointer"
                >
                  {Object.entries(sortLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-square bg-cream-200 rounded-xl mb-4" />
                  <div className="h-3 bg-cream-200 rounded mb-2" />
                  <div className="h-3 bg-cream-200 rounded w-2/3 mb-4" />
                  <div className="h-4 bg-cream-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-ink-400 mb-4">Không tìm thấy sản phẩm phù hợp</p>
              <button
                onClick={() => {
                  setSelectedBrands([]);
                  setPriceRange([0, 200000000]);
                }}
                className="btn-secondary"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {paginatedFiltered.map((p) => (
                  <ProductCard key={p.id} product={p} onView={(slug) => onNavigate({ name: 'product', slug })} />
                ))}
              </div>

              {/* Storefront Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ‹ Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === pageNum
                          ? 'bg-ink-800 text-cream-50 shadow-xs'
                          : 'bg-white text-ink-700 border border-ink-200 hover:border-ink-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-ink-200 rounded-xl text-sm font-medium text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Sau ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
