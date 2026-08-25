import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Star,
  Camera,
  Check,
  Plus,
  Loader2,
  Package,
} from 'lucide-react';
import { reviewService } from '../services/review.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_code: string;
    items: Array<{
      categoryTag?: string;
      name: string;
      quantity: number;
      price: number;
      image_url?: string;
    }>;
  } | null;
  onSubmitted?: () => void;
}

const RATING_FEEDBACK: Record<number, string> = {
  5: 'Rất Hài Lòng (5/5)',
  4: 'Hài Lòng (4/5)',
  3: 'Bình Thường (3/5)',
  2: 'Chưa Hài Lòng (2/5)',
  1: 'Rất Tệ (1/5)',
};

export function OrderRatingModal({ isOpen, onClose, order, onSubmitted }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const firstItem = order.items?.[0];

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 3 - attachedImages.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachedImages((prev) => [...prev, String(event.target!.result)].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.warning('Vui lòng nhập nhận xét chi tiết của bạn.');
      return;
    }

    setSubmitting(true);
    try {
      // Save review to reviewService
      reviewService.addReview({
        productId: 'all', // matches the store catalog
        orderId: order.order_code,
        userName: user?.fullName || 'Khách hàng CameraHub',
        rating,
        variant: firstItem?.name ? `${firstItem.name}` : 'Chính Hãng',
        comment: comment.trim(),
        images: attachedImages,
      });

      // Mark order as reviewed
      reviewService.markOrderAsReviewed(order.order_code);
      toast.success('Cảm ơn bạn đã gửi đánh giá sản phẩm!');

      if (onSubmitted) {
        onSubmitted();
      }

      onClose();
      setComment('');
      setAttachedImages([]);
    } catch (err) {
      console.error('Rating failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden my-auto cursor-default animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Matches Image 5) */}
        <div className="px-6 pt-5 pb-4 border-b border-cream-100 flex items-start justify-between bg-cream-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <h2 className="font-display font-bold text-lg sm:text-xl text-ink-900 leading-tight">
                Đánh Giá Đơn Hàng {order.order_code}
              </h2>
            </div>
            <p className="text-xs text-ink-500 mt-1">
              Chia sẻ cảm nhận về thiết bị sau khi nhận hàng để giúp cộng đồng người chơi máy ảnh
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-200 text-ink-400 hover:text-ink-900 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Product Preview Box (Matches Image 5) */}
          {firstItem && (
            <div className="p-3.5 bg-accent-50/50 border border-accent-200/80 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-cream-100 border border-cream-200 shrink-0">
                  {firstItem.image_url ? (
                    <img
                      src={firstItem.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-400">
                      <Package size={20} />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-accent-700 uppercase tracking-wide">
                    SẢN PHẨM ĐÁNH GIÁ:
                  </span>
                  <h4 className="text-xs font-bold text-ink-900 truncate max-w-[260px]">
                    {firstItem.name}
                  </h4>
                </div>
              </div>
              <span className="text-xs font-bold text-ink-500 shrink-0">
                x{firstItem.quantity}
              </span>
            </div>
          )}

          {/* Quality Rating (Matches Image 5) */}
          <div>
            <label className="block text-xs font-bold text-ink-800 mb-2">
              Chất lượng sản phẩm:
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                  >
                    <Star
                      size={26}
                      className={
                        s <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                          : 'text-cream-300'
                      }
                    />
                  </button>
                ))}
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1">
                <span>⭐</span>
                <span>{RATING_FEEDBACK[hoverRating || rating]}</span>
              </span>
            </div>
          </div>

          {/* Detailed Review Textarea */}
          <div>
            <label className="block text-xs font-bold text-ink-700 mb-1.5">
              Nhận xét chi tiết:
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cảm giác cầm nắm, chất lượng ảnh, quay video, thời gian giao hàng..."
              className="input-field resize-none text-xs"
            />
          </div>

          {/* Photo Attachment (Max 3) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-ink-700">
                <Camera size={14} className="text-accent-500" />
                <span>Hình ảnh mở hộp / thực tế (Tối đa 3 ảnh):</span>
              </label>
              <span className="text-[11px] font-bold text-ink-400">
                {attachedImages.length}/3 ảnh
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {attachedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 rounded-2xl overflow-hidden border border-cream-200 group shadow-xs"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 w-4 h-4 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {attachedImages.length < 3 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-accent-300 hover:border-accent-500 bg-accent-50/40 hover:bg-accent-50 flex flex-col items-center justify-center gap-1 text-accent-700 transition-all cursor-pointer"
                  >
                    <Plus size={16} />
                    <span className="text-[9px] font-bold">Thêm ảnh</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cream-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-bold text-ink-600 hover:bg-cream-100 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Gửi Đánh Giá Ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
