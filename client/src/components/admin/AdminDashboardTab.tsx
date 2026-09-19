import React, { useState, useEffect } from 'react';
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
  RefreshCw,
  Award,
  CreditCard,
} from 'lucide-react';
import type {
  Product,
  Order,
  Page,
  AnalyticsOverview,
  DailyRevenueItem,
  MonthlyRevenueItem,
  CategoryRevenueItem,
  PaymentMethodStatItem,
  OrderStatusStatItem,
  TopProductItem,
} from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { AdminTab } from './AdminSidebar';
import { api } from '../../lib/api';
import {
  RevenueTrendChart,
  MonthlyRevenueChart,
  CategoryDistributionChart,
  PaymentMethodChart,
  OrderStatusChart,
} from './AdminReportsCharts';

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
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<DailyRevenueItem[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueItem[]>([]);
  const [categoryDist, setCategoryDist] = useState<CategoryRevenueItem[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStatItem[]>([]);
  const [orderStatusStats, setOrderStatusStats] = useState<OrderStatusStatItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active product counts
  const activeProducts = products.filter((p) => p.status === 'active' && p.stock > 0);
  const lowStockProducts = products.filter((p) => p.stock <= 5);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        trendRes,
        monthlyRes,
        catRes,
        payRes,
        statusRes,
        topRes,
      ] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getRevenueTrend(),
        api.getMonthlyRevenue(),
        api.getCategoryDistribution(),
        api.getPaymentMethodStats(),
        api.getOrderStatusStats(),
        api.getTopSellingProducts(),
      ]);

      setOverview(overviewRes);
      setRevenueTrend(trendRes.data || []);
      setMonthlyRevenue(monthlyRes.data || []);
      setCategoryDist(catRes.data || []);
      setPaymentStats(payRes.data || []);
      setOrderStatusStats(statusRes.data || []);
      setTopProducts(topRes.data || []);
    } catch (error) {
      console.error('Failed to load analytics dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight">
            Tổng Quan Hệ Thống & Báo Cáo Kinh Doanh
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Dữ liệu kinh doanh thời gian thực 100% từ cơ sở dữ liệu CameraHub (loại trừ đơn đã hủy)
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-ink-700 bg-white border border-cream-200 rounded-2xl hover:bg-cream-50 transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* 2. STATS KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Doanh thu hợp lệ */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Doanh Thu Thuần</span>
            <div className="w-11 h-11 bg-accent-50 text-accent-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <DollarSign size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            {formatCurrency(overview?.totalRevenue || 0)}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                (overview?.revenueGrowth || 0) >= 0
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              <TrendingUp size={13} />
              {(overview?.revenueGrowth || 0) >= 0 ? `+${overview?.revenueGrowth}%` : `${overview?.revenueGrowth}%`}
            </span>
            <span className="text-xs text-ink-400">so với kỳ trước</span>
          </div>
        </div>

        {/* Tổng đơn hàng */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Tổng Đơn Hàng</span>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <ShoppingCart size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            {overview?.totalOrders || orders.length}{' '}
            <span className="text-sm font-semibold text-ink-400">đơn</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold">
              {overview?.completedOrdersCount || 0} thành công
            </span>
            <span className="text-xs text-ink-400">({overview?.completionRate || 0}%)</span>
          </div>
        </div>

        {/* Giá trị đơn TB (AOV) */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Giá Trị TB / Đơn (AOV)</span>
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <CreditCard size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            {formatCurrency(overview?.averageOrderValue || 0)}
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-bold">
              {overview?.pendingOrdersCount || 0} đơn
            </span>
            <span className="text-xs text-ink-400">đang chờ xử lý</span>
          </div>
        </div>

        {/* Khách hàng */}
        <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-ink-400 uppercase tracking-wider">Khách Hàng Đăng Ký</span>
            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
              <Users size={22} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-display font-bold text-ink-900 leading-none mb-3">
            {overview?.totalCustomers || 15}{' '}
            <span className="text-sm font-semibold text-ink-400">người</span>
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-bold">
              {activeProducts.length} SP đang bán
            </span>
            <span className="text-xs text-ink-400">• {overview?.totalProducts || products.length} tổng mã</span>
          </div>
        </div>
      </div>

      {/* 3. VISUAL CHARTS SECTION (RECHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 30-Day Revenue Trend (Area Chart) */}
        <div className="lg:col-span-2">
          <RevenueTrendChart data={revenueTrend} />
        </div>

        {/* Category Revenue Distribution (Donut Chart) */}
        <div className="lg:col-span-1">
          <CategoryDistributionChart data={categoryDist} />
        </div>
      </div>

      {/* 4. MONTHLY COMPARISON & PAYMENT METHODS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 12-Month Revenue Comparison (Bar Chart) */}
        <div className="lg:col-span-2">
          <MonthlyRevenueChart data={monthlyRevenue} />
        </div>

        {/* Payment Methods (Donut Chart) */}
        <div className="lg:col-span-1">
          <PaymentMethodChart data={paymentStats} />
        </div>
      </div>

      {/* 5. TOP PRODUCTS & ORDER STATUS BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Status Breakdown */}
        <div className="lg:col-span-1">
          <OrderStatusChart data={orderStatusStats} />
        </div>

        {/* Top 5 Best-Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 p-6 lg:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
                <Award size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink-900">
                  Top 5 Sản Phẩm Bán Chạy Nhất
                </h3>
                <p className="text-xs text-ink-400 mt-0.5">
                  Xếp hạng theo số lượng bán ra thực tế từ các đơn hàng hoàn tất
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Xem kho hàng <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-ink-400 text-xs">
                Chưa có dữ liệu sản phẩm bán chạy.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 bg-cream-50/50 hover:bg-cream-100/60 rounded-2xl border border-cream-200/80 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500 text-white shadow-xs'
                          : idx === 1
                          ? 'bg-slate-400 text-white'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-cream-200 text-ink-600'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-cover border border-cream-300 flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-white border border-cream-300 flex items-center justify-center text-ink-400 flex-shrink-0">
                        <Package size={18} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="font-bold text-sm text-ink-900 truncate group-hover:text-accent-600 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-xs text-ink-400 mt-0.5 truncate">
                        {p.brandName} • {p.categoryName} • Đơn giá: {formatCurrency(p.price)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-3">
                    <p className="font-bold font-display text-sm text-accent-600">
                      {formatCurrency(p.totalRevenue)}
                    </p>
                    <span className="text-xs font-semibold text-ink-500">
                      Đã bán: <strong className="text-ink-900">{p.totalSold}</strong> chiếc
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. RECENT ORDERS & QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 p-6 lg:p-7 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-lg text-ink-900">Đơn Hàng Gần Đây</h3>
              <p className="text-xs text-ink-400 mt-0.5">Khách hàng đặt mua trực tuyến từ website</p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
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
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 bg-white border border-cream-300 rounded-xl flex items-center justify-center font-bold text-ink-700 text-sm shadow-2xs flex-shrink-0">
                    {(o.customer_name || 'K')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-ink-900 truncate">{o.customer_name}</p>
                    <p className="text-xs text-ink-400 mt-0.5 truncate">
                      Mã: <span className="font-semibold text-accent-600">#{o.order_code || o.id.substring(0, 8)}</span> • {o.customer_phone}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-3">
                  <p className="font-bold text-sm text-ink-900">{formatCurrency(o.total_amount)}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md mt-0.5 ${
                      o.order_status === 'completed'
                        ? 'text-emerald-700 bg-emerald-50'
                        : o.order_status === 'cancelled'
                        ? 'text-rose-700 bg-rose-50'
                        : o.order_status === 'shipping'
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}
                  >
                    {o.order_status === 'completed'
                      ? 'Giao thành công'
                      : o.order_status === 'cancelled'
                      ? 'Đã hủy'
                      : o.order_status === 'shipping'
                      ? 'Đang giao'
                      : 'Chờ xử lý'}
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
                onClick={() => setActiveTab('users')}
                className="w-full flex items-center justify-between p-3.5 bg-cream-50 hover:bg-purple-50/60 rounded-2xl border border-cream-200 text-sm font-bold text-ink-800 hover:text-purple-700 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-cream-300 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Users size={16} />
                  </div>
                  <span>Quản lý người dùng</span>
                </div>
                <ArrowUpRight size={16} className="text-ink-400 group-hover:text-purple-600 transition-colors" />
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
                {lowStockProducts.slice(0, 3).map((lp) => (
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
