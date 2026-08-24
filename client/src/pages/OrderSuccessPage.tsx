import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Package,
  MapPin,
  QrCode,
  Copy,
  Check,
  Mail,
  Zap,
  Truck,
  Download,
  Clock,
  Send,
  Loader2,
} from 'lucide-react';
import type { Page, Order } from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { vietqrService, VIETQR_CONFIG } from '../services/vietqr.service';

interface Props {
  orderId: string;
  onNavigate: (page: Page) => void;
}

export function OrderSuccessPage({ orderId, onNavigate }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getOrder(orderId);
        setOrder(data);
        if (data && (data.status === 'shipping' || data.status === 'completed')) {
          setPaymentConfirmed(true);
        }
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const handleCopy = async (field: string, text: string) => {
    const success = await vietqrService.copyText(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleConfirmPaid = async () => {
    if (!order) return;
    setConfirmingPayment(true);
    try {
      // Call backend API to confirm payment and auto-approve
      const res = await api.confirmPayment(order.id);
      if (res && res.order) {
        setOrder(res.order);
      }
      setPaymentConfirmed(true);
    } catch (e) {
      console.error('Failed to auto-confirm payment:', e);
      // Still set local success for smooth simulation
      setPaymentConfirmed(true);
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-pulse">
        <div className="w-16 h-16 bg-cream-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-cream-200 rounded w-1/2 mx-auto mb-2" />
        <div className="h-4 bg-cream-200 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  const isVietQR = order?.payment_method === 'vietqr' || order?.payment_method === 'bank_transfer';
  const qrUrl = order
    ? vietqrService.generateQRUrl({
        amount: order.total_amount,
        orderCode: order.order_code || order.id,
        template: 'compact2',
      })
    : '';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in space-y-8">
      {/* 1. Header Banner */}
      <div className="text-center">
        <div className="w-20 h-20 bg-accent-50 text-accent-500 border border-accent-200/80 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in shadow-xs">
          <CheckCircle2 size={44} />
        </div>
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-2">
          Đặt hàng thành công!
        </h1>
        <p className="text-sm text-ink-500 max-w-md mx-auto">
          Cảm ơn bạn đã mua sắm tại CameraHub. Đơn hàng của bạn đã được tiếp nhận và xử lý tự động vào hệ thống.
        </p>
        {order?.order_code && (
          <div className="inline-block mt-3 px-4 py-1.5 bg-ink-900 text-white rounded-full text-xs font-bold font-mono tracking-wider shadow-2xs">
            MÃ ĐƠN: #{order.order_code}
          </div>
        )}
      </div>

      {/* 2. Email Confirmation Notice Box */}
      {order && (
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900 shadow-2xs">
          <Mail size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-blue-950">Email xác nhận & hóa đơn đã được gửi tự động</p>
            <p className="text-blue-800 leading-relaxed">
              Chi tiết đơn hàng kèm mã VietQR đã được gửi đến hòm thư: <strong className="font-semibold text-blue-950">{order.customer_email}</strong>. Quý khách vui lòng kiểm tra hộp thư đến (hoặc thư rác/spam).
            </p>
          </div>
        </div>
      )}

      {/* 3. VietQR Payment Card (If VietQR Payment Selected) */}
      {isVietQR && order && (
        <div className="bg-white rounded-3xl border-2 border-accent-500/30 p-6 sm:p-8 shadow-lg space-y-6 animate-scale-up">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-accent-50 text-accent-600 flex items-center justify-center border border-accent-200 shadow-2xs">
                <QrCode size={22} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-ink-900">
                  Thanh toán Chuyển khoản VietQR
                </h3>
                <p className="text-xs text-ink-500">
                  Quét mã bằng App ngân hàng bất kỳ để chuyển tiền nhanh Napas 24/7
                </p>
              </div>
            </div>

            {paymentConfirmed ? (
              <span className="px-3 py-1 bg-accent-50 text-accent-700 border border-accent-200 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={14} className="text-accent-600" />
                <span>Đã xác nhận thanh toán</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1">
                <Clock size={14} className="text-amber-500 animate-pulse" />
                <span>Chờ thanh toán</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Dynamic QR Code */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center space-y-3 bg-cream-50/70 p-4 rounded-2xl border border-cream-200">
              <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-cream-200">
                <img
                  src={qrUrl}
                  alt="VietQR Vietcombank"
                  className="w-48 h-48 object-contain rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-ink-600 block">
                  Tự động điền đúng số tiền & mã đơn
                </span>
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={`VietQR-${order.order_code}.png`}
                  className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-bold"
                >
                  <Download size={13} />
                  <span>Tải ảnh QR</span>
                </a>
              </div>
            </div>

            {/* Right: Bank Account Details with 1-Click Copy */}
            <div className="md:col-span-7 space-y-3">
              <div className="space-y-2 text-xs">
                {/* Bank */}
                <div className="p-3 bg-cream-50/60 rounded-xl border border-cream-200">
                  <span className="text-ink-400 text-[11px] block">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-ink-900 text-sm">{VIETQR_CONFIG.bankFullName}</span>
                </div>

                {/* Account Number */}
                <div className="p-3 bg-cream-50/60 rounded-xl border border-cream-200 flex items-center justify-between">
                  <div>
                    <span className="text-ink-400 text-[11px] block">Số tài khoản (STK):</span>
                    <span className="font-mono font-bold text-base text-accent-600">
                      {VIETQR_CONFIG.accountNo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('stk', VIETQR_CONFIG.accountNo)}
                    className="px-3 py-1.5 bg-white hover:bg-cream-100 text-accent-700 rounded-lg border border-cream-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    {copiedField === 'stk' ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Account Name */}
                <div className="p-3 bg-cream-50/60 rounded-xl border border-cream-200">
                  <span className="text-ink-400 text-[11px] block">Chủ tài khoản:</span>
                  <span className="font-bold text-ink-900">{VIETQR_CONFIG.accountName}</span>
                </div>

                {/* Amount */}
                <div className="p-3 bg-cream-50/60 rounded-xl border border-cream-200 flex items-center justify-between">
                  <div>
                    <span className="text-ink-400 text-[11px] block">Số tiền thanh toán:</span>
                    <span className="font-display font-bold text-base text-accent-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('amount', String(order.total_amount))}
                    className="px-3 py-1.5 bg-white hover:bg-cream-100 text-accent-700 rounded-lg border border-cream-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    {copiedField === 'amount' ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Transfer Content */}
                <div className="p-3 bg-accent-50/70 rounded-xl border border-accent-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-accent-700 text-[11px] font-bold block">Nội dung chuyển khoản (bắt buộc):</span>
                    <span className="font-mono font-bold text-sm text-accent-700">
                      {order.order_code || order.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('memo', order.order_code || order.id)}
                    className="px-3 py-1.5 bg-white hover:bg-accent-100 text-accent-700 rounded-lg border border-accent-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    {copiedField === 'memo' ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Shopee-style Auto-Approval Simulation Action */}
              <div className="pt-2">
                {paymentConfirmed ? (
                  <div className="p-3.5 bg-accent-50 border border-accent-200 rounded-2xl flex items-center gap-2.5 text-xs text-accent-900">
                    <CheckCircle2 size={18} className="text-accent-600 shrink-0" />
                    <div>
                      <strong className="block text-accent-700">Đã tự động duyệt đơn hàng trực tuyến!</strong>
                      <span>Đơn hàng đã được chuyển sang bộ phận đóng gói và bàn giao Shipper.</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmPaid}
                    disabled={confirmingPayment}
                    className="w-full btn-accent py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    {confirmingPayment ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Đang đối soát giao dịch VietQR 24/7...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="fill-white" />
                        <span>Tôi đã chuyển khoản thành công (Tự động duyệt đơn)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Order Details Card */}
      {order && (
        <div className="card p-6 md:p-8 space-y-6 bg-white border border-cream-200 rounded-3xl shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-cream-100">
            <div>
              <span className="text-xs text-ink-400 block mb-1">Mã đơn hàng</span>
              <span className="font-display font-bold text-lg text-ink-900">
                #{order.order_code || order.id}
              </span>
            </div>
            <div>
              <span className="text-xs text-ink-400 block mb-1">Tổng thanh toán</span>
              <span className="font-display font-bold text-xl text-accent-600">
                {formatCurrency(order.total_amount)}
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-ink-900 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-accent-500" /> Thông tin giao hàng
              </h3>
              <p className="font-semibold text-ink-900 text-sm">{order.customer_name}</p>
              <p className="text-ink-500">{order.customer_email}</p>
              <p className="text-ink-500">{order.customer_phone}</p>
              <p className="text-ink-700 mt-1 font-medium">{order.shipping_address}, {order.city}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-ink-900 mb-2 flex items-center gap-2">
                <Truck size={16} className="text-accent-500" /> Trạng thái & Phương thức
              </h3>
              <div>
                <span className="text-ink-400 block">Trạng thái đơn hàng:</span>
                <span className="inline-block mt-0.5 px-3 py-1 bg-accent-50 text-accent-700 border border-accent-200 text-xs font-bold rounded-full">
                  {paymentConfirmed || order.status === 'shipping'
                    ? 'Đã duyệt • Đang chuẩn bị hàng'
                    : 'Đang xử lý'}
                </span>
              </div>
              <div>
                <span className="text-ink-400 block">Hình thức thanh toán:</span>
                <span className="font-semibold text-ink-800">
                  {isVietQR
                    ? 'Chuyển khoản VietQR (Vietcombank)'
                    : order.payment_method === 'vnpay'
                    ? 'Cổng VNPAY'
                    : order.payment_method === 'momo'
                    ? 'Ví MoMo'
                    : 'Thanh toán khi nhận hàng (COD)'}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-ink-900 mb-3 flex items-center gap-2">
              <Package size={16} className="text-accent-500" /> Sản phẩm đã đặt
            </h3>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm py-2 border-b border-cream-100 last:border-none"
                >
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-11 h-11 object-cover rounded-xl bg-cream-100 border border-cream-200 shrink-0"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-ink-900">{item.name}</p>
                      <p className="text-xs text-ink-400">Số lượng: x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-ink-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Navigation Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <button
          onClick={() => onNavigate({ name: 'orders' })}
          className="btn-secondary px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <Package size={16} />
          <span>Theo dõi đơn hàng & hành trình</span>
        </button>

        <button
          onClick={() => onNavigate({ name: 'catalog' })}
          className="btn-accent px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>Tiếp tục mua sắm</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
