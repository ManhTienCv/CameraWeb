import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Minus, Plus, ChevronRight, Check, Truck, Shield, RotateCcw, MessageSquare, Info, FileText } from 'lucide-react';
import type { Page, Product, Category } from '../types';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { StarRating } from '../components/StarRating';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { reviewService } from '../services/review.service';

interface Props {
  slug: string;
  onNavigate: (page: Page) => void;
  categories: Category[];
}

export function ProductDetailPage({ slug, onNavigate, categories }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [reviewCount, setReviewCount] = useState(3);
  const { addToCart } = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setQuantity(1);
      setActiveImage(0);
      setAdded(false);
      setActiveTab('desc');

      try {
        const prod = await api.getProductBySlug(slug);
        setProduct(prod);

        if (prod) {
          const stats = reviewService.getProductStats(prod.id);
          setReviewCount(stats.count);

          if (prod.category_id) {
            const categoryObj = categories.find((c) => String(c.id) === String(prod.category_id));
            const catProducts = await api.getProducts({ category: categoryObj?.slug });
            const rel = catProducts
              .filter((p) => String(p.id) !== String(prod.id))
              .slice(0, 4);
            setRelated(rel);
          }
        }
      } catch (e) {
        console.error('Failed to load product detail:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, categories]);

  // Sync review count listener
  useEffect(() => {
    const handleSync = () => {
      if (product) {
        const stats = reviewService.getProductStats(product.id);
        setReviewCount(stats.count);
      }
    };
    window.addEventListener('camerahub_reviews_updated', handleSync);
    return () => window.removeEventListener('camerahub_reviews_updated', handleSync);
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return;
    await addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-cream-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-4 bg-cream-200 rounded w-1/4" />
            <div className="h-8 bg-cream-200 rounded w-3/4" />
            <div className="h-6 bg-cream-200 rounded w-1/3" />
            <div className="h-32 bg-cream-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-ink-500 mb-4">Không tìm thấy sản phẩm camera này</p>
        <button onClick={() => onNavigate({ name: 'catalog' })} className="btn-primary">
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  const discount =
    product.original_price && product.original_price > product.price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0;

  const gallery = [product.image_url, ...(product.gallery || [])].filter(Boolean);
  const category = categories.find((c) => c.id === product.category_id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-400 mb-6 flex-wrap">
        <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-ink-700">Trang chủ</button>
        <ChevronRight size={14} />
        <button onClick={() => onNavigate({ name: 'catalog' })} className="hover:text-ink-700">Sản phẩm</button>
        {category && (
          <>
            <ChevronRight size={14} />
            <button
              onClick={() => onNavigate({ name: 'catalog', categorySlug: category.slug })}
              className="hover:text-ink-700"
            >
              {category.name}
            </button>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-ink-700 truncate">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-3xl overflow-hidden bg-cream-100 mb-4 border border-cream-200">
            <img
              src={gallery[activeImage] || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImage === i ? 'border-accent-500 shadow-xs scale-95' : 'border-cream-200 hover:border-cream-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-ink-500 uppercase tracking-wider">
              {product.brand}
            </span>
            {product.is_new && (
              <span className="px-2.5 py-0.5 bg-ink-900 text-white text-[11px] font-bold rounded-full">
                Mới Ra Mắt
              </span>
            )}
            {discount > 0 && (
              <span className="px-2.5 py-0.5 bg-accent-500 text-white text-[11px] font-bold rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          <h1 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 mb-4">
            {product.name}
          </h1>

          {/* Star rating click to open reviews tab */}
          <button
            onClick={() => setActiveTab('reviews')}
            className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <StarRating rating={product.rating || 4.8} size={18} />
            <span className="text-sm font-semibold text-accent-600 underline">
              {product.rating || 4.8} ({reviewCount} đánh giá thực tế)
            </span>
          </button>

          <div className="flex items-end gap-3 mb-6">
            <span className="font-display font-bold text-3xl lg:text-4xl text-ink-900">
              {formatCurrency(product.price)}
            </span>
            {product.original_price && (
              <span className="text-lg text-ink-400 line-through mb-1">
                {formatCurrency(product.original_price)}
              </span>
            )}
          </div>

          <p className="text-ink-600 leading-relaxed mb-6">{product.description}</p>

          {/* Stock */}
          <div className="flex items-center gap-2 mb-6">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 text-accent-700 text-xs font-bold rounded-full border border-accent-200">
                <Check size={14} className="text-accent-600" />
                <span>Còn hàng trong kho ({product.stock} sản phẩm sẵn sàng giao)</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3.5 py-1 rounded-full border border-rose-200 inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Tạm hết hàng
              </span>
            )}
          </div>

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="mb-6">
              <h3 className="font-display font-semibold text-ink-800 text-sm mb-3">Đặc điểm nổi bật:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-ink-700">
                    <Check size={14} className="text-accent-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-cream-300 rounded-2xl overflow-hidden bg-white">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={product.stock <= 0}
                  className="p-3 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Minus size={16} />
                </button>
                <span className="px-5 font-bold text-ink-900 min-w-[2.5rem] text-center text-sm">
                  {product.stock <= 0 ? 0 : quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={product.stock <= 0}
                  className="p-3 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`flex-1 ${added ? 'btn-accent' : 'btn-primary'} py-3 rounded-2xl font-bold text-sm shadow-sm cursor-pointer disabled:opacity-50`}
              >
                {product.stock <= 0 ? (
                  'Sản phẩm tạm hết hàng'
                ) : added ? (
                  <>
                    <Check size={18} /> Đã thêm vào giỏ
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Thêm vào giỏ hàng
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              handleAddToCart();
              setTimeout(() => onNavigate({ name: 'cart' }), 300);
            }}
            disabled={product.stock === 0}
            className="w-full btn-accent py-3.5 rounded-2xl font-bold text-sm shadow-md mb-8 disabled:opacity-50 cursor-pointer"
          >
            Mua ngay
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-cream-200">
            {[
              { icon: Truck, label: 'Miễn phí vận chuyển' },
              { icon: Shield, label: 'Bảo hành 24 tháng' },
              { icon: RotateCcw, label: 'Đổi trả 30 ngày' },
            ].map((b, i) => (
              <div key={i} className="text-center">
                <b.icon size={20} className="mx-auto text-ink-600 mb-1" />
                <p className="text-[11px] font-medium text-ink-500">{b.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 Main Product Tabs (Matches Image 1) */}
      {/* ========================================================================= */}
      <div className="mb-16">
        <div className="border-b border-cream-200 mb-8">
          <div className="flex items-center gap-8 overflow-x-auto pb-0.5 relative">
            {[
              { id: 'desc', label: 'Mô Tả Sản Phẩm', icon: Info },
              { id: 'specs', label: 'Thông Số Kỹ Thuật Chi Tiết', icon: FileText },
              { id: 'reviews', label: 'Đánh Giá Khách Hàng', icon: MessageSquare, badge: reviewCount },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 text-sm sm:text-base font-bold transition-colors relative whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                    isActive ? 'text-accent-600' : 'text-ink-400 hover:text-ink-700'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-accent-50 text-accent-700 border border-accent-200'
                          : 'bg-cream-100 text-ink-500'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="product-detail-tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-600"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: Mô tả sản phẩm */}
        {activeTab === 'desc' && (
          <div className="card p-8 bg-white border border-cream-200 rounded-3xl space-y-6 animate-fade-in">
            <h3 className="font-display font-bold text-xl text-ink-900">Chi tiết sản phẩm</h3>
            <p className="text-ink-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {product.description}
            </p>
            {product.features && product.features.length > 0 && (
              <div className="pt-4 border-t border-cream-100 space-y-3">
                <h4 className="font-bold text-sm text-ink-800 uppercase tracking-wide">
                  Các tính năng vượt trội:
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {product.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-cream-50/70 border border-cream-200 text-xs font-medium text-ink-800">
                      <Check size={16} className="text-accent-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Thông số kỹ thuật */}
        {activeTab === 'specs' && (
          <div className="card overflow-hidden bg-white border border-cream-200 rounded-3xl animate-fade-in">
            {product.specs && Object.keys(product.specs).length > 0 ? (
              <table className="w-full text-left">
                <tbody>
                  {Object.entries(product.specs).map(([key, val], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-cream-50/60' : 'bg-white'}>
                      <td className="px-6 py-4 text-xs sm:text-sm font-bold text-ink-700 w-1/3 border-b border-cream-100">
                        {key}
                      </td>
                      <td className="px-6 py-4 text-xs sm:text-sm text-ink-600 border-b border-cream-100 font-medium">
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-ink-400 text-sm">
                Thông số kỹ thuật đang được cập nhật
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Đánh giá khách hàng (Matches Image 2, 3, 4) */}
        {activeTab === 'reviews' && (
          <div className="animate-fade-in">
            <ProductReviewsSection product={product} />
          </div>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="pt-8 border-t border-cream-200">
          <h2 className="font-display font-bold text-2xl text-ink-900 mb-6">Sản phẩm tương tự</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} onView={(s) => onNavigate({ name: 'product', slug: s })} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
