import React, { useState, useEffect } from 'react';
import { Camera, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import type { Page, Category } from '../types';
import { getStoreSettings, type StoreSettings } from '../lib/settings';

interface Props {
  onNavigate: (page: Page) => void;
  categories: Category[];
}

export function Footer({ onNavigate, categories }: Props) {
  const [settings, setSettings] = useState<StoreSettings>(getStoreSettings());

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getStoreSettings());
    };
    window.addEventListener('store_settings_updated', handleUpdate);
    return () => window.removeEventListener('store_settings_updated', handleUpdate);
  }, []);

  return (
    <footer className="bg-ink-900 text-cream-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              <span className="font-display font-bold text-2xl text-cream-50">
                {settings.storeName || 'CameraHub'}
              </span>
            </div>
            <p className="text-sm text-ink-300 max-w-sm leading-relaxed">
              Hệ thống bán lẻ máy ảnh, ống kính và phụ kiện máy ảnh chính hãng hàng đầu Việt Nam.
              Cam kết chất lượng chuẩn quốc tế, bảo hành tận tâm.
            </p>
            <div className="space-y-2 pt-2 text-sm text-ink-300">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-accent-500 shrink-0" />
                <span>Hotline: {settings.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-accent-500 shrink-0" />
                <span>Email: {settings.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-accent-500 shrink-0" />
                <span>{settings.address}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-display font-semibold text-cream-50 text-sm mb-4">Danh mục sản phẩm</h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onNavigate({ name: 'catalog', categorySlug: cat.slug })}
                    className="hover:text-accent-400 transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="font-display font-semibold text-cream-50 text-sm mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2.5 text-sm text-ink-300">
              <li>
                <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-accent-400 transition-colors">
                  Chính sách bảo hành
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-accent-400 transition-colors">
                  Chính sách đổi trả
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-accent-400 transition-colors">
                  Vận chuyển & Giao nhận
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate({ name: 'home' })} className="hover:text-accent-400 transition-colors">
                  Phương thức thanh toán
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div>
            <h4 className="font-display font-semibold text-cream-50 text-sm mb-4">Đăng ký nhận tin</h4>
            <p className="text-xs text-ink-300 mb-3">
              Nhận thông báo về các ưu đãi máy ảnh và tin tức công nghệ mới nhất.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="w-full px-3.5 py-2.5 bg-ink-800 border border-ink-700 rounded-xl text-xs text-cream-100 placeholder-ink-400 focus:outline-none focus:border-accent-500"
              />
              <button type="submit" className="w-full btn-accent py-2.5 text-xs">
                Đăng ký ngay <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-ink-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-400">
          <p>© 2026 {settings.storeName || 'CameraHub'}. Bản quyền thuộc về CameraHub Store.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate({ name: 'admin' })}
              className="text-ink-400 hover:text-accent-400 transition-colors underline"
            >
              Trang Quản trị (Admin Dashboard)
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
