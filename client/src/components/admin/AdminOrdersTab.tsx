import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye,
  Truck,
  ExternalLink,
  Loader2,
  Send,
  QrCode,
  CreditCard,
  Ban,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import type { Order } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

interface AdminOrdersTabProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: string) => void;
  onViewOrder: (order: Order) => void;
  onDispatchGhn?: (orderId: string) => Promise<void>;
  onRefresh?: () => void;
}

type AdminOrderFilter = 'all' | 'pending' | 'refund_pending' | 'shipping' | 'completed' | 'cancelled';

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  orders,
  onUpdateStatus,
  onViewOrder,
  onDispatchGhn,
  onRefresh,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminOrderFilter>('all');
  const [adminPageNum, setAdminPageNum] = useState(1);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Refund Confirmation Modal state
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundTxCode, setRefundTxCode] = useState('');
  const [refundNote, setRefundNote] = useState('Đã chuyển khoản hoàn tiền thành công');
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tab counts
  const counts = useMemo(() => {
    const res = {
      all: orders.length,
      pending: 0,
      refund_pending: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      const st = o.order_status || o.status || 'pending';
      if (st === 'pending') res.pending++;
      else if (st === 'refund_pending') res.refund_pending++;
      else if (st === 'shipping') res.shipping++;
      else if (st === 'completed' || st === 'delivered') res.completed++;
      else if (st === 'cancelled') res.cancelled++;
    });
    return res;
  }, [orders]);

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => {
      const st = o.order_status || o.status || 'pending';
      if (activeTab === 'completed') return st === 'completed' || st === 'delivered';
      return st === activeTab;
    });
  }, [orders, activeTab]);

  const totalAdminPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (adminPageNum - 1) * itemsPerPage,
    adminPageNum * itemsPerPage
  );

  const handleDispatch = async (orderId: string) => {
    try {
      setDispatchingId(orderId);
      if (onDispatchGhn) {
        await onDispatchGhn(orderId);
      } else {
        const res = await api.createGhnShippingOrder(orderId);
        if (res.success) {
          toast.success(`Đã đẩy đơn sang GHN Express thành công! Vận đơn: ${res.tracking_code}`);
          if (onRefresh) onRefresh();
        } else {
          toast.error(res.message || 'Không thể tạo đơn GHN!');
        }
      }
    } catch (err: any) {
      console.error('GHN dispatch error:', err);
      toast.error(err.message || 'Lỗi khi kết nối GHN Express API!');
    } finally {
      setDispatchingId(null);
    }
  };

  const handleOpenRefundModal = (o: Order) => {
    setRefundModalOrder(o);
    setRefundTxCode('');
    setRefundNote('Đã chuyển khoản hoàn tiền thành công');
    setCopied(false);
  };

  const handleCopyAccountNumber = (accNum: string) => {
    navigator.clipboard.writeText(accNum);
    setCopied(true);
    toast.success('Đã sao chép số tài khoản vào bộ nhớ tạm!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmRefund = async () => {
    if (!refundModalOrder) return;
    try {
      setConfirmingRefund(true);
      const res = await api.confirmOrderRefund(refundModalOrder.id, {
        refundTransactionCode: refundTxCode.trim() || undefined,
        refundNote: refundNote.trim() || undefined,
      });

      toast.success(res.message || 'Đã xác nhận hoàn tiền thành công!');
      setRefundModalOrder(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Confirm refund error:', err);
      toast.error(err.message || 'Không thể xác nhận hoàn tiền!');
    } finally {
      setConfirmingRefund(false);
    }
  };

  const renderPaymentBadge = (o: Order) => {
    if (o.payment_status === 'refund_pending') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw size={11} className="text-purple-600 animate-spin" />
            <span>Chờ hoàn tiền</span>
          </span>
          <p className="text-[10px] text-purple-600 font-medium">Khách đã hủy online</p>
        </div>
      );
    }

    if (o.payment_status === 'refunded') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={11} className="text-emerald-600" />
            <span>Đã hoàn tiền</span>
          </span>
          {o.refund_transaction_code && (
            <p className="text-[10px] text-ink-400 font-mono truncate max-w-[120px]" title={o.refund_transaction_code}>
              #{o.refund_transaction_code}
            </p>
          )}
        </div>
      );
    }

    const method = (o.payment_method || '').toLowerCase();
    const isPaid = o.payment_status === 'completed';

    if (method === 'momo') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-[#D82D8B] border border-pink-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D82D8B]" />
            <span>MoMo V2</span>
          </span>
          <div>
            <span
              className={`text-[11px] font-semibold ${
                isPaid ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {isPaid ? '● Đã thanh toán' : '○ Chờ thanh toán'}
            </span>
          </div>
        </div>
      );
    }

    if (method === 'vietqr') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <QrCode size={11} className="text-sky-600" />
            <span>VietQR 24/7</span>
          </span>
          <div>
            <span
              className={`text-[11px] font-semibold ${
                isPaid ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {isPaid ? '● Đã thanh toán' : '○ Chờ thanh toán'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <CreditCard size={11} className="text-amber-600" />
          <span>COD (Tiền mặt)</span>
        </span>
        <div>
          <span className="text-[11px] font-semibold text-ink-500">
            {isPaid ? '● Đã thu tiền' : '○ Thu khi giao'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-display font-bold text-ink-900">Quản lý Đơn hàng</h3>
          <p className="text-sm text-ink-500 mt-1">
            Theo dõi, điều phối đối tác vận chuyển GHN Express và đối soát chuyển khoản hoàn tiền ({orders.length} đơn hàng)
          </p>
        </div>
      </div>

      {/* Sub-Tabs Filter for Admin */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: `Tất cả (${counts.all})` },
          { id: 'pending', label: `Chờ xử lý (${counts.pending})` },
          {
            id: 'refund_pending',
            label: `Chờ hoàn tiền (${counts.refund_pending})`,
            highlight: counts.refund_pending > 0,
          },
          { id: 'shipping', label: `Đang giao (${counts.shipping})` },
          { id: 'completed', label: `Hoàn tất (${counts.completed})` },
          { id: 'cancelled', label: `Đã hủy (${counts.cancelled})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as AdminOrderFilter);
                setAdminPageNum(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-ink-900 text-white border-ink-900 shadow-xs'
                  : tab.highlight
                  ? 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                  : 'bg-white text-ink-700 border-cream-200 hover:bg-cream-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-cream-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-100/60 border-b border-cream-200 text-xs font-bold text-ink-600 uppercase tracking-wider">
                <th className="py-4 px-6">MÃ ĐƠN</th>
                <th className="py-4 px-6">KHÁCH HÀNG</th>
                <th className="py-4 px-6">THANH TOÁN</th>
                <th className="py-4 px-6">VẬN CHUYỂN (GHN)</th>
                <th className="py-4 px-6">TỔNG TIỀN</th>
                <th className="py-4 px-6">TRẠNG THÁI</th>
                <th className="py-4 px-6 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 text-sm">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-400">
                    Chưa có đơn hàng nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((o) => {
                  const status = o.order_status || o.status || 'pending';
                  const isPending = status === 'pending';
                  const trackingCode = o.tracking_code || o.ghn_order_code;
                  const ghnTrackingUrl = trackingCode
                    ? `https://tracking.ghn.vn/?order_code=${trackingCode}`
                    : null;

                  return (
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
                        <p className="text-[11px] text-ink-400 truncate max-w-xs" title={`${o.shipping_address}, ${o.city}`}>
                          {o.shipping_address}, {o.city}
                        </p>
                      </td>
                      <td className="py-4 px-6">{renderPaymentBadge(o)}</td>
                      <td className="py-4 px-6">
                        {trackingCode ? (
                          <div className="space-y-1">
                            <a
                              href={ghnTrackingUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              title="Tra cứu lộ trình GHN"
                            >
                              <Truck size={12} />
                              <span>{trackingCode}</span>
                              <ExternalLink size={11} />
                            </a>
                            {o.expected_delivery_time && (
                              <p className="text-[10px] text-ink-400">
                                Giao dự kiến: {new Date(o.expected_delivery_time).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                        ) : isPending ? (
                          <button
                            type="button"
                            disabled={dispatchingId === o.id}
                            onClick={() => handleDispatch(o.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
                            title="Tạo đơn giao hàng nhanh GHN tự động"
                          >
                            {dispatchingId === o.id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Send size={12} />
                            )}
                            <span>Đẩy GHN (1-Click)</span>
                          </button>
                        ) : (
                          <span className="text-xs text-ink-400">
                            {o.shipping_partner || 'GHN Express'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-ink-900">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="py-4 px-6">
                        {status === 'refund_pending' ? (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
                              <RotateCcw size={12} className="text-purple-600 animate-spin" />
                              <span>Chờ hoàn tiền</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenRefundModal(o)}
                              className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                              title="Xác nhận đã chuyển khoản hoàn tiền cho khách"
                            >
                              <RotateCcw size={11} />
                              <span>Hoàn tiền</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <select
                              value={status}
                              onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold border focus:outline-none cursor-pointer transition-all ${
                                status === 'completed' || status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : status === 'shipping'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <option value="pending">Chờ xử lý</option>
                              <option value="refund_pending">Chờ hoàn tiền</option>
                              <option value="shipping">Đang giao hàng</option>
                              <option value="completed">Đã nhận / Hoàn tất</option>
                              <option value="cancelled">Đã hủy</option>
                            </select>
                            {status === 'cancelled' && o.cancel_reason && (
                              <p className="text-[10px] text-rose-600 mt-1 max-w-[140px] truncate" title={o.cancel_reason}>
                                Lý do: {o.cancel_reason}
                              </p>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {status === 'refund_pending' && (
                            <button
                              onClick={() => handleOpenRefundModal(o)}
                              className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                              title="Mở form xác nhận hoàn tiền"
                            >
                              <RotateCcw size={12} />
                              <span>Hoàn tiền</span>
                            </button>
                          )}
                          <button
                            onClick={() => onViewOrder(o)}
                            className="bg-ink-900 hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
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

        {/* Pagination Toolbar */}
        {totalAdminPages > 1 && (
          <div className="p-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 bg-cream-50/50">
            <div className="text-xs text-ink-500 font-medium">
              Hiển thị <span className="font-bold text-ink-900">{(adminPageNum - 1) * itemsPerPage + 1}</span> -{' '}
              <span className="font-bold text-ink-900">{Math.min(adminPageNum * itemsPerPage, filteredOrders.length)}</span> trên{' '}
              <span className="font-bold text-ink-900">{filteredOrders.length}</span> đơn hàng
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

      {/* MODAL: ADMIN XÁC NHẬN HOÀN TIỀN CHO KHÁCH */}
      {refundModalOrder &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget && !confirmingRefund) {
                setRefundModalOrder(null);
              }
            }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-200 p-6 sm:p-7 animate-scale-up space-y-5 my-auto cursor-default text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                <div className="flex items-center gap-2 text-purple-700">
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-200">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-ink-900">
                      Xác nhận đối soát & Hoàn tiền
                    </h3>
                    <p className="text-[11px] text-ink-400">
                      Đơn hàng: <strong className="font-mono text-purple-800">{refundModalOrder.order_code}</strong>
                    </p>
                  </div>
                </div>
                {!confirmingRefund && (
                  <button
                    onClick={() => setRefundModalOrder(null)}
                    className="p-1.5 rounded-full text-ink-400 hover:text-ink-900 hover:bg-cream-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Amount to Refund Box */}
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-purple-800 block">Số tiền cần chuyển hoàn cho khách:</span>
                  <span className="text-xl font-display font-extrabold text-purple-700">
                    {formatCurrency(refundModalOrder.total_amount)}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-200/80 text-purple-900 border border-purple-300">
                  Hoàn 100%
                </span>
              </div>

              {/* Customer Payout Information */}
              <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2.5">
                <h4 className="font-bold text-ink-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <CreditCard size={13} className="text-purple-600" />
                  <span>Thông tin tài khoản khách cung cấp</span>
                </h4>

                <div className="grid grid-cols-2 gap-2.5 text-ink-700">
                  <div>
                    <span className="text-ink-400 block text-[10px]">Ngân hàng / Ví:</span>
                    <strong className="text-ink-900 text-xs">
                      {refundModalOrder.refund_bank_name || 'Chưa cung cấp'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-ink-400 block text-[10px]">Chủ tài khoản:</span>
                    <strong className="text-ink-900 text-xs uppercase">
                      {refundModalOrder.refund_account_holder || refundModalOrder.customer_name}
                    </strong>
                  </div>

                  <div className="col-span-2 flex items-center justify-between bg-white p-2.5 rounded-xl border border-cream-200">
                    <div>
                      <span className="text-ink-400 block text-[10px]">Số tài khoản / SĐT MoMo:</span>
                      <strong className="font-mono text-sm text-ink-900">
                        {refundModalOrder.refund_account_number || 'Chưa cung cấp'}
                      </strong>
                    </div>
                    {refundModalOrder.refund_account_number && (
                      <button
                        type="button"
                        onClick={() => handleCopyAccountNumber(refundModalOrder.refund_account_number!)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      >
                        {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    )}
                  </div>

                  <div className="col-span-2">
                    <span className="text-ink-400 text-[10px]">Lý do khách hủy: </span>
                    <span className="text-ink-800 font-medium">
                      {refundModalOrder.cancel_reason || 'Khách yêu cầu hủy đơn'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-800 mb-1">
                    Mã giao dịch chuyển khoản hoàn tiền (FT code / Mã MoMo):
                  </label>
                  <input
                    type="text"
                    value={refundTxCode}
                    onChange={(e) => setRefundTxCode(e.target.value)}
                    placeholder="Ví dụ: FT2409189923 hoặc TID-MoMo-987654"
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-[10px] text-ink-400 mt-1">
                    Mã này sẽ được ghi vào biên lai và gửi email thông báo hoàn tất cho khách hàng.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-800 mb-1">
                    Ghi chú đối soát hoàn tiền (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    placeholder="Ví dụ: Đã chuyển khoản qua Vietcombank 24/7"
                    className="w-full px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-amber-800 text-[11px]">
                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái <strong>Đã hủy</strong>, trạng thái thanh toán là <strong>Đã hoàn tiền</strong>, và hệ thống sẽ tự động gửi email biên lai hoàn tiền cho khách hàng.
                </span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  disabled={confirmingRefund}
                  onClick={() => setRefundModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-cream-100 cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={confirmingRefund}
                  onClick={handleConfirmRefund}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                >
                  {confirmingRefund ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang lưu xác nhận...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Xác nhận đã hoàn tiền</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
