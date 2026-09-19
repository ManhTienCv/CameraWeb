import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  Send,
  Star,
  RotateCcw,
  X,
  CheckCircle2,
  Ban,
  ExternalLink,
  RefreshCw,
  CreditCard,
  ArrowRight,
  Loader2,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import type { Page, Order } from '../types';
import { OrderRatingModal } from '../components/OrderRatingModal';
import { reviewService } from '../services/review.service';

interface OrdersPageProps {
  onNavigate: (page: Page) => void;
}

type OrderFilterTab = 'all' | 'pending' | 'refund_pending' | 'shipping' | 'delivered' | 'cancelled';

const CANCEL_PRESET_REASONS = [
  'Thay đổi ý định mua sắm',
  'Muốn đổi sang mẫu máy ảnh / phụ kiện khác',
  'Muốn đổi phương thức thanh toán',
  'Nhập sai địa chỉ hoặc số điện thoại nhận hàng',
  'Tìm thấy giá tốt hơn ở nơi khác',
  'Thời gian giao hàng không phù hợp',
  'Lý do khác',
];

const COMMON_BANKS = [
  'Vietcombank',
  'MB Bank (Quân Đội)',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'VIB',
  'HDBank',
  'Ví MoMo',
  'Ví ZaloPay',
  'Khác (Nhập tùy chọn)',
];

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals state
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState(CANCEL_PRESET_REASONS[0]);
  const [cancelReasonCustom, setCancelReasonCustom] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [payingAgainId, setPayingAgainId] = useState<string | null>(null);

  // Refund bank details state
  const [refundBankPreset, setRefundBankPreset] = useState(COMMON_BANKS[0]);
  const [refundBankCustom, setRefundBankCustom] = useState('');
  const [refundAccountNumber, setRefundAccountNumber] = useState('');
  const [refundAccountHolder, setRefundAccountHolder] = useState('');

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (cancelModalOrder || ratingOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [cancelModalOrder, ratingOrder]);

  // Fetch real orders from backend
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let list: Order[] = [];
      if (user) {
        try {
          list = await api.getMyOrders();
        } catch {
          list = [];
        }
      }

      setOrders(list || []);

    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error('Không thể tải lịch sử đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Tab counts
  const counts = useMemo(() => {
    const res = {
      all: orders.length,
      pending: 0,
      refund_pending: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      const st = o.order_status || o.status || 'pending';
      if (st === 'pending') res.pending++;
      else if (st === 'refund_pending') res.refund_pending++;
      else if (st === 'shipping') res.shipping++;
      else if (st === 'delivered' || st === 'completed') res.delivered++;
      else if (st === 'cancelled') res.cancelled++;
    });
    return res;
  }, [orders]);

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => {
      const st = o.order_status || o.status || 'pending';
      if (activeTab === 'delivered') return st === 'delivered' || st === 'completed';
      return st === activeTab;
    });
  }, [orders, activeTab]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Handle Cancel Order
  const handleOpenCancelModal = (order: Order) => {
    setCancelModalOrder(order);
    setCancelReasonPreset(CANCEL_PRESET_REASONS[0]);
    setCancelReasonCustom('');
    setRefundBankPreset(COMMON_BANKS[0]);
    setRefundBankCustom('');
    setRefundAccountNumber('');
    setRefundAccountHolder(
      (user?.fullName || order.customer_name || '').trim().toUpperCase()
    );
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancelModalOrder) return;
    const finalReason =
      cancelReasonPreset === 'Lý do khác'
        ? cancelReasonCustom.trim() || 'Lý do khác'
        : cancelReasonPreset;

    const isPaidOnline = cancelModalOrder.payment_status === 'completed';
    const finalBankName =
      refundBankPreset === 'Khác (Nhập tùy chọn)'
        ? refundBankCustom.trim()
        : refundBankPreset;

    if (isPaidOnline) {
      if (!finalBankName) {
        toast.warning('Vui lòng chọn hoặc nhập tên Ngân hàng / Ví nhận hoàn tiền.');
        return;
      }
      if (!refundAccountNumber.trim()) {
        toast.warning('Vui lòng nhập Số tài khoản hoặc Số điện thoại MoMo nhận tiền hoàn.');
        return;
      }
      if (!refundAccountHolder.trim()) {
        toast.warning('Vui lòng nhập Tên chủ tài khoản nhận tiền.');
        return;
      }
    }

    try {
      setCancelling(true);
      const res = await api.cancelOrder(cancelModalOrder.id, {
        reason: finalReason,
        refundBankName: isPaidOnline ? finalBankName : undefined,
        refundAccountNumber: isPaidOnline ? refundAccountNumber.trim() : undefined,
        refundAccountHolder: isPaidOnline ? refundAccountHolder.trim().toUpperCase() : undefined,
      });

      toast.success(res.message || 'Đã tiếp nhận yêu cầu thành công!');

      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelModalOrder.id
            ? {
                ...o,
                status: isPaidOnline ? 'refund_pending' : 'cancelled',
                order_status: isPaidOnline ? 'refund_pending' : 'cancelled',
                payment_status: isPaidOnline ? 'refund_pending' : o.payment_status,
                cancel_reason: finalReason,
                refund_bank_name: isPaidOnline ? finalBankName : o.refund_bank_name,
                refund_account_number: isPaidOnline ? refundAccountNumber.trim() : o.refund_account_number,
                refund_account_holder: isPaidOnline ? refundAccountHolder.trim().toUpperCase() : o.refund_account_holder,
              }
            : o
        )
      );

      setCancelModalOrder(null);
    } catch (err: any) {
      console.error('Cancel order error:', err);
      toast.error(err.message || 'Không thể hủy đơn hàng. Vui lòng thử lại!');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Pay Again MoMo
  const handlePayAgainMomo = async (order: Order) => {
    try {
      setPayingAgainId(order.id);
      const redirectUrl = `${window.location.origin}/order-success?orderId=${order.id}`;
      const res = await api.payAgainMomo(order.id, redirectUrl);

      if (res.success && res.payUrl) {
        toast.info('Đang chuyển hướng đến cổng thanh toán MoMo Sandbox...');
        setTimeout(() => {
          window.location.href = res.payUrl!;
        }, 800);
      } else {
        toast.error(res.message || 'Không thể khởi tạo thanh toán MoMo.');
      }
    } catch (err: any) {
      console.error('MoMo pay again error:', err);
      toast.error(err.message || 'Lỗi khi kết nối cổng MoMo.');
    } finally {
      setPayingAgainId(null);
    }
  };

  // Handle Repurchase
  const handleRepurchase = (order: Order) => {
    if (!order.items || order.items.length === 0) return;
    let addedCount = 0;
    order.items.forEach((item) => {
      addToCart(
        {
          id: item.product_id,
          name: item.name,
          slug: '',
          brand: 'Sony',
          description: '',
          price: item.price,
          original_price: item.price,
          category_id: '',
          image_url: item.image_url || '',
          gallery: [],
          specs: {},
          features: [],
          rating: 5,
          review_count: 0,
          stock: 10,
          is_featured: false,
          is_new: false,
        },
        item.quantity
      );
      addedCount += item.quantity;
    });
    toast.success(`Đã thêm ${addedCount} sản phẩm từ đơn ${order.order_code || ''} vào giỏ hàng!`);
    onNavigate({ name: 'cart' });
  };

  // Badges
  const renderPaymentBadge = (order: Order) => {
    if (order.payment_status === 'refund_pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          <RotateCcw size={12} className="text-purple-600" />
          <span>Chờ đối soát hoàn tiền</span>
        </span>
      );
    }

    if (order.payment_status === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} className="text-emerald-600" />
          <span>Đã hoàn tiền</span>
        </span>
      );
    }

    const method = (order.payment_method || '').toLowerCase();
    const isPaid = order.payment_status === 'completed';

    if (method === 'momo') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-pink-50 text-[#D82D8B] border border-pink-200">
          <span className="w-2 h-2 rounded-full bg-[#D82D8B]" />
          <span>MoMo V2 {isPaid ? '• Đã thanh toán' : '• Chờ thanh toán'}</span>
        </span>
      );
    }

    if (method === 'vietqr') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          <QrCode size={12} className="text-sky-600" />
          <span>VietQR 24/7 {isPaid ? '• Đã thanh toán' : '• Chờ thanh toán'}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
        <CreditCard size={12} className="text-amber-600" />
        <span>COD (Tiền mặt khi nhận)</span>
      </span>
    );
  };

  const renderStatusBadge = (order: Order) => {
    const st = order.order_status || order.status || 'pending';

    if (st === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full">
          <Clock size={14} className="text-amber-500" />
          <span>Chờ xử lý & đóng gói</span>
        </span>
      );
    }

    if (st === 'refund_pending') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3.5 py-1 rounded-full">
          <RotateCcw size={14} className="text-purple-600" />
          <span>Chờ hoàn tiền</span>
        </span>
      );
    }

    if (st === 'shipping') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3.5 py-1 rounded-full shadow-2xs">
          <Truck size={14} className="animate-pulse" />
          <span>Đang giao hàng</span>
        </span>
      );
    }

    if (st === 'delivered' || st === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 px-3.5 py-1 rounded-full shadow-2xs">
          <CheckCircle2 size={14} />
          <span>Giao thành công</span>
        </span>
      );
    }

    if (st === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1 rounded-full">
          <Ban size={14} className="text-rose-500" />
          <span>Đã hủy đơn hàng</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-700 bg-cream-100 px-3.5 py-1 rounded-full">
        <span>{st}</span>
      </span>
    );
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4 border border-accent-100 shadow-2xs">
          <Package size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-ink-900 mb-2">Lịch Sử Đơn Hàng</h2>
        <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
          Vui lòng đăng nhập để tra cứu lịch sử mua hàng, mã vận đơn GHN Express và quản lý đơn hàng của bạn.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="btn-accent px-6 py-3 rounded-2xl font-bold text-sm shadow-md cursor-pointer"
        >
          Đăng nhập ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-fade-in space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-200/80 shadow-2xs">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-display font-bold text-ink-900 tracking-tight">
              Lịch Sử Đơn Hàng
            </h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Theo dõi vận đơn GHN Express, đối soát thanh toán MoMo / VietQR và quản lý đơn mua
            </p>
          </div>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-cream-200 text-xs font-bold text-ink-700 hover:bg-cream-100 transition-colors shadow-2xs cursor-pointer"
          title="Tải lại đơn hàng"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-accent-600' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. Sub-Tabs Filter */}
      <div className="flex flex-wrap gap-2.5 pb-1 relative">
        {[
          { id: 'all', label: `Tất cả (${counts.all})` },
          { id: 'pending', label: `Chờ xử lý (${counts.pending})` },
          { id: 'refund_pending', label: `Chờ hoàn tiền (${counts.refund_pending})` },
          { id: 'shipping', label: `Đang giao (${counts.shipping})` },
          { id: 'delivered', label: `Đã giao (${counts.delivered})` },
          { id: 'cancelled', label: `Đã hủy (${counts.cancelled})` },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OrderFilterTab)}
              className={`relative px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                isActive
                  ? 'border-ink-900 text-white shadow-xs'
                  : 'border-cream-200 text-ink-700 hover:border-cream-300 hover:bg-cream-50 bg-white shadow-2xs'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="orders-status-tab-capsule"
                  className="absolute inset-0 bg-ink-900 rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Orders List */}
      {loading ? (
        <div className="bg-white p-16 rounded-3xl border border-cream-200 text-center space-y-3">
          <Loader2 size={36} className="text-accent-500 animate-spin mx-auto" />
          <p className="font-bold text-ink-800 text-sm">Đang tải lịch sử đơn hàng từ máy chủ...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-cream-200 text-center space-y-3">
          <Package size={36} className="text-cream-300 mx-auto" />
          <p className="font-bold text-ink-800">Không có đơn hàng nào trong mục này</p>
          <p className="text-xs text-ink-400">Đơn hàng mới tạo sẽ xuất hiện ngay tại đây</p>
          <button
            onClick={() => onNavigate({ name: 'catalog' })}
            className="btn-accent px-5 py-2 text-xs font-bold rounded-xl mt-2 cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Mua sắm ngay</span>
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        <>
          <div className="text-xs text-ink-500 font-medium flex items-center justify-between">
            <span>
              Hiển thị <strong className="text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
              <strong className="text-ink-900">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </strong>{' '}
              trên tổng số <strong className="text-ink-900">{filteredOrders.length}</strong> đơn hàng
            </span>
          </div>

          <div className="space-y-6">
            {paginatedOrders.map((ord) => {
              const status = ord.order_status || ord.status || 'pending';
              const isPending = status === 'pending';
              const isRefundPending = status === 'refund_pending';
              const isDelivered = status === 'delivered' || status === 'completed';
              const isCancelled = status === 'cancelled';
              const isMomoPending =
                (ord.payment_method || '').toLowerCase() === 'momo' &&
                ord.payment_status === 'pending' &&
                !isCancelled &&
                !isRefundPending;

              const trackingCode = ord.tracking_code || ord.ghn_order_code;
              const ghnTrackingUrl = trackingCode
                ? `https://tracking.ghn.vn/?order_code=${trackingCode}`
                : null;

              return (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl border border-cream-200/90 shadow-xs p-6 sm:p-8 space-y-5 hover:shadow-md transition-shadow"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-400 font-medium">Mã đơn hàng:</span>
                        <h4 className="font-display font-bold text-lg text-ink-900">{ord.order_code}</h4>
                      </div>
                      <span className="text-[11px] text-ink-400">
                        Ngày đặt: {new Date(ord.created_at || Date.now()).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {renderPaymentBadge(ord)}
                      {renderStatusBadge(ord)}
                    </div>
                  </div>

                  {/* Refund Pending Notice Banner */}
                  {isRefundPending && (
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-purple-800">
                        <RotateCcw size={15} className="text-purple-600 animate-spin" />
                        <span>Đã tiếp nhận yêu cầu hủy đơn & Chờ shop hoàn tiền (24h - 48h)</span>
                      </div>
                      <p className="text-purple-700 leading-relaxed">
                        Toàn bộ sản phẩm trong đơn đã được tự động hoàn lại vào kho hàng. CameraHub đang kiểm tra và sẽ thực hiện lệnh chuyển khoản hoàn lại số tiền <strong>{formatCurrency(ord.total_amount)}</strong> cho bạn.
                      </p>
                      {ord.refund_bank_name && (
                        <div className="bg-white/90 rounded-xl p-3 border border-purple-100 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-purple-950 font-medium">
                          <span>Ngân hàng / Ví: <strong className="text-purple-700">{ord.refund_bank_name}</strong></span>
                          <span>Số TK / SĐT MoMo: <strong className="font-mono text-purple-900">{ord.refund_account_number}</strong></span>
                          <span>Chủ tài khoản: <strong className="text-purple-900">{ord.refund_account_holder}</strong></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancelled Notice Banner */}
                  {isCancelled && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                      <Ban size={16} className="text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div>
                          <strong>Đơn hàng đã được hủy:</strong>{' '}
                          {ord.cancel_reason || 'Theo yêu cầu của khách hàng'}. Số lượng sản phẩm đã được tự động hoàn lại vào kho.
                        </div>
                        {ord.refund_transaction_code && (
                          <div className="text-emerald-700 font-semibold flex flex-wrap items-center gap-1.5 pt-0.5">
                            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                            <span>
                              Shop đã hoàn tiền thành công ({ord.refund_bank_name} - STK: {ord.refund_account_number}) - Mã GD: <strong className="font-mono text-emerald-800">{ord.refund_transaction_code}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Product Items List */}
                  <div className="space-y-3">
                    {(ord.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-11 h-11 rounded-xl object-cover border border-cream-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-cream-100 flex items-center justify-center text-ink-400 shrink-0">
                              <Package size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-ink-900 truncate block">
                              {item.name}
                            </span>
                            <span className="text-xs text-ink-400">Số lượng: x{item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-display font-bold text-sm text-ink-900 shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping & Delivery Info Box */}
                  <div className="bg-cream-50/70 border border-cream-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
                        <Truck size={15} className="text-accent-500" />
                        <span>Vận chuyển & Nhận hàng</span>
                      </div>

                      {/* GHN Direct Tracking Link */}
                      {ghnTrackingUrl && (
                        <a
                          href={ghnTrackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <Send size={12} />
                          <span>Tra cứu GHN ({trackingCode})</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-ink-700">
                      <div>
                        <span className="text-ink-400">Người nhận: </span>
                        <strong className="text-ink-900">{ord.customer_name}</strong> ({ord.customer_phone})
                      </div>
                      <div className="md:text-right">
                        <span className="text-ink-400">Đối tác vận chuyển: </span>
                        <strong className="text-orange-600 font-bold">
                          {ord.shipping_partner || 'GHN Express'}
                        </strong>
                        {trackingCode && <span className="text-ink-400 font-mono ml-1">#{trackingCode}</span>}
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-ink-400">Địa chỉ: </span>
                        <span className="text-ink-800 font-medium">
                          {ord.shipping_address}, {ord.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Summary & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-cream-100">
                    <div className="text-xs">
                      <span className="text-ink-400">Tổng thanh toán: </span>
                      <strong className="font-display text-lg text-accent-600 font-bold ml-1">
                        {formatCurrency(ord.total_amount)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Button: Pay Again MoMo if pending */}
                      {isMomoPending && (
                        <button
                          onClick={() => handlePayAgainMomo(ord)}
                          disabled={payingAgainId === ord.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D82D8B] hover:bg-[#b01e6e] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
                        >
                          {payingAgainId === ord.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CreditCard size={13} />
                          )}
                          <span>Thanh toán lại MoMo</span>
                        </button>
                      )}

                      {/* Button: Cancel Order (Only if pending) */}
                      {isPending && (
                        <button
                          onClick={() => handleOpenCancelModal(ord)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Ban size={13} />
                          <span>Hủy đơn hàng</span>
                        </button>
                      )}

                      {/* Button: Review Order if Delivered */}
                      {isDelivered && (
                        <>
                          {reviewService.hasReviewedOrder(ord.order_code || '') ? (
                            <button
                              onClick={() => setRatingOrder(ord)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-50 text-accent-700 border border-accent-200/80 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <CheckCircle2 size={13} className="text-accent-600" />
                              <span>Đã đánh giá</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setRatingOrder(ord)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent-50 hover:bg-accent-100 text-accent-700 border border-accent-200/80 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                            >
                              <Star size={13} className="text-accent-500 fill-accent-500" />
                              <span>Đánh giá sản phẩm</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Button: Repurchase */}
                      <button
                        onClick={() => handleRepurchase(ord)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-700 text-xs font-bold transition-colors cursor-pointer border border-cream-200"
                      >
                        <RotateCcw size={13} />
                        <span>Mua lại</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-cream-200 rounded-xl text-xs font-bold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                ‹ Trang trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-ink-900 text-white shadow-xs'
                      : 'bg-white text-ink-700 border border-cream-200 hover:border-cream-300'
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
                className="px-4 py-2 bg-white border border-cream-200 rounded-xl text-xs font-bold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                Trang sau ›
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL: HỦY ĐƠN HÀNG VÀ HOÀN KHO */}
      {cancelModalOrder &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget && !cancelling) {
                setCancelModalOrder(null);
              }
            }}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-cream-200 p-6 sm:p-8 animate-scale-up space-y-5 my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-cream-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200">
                    <Ban size={18} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-ink-900">
                    Xác nhận hủy đơn hàng
                  </h3>
                </div>
                {!cancelling && (
                  <button
                    onClick={() => setCancelModalOrder(null)}
                    className="p-1.5 rounded-full text-ink-400 hover:text-ink-900 hover:bg-cream-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {cancelModalOrder.payment_status === 'completed' ? (
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-purple-800">
                    <RotateCcw size={14} className="text-purple-600" />
                    <span>Đơn hàng đã thanh toán trực tuyến ({cancelModalOrder.payment_method === 'momo' ? 'MoMo' : 'VietQR'})</span>
                  </div>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    Sản phẩm sẽ được tự động hoàn lại vào tồn kho ngay sau khi gửi yêu cầu. Để Shop chuyển khoản hoàn lại số tiền <strong>{formatCurrency(cancelModalOrder.total_amount)}</strong> cho bạn, vui lòng cung cấp thông tin tài khoản nhận tiền:
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-ink-600 leading-relaxed">
                    Bạn có chắc chắn muốn hủy đơn hàng{' '}
                    <strong className="text-ink-900">{cancelModalOrder.order_code}</strong>? Sau khi hủy,
                    toàn bộ sản phẩm sẽ được tự động hoàn lại số lượng tồn kho ngay lập tức.
                  </p>
                </div>
              )}

              {/* Thông tin tài khoản hoàn tiền nếu đơn online đã thanh toán */}
              {cancelModalOrder.payment_status === 'completed' && (
                <div className="space-y-3 p-3.5 bg-cream-50/80 rounded-2xl border border-cream-200">
                  <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wide flex items-center gap-1.5">
                    <CreditCard size={13} className="text-purple-600" />
                    <span>Thông tin nhận hoàn tiền</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-700 mb-1">
                        Ngân hàng hoặc Ví điện tử <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={refundBankPreset}
                        onChange={(e) => setRefundBankPreset(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-cream-200 rounded-xl text-xs text-ink-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                      >
                        {COMMON_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    {refundBankPreset === 'Khác (Nhập tùy chọn)' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-ink-700 mb-1">
                          Tên Ngân hàng / Ví nhận tiền <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={refundBankCustom}
                          onChange={(e) => setRefundBankCustom(e.target.value)}
                          placeholder="Ví dụ: OCB, Shinhan Bank..."
                          className="w-full px-3 py-2 bg-white border border-cream-200 rounded-xl text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-ink-700 mb-1">
                        Số tài khoản hoặc SĐT MoMo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={refundAccountNumber}
                        onChange={(e) => setRefundAccountNumber(e.target.value)}
                        placeholder="Nhập số tài khoản hoặc số ví MoMo..."
                        className="w-full px-3 py-2 bg-white border border-cream-200 rounded-xl text-xs text-ink-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-ink-700 mb-1">
                        Tên chủ tài khoản (Không dấu) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={refundAccountHolder}
                        onChange={(e) => setRefundAccountHolder(e.target.value.toUpperCase())}
                        placeholder="Ví dụ: NGUYEN VAN A"
                        className="w-full px-3 py-2 bg-white border border-cream-200 rounded-xl text-xs text-ink-800 uppercase font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-bold text-ink-800">
                  Vui lòng chọn lý do hủy đơn:
                </label>
                <div className="space-y-2">
                  {CANCEL_PRESET_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        cancelReasonPreset === reason
                          ? 'border-rose-300 bg-rose-50/50 text-ink-900 font-semibold'
                          : 'border-cream-200 hover:bg-cream-50 text-ink-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel_reason"
                        value={reason}
                        checked={cancelReasonPreset === reason}
                        onChange={() => setCancelReasonPreset(reason)}
                        className="w-3.5 h-3.5 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                {cancelReasonPreset === 'Lý do khác' && (
                  <textarea
                    rows={2}
                    value={cancelReasonCustom}
                    onChange={(e) => setCancelReasonCustom(e.target.value)}
                    placeholder="Nhập lý do chi tiết của bạn..."
                    className="w-full px-3.5 py-2 bg-cream-50 border border-cream-200 rounded-xl text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cream-100">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setCancelModalOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-cream-100 cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancelOrder}
                  className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60 text-white ${
                    cancelModalOrder.payment_status === 'completed'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'btn-danger'
                  }`}
                >
                  {cancelling ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{cancelModalOrder.payment_status === 'completed' ? 'Đang gửi yêu cầu hoàn tiền...' : 'Đang xử lý hoàn kho...'}</span>
                    </>
                  ) : cancelModalOrder.payment_status === 'completed' ? (
                    <>
                      <RotateCcw size={14} />
                      <span>Gửi yêu cầu hủy & Hoàn tiền</span>
                    </>
                  ) : (
                    <>
                      <Ban size={14} />
                      <span>Xác nhận hủy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL: ĐÁNH GIÁ SẢN PHẨM */}
      <OrderRatingModal
        isOpen={!!ratingOrder}
        onClose={() => setRatingOrder(null)}
        order={
          ratingOrder
            ? {
                id: ratingOrder.id,
                order_code: ratingOrder.order_code || '',
                items: (ratingOrder.items || []).map((i) => ({
                  name: i.name,
                  quantity: i.quantity,
                  price: i.price,
                  image_url: i.image_url,
                })),
              }
            : null
        }
        onSubmitted={() => {
          setRatingOrder(null);
          fetchOrders();
        }}
      />
    </div>
  );
};
