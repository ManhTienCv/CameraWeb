import React from 'react';
import {
  Plus,
  Camera,
  Disc,
  Navigation,
  Briefcase,
  Edit3,
  Trash2,
  Package,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import type { Category } from '../../types';

interface AdminCategoriesTabProps {
  categories: Category[];
  onOpenAddCategory: () => void;
  onOpenEditCategory: (cat: Category) => void;
  onDeleteCategory: (catId: string) => void;
  onViewCategoryProducts?: (categoryId: string) => void;
}

const getCategoryIcon = (slug: string, iconName?: string | null) => {
  if (slug.includes('mirrorless') || slug.includes('dslr') || slug.includes('compact') || iconName === 'Camera') return Camera;
  if (slug.includes('ong-kinh') || slug.includes('lens') || iconName === 'Disc') return Disc;
  return Briefcase;
};

const getCategoryTheme = (idx: number) => {
  const themes = [
    { bg: 'bg-accent-50', text: 'text-accent-600', border: 'border-accent-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  ];
  return themes[idx % themes.length];
};

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  categories,
  onOpenAddCategory,
  onOpenEditCategory,
  onDeleteCategory,
  onViewCategoryProducts,
}) => {
  const totalProducts = categories.reduce((sum, c) => sum + (c.products_count || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
            Quản lý Danh mục Sản phẩm
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Phân loại máy ảnh mirrorless, DSLR, compact, ống kính và phụ kiện nhiếp ảnh
          </p>
        </div>

        <button
          onClick={onOpenAddCategory}
          className="btn-accent px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-bold active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={18} />
          Thêm danh mục mới
        </button>
      </div>

      {/* 2. STATS PILL BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center font-bold">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Tổng danh mục</p>
            <p className="text-xl font-bold text-ink-900 mt-0.5">{categories.length} phân loại</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Package size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Sản phẩm đã phân loại</p>
            <p className="text-xl font-bold text-emerald-700 mt-0.5">{totalProducts} sản phẩm</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cream-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink-400 uppercase">Trạng thái danh mục</p>
            <p className="text-base font-bold text-ink-900 mt-0.5 text-purple-700">100% Hoạt động</p>
          </div>
        </div>
      </div>

      {/* 3. CATEGORIES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((c, idx) => {
          const Icon = getCategoryIcon(c.slug, c.icon);
          const theme = getCategoryTheme(idx);

          return (
            <div
              key={c.id}
              className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${theme.bg} ${theme.text} rounded-2xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-bold text-ink-700 bg-cream-100/80 px-3 py-1 rounded-full border border-cream-200">
                    {c.products_count !== undefined ? c.products_count : 0} sản phẩm
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="font-display font-bold text-ink-900 text-lg group-hover:text-accent-600 transition-colors mb-1.5">
                  {c.name}
                </h3>
                <p className="text-xs text-ink-500 leading-relaxed line-clamp-3 mb-6">
                  {c.description || 'Chưa có mô tả chi tiết cho danh mục này.'}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-cream-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink-400">
                  Slug: <code className="bg-cream-100 px-1.5 py-0.5 rounded text-ink-700">{c.slug}</code>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenEditCategory(c)}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-amber-50 text-ink-600 hover:text-amber-700 transition-colors cursor-pointer"
                    title="Chỉnh sửa danh mục"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteCategory(c.id)}
                    className="p-2 rounded-xl bg-cream-100 hover:bg-rose-50 text-ink-600 hover:text-rose-700 transition-colors cursor-pointer"
                    title="Xóa danh mục"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* 4. ADD NEW CATEGORY PLACEHOLDER CARD */}
        <button
          onClick={onOpenAddCategory}
          className="border-2 border-dashed border-cream-300 hover:border-accent-400 bg-cream-50/50 hover:bg-accent-50/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-all group cursor-pointer min-h-[220px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-white border border-cream-300 group-hover:border-accent-400 flex items-center justify-center text-accent-500 shadow-2xs group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <div>
            <p className="font-display font-bold text-ink-900 text-base group-hover:text-accent-600 transition-colors">
              Thêm danh mục mới
            </p>
            <p className="text-xs text-ink-400 mt-1 max-w-[200px]">
              Tạo mới phân loại máy ảnh, ống kính hoặc thiết bị phụ trợ
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
