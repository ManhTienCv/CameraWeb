import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Package,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { Product, Category } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onToggleStatus: (product: Product) => void;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'outofstock';
type SortOption = 'newest' | 'price-desc' | 'price-asc' | 'stock-asc' | 'stock-desc';

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  categories,
  loading,
  onOpenAddModal,
  onOpenEditModal,
  onViewProduct,
  onDeleteProduct,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [adminPageNum, setAdminPageNum] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setAdminPageNum(1);
  }, [searchQuery, selectedCategoryFilter, selectedBrandFilter, statusFilter, sortOption]);

  // Derived stats
  const activeCount = products.filter((p) => p.status === 'active' && p.stock > 0).length;
  const inactiveCount = products.filter((p) => p.status === 'inactive').length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const totalStockValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  // Brands list from products
  const brandsList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = !selectedCategoryFilter || p.category_id === selectedCategoryFilter;
      const matchesBrand =
        !selectedBrandFilter || p.brand.toLowerCase() === selectedBrandFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = p.status === 'active' && p.stock > 0;
      } else if (statusFilter === 'inactive') {
        matchesStatus = p.status === 'inactive';
      } else if (statusFilter === 'outofstock') {
        matchesStatus = p.stock <= 0;
      }

      return matchesSearch && matchesCat && matchesBrand && matchesStatus;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'price-desc') return b.price - a.price;
      if (sortOption === 'price-asc') return a.price - b.price;
      if (sortOption === 'stock-asc') return a.stock - b.stock;
      if (sortOption === 'stock-desc') return b.stock - a.stock;
      return 0; // Default order
    });

    return result;
  }, [products, searchQuery, selectedCategoryFilter, selectedBrandFilter, statusFilter, sortOption]);

  const totalAdminPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedAdminProducts = filteredProducts.slice(
    (adminPageNum - 1) * itemsPerPage,
    adminPageNum * itemsPerPage
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategoryFilter('');
    setSelectedBrandFilter('');
    setStatusFilter('all');
    setSortOption('newest');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP HEADER WITH STATS SUMMARY */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
            Quản lý Sản phẩm Camera
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Quản lý danh sách máy ảnh, ống kính, flycam và thông số bán hàng
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Đăng sản phẩm mới
        </button>
      </div>

      {/* 2. STATS MINI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center font-bold">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Tổng sản phẩm</p>
            <p className="text-xl font-bold text-ink-900 mt-0.5">{products.length} SP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Đang kinh doanh</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{activeCount} SP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Hết hàng / Tạm ẩn</p>
            <p className="text-xl font-bold text-rose-700 mt-0.5">{outOfStockCount + inactiveCount} SP</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Giá trị kho ước tính</p>
            <p className="text-lg font-bold text-ink-900 mt-0.5 truncate">{formatCurrency(totalStockValue)}</p>
          </div>
        </div>
      </div>

      {/* 3. ADVANCED FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs space-y-4">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cream-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                statusFilter === 'all'
                  ? 'bg-ink-900 text-white shadow-xs'
                  : 'bg-cream-100/70 text-ink-600 hover:bg-cream-200'
              }`}
            >
              Tất cả ({products.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-cream-100/70 text-emerald-700 hover:bg-cream-200'
              }`}
            >
              Đang bán ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('outofstock')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                statusFilter === 'outofstock'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-cream-100/70 text-rose-700 hover:bg-cream-200'
              }`}
            >
              Hết hàng ({outOfStockCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-cream-100/70 text-amber-700 hover:bg-cream-200'
              }`}
            >
              Tạm ẩn ({inactiveCount})
            </button>
          </div>

          {(searchQuery || selectedCategoryFilter || selectedBrandFilter || statusFilter !== 'all') && (
            <button
              onClick={resetAllFilters}
              className="text-xs font-semibold text-accent-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw size={13} /> Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Search & Select Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-5">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên máy ảnh, ống kính, thương hiệu..."
              className="w-full pl-10 pr-4 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 focus:bg-white transition-all text-ink-800 placeholder:text-ink-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 text-ink-700 font-medium"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 text-ink-700 font-medium"
            >
              <option value="">Tất cả hãng</option>
              {brandsList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-2xl text-sm focus:outline-none focus:border-accent-500 text-ink-700 font-medium"
            >
              <option value="newest">Mới nhất</option>
              <option value="price-desc">Giá: Cao → Thấp</option>
              <option value="price-asc">Giá: Thấp → Cao</option>
              <option value="stock-asc">Kho: Ít → Nhiều</option>
              <option value="stock-desc">Kho: Nhiều → Ít</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100/70 border-b border-cream-200 text-[11px] font-bold text-ink-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-4 px-6">SẢN PHẨM</th>
                <th className="py-4 px-6">DANH MỤC</th>
                <th className="py-4 px-6">GIÁ BÁN</th>
                <th className="py-4 px-6">TỒN KHO</th>
                <th className="py-4 px-6">TRẠNG THÁI</th>
                <th className="py-4 px-6 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-ink-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-3 border-accent-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-ink-500">Đang tải dữ liệu sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-ink-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package size={36} className="text-cream-300" />
                      <p className="font-bold text-ink-700">Không tìm thấy sản phẩm nào</p>
                      <p className="text-xs text-ink-400">Vui lòng thử tìm kiếm hoặc điều chỉnh lại bộ lọc</p>
                      <button
                        onClick={resetAllFilters}
                        className="mt-2 text-xs font-bold text-accent-600 hover:underline"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAdminProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock > 0 && p.stock <= 5;
                  const discountPercent =
                    p.original_price && p.original_price > p.price
                      ? Math.round(((p.original_price - p.price) / p.original_price) * 100)
                      : 0;

                  return (
                    <tr key={p.id} className="hover:bg-cream-50/80 transition-colors group">
                      {/* Product details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5 min-w-[260px]">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-cream-300 bg-cream-50 shrink-0 group-hover:scale-105 transition-transform">
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-ink-900 group-hover:text-accent-600 transition-colors line-clamp-1">
                              {p.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded-md uppercase">
                                {p.brand}
                              </span>
                              <span className="text-[11px] text-ink-400 truncate">Mã: {p.slug.substring(0, 16)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-cream-100/90 text-ink-700 text-xs font-semibold px-3 py-1 rounded-xl border border-cream-200/80">
                          {(p as any).category_name || 'Camera'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div>
                          <p className="font-display font-bold text-ink-900 text-base">
                            {formatCurrency(p.price)}
                          </p>
                          {discountPercent > 0 && p.original_price && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-ink-400 line-through">
                                {formatCurrency(p.original_price)}
                              </span>
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                -{discountPercent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1.5 min-w-[110px]">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-700'}>
                              {isOutOfStock ? 'Hết hàng (0)' : isLowStock ? `Sắp hết (${p.stock})` : `Còn hàng (${p.stock})`}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-24 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, (p.stock / 20) * 100)}%` }}
                              className={`h-full rounded-full ${
                                isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(p)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shadow-2xs cursor-pointer ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Bấm để chuyển đổi trạng thái hiển thị"
                        >
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isOutOfStock ? 'bg-rose-600' : p.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{isOutOfStock ? 'Hết hàng' : p.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewProduct(p)}
                            className="p-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-700 hover:text-ink-900 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => onOpenEditModal(p)}
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title="Chỉnh sửa sản phẩm"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION CONTROLS */}
        {filteredProducts.length > 0 && (
          <div className="p-4 px-6 bg-cream-50/80 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <p className="text-ink-500">
              Hiển thị <span className="font-bold text-ink-900">{(adminPageNum - 1) * itemsPerPage + 1}</span> -{' '}
              <span className="font-bold text-ink-900">{Math.min(adminPageNum * itemsPerPage, filteredProducts.length)}</span> trên{' '}
              <span className="font-bold text-ink-900">{filteredProducts.length}</span> sản phẩm
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setAdminPageNum((p) => Math.max(1, p - 1))}
                disabled={adminPageNum === 1}
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 bg-white text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                ‹ Trước
              </button>

              {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setAdminPageNum(pageNum)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                    adminPageNum === pageNum
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-white text-ink-700 border border-cream-300 hover:bg-cream-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setAdminPageNum((p) => Math.min(totalAdminPages, p + 1))}
                disabled={adminPageNum === totalAdminPages || totalAdminPages === 0}
                className="px-3.5 py-1.5 rounded-xl border border-cream-300 bg-white text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
