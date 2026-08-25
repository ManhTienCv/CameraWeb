import React from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Plus,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Layers,
  Clock,
} from 'lucide-react';
import type { Product, Order, Page } from '../../types';
import { formatCurrency } from '../../lib/utils';
import type { AdminTab } from './AdminSidebar';

interface AdminDashboardTabProps {
  products: Product[];
  orders: Order[];
  setActiveTab: (tab: AdminTab) => void;
  onOpenAddProduct: () => void;
  onOpenAddCategory: () => void;
  onNavigate: (page: Page) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  products,
  orders,
  setActiveTab,
  onOpenAddProduct,
  onOpenAddCategory,
  onNavigate,
}) => {

  // Metrics calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 345800000;
  const activeProducts = products.filter((p) => p.status === 'active' && p.stock > 0);
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  // Revenue chart mock data by weekday
  const weeklyData = [
    { day: 'T2', value: 42, revenue: '42.0M' },
    { day: 'T3', value: 68, revenue: '68.5M' },
    { day: 'T4', value: 54, revenue: '54.2M' },
    { day: 'T5', value: 89, revenue: '89.0M' },
    { day: 'T6', value: 76, revenue: '76.4M' },
    { day: 'T7', value: 95, revenue: '95.8M', highlight: true },
    { day: 'CN', value: 63, revenue: '63.1M' },
  ];

  // Brand sales breakdown
  const brandShares = [
    { name: 'Sony Alpha', share: 42, color: 'bg-accent-500', count: '145.2M đ' },
    { name: 'Canon EOS', share: 28, color: 'bg-rose-500', count: '96.8M đ' },
    { name: 'DJI Drone', share: 18, color: 'bg-emerald-500', count: '62.2M đ' },
    { name: 'Fujifilm & Khác', share: 12, color: 'bg-indigo-500', count: '41.6M đ' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
            Tổng Quan Hệ Thống
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Báo cáo kinh doanh và thống kê hoạt động cửa hàng CameraHub
          </p>
        </div>
      </div>

      {/* 2. STATS KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Doanh thu */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Doanh thu tháng</span>
            <div className="w-11 h-11 bg-accent-50 text-accent-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <DollarSign size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            {formatCurrency(totalRevenue)}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
              <TrendingUp size={13} /> +14.8%
            </span>
            <span className="text-xs text-ink-400">so với tháng trước</span>
          </div>
        </div>

        {/* Đơn hàng */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Tổng đơn hàng</span>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <ShoppingCart size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            {orders.length || 18} <span className="text-sm font-semibold text-ink-400">đơn</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
              <TrendingUp size={13} /> +8.2%
            </span>
            <span className="text-xs text-ink-400">3 đơn chờ giao</span>
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Sản phẩm sẵn có</span>
            <div className="w-11 h-11 bg-cream-100 text-ink-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Package size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            {products.length} <span className="text-sm font-semibold text-ink-400">mã SP</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-50 text-accent-700 text-xs font-bold">
              {activeProducts.length} đang bán
            </span>
            <span className="text-xs text-ink-400">• {products.length - activeProducts.length} tạm ẩn</span>
          </div>
        </div>

        {/* Khách hàng */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Khách hàng mới</span>
            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Users size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            142 <span className="text-sm font-semibold text-ink-400">người</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold">
              ★ 4.9 / 5.0
            </span>
            <span className="text-xs text-ink-400">98% hài lòng</span>
          </div>
        </div>
      </div>

      {/* 3. CHARTS & ANALYTICS VISUAL SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doanh thu 7 ngày qua (Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 p-6 lg:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-ink-900">Biểu đồ doanh thu tuần</h3>
              <p className="text-xs text-ink-400 mt-0.5">Thống kê doanh số bán ra theo từng ngày trong tuần</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-500">
              <span className="w-3 h-3 rounded-full bg-accent-500" />
              <span>Tuần này</span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-cream-100">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                <span
                  className={`text-[11px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-md transition-all ${
                    d.highlight
                      ? 'bg-accent-50 text-accent-700 border border-accent-200 shadow-2xs font-bold'
                      : 'text-ink-500 group-hover:text-accent-600 group-hover:bg-accent-50/60'
                  }`}
                >
                  {d.revenue}
                </span>
                <div
                  style={{ height: `${d.value}%` }}
                  className={`w-full max-w-[44px] rounded-t-xl transition-all duration-300 group-hover:opacity-90 ${
                    d.highlight
                      ? 'bg-gradient-to-t from-accent-600 to-accent-400 shadow-sm'
                      : 'bg-cream-200 group-hover:bg-accent-200'
                  }`}
                />
                <span className={`text-xs font-bold transition-colors ${d.highlight ? 'text-accent-700' : 'text-ink-500 group-hover:text-ink-900'}`}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-accent-500" />
              Cập nhật lúc 23:59 mỗi ngày
            </span>
            <span className="font-semibold text-ink-800">
              Doanh số trung bình: <strong className="text-accent-600">69.8M đ/ngày</strong>
            </span>
          </div>
        </div>

        {/* Tỷ trọng thương hiệu (Brand Breakdown) */}
        <div className="bg-white rounded-3xl border border-cream-200 p-6 lg:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-ink-900 mb-1">Tỷ trọng thương hiệu</h3>
            <p className="text-xs text-ink-400 mb-6">Đóng góp doanh thu từ các hãng camera hàng đầu</p>

            <div className="space-y-4">
              {brandShares.map((b, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-ink-800 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
                      {b.name}
                    </span>
                    <span className="text-ink-900 font-bold">{b.share}% ({b.count})</span>
                  </div>
                  <div className="w-full h-2 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${b.share}%` }}
                      className={`h-full rounded-full ${b.color} transition-all duration-500`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-cream-100 flex items-center justify-between text-xs">
            <span className="text-ink-400 font-medium">Bán chạy số 1:</span>
            <span className="font-bold text-accent-600 bg-accent-50 px-2.5 py-1 rounded-lg">
              Sony A7 Mark IV
            </span>
          </div>
        </div>
      </div>

      {/* 4. ORDERS & OPERATIONAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 p-6 lg:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-lg text-ink-900">Đơn hàng vừa đặt</h3>
              <p className="text-xs text-ink-400 mt-0.5">Khách hàng đặt mua trực tuyến từ website</p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-xl transition-colors"
            >
              Xem tất cả ({orders.length}) <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 4).map((o, idx) => (
              <div
                key={o.id || idx}
                className="flex items-center justify-between p-4 bg-cream-50/70 hover:bg-cream-100/70 rounded-2xl border border-cream-200/80 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-white border border-cream-300 rounded-xl flex items-center justify-center font-bold text-ink-700 text-sm shadow-2xs">
                    {(o.customer_name || 'K')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-ink-900">{o.customer_name}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      Mã: <span className="font-semibold text-accent-600">#{o.order_code || o.id.substring(0, 8)}</span> • {o.customer_phone}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm text-ink-900">{formatCurrency(o.total_amount)}</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Chờ xử lý
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Low Stock */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-3xl border border-cream-200 p-6 shadow-xs">
            <h3 className="font-display font-bold text-base text-ink-900 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-accent-500" />
              Tác vụ nhanh
            </h3>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setActiveTab('products');
                  onOpenAddProduct();
                }}
                className="w-full flex items-center justify-between p-3.5 bg-cream-50 hover:bg-accent-50/60 rounded-2xl border border-cream-200 text-sm font-bold text-ink-800 hover:text-accent-600 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-cream-300 flex items-center justify-center text-accent-500 group-hover:bg-accent-500 group-hover:text-white transition-colors">
                    <Plus size={16} />
                  </div>
                  <span>Đăng sản phẩm mới</span>
                </div>
                <ArrowUpRight size={16} className="text-ink-400 group-hover:text-accent-500 transition-colors" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('categories');
                  onOpenAddCategory();
                }}
                className="w-full flex items-center justify-between p-3.5 bg-cream-50 hover:bg-accent-50/60 rounded-2xl border border-cream-200 text-sm font-bold text-ink-800 hover:text-accent-600 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-cream-300 flex items-center justify-center text-accent-500 group-hover:bg-accent-500 group-hover:text-white transition-colors">
                    <Layers size={16} />
                  </div>
                  <span>Tạo danh mục mới</span>
                </div>
                <ArrowUpRight size={16} className="text-ink-400 group-hover:text-accent-500 transition-colors" />
              </button>

              <button
                onClick={() => onNavigate({ name: 'home' })}
                className="w-full flex items-center justify-between p-3.5 bg-cream-50 hover:bg-cream-100 rounded-2xl border border-cream-200 text-sm font-bold text-ink-800 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-cream-300 flex items-center justify-center text-ink-600">
                    <ExternalLink size={16} />
                  </div>
                  <span>Mở trang Storefront</span>
                </div>
                <ArrowUpRight size={16} className="text-ink-400 group-hover:text-ink-900 transition-colors" />
              </button>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-3xl p-5 shadow-xs">
              <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm mb-3">
                <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                <span>Cảnh báo tồn kho ({lowStockProducts.length} SP)</span>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 2).map((lp) => (
                  <div key={lp.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-rose-100">
                    <span className="font-semibold text-ink-800 truncate max-w-[150px]">{lp.name}</span>
                    <span className="font-bold text-rose-600">Còn {lp.stock} SP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
