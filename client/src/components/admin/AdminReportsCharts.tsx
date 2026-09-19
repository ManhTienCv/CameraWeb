import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type {
  DailyRevenueItem,
  MonthlyRevenueItem,
  CategoryRevenueItem,
  PaymentMethodStatItem,
  OrderStatusStatItem,
} from '../../types';
import { formatCurrency } from '../../lib/utils';
import { TrendingUp, CreditCard, PieChart as PieIcon, BarChart3, Calendar } from 'lucide-react';

// Custom Tooltip for Daily Revenue Area Chart
const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-ink-900/95 backdrop-blur-sm text-white p-3.5 rounded-2xl shadow-xl border border-white/10 text-xs space-y-1 z-50">
        <div className="flex items-center gap-1.5 font-bold text-cream-200">
          <Calendar size={13} />
          <span>Ngày {label} ({data.date})</span>
        </div>
        <div className="text-sm font-black text-accent-400">
          {formatCurrency(data.revenue)}
        </div>
        <div className="text-ink-400 flex items-center justify-between gap-4">
          <span>Số đơn hàng:</span>
          <span className="font-bold text-white">{data.orderCount} đơn</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Monthly Bar Chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-ink-900/95 backdrop-blur-sm text-white p-3.5 rounded-2xl shadow-xl border border-white/10 text-xs space-y-1 z-50">
        <div className="font-bold text-cream-200">Tháng: {label}</div>
        <div className="text-sm font-black text-amber-400">
          {formatCurrency(data.revenue)}
        </div>
        <div className="text-ink-400 flex items-center justify-between gap-4">
          <span>Số đơn trong tháng:</span>
          <span className="font-bold text-white">{data.orderCount} đơn</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Donut Charts
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-ink-900/95 backdrop-blur-sm text-white p-3 rounded-2xl shadow-xl border border-white/10 text-xs space-y-1 z-50">
        <div className="font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span>{data.name || data.label}</span>
        </div>
        {data.revenue !== undefined && (
          <div className="text-accent-400 font-bold">
            {formatCurrency(data.revenue)} ({data.percentage}%)
          </div>
        )}
        {data.totalAmount !== undefined && (
          <div className="text-emerald-400 font-bold">
            {formatCurrency(data.totalAmount)} ({data.percentage}%)
          </div>
        )}
        <div className="text-ink-400">
          Số lượng: <span className="text-white font-semibold">{data.count || data.itemCount || 0}</span>
        </div>
      </div>
    );
  }
  return null;
};

interface RevenueTrendChartProps {
  data: DailyRevenueItem[];
}

export const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => {
  const totalPeriodRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <h3 className="font-bold text-ink-900 text-lg">
              Xu Hướng Doanh Thu 30 Ngày Gần Nhất
            </h3>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Biểu đồ diễn biến doanh số thực tế hàng ngày (loại trừ các đơn bị hủy)
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-ink-400 block font-medium">Tổng 30 ngày</span>
          <span className="text-xl font-bold font-display text-accent-600">
            {formatCurrency(totalPeriodRevenue)}
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-400 text-sm">
            Chưa có dữ liệu giao dịch trong 30 ngày qua
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval={Math.ceil(data.length / 10)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#d97706"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6, fill: '#b45309', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

interface MonthlyRevenueChartProps {
  data: MonthlyRevenueItem[];
}

export const MonthlyRevenueChart: React.FC<MonthlyRevenueChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 size={16} />
            </div>
            <h3 className="font-bold text-ink-900 text-lg">Doanh Thu 12 Tháng Qua</h3>
          </div>
          <p className="text-xs text-ink-500 mt-1">
            So sánh tăng trưởng doanh thu theo từng tháng trong năm
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-ink-400 text-sm">
            Chưa có dữ liệu theo tháng
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="revenue"
                fill="#f59e0b"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

interface CategoryDistributionChartProps {
  data: CategoryRevenueItem[];
}

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <PieIcon size={16} />
          </div>
          <div>
            <h3 className="font-bold text-ink-900 text-lg">Cơ Cấu Danh Mục Sản Phẩm</h3>
            <p className="text-xs text-ink-500">Tỷ trọng doanh số đóng góp theo danh mục</p>
          </div>
        </div>
      </div>

      <div className="h-60 w-full flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-ink-400 text-sm">Chưa có giao dịch danh mục</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="revenue"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend list */}
      <div className="space-y-2 mt-2 pt-3 border-t border-cream-100">
        {data.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-ink-700 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 font-semibold text-ink-900">
              <span>{formatCurrency(item.revenue)}</span>
              <span className="text-ink-400 font-normal w-10 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PaymentMethodChartProps {
  data: PaymentMethodStatItem[];
}

export const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CreditCard size={16} />
          </div>
          <div>
            <h3 className="font-bold text-ink-900 text-lg">Cổng Thanh Toán Sử Dụng</h3>
            <p className="text-xs text-ink-500">Phân bố đơn hàng theo MoMo, VietQR & COD</p>
          </div>
        </div>
      </div>

      <div className="h-60 w-full flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-ink-400 text-sm">Chưa có giao dịch thanh toán</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend list */}
      <div className="space-y-2 mt-2 pt-3 border-t border-cream-100">
        {data.map((item) => (
          <div key={item.method} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-ink-700">{item.label}</span>
            </div>
            <div className="flex items-center gap-3 font-semibold text-ink-900">
              <span>{item.count} đơn</span>
              <span className="text-ink-400 font-normal w-12 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface OrderStatusChartProps {
  data: OrderStatusStatItem[];
}

export const OrderStatusChart: React.FC<OrderStatusChartProps> = ({ data }) => {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white p-6 rounded-3xl border border-cream-200 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-ink-900 text-lg">Tỷ Lệ Xử Lý Đơn Hàng</h3>
          <p className="text-xs text-ink-500">Tình trạng các đơn hàng trên toàn hệ thống ({total} đơn)</p>
        </div>
      </div>

      <div className="space-y-3.5 my-auto py-2">
        {data.map((item) => (
          <div key={item.status} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-ink-500 font-medium">{item.count} đơn</span>
                <span className="font-bold text-ink-900 w-10 text-right">{item.percentage}%</span>
              </div>
            </div>
            <div className="w-full h-2.5 bg-cream-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
