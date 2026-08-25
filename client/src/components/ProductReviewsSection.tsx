import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Camera,
  Check,
  ThumbsUp,
  X,
  Plus,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import type { Product, Review } from '../types';
import { reviewService } from '../services/review.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface Props {
  product: Product;
}

const RATING_LABELS: Record<number, string> = {
  5: 'Tuyệt vời (5/5)',
  4: 'Rất tốt (4/5)',
  3: 'Bình thường (3/5)',
  2: 'Chưa hài lòng (2/5)',
  1: 'Kém (1/5)',
};

export function ProductReviewsSection({ product }: Props) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState(reviewService.getProductStats(product.id));
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'images'>('all');

  // Form State
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState(user?.fullName || '');
  const [variant, setVariant] = useState('Body Only • Chính Hãng');
  const [comment, setComment] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const loadData = () => {
    const data = reviewService.getReviewsByProduct(product.id);
    setReviews(data);
    setStats(reviewService.getProductStats(product.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('camerahub_reviews_updated', handleUpdate);
    return () => window.removeEventListener('camerahub_reviews_updated', handleUpdate);
  }, [product.id]);

  useEffect(() => {
    if (user?.fullName && !userName) {
      setUserName(user.fullName);
    }
  }, [user]);

  // Handle Photo Upload
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

  // Submit Review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.warning('Vui lòng nhập nội dung nhận xét của bạn.');
      return;
    }

    reviewService.addReview({
      productId: product.id,
      userName: userName || user?.fullName || 'Khách hàng CameraHub',
      rating,
      variant: variant || 'Chính Hãng',
      comment: comment.trim(),
      images: attachedImages,
    });

    // Reset Form
    setIsWriting(false);
    setComment('');
    setAttachedImages([]);
    setRating(5);
    toast.success('Đã gửi đánh giá sản phẩm thành công!');
    loadData();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter Reviews
  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'images') return r.images && r.images.length > 0;
    return String(Math.round(r.rating || 5)) === selectedFilter;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* 1. Review Summary Card (Matches Image 2 & 4) */}
      <div className="card p-6 sm:p-8 bg-white border border-cream-200 rounded-3xl shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Overall Rating Score */}
          <div className="lg:col-span-4 text-center lg:text-left lg:border-r lg:border-cream-200 lg:pr-8">
            <div className="flex items-baseline justify-center lg:justify-start gap-2 mb-1.5">
              <span className="font-display font-black text-5xl sm:text-6xl text-ink-900 tracking-tight">
                {stats.average.toFixed(1)}
              </span>
              <span className="text-xl font-bold text-ink-400">/ 5</span>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center lg:justify-start gap-1 text-amber-400 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    star <= Math.round(stats.average)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-cream-300'
                  }
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-ink-500">
              Dựa trên {stats.count} lượt đánh giá thực tế
            </p>
          </div>

          {/* Middle: Rating Breakdown Bars */}
          <div className="lg:col-span-5 space-y-1.5 px-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const percent = stats.breakdownPercent[star] || 0;
              const count = stats.breakdown[star] || 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-10 font-bold text-ink-700 text-right">{star} sao</span>
                  <div className="flex-1 h-2.5 bg-cream-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-10 font-medium text-ink-400 text-right">{percent}%</span>
                </div>
              );
            })}
          </div>

          {/* Right: Write Review Button */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end">
            <button
              onClick={() => setIsWriting(!isWriting)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95 ${
                isWriting
                  ? 'bg-ink-800 hover:bg-ink-900 text-white'
                  : 'bg-accent-500 hover:bg-accent-600 text-white shadow-accent-500/20'
              }`}
            >
              <MessageSquare size={16} />
              <span>{isWriting ? 'Đóng Form Đánh Giá' : 'Viết Đánh Giá Của Bạn'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Inline Review Form (Matches Image 3 & 4) */}
      {isWriting && (
        <div className="bg-white border-2 border-accent-500/30 rounded-3xl p-6 sm:p-8 shadow-lg animate-scale-up space-y-5">
          <div className="border-b border-cream-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-xs font-bold mb-1.5 border border-accent-200">
              <Sparkles size={13} className="text-accent-500" />
              <span>Chia Sẻ Đánh Giá Thực Tế</span>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-ink-900">
              Gửi nhận xét về sản phẩm: <span className="text-accent-600">{product.name}</span>
            </h3>
            <p className="text-xs text-ink-500 mt-0.5">
              Đánh giá của bạn sẽ giúp cộng đồng người yêu nhiếp ảnh lựa chọn đúng thiết bị phù hợp
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-5">
            {/* Interactive Rating Stars */}
            <div>
              <label className="block text-xs font-bold text-ink-800 mb-2">
                Mức độ hài lòng của bạn:
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-cream-300'
                        }
                      />
                    </button>
                  ))}
                </div>
                <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1">
                  <span>⭐</span>
                  <span>{RATING_LABELS[hoverRating || rating]}</span>
                </span>
              </div>
            </div>

            {/* Name and Variant Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1.5">
                  Họ và tên của bạn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1.5">
                  Phân loại đã mua:
                </label>
                <input
                  type="text"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  placeholder="Ví dụ: Body Only, Kit 24-70mm..."
                  className="input-field"
                />
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1.5">
                Nội dung nhận xét & trải nghiệm thực tế <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ chất ảnh, khả năng lấy nét, khử nhiễu ISO, cảm giác cầm nắm, đóng gói giao hàng..."
                className="input-field resize-none"
              />
            </div>

            {/* Image Attachment (Max 3) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-ink-700">
                  <Camera size={15} className="text-accent-500" />
                  <span>Đính kèm hình ảnh thực tế / đập hộp (Tối đa 3 ảnh):</span>
                </label>
                <span className="text-[11px] font-bold text-ink-400">
                  {attachedImages.length}/3 ảnh
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Thumbnails */}
                {attachedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border border-cream-200 group shadow-xs"
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Add Photo Button */}
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
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-accent-300 hover:border-accent-500 bg-accent-50/40 hover:bg-accent-50 flex flex-col items-center justify-center gap-1 text-accent-700 transition-all cursor-pointer"
                    >
                      <Plus size={18} />
                      <span className="text-[10px] font-bold">Thêm ảnh</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-100">
              <button
                type="button"
                onClick={() => setIsWriting(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-ink-600 hover:bg-cream-100 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-7 py-2.5 rounded-full text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Check size={16} />
                <span>Gửi Đánh Giá Ngay</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Filter Pills with Shared Layout Capsule and Zero Layout Shift */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-ink-600 mr-1">Lọc theo:</span>
        {[
          { id: 'all', label: `Tất cả (${stats.count})` },
          { id: '5', label: `5 ⭐ (${stats.breakdown[5] || 0})` },
          { id: '4', label: `4 ⭐ (${stats.breakdown[4] || 0})` },
          { id: '3', label: `3 ⭐ (${stats.breakdown[3] || 0})` },
          { id: '2', label: `2 ⭐ (${stats.breakdown[2] || 0})` },
          { id: '1', label: `1 ⭐ (${stats.breakdown[1] || 0})` },
          { id: 'images', icon: Camera, label: `Có hình ảnh (${stats.withImagesCount})` },
        ].map((item) => {
          const isActive = selectedFilter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedFilter(item.id as any)}
              className={`relative px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                isActive
                  ? 'border-accent-500 text-white shadow-xs'
                  : 'border-cream-200 text-ink-700 hover:border-cream-300 hover:bg-cream-50 bg-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="review-filter-pill-capsule"
                  className="absolute inset-0 bg-accent-500 rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {item.icon && <item.icon size={13} className="relative z-10" />}
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Review Cards List (Matches Image 2) */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-cream-200 text-center space-y-2">
            <MessageSquare size={36} className="text-cream-300 mx-auto mb-1" />
            <p className="font-bold text-sm text-ink-800">Chưa có đánh giá nào trong mục này</p>
            <p className="text-xs text-ink-400">Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm này!</p>
          </div>
        ) : (
          <>
            <div className="text-xs text-ink-500 font-medium">
              Hiển thị <strong className="text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
              <strong className="text-ink-900">{Math.min(currentPage * itemsPerPage, filteredReviews.length)}</strong> trên tổng số{' '}
              <strong className="text-ink-900">{filteredReviews.length}</strong> đánh giá
            </div>

            {paginatedReviews.map((rev) => {
              const isVoted = reviewService.isReviewHelpfulVoted(rev.id);
              return (
                <div
                  key={rev.id}
                  className="card p-6 bg-white border border-cream-200 rounded-3xl space-y-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  {/* User Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* User Avatar Initial */}
                      <div className="w-10 h-10 rounded-2xl bg-accent-100 text-accent-700 font-display font-bold text-base flex items-center justify-center shrink-0 border border-accent-200/60 shadow-2xs">
                        {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-ink-900">{rev.userName}</h4>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-50 text-accent-700 border border-accent-200/80 rounded-md text-[10px] font-bold">
                              <ShieldCheck size={11} className="text-accent-600" />
                              <span>Đã mua hàng tại CameraHub</span>
                            </span>
                          )}
                        </div>

                        {/* Stars & Meta */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-ink-400">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                className={
                                  s <= Math.round(rev.rating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-cream-300'
                                }
                              />
                            ))}
                          </div>
                          <span>•</span>
                          <span>{rev.createdAt}</span>
                          {rev.variant && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-ink-600">Phân loại: {rev.variant}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Helpful Button */}
                    <button
                      onClick={() => {
                        reviewService.toggleHelpful(rev.id);
                        loadData();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                        isVoted
                          ? 'bg-accent-50 border-accent-300 text-accent-700'
                          : 'border-cream-200 text-ink-500 hover:bg-cream-100'
                      }`}
                    >
                      <ThumbsUp size={13} className={isVoted ? 'text-accent-500 fill-accent-500' : ''} />
                      <span>Hữu ích ({rev.helpfulCount || 0})</span>
                    </button>
                  </div>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-ink-700 leading-relaxed font-normal">
                    {rev.comment}
                  </p>

                  {/* Attached Images */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex items-center gap-2.5 pt-1 overflow-x-auto pb-1">
                      {rev.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setLightboxImage(img)}
                          className="w-20 h-20 rounded-2xl overflow-hidden border border-cream-200 cursor-zoom-in hover:opacity-90 hover:scale-105 transition-all shrink-0 shadow-2xs"
                        >
                          <img src={img} alt="Đánh giá" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Review Pagination Controls (10 reviews / page) */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-cream-200 rounded-xl text-xs font-bold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  ‹ Đánh giá trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-accent-500 text-white shadow-xs'
                        : 'bg-white text-ink-700 border border-cream-200 hover:border-cream-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-cream-200 rounded-xl text-xs font-bold text-ink-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                >
                  Đánh giá sau ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Image Lightbox Modal */}
      {lightboxImage &&
        createPortal(
          <div
            className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-fade-in"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
              <img src={lightboxImage} alt="" className="max-w-full max-h-[85vh] object-contain" />
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute top-3 right-3 w-9 h-9 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
