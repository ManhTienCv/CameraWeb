import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Sparkles,
  Check,
  Navigation,
  Loader2,
} from 'lucide-react';
import type { Address } from '../types';
import { MapLocationPicker, type SelectedLocationData } from './MapLocationPicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    label: string;
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    isDefault: boolean;
  }) => Promise<void>;
  initialAddress?: Address | null;
}

const POPULAR_PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Quảng Ninh',
  'Bắc Ninh',
  'Nghệ An',
  'Thừa Thiên Huế',
  'Khánh Hòa (Nha Trang)',
  'Lâm Đồng (Đà Lạt)',
  'Bà Rịa - Vũng Tàu',
  'Thanh Hóa',
];

export function AddressModal({ isOpen, onClose, onSave, initialAddress }: Props) {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [label, setLabel] = useState('Địa chỉ nhận hàng');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hà Nội');
  const [district, setDistrict] = useState('Quận Cầu Giấy');
  const [streetAddress, setStreetAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

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

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isMapOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMapOpen, onClose]);

  useEffect(() => {
    if (initialAddress) {
      setLabel(initialAddress.label || 'Địa chỉ nhận hàng');
      setRecipientName(initialAddress.recipientName || '');
      setPhone(initialAddress.phone || '');
      setCity(initialAddress.city || 'Hà Nội');
      setStreetAddress(initialAddress.address || '');
      setIsDefault(initialAddress.isDefault || false);
    } else {
      setLabel('Địa chỉ nhận hàng');
      setRecipientName('');
      setPhone('');
      setCity('Hà Nội');
      setDistrict('Quận Cầu Giấy');
      setStreetAddress('');
      setIsDefault(false);
    }
  }, [initialAddress, isOpen]);

  const handleMapConfirm = (data: SelectedLocationData) => {
    if (data.city) setCity(data.city);
    if (data.district) setDistrict(data.district);
    if (data.detailAddress) {
      setStreetAddress(data.detailAddress);
    } else {
      setStreetAddress(data.fullAddress);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const fullAddressString = district
        ? `${streetAddress}, ${district}`.trim().replace(/^,\s*/, '')
        : streetAddress;

      await onSave({
        label,
        recipientName,
        phone,
        address: fullAddressString,
        city,
        isDefault,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save address:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop: Fullscreen portal covering 100% viewport */}
      <div
        className={`fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in overflow-y-auto cursor-pointer ${
          isMapOpen ? 'hidden' : ''
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Modal Content Card */}
        <div
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden my-auto cursor-default animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-3.5 border-b border-cream-100 flex items-start justify-between bg-cream-50/50">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-accent-50 text-accent-700 rounded-full text-[11px] font-bold mb-1 border border-accent-200/70">
                <MapPin size={12} className="text-accent-500" />
                <span>Định Vị Vận Chuyển Số</span>
              </div>
              <h2 className="font-display font-bold text-lg text-ink-900 leading-tight">
                {initialAddress ? 'Chỉnh Sửa Địa Chỉ Nhận Hàng' : 'Thêm Địa Chỉ Nhận Hàng Mới'}
              </h2>
              <p className="text-[11px] text-ink-500 mt-0.5">
                Điền thông tin hoặc chọn trực tiếp vị trí trên Bản đồ tương tác
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-200 text-ink-400 hover:text-ink-900 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Banner Map Picker Card */}
            <div className="p-3.5 bg-accent-50/70 border border-accent-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-900">
                    Chọn vị trí trực tiếp qua Bản đồ OpenStreetMap / Google Maps
                  </h4>
                  <p className="text-[11px] text-ink-500 mt-0.5">
                    Kéo ghim định vị toạ độ GPS để lấy tên đường & số nhà tự động
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Navigation size={13} />
                <span>Mở Bản Đồ</span>
              </button>
            </div>

            {/* Name & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Tên người nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Phục"
                  className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909123456"
                  className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Province & District Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">
                  Tỉnh / Thành phố <span className="text-rose-500">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:bg-white transition-all font-medium cursor-pointer"
                >
                  {POPULAR_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 mb-1">Quận / Huyện</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Ví dụ: Quận Cầu Giấy"
                  className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Detail Address */}
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">
                Số nhà, tên đường, khu đô thị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Ví dụ: Số 10 Đường Cầu Giấy, Phường Dịch Vọng"
                className="w-full px-3.5 py-2.5 bg-cream-50/80 border border-cream-200 rounded-xl text-xs text-ink-900 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="isDefaultAddressCheckbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-accent-500 rounded border-cream-300 focus:ring-accent-500 cursor-pointer"
              />
              <label htmlFor="isDefaultAddressCheckbox" className="text-xs font-semibold text-ink-700 cursor-pointer">
                Đặt làm địa chỉ giao hàng mặc định
              </label>
            </div>

            {/* Actions */}
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
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-bold text-white bg-accent-500 hover:bg-accent-600 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Lưu Địa Chỉ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Map Picker Modal */}
      <MapLocationPicker
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={handleMapConfirm}
      />
    </>,
    document.body
  );
}
