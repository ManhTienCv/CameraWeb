import React, { useState, useMemo, useEffect } from 'react';
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
  Edit3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../lib/utils';
import type { Page } from '../types';
import { OrderRatingModal } from '../components/OrderRatingModal';
import { reviewService } from '../services/review.service';

interface OrdersPageProps {
  onNavigate: (page: Page) => void;
}

type OrderStatusTab = 'pending' | 'shipping' | 'delivered';

interface MockJourneyStep {
  time: string;
  title: string;
  desc: string;
  done: boolean;
  current?: boolean;
}

interface EnhancedOrder {
  id: string;
  order_code: string;
  date: string;
  status: 'pending' | 'shipping' | 'delivered';
  statusLabel: string;
  items: Array<{
    categoryTag: string;
    name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  shippingPartner: string;
  trackingCode: string;
  paymentMethod: string;
  totalAmount: number;
  journey: MockJourneyStep[];
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ onNavigate }) => {
  const { user, openAuthModal } = useAuth();
  const toast = useToast();
  const [orderStatusTab, setOrderStatusTab] = useState<OrderStatusTab>('pending');

  // Tracking Journey Modal State
  const [trackingOrder, setTrackingOrder] = useState<EnhancedOrder | null>(null);
  const [ratingOrder, setRatingOrder] = useState<EnhancedOrder | null>(null);
  const [editingOrderAddress, setEditingOrderAddress] = useState<EnhancedOrder | null>(null);
  const [newOrderAddressText, setNewOrderAddressText] = useState('');
  const [, setRefreshKey] = useState(0);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (trackingOrder || editingOrderAddress) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [trackingOrder, editingOrderAddress]);

  useEffect(() => {
    const handleSync = () => setRefreshKey((k) => k + 1);
    window.addEventListener('camerahub_reviews_updated', handleSync);
    return () => window.removeEventListener('camerahub_reviews_updated', handleSync);
  }, []);

  // Sample Camera Orders (Rich Mock Data for camera store)
  const [mockOrders, setMockOrders] = useState<EnhancedOrder[]>([
    {
      id: 'ord-1',
      order_code: '#HD-88291',
      date: '24/8/2026',
      status: 'pending',
      statusLabel: 'Chờ Duyệt & Đóng Gói',
      items: [
        {
          categoryTag: 'Thiết bị',
          name: 'Sony Alpha A7 Mark IV (Body)',
          quantity: 1,
          price: 54990000,
          image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600',
        },
        {
          categoryTag: 'Phụ kiện',
          name: 'Thẻ nhớ SanDisk Extreme Pro 128GB SDXC UHS-I 200MB/s',
          quantity: 1,
          price: 890000,
          image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600',
        },
      ],
      recipientName: 'Nguyễn Văn Phục',
      recipientPhone: '0987654321',
      shippingAddress: 'Số 10 Đường Cầu Giấy, Q. Cầu Giấy, Hà Nội',
      shippingPartner: 'GHN Express',
      trackingCode: '#GHN-VN-882910',
      paymentMethod: 'VIETQR NGÂN HÀNG',
      totalAmount: 55880000,
      journey: [
        { time: '10:30 - 24/8/2026', title: 'Đặt hàng thành công', desc: 'Đơn hàng đã được ghi nhận trên hệ thống CameraHub.', done: true },
        { time: '11:15 - 24/8/2026', title: 'Xác nhận thanh toán', desc: 'Giao dịch qua VietQR đã được đối soát thành công.', done: true },
        { time: 'Đang xử lý', title: 'Đang đóng gói kiện hàng', desc: 'Kỹ thuật viên đang kiểm tra ngoại quan máy và dán tem niêm phong.', done: false, current: true },
        { time: 'Dự kiến hôm nay', title: 'Bàn giao cho GHN Express', desc: 'Shipper sẽ lấy hàng và chuyển về kho trung chuyển.', done: false },
      ],
    },
    {
      id: 'ord-2',
      order_code: '#HD-88295',
      date: '9/8/2026',
      status: 'shipping',
      statusLabel: 'Đang Giao (GHN Express)',
      items: [
        {
          categoryTag: 'Thiết bị',
          name: 'Ống kính Sigma 24-70mm f/2.8 DG DN Art (Ngàm Sony E)',
          quantity: 1,
          price: 24500000,
          image_url: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&q=80&w=600',
        },
      ],
      recipientName: 'Trần Văn Cường',
      recipientPhone: '0912345678',
      shippingAddress: 'Số 25 Phố Lý Thường Kiệt, Q. Hoàn Kiếm, Hà Nội',
      shippingPartner: 'GHN Express',
      trackingCode: '#GHN-VN-882910',
      paymentMethod: 'VIETQR NGÂN HÀNG',
      totalAmount: 24500000,
      journey: [
        { time: '08:00 - 08/8/2026', title: 'Đặt hàng thành công', desc: 'Đơn hàng đã được tạo thành công.', done: true },
        { time: '14:20 - 08/8/2026', title: 'Đã xuất kho CameraHub', desc: 'Kiện hàng đã bàn giao cho GHN Express.', done: true },
        { time: '21:00 - 08/8/2026', title: 'Đến kho trung chuyển Hà Nội', desc: 'Kiện hàng đã được phân loại về bưu cục giao Hoàn Kiếm.', done: true },
        { time: '08:30 - 09/8/2026', title: 'Đang phát hàng', desc: 'Shipper Nguyễn Hoàng Nam (0901234567) đang trên đường giao.', done: true, current: true },
      ],
    },
    {
      id: 'ord-3',
      order_code: '#HD-77102',
      date: '7/8/2026',
      status: 'delivered',
      statusLabel: 'Đã Giao Thành Công',
      items: [
        {
          categoryTag: 'Compact',
          name: 'Canon PowerShot G7 X Mark III (Vlog & LiveStream)',
          quantity: 1,
          price: 19990000,
          image_url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=600',
        },
      ],
      recipientName: 'Lê Minh Tuấn',
      recipientPhone: '0908889999',
      shippingAddress: 'Toà nhà Bitexco, Số 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM',
      shippingPartner: 'GHTK Express',
      trackingCode: '#GHTK-SGN-44912',
      paymentMethod: 'THU TIỀN KHI NHẬN (COD)',
      totalAmount: 19890000,
      journey: [
        { time: '09:00 - 05/8/2026', title: 'Đặt hàng thành công', desc: 'Đơn hàng được tiếp nhận.', done: true },
        { time: '16:00 - 05/8/2026', title: 'Bàn giao GHTK Express', desc: 'Kiện hàng đã rời kho.', done: true },
        { time: '11:00 - 07/8/2026', title: 'Giao hàng thành công', desc: 'Người nhận đã ký nhận kiện hàng nguyên vẹn.', done: true, current: true },
      ],
    },
  ]);

  const pendingOrdersCount = mockOrders.filter((o) => o.status === 'pending').length;
  const shippingOrdersCount = mockOrders.filter((o) => o.status === 'shipping').length;
  const deliveredOrdersCount = mockOrders.filter((o) => o.status === 'delivered').length;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when switching status tab
  useEffect(() => {
    setCurrentPage(1);
  }, [orderStatusTab]);

  const filteredOrders = useMemo(() => {
    return mockOrders.filter((o) => o.status === orderStatusTab);
  }, [mockOrders, orderStatusTab]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredOrders, currentPage, itemsPerPage]);

  const handleOpenEditOrderAddress = (order: EnhancedOrder) => {
    setEditingOrderAddress(order);
    setNewOrderAddressText(order.shippingAddress);
  };

  const handleSaveOrderAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrderAddress) return;
    setMockOrders((prev) =>
      prev.map((o) =>
        o.id === editingOrderAddress.id ? { ...o, shippingAddress: newOrderAddressText } : o
      )
    );
    setEditingOrderAddress(null);
  };

  const handleRepurchase = (order: EnhancedOrder) => {
    toast.success(`Đã thêm ${order.items.length} sản phẩm từ đơn ${order.order_code} vào giỏ hàng!`);
    onNavigate({ name: 'cart' });
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-accent-50 text-accent-600 flex items-center justify-center mx-auto mb-4 border border-accent-100 shadow-2xs">
          <Package size={32} />
        </div>
        <h2 className="text-2xl font-display font-bold text-ink-900 mb-2">Lịch Sử Đơn Hàng</h2>
        <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
          Vui lòng đăng nhập để tra cứu lịch sử mua hàng và hành trình giao hàng của bạn.
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
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-200/80 shadow-2xs">
          <Package size={24} />
        </div>
        <div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-ink-900 tracking-tight">
            Lịch Sử Đơn Hàng & Hành Trình Giao Hàng
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Theo dõi trạng thái đóng gói, đối tác vận chuyển và lịch sử mua máy ảnh của bạn
          </p>
        </div>
      </div>

      {/* 2. Sub-Tabs: Filter by Delivery Status with Zero Layout Shift and Smooth Gliding Pill */}
      <div className="flex flex-wrap gap-2.5 pb-1 relative">
        {[
          { id: 'pending', label: `Chờ đóng gói (${pendingOrdersCount})` },
          { id: 'shipping', label: `Đang giao hàng (${shippingOrdersCount})` },
          { id: 'delivered', label: `Đã nhận hàng (${deliveredOrdersCount})` },
        ].map((tab) => {
          const isActive = orderStatusTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setOrderStatusTab(tab.id as any)}
              className={`relative px-5 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
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
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-cream-200 text-center space-y-3">
          <Package size={36} className="text-cream-300 mx-auto" />
          <p className="font-bold text-ink-800">Không có đơn hàng nào trong mục này</p>
          <p className="text-xs text-ink-400">Các đơn hàng mới đặt sẽ xuất hiện tại đây</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-ink-500 font-medium">
            Hiển thị <strong className="text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
            <strong className="text-ink-900">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</strong> trên tổng số{' '}
            <strong className="text-ink-900">{filteredOrders.length}</strong> đơn hàng
          </div>

          <div className="space-y-6">
            {paginatedOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-3xl border border-cream-200/90 shadow-xs p-6 sm:p-8 space-y-6 hover:shadow-md transition-shadow"
              >
                {/* Order Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-100">
                  <div>
                    <span className="text-xs text-ink-400 font-medium">Mã đơn hàng:</span>
                    <h4 className="font-display font-bold text-lg text-ink-900">{ord.order_code}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    {ord.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50/80 border border-amber-200/80 px-3.5 py-1 rounded-full">
                        <Clock size={14} className="text-amber-500" />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    {ord.status === 'shipping' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3.5 py-1 rounded-full shadow-2xs">
                        <Truck size={14} />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    {ord.status === 'delivered' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-accent-600 px-3.5 py-1 rounded-full shadow-2xs">
                        <CheckCircle2 size={14} />
                        <span>{ord.statusLabel}</span>
                      </span>
                    )}

                    <span className="text-xs text-ink-500 font-semibold">{ord.date}</span>
                  </div>
                </div>

                {/* Product Items List */}
                <div className="space-y-3">
                  {ord.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-cream-200 shrink-0"
                          />
                        )}
                        <span className="text-[11px] font-bold text-ink-600 bg-cream-100/90 border border-cream-200 px-2.5 py-0.5 rounded-full shrink-0">
                          {item.categoryTag}
                        </span>
                        <span className="text-sm font-semibold text-ink-900 truncate">
                          {item.name}{' '}
                          <span className="text-xs font-normal text-ink-400">x{item.quantity}</span>
                        </span>
                      </div>
                      <span className="font-display font-bold text-sm text-ink-900 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Shipping & Delivery Information Box */}
                <div className="bg-cream-50/60 border border-cream-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-900">
                      <Truck size={16} className="text-accent-500" />
                      <span>Thông tin vận chuyển & Nhận hàng</span>
                    </div>

                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleOpenEditOrderAddress(ord)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-cream-100 border border-cream-200 text-accent-700 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                      >
                        <Edit3 size={13} />
                        <span>Sửa Địa Chỉ</span>
                      </button>
                    )}

                    {(ord.status === 'shipping' || ord.status === 'delivered') && (
                      <button
                        onClick={() => setTrackingOrder(ord)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                      >
                        <Send size={13} />
                        <span>Tra Cứu Hành Trình</span>
                      </button>
                    )}
                  </div>

                  {/* Recipient & Address Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-ink-700">
                    <div>
                      <span className="text-ink-400">Người nhận: </span>
                      <strong className="text-ink-900">{ord.recipientName}</strong> ({ord.recipientPhone})
                    </div>
                    <div className="md:text-right">
                      <span className="text-ink-400">Đối tác giao: </span>
                      <strong className="text-accent-700 font-bold">{ord.shippingPartner}</strong>{' '}
                      <span className="text-ink-400 font-mono">({ord.trackingCode})</span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-ink-400">Địa chỉ nhận hàng: </span>
                      <span className="text-ink-800 font-medium">{ord.shippingAddress}</span>
                    </div>
                  </div>

                  {/* Status Notice Callout Box */}
                  {ord.status === 'pending' && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                      <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đơn hàng đang chờ xử lý:</strong> Nhân viên kho đang chuẩn bị và đóng gói sản phẩm. Đơn vị vận chuyển sẽ tiếp nhận kiện hàng sớm.
                      </div>
                    </div>
                  )}

                  {ord.status === 'shipping' && (
                    <div className="p-3.5 bg-blue-50/90 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                      <Truck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đang vận chuyển:</strong> Đơn hàng {ord.order_code} đã được giao cho Shipper {ord.shippingPartner}. Bấm nút "Tra Cứu Hành Trình" ở trên để theo dõi vị trí kiện hàng.
                      </div>
                    </div>
                  )}

                  {ord.status === 'delivered' && (
                    <div className="p-3.5 bg-accent-50/70 border border-accent-200/80 rounded-xl text-xs text-ink-900 flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-accent-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Đã nhận hàng thành công:</strong> Kiện hàng {ord.order_code} đã được giao đến tay bạn. Bạn có thể bấm "Đánh giá sản phẩm" bên dưới để chia sẻ cảm nhận!
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Payment & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-ink-500">
                    Thanh toán:{' '}
                    <strong className="text-ink-800 uppercase font-bold">
                      {ord.paymentMethod === 'vietqr' ? 'VietQR (Vietcombank)' : ord.paymentMethod}
                    </strong>
                  </div>

                  <div className="flex items-center gap-3">
                    {ord.status === 'delivered' && (
                      <>
                        {reviewService.hasReviewedOrder(ord.order_code) ? (
                          <button
                            onClick={() => setRatingOrder(ord)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-50 hover:bg-accent-100 text-accent-700 border border-accent-200/80 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={14} className="text-accent-600" />
                            <span>Đã đánh giá</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setRatingOrder(ord)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-50 hover:bg-accent-100 text-accent-700 border border-accent-200/80 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            <Star size={14} className="text-accent-500 fill-accent-500" />
                            <span>Đánh giá sản phẩm</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => handleRepurchase(ord)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-ink-700 text-xs font-bold transition-colors cursor-pointer border border-cream-200"
                    >
                      <RotateCcw size={13} />
                      <span>Mua lại</span>
                    </button>

                    <div className="text-xs">
                      <span className="text-ink-400">Tổng tiền: </span>
                      <strong className="font-display text-base text-accent-600 font-bold">
                        {formatCurrency(ord.totalAmount)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Orders Pagination Controls (10 items / page) */}
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

      {/* 4. MODAL TRA CỨU HÀNH TRÌNH GIAO HÀNG */}
      {trackingOrder &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setTrackingOrder(null);
              }
            }}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cream-200 p-6 sm:p-8 animate-scale-up space-y-6 my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-cream-100">
                <div>
                  <h3 className="font-display font-bold text-lg text-ink-900">
                    Hành Trình Đơn Hàng {trackingOrder.order_code}
                  </h3>
                  <p className="text-xs text-ink-400 mt-0.5">
                    Đối tác: <strong className="text-accent-600 font-bold">{trackingOrder.shippingPartner}</strong> ({trackingOrder.trackingCode})
                  </p>
                </div>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="p-2 rounded-full text-ink-400 hover:text-ink-900 hover:bg-cream-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Timeline Steps */}
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-cream-200 pl-2">
                {trackingOrder.journey.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                        step.current
                          ? 'bg-accent-500 text-white ring-4 ring-accent-100 animate-pulse'
                          : step.done
                          ? 'bg-ink-900 text-white'
                          : 'bg-cream-200 text-ink-400'
                      }`}
                    >
                      {step.done ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-ink-400">{step.time}</span>
                      <h5 className="font-bold text-sm text-ink-900 mt-0.5">{step.title}</h5>
                      <p className="text-xs text-ink-600 mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-cream-100 flex justify-end">
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="btn-accent px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 5. MODAL SỬA ĐỊA CHỈ ĐƠN HÀNG */}
      {editingOrderAddress &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditingOrderAddress(null);
              }
            }}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-cream-200 p-6 sm:p-8 animate-scale-up space-y-5 my-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display font-bold text-xl text-ink-900">
                Sửa Địa Chỉ Giao Hàng {editingOrderAddress.order_code}
              </h3>
              <p className="text-xs text-ink-500">
                Đơn hàng đang chờ duyệt và đóng gói nên bạn có thể cập nhật lại địa chỉ nhận.
              </p>

              <form onSubmit={handleSaveOrderAddress} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-700 mb-1">Địa chỉ nhận hàng mới</label>
                  <textarea
                    rows={3}
                    required
                    value={newOrderAddressText}
                    onChange={(e) => setNewOrderAddressText(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-cream-50 border border-cream-200 rounded-2xl text-sm text-ink-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-cream-100">
                  <button
                    type="button"
                    onClick={() => setEditingOrderAddress(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-cream-100 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-accent px-5 py-2 rounded-xl text-xs font-bold cursor-pointer">
                    Cập nhật địa chỉ
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 6. MODAL ĐÁNH GIÁ ĐƠN HÀNG VÀ ĐỒNG BỘ ĐÁNH GIÁ SẢN PHẨM */}
      <OrderRatingModal
        isOpen={!!ratingOrder}
        onClose={() => setRatingOrder(null)}
        order={ratingOrder}
        onSubmitted={() => setRatingOrder(null)}
      />
    </div>
  );
};
