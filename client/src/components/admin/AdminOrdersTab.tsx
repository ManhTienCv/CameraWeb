import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import type { Order } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface AdminOrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: string) => void;
  onViewOrder: (order: Order) => void;
}

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  onUpdateStatus,
  onViewOrder,
}) => {
  const [adminPageNum, setAdminPageNum] = useState(1);
  const itemsPerPage = 10;

  const totalAdminPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (adminPageNum - 1) * itemsPerPage,
    adminPageNum * itemsPerPage
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-display font-bold text-ink-900">Quản lý Đơn hàng</h3>
          <p className="text-sm text-ink-500 mt-1">Quản lý các đơn đặt hàng trực tiếp từ khách hàng ({orders.length} đơn hàng)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100/60 border-b border-cream-200 text-xs font-bold text-ink-600 uppercase tracking-wider">
                <th className="py-4 px-6">MÃ ĐƠN</th>
                <th className="py-4 px-6">KHÁCH HÀNG</th>
                <th className="py-4 px-6">THANH TOÁN</th>
                <th className="py-4 px-6">TỔNG TIỀN</th>
                <th className="py-4 px-6">TRẠNG THÁI</th>
                <th className="py-4 px-6 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-400">
                    Chưa có đơn hàng nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-50/70">
                    <td className="py-4 px-6">
                      <span className="font-bold font-mono text-accent-600">
                        {o.order_code || o.id.substring(0, 8)}
                      </span>
                      <p className="text-[11px] text-ink-400 mt-0.5">
                        {new Date(o.created_at || Date.now()).toLocaleDateString('vi-VN')}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-ink-900">{o.customer_name}</p>
                      <p className="text-xs text-ink-500">{o.customer_phone}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          o.payment_method === 'vietqr'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-cream-200/80 text-ink-700 border border-cream-300'
                        }`}>
                          {o.payment_method === 'vietqr' ? 'VietQR (Vietcombank)' : 'COD (Tiền mặt)'}
                        </span>
                        <div>
                          <span className={`text-[11px] font-semibold ${
                            o.payment_status === 'completed'
                              ? 'text-emerald-600'
                              : 'text-amber-600'
                          }`}>
                            {o.payment_status === 'completed' ? '● Đã thanh toán' : '○ Chờ thanh toán'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-ink-900">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={o.status || 'pending'}
                        onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border focus:outline-none cursor-pointer transition-all ${
                          o.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : o.status === 'shipping'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : o.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="shipping">Đang giao hàng</option>
                        <option value="completed">Đã nhận / Hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => onViewOrder(o)}
                        className="bg-ink-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                      >
                        <Eye size={13} />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalAdminPages > 1 && (
          <div className="p-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 bg-cream-50/50">
            <div className="text-xs text-ink-500 font-medium">
              Hiển thị <span className="font-bold text-ink-900">{(adminPageNum - 1) * itemsPerPage + 1}</span> -{' '}
              <span className="font-bold text-ink-900">{Math.min(adminPageNum * itemsPerPage, orders.length)}</span> trên{' '}
              <span className="font-bold text-ink-900">{orders.length}</span> đơn hàng
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminPageNum((p) => Math.max(1, p - 1))}
                disabled={adminPageNum === 1}
                className="px-3 py-1.5 rounded-xl border border-cream-200 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Trước
              </button>
              {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setAdminPageNum(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    adminPageNum === pageNum
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-white text-ink-700 border border-cream-200 hover:border-cream-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button
                onClick={() => setAdminPageNum((p) => Math.min(totalAdminPages, p + 1))}
                disabled={adminPageNum === totalAdminPages || totalAdminPages === 0}
                className="px-3 py-1.5 rounded-xl border border-cream-200 bg-white text-xs font-semibold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
