import React, { useEffect, useState } from 'react';
import { ArrowRight, Truck, Shield, Headphones, CreditCard, Camera, Aperture, Video, Circle, Package } from 'lucide-react';
import type { Page, Product, Category } from '../types';
import { ProductCard } from '../components/ProductCard';
import { api } from '../lib/api';

interface Props {
  onNavigate: (page: Page) => void;
  categories: Category[];
}

const iconMap: Record<string, typeof Camera> = {
  Camera,
  Aperture,
  Video,
  Circle,
  Package,
};

export function HomePage({ onNavigate, categories }: Props) {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [feat, news] = await Promise.all([
          api.getFeaturedProducts('featured'),
          api.getFeaturedProducts('new'),
        ]);
        setFeatured(feat || []);
        setNewProducts(news || []);
      } catch (e) {
        console.error('Error fetching home products:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-100 via-cream-50 to-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <h1 className="font-display font-bold text-4xl lg:text-6xl text-ink-900 leading-tight mb-6">
                Bắt trọn khoảnh khắc,<br />
                <span className="text-accent-500">tạo nên nghệ thuật</span>
              </h1>
              <p className="text-lg text-ink-500 leading-relaxed mb-8 max-w-lg">
                Khám phá bộ sưu tập máy ảnh, ống kính và phụ kiện chuyên nghiệp từ các thương hiệu
                hàng đầu thế giới. Canon, Nikon, Sony, Fujifilm, DJI và hơn thế nữa.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => onNavigate({ name: 'catalog' })}
                  className="btn-primary"
                >
                  Khám phá sản phẩm
                  <ArrowRight size={18} />
                </button>
                <button
                  onClick={() => onNavigate({ name: 'catalog', categorySlug: 'may-anh-mirrorless' })}
                  className="btn-secondary"
                >
                  Máy ảnh Mirrorless
                </button>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000"
                  alt="Máy ảnh chuyên nghiệp"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="bg-white border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn hàng toàn quốc' },
              { icon: Shield, title: 'Bảo hành chính hãng', desc: 'Lên đến 24 tháng' },
              { icon: Headphones, title: 'Hỗ trợ 24/7', desc: 'Tư vấn chuyên nghiệp' },
              { icon: CreditCard, title: 'Thanh toán linh hoạt', desc: 'VNPAY / MoMo / COD' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-11 h-11 bg-cream-100 rounded-xl flex items-center justify-center shrink-0">
                  <f.icon size={20} className="text-ink-700" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink-800">{f.title}</p>
                  <p className="text-xs text-ink-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 mb-2">
              Danh mục nổi bật
            </h2>
            <p className="text-ink-400">Khám phá theo loại sản phẩm</p>
          </div>
          <button
            onClick={() => onNavigate({ name: 'catalog' })}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:gap-2.5 transition-all"
          >
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon || 'Camera'] || Camera;
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate({ name: 'catalog', categorySlug: cat.slug })}
                className="group card p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto bg-cream-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-accent-500 transition-colors duration-300">
                  <Icon size={24} className="text-ink-700 group-hover:text-white transition-colors" />
                </div>
                <p className="font-display font-semibold text-sm text-ink-800">{cat.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 mb-2">
              Sản phẩm nổi bật
            </h2>
            <p className="text-ink-400">Được đánh giá cao nhất bởi khách hàng</p>
          </div>
          <button
            onClick={() => onNavigate({ name: 'catalog' })}
            className="hidden md:flex items-center gap-1.5 text-sm font-medium text-accent-500 hover:gap-2.5 transition-all"
          >
            Xem tất cả <ArrowRight size={16} />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="aspect-square bg-cream-200 rounded-xl mb-4" />
                <div className="h-3 bg-cream-200 rounded mb-2" />
                <div className="h-3 bg-cream-200 rounded w-2/3 mb-4" />
                <div className="h-4 bg-cream-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onView={(slug) => onNavigate({ name: 'product', slug })} />
            ))}
          </div>
        )}
      </section>

      {/* Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden bg-ink-900 rounded-3xl">
          <div className="absolute inset-0 opacity-20">
            <img
              src="https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&q=80&w=1000"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative px-8 py-16 lg:px-16 lg:py-20 text-center max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-accent-500 text-white text-xs font-semibold rounded-full mb-4">
              ƯU ĐÃI KHỦNG THÁNG 8
            </span>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-cream-50 mb-4">
              Giảm đến 15% cho Máy ảnh & Ống kính Sony, Canon
            </h2>
            <p className="text-cream-200 mb-8">
              Cơ hội sở hữu máy ảnh chuyên nghiệp giá cực ưu đãi. Số lượng quà tặng có hạn!
            </p>
            <button
              onClick={() => onNavigate({ name: 'catalog', categorySlug: 'may-anh-mirrorless' })}
              className="btn-accent"
            >
              Mua ngay
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-ink-900 mb-2">
              Hàng mới về
            </h2>
            <p className="text-ink-400">Các sản phẩm vừa được ra mắt</p>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="aspect-square bg-cream-200 rounded-xl mb-4" />
                <div className="h-3 bg-cream-200 rounded mb-2" />
                <div className="h-3 bg-cream-200 rounded w-2/3 mb-4" />
                <div className="h-4 bg-cream-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {newProducts.map((p) => (
              <ProductCard key={p.id} product={p} onView={(slug) => onNavigate({ name: 'product', slug })} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
