import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  Check,
  Loader2,
  MapPin,
  Sparkles,
  Navigation,
  Truck,
  ShieldCheck,
  Zap,
  Building,
  Home,
  Clock,
  QrCode,
  Copy,
  AlertTriangle,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import type { Page, Address } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { MapLocationPicker, type SelectedLocationData } from '../components/MapLocationPicker';
import {
  AVAILABLE_CARRIERS,
  calculateShippingFee,
  FREE_SHIPPING_THRESHOLD,
  type ShippingCarrier,
} from '../services/shipping.service';
import { vietqrService, VIETQR_CONFIG } from '../services/vietqr.service';

interface Props {
  onNavigate: (page: Page) => void;
}

const CHECKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes session

export function CheckoutPage({ onNavigate }: Props) {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 15-minute Session Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(CHECKOUT_DURATION_SECONDS);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    // Reset timer when component mounts
    setTimeLeft(CHECKOUT_DURATION_SECONDS);
    setIsExpired(false);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Form State
  const [form, setForm] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: 'Hà Nội',
    payment: 'vietqr', // Default to VietQR
    carrierId: 'ghn',
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = (timeLeft / CHECKOUT_DURATION_SECONDS) * 100;

  const handleCopy = async (field: string, text: string) => {
    const success = await vietqrService.copyText(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // Load Saved Addresses
  useEffect(() => {
    if (user) {
      (async () => {
        try {
          const addrs = await api.getAddresses();
          setSavedAddresses(addrs || []);
          const def = addrs.find((a) => a.isDefault);
          if (def) {
            setSelectedAddressId(def.id);
            setForm((prev) => ({
              ...prev,
              name: def.recipientName || prev.name,
              phone: def.phone || prev.phone,
              address: def.address || prev.address,
              city: def.city || prev.city,
            }));
          }
        } catch (e) {
          console.error('Error fetching addresses:', e);
        }
      })();
    }
  }, [user]);

  // Map Confirm Callback
  const handleMapConfirm = (data: SelectedLocationData) => {
    setSelectedAddressId(null);
    setForm((prev) => ({
      ...prev,
      city: data.city || prev.city,
      address: data.detailAddress
        ? `${data.detailAddress}, ${data.administrativeArea}`
        : data.fullAddress,
    }));
  };

  const handleSelectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setForm((prev) => ({
      ...prev,
      name: addr.recipientName || prev.name,
      phone: addr.phone || prev.phone,
      address: addr.address || prev.address,
      city: addr.city || prev.city,
    }));
  };

  // Calculate Shipping with Service
  const shippingCalculation = calculateShippingFee({
    carrierId: form.carrierId,
    subtotal,
    province: form.city,
  });

  const shippingFee = shippingCalculation.fee;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);

    try {
      const orderItems = items.map((i) => ({
        product_id: i.product_id,
        name: i.product?.name || 'Sản phẩm Camera',
        price: i.product?.price || 0,
        quantity: i.quantity,
        image_url: i.product?.image_url || '',
      }));

      const order = await api.createOrder({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        shipping_address: form.address,
        city: form.city,
        payment_method: form.payment,
        items: orderItems,
      });

      await clearCart();
      onNavigate({ name: 'order-success', orderId: order.id });
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Không thể tạo đơn hàng. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-3">
          Không có sản phẩm để thanh toán
        </h1>
        <p className="text-ink-400 mb-8">Giỏ hàng của bạn đang trống.</p>
        <button onClick={() => onNavigate({ name: 'catalog' })} className="btn-primary">
          Khám phá sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-400 mb-4">
        <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-ink-700">
          Trang chủ
        </button>
        <ChevronRight size={14} />
        <button onClick={() => onNavigate({ name: 'cart' })} className="hover:text-ink-700">
          Giỏ hàng
        </button>
        <ChevronRight size={14} />
        <span className="text-ink-700">Thanh toán</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink-900">Thanh toán đơn hàng</h1>
          <p className="text-xs text-ink-500 mt-1">Hoàn tất thông tin giao hàng và chọn hình thức thanh toán an toàn</p>
        </div>

        {/* 15-min Countdown Timer Header Badge */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-cream-200 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Flame size={18} className="text-amber-500 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">Thời gian giữ hàng</div>
            <div className="font-display font-bold text-base text-accent-600 flex items-center gap-1.5">
              <Clock size={14} className="text-accent-500" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Urgency Progress Bar */}
      <div className="mb-8 bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs text-amber-900">
          <span className="font-semibold flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            Giỏ hàng của bạn đang được giữ chỗ trong 15 phút
          </span>
          <span className="font-bold font-mono">{formattedTime}</span>
        </div>
        <div className="w-full bg-amber-200/70 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-amber-800/80">
          Nếu cần chọn thêm sản phẩm, bạn có thể quay lại giỏ hàng. Khi quay lại trang thanh toán, thời gian 15:00 sẽ tự động bắt đầu lại từ đầu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Information & Carriers */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Saved Addresses Selection (if available) */}
          {savedAddresses.length > 0 && (
            <div className="card p-6 space-y-3">
              <h2 className="font-display font-semibold text-lg text-ink-800 flex items-center gap-2">
                <MapPin size={18} className="text-accent-500" />
                <span>Sổ địa chỉ đã lưu của bạn</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-accent-500 bg-accent-50/40 shadow-2xs'
                        : 'border-cream-200 hover:border-cream-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 bg-cream-100 text-ink-800 rounded-md text-[11px] font-bold">
                        {addr.label || 'Nhà riêng'}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-ink-900 truncate">{addr.recipientName} - {addr.phone}</p>
                    <p className="text-xs text-ink-500 truncate mt-0.5">{addr.address}, {addr.city}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Shipping info with Interactive Map trigger */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-ink-800">
                Thông tin giao hàng
              </h2>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent-50 text-accent-700 border border-accent-200 rounded-full text-xs font-bold hover:bg-accent-100 transition-colors cursor-pointer shadow-2xs"
              >
                <Navigation size={13} className="text-accent-500" />
                <span>Chọn trên Bản Đồ</span>
              </button>
            </div>

            {/* Smart Map Banner Card (Matches Image 1) */}
            <div className="p-4 bg-accent-50/60 border border-accent-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-900">
                    Chọn vị trí trực tiếp qua Bản đồ OpenStreetMap / Google Maps
                  </h4>
                  <p className="text-[11px] text-accent-700 mt-0.5">
                    Kéo ghim định vị toạ độ GPS để lấy tên đường & số nhà tự động
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <MapPin size={13} />
                <span>Mở Bản Đồ</span>
              </button>
            </div>

            {/* Form Inputs */}
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Họ và tên người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Nguyễn Văn Phục"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Email thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Số điện thoại nhận hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                  placeholder="0909123456"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Tỉnh / Thành phố <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Hà Nội hoặc TP. Hồ Chí Minh"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường, phường/xã) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Số 10 Đường Cầu Giấy, Phường Dịch Vọng..."
                />
              </div>
            </div>
          </div>

          {/* 3. Shipping Carrier Selection (4 Carriers) */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-ink-800 flex items-center gap-2">
                <Truck size={18} className="text-accent-500" />
                <span>Đơn vị vận chuyển</span>
              </h2>
              {subtotal >= FREE_SHIPPING_THRESHOLD && (
                <span className="px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-bold border border-accent-200">
                  🎉 Miễn phí vận chuyển đơn &gt; 1.000.000đ
                </span>
              )}
            </div>

            <div className="space-y-3">
              {AVAILABLE_CARRIERS.map((carrier) => {
                const calc = calculateShippingFee({
                  carrierId: carrier.id,
                  subtotal,
                  province: form.city,
                });
                const isSelected = form.carrierId === carrier.id;

                return (
                  <label
                    key={carrier.id}
                    className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent-500 bg-accent-50/40 shadow-xs'
                        : 'border-cream-200 hover:border-cream-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="carrier"
                        value={carrier.id}
                        checked={isSelected}
                        onChange={() => setForm({ ...form, carrierId: carrier.id })}
                        className="w-4 h-4 text-accent-500 focus:ring-accent-400 mt-1 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-ink-900">{carrier.name}</p>
                          {carrier.badgeText && (
                            <span className="px-2 py-0.5 bg-cream-100 text-ink-700 text-[10px] font-bold rounded-full border border-cream-300">
                              {carrier.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5">{carrier.tagline}</p>
                        <p className="text-[11px] text-accent-600 font-semibold mt-1 flex items-center gap-1">
                          <Clock size={12} />
                          <span>Thời gian giao dự kiến: {carrier.estimatedTime}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {calc.isFree ? (
                        <div>
                          <span className="text-xs text-ink-400 line-through mr-1.5">
                            {formatCurrency(calc.originalFee)}
                          </span>
                          <span className="font-bold text-sm text-accent-600">Miễn phí</span>
                        </div>
                      ) : (
                        <span className="font-bold text-sm text-ink-900">
                          {formatCurrency(calc.fee)}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. Payment Method */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-ink-800 flex items-center gap-2">
                <QrCode size={18} className="text-accent-500" />
                <span>Phương thức thanh toán</span>
              </h2>
              <span className="text-xs font-semibold text-accent-700 bg-accent-50 border border-accent-200 px-2.5 py-0.5 rounded-full">
                Miễn phí giao dịch
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'vietqr',
                  label: 'Chuyển khoản VietQR (Napas 24/7 - Khuyên dùng)',
                  desc: 'Quét mã QR bằng App mọi ngân hàng (VCB, MB, Techcombank, MoMo...). Tự động duyệt đơn.',
                  badge: 'Khuyên dùng • Xử lý tức thì',
                },
                {
                  id: 'cod',
                  label: 'Thanh toán khi nhận hàng (COD)',
                  desc: 'Kiểm tra máy ảnh và thanh toán tiền mặt khi shipper giao tận nơi',
                },
                {
                  id: 'vnpay',
                  label: 'Cổng VNPAY (ATM / Visa / QR Code)',
                  desc: 'Thanh toán bảo mật trực tuyến qua VNPAY an toàn 100%',
                },
                {
                  id: 'momo',
                  label: 'Ví điện tử MoMo',
                  desc: 'Quét mã QR qua ứng dụng MoMo tiện lợi',
                },
              ].map((method) => {
                const isSelected = form.payment === method.id;
                return (
                  <div
                    key={method.id}
                    className={`rounded-2xl border-2 transition-all overflow-hidden ${
                      isSelected
                        ? 'border-accent-500 bg-accent-50/40 shadow-xs'
                        : 'border-cream-200 hover:border-cream-300 bg-white'
                    }`}
                  >
                    <label className="flex items-start gap-3 p-4 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={isSelected}
                        onChange={(e) => setForm({ ...form, payment: e.target.value })}
                        className="w-4 h-4 text-accent-500 focus:ring-accent-400 mt-1 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-ink-900">{method.label}</p>
                          {method.badge && (
                            <span className="px-2 py-0.5 bg-accent-50 text-accent-700 text-[10px] font-bold rounded-full border border-accent-200">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5">{method.desc}</p>
                      </div>
                    </label>

                    {/* Inline VietQR Account Info Details Box */}
                    {isSelected && method.id === 'vietqr' && (
                      <div className="px-4 pb-4 pt-1">
                        <div className="bg-white rounded-xl border border-accent-200/90 p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-cream-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs font-bold text-ink-900">
                                Cổng VietQR {VIETQR_CONFIG.bankName} (Tự động duyệt online)
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-accent-600 font-bold bg-accent-50 px-2 py-0.5 rounded-md border border-accent-200/60">
                              Napas 24/7
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                            <div className="bg-cream-50/70 p-2.5 rounded-xl border border-cream-200">
                              <span className="text-ink-400 text-[11px] block">Ngân hàng thụ hưởng:</span>
                              <strong className="text-ink-900 font-semibold">{VIETQR_CONFIG.bankFullName}</strong>
                            </div>

                            <div className="bg-cream-50/70 p-2.5 rounded-xl border border-cream-200 flex items-center justify-between">
                              <div>
                                <span className="text-ink-400 text-[11px] block">Số tài khoản:</span>
                                <strong className="text-accent-600 font-mono text-sm font-bold">
                                  {VIETQR_CONFIG.accountNo}
                                </strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy('stk', VIETQR_CONFIG.accountNo)}
                                className="px-2.5 py-1 bg-white hover:bg-cream-100 text-accent-700 rounded-lg border border-cream-200 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                              >
                                {copiedField === 'stk' ? (
                                  <>
                                    <Check size={12} className="text-emerald-600" />
                                    <span className="text-emerald-700">Đã chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Sao chép</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="bg-cream-50/70 p-2.5 rounded-xl border border-cream-200">
                              <span className="text-ink-400 text-[11px] block">Chủ tài khoản:</span>
                              <strong className="text-ink-900 font-bold">{VIETQR_CONFIG.accountName}</strong>
                            </div>

                            <div className="bg-cream-50/70 p-2.5 rounded-xl border border-cream-200">
                              <span className="text-ink-400 text-[11px] block">Số tiền thanh toán:</span>
                              <strong className="text-accent-600 font-bold text-sm font-display">
                                {formatCurrency(total)}
                              </strong>
                            </div>
                          </div>

                          <div className="text-[11px] text-ink-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 flex items-start gap-2">
                            <Zap size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              Mã QR thanh toán chuẩn Napas 24/7 sẽ xuất hiện ngay sau khi bấm "Xác nhận đặt hàng". Hệ thống sẽ tự động đối soát và kích hoạt đơn hàng trong 3 giây.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-5">
            <h2 className="font-display font-semibold text-lg text-ink-800">
              Đơn hàng của bạn
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-cream-100 shrink-0 border border-cream-200">
                    <img
                      src={item.product?.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-ink-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-[11px] text-ink-400">Số lượng: {item.quantity}</p>
                  </div>
                  <p className="text-xs font-bold text-ink-900 shrink-0">
                    {formatCurrency((item.product?.price || 0) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-cream-100 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-500 font-medium">Tạm tính:</span>
                <span className="font-bold text-ink-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-500 font-medium">Đơn vị vận chuyển:</span>
                <span className="font-semibold text-ink-700">{shippingCalculation.carrier.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-500 font-medium">Phí vận chuyển:</span>
                {shippingCalculation.isFree ? (
                  <span className="font-bold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-md border border-accent-200/60">
                    Miễn phí
                  </span>
                ) : (
                  <span className="font-bold text-ink-900">
                    {formatCurrency(shippingCalculation.fee)}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-cream-100 pt-4">
              <div className="flex justify-between items-end mb-1">
                <span className="font-bold text-sm text-ink-800">Tổng thanh toán:</span>
                <span className="font-display font-bold text-2xl text-accent-600">
                  {formatCurrency(total)}
                </span>
              </div>
              <p className="text-[11px] text-ink-400 text-right">Đã bao gồm VAT & phí bảo hiểm thiết bị</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-accent py-3.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Đang tạo đơn hàng...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Check size={18} />
                  <span>Xác nhận đặt hàng</span>
                </div>
              )}
            </button>

            {/* Trust badge */}
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-ink-500 font-medium border-t border-cream-100">
              <ShieldCheck size={15} className="text-accent-500" />
              <span>Bảo hành chính hãng & đồng kiểm khi nhận hàng</span>
            </div>
          </div>
        </div>
      </form>

      {/* Interactive Map Picker Modal */}
      <MapLocationPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
      />

      {/* 15-Minute Session Expired Modal */}
      {isExpired &&
        createPortal(
          <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-cream-200 animate-scale-up">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>

              <div>
                <h3 className="font-display font-bold text-xl text-ink-900">
                  Phiên thanh toán đã hết hạn!
                </h3>
                <p className="text-xs text-ink-500 mt-1 leading-relaxed">
                  Thời gian giữ đơn hàng (15 phút) đã kết thúc nhằm đảm bảo số lượng tồn kho chính xác cho khách hàng khác. Vui lòng quay lại giỏ hàng để cập nhật và thanh toán lại.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate({ name: 'cart' })}
                  className="w-full btn-accent py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ArrowLeft size={16} />
                  <span>Quay lại giỏ hàng</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
