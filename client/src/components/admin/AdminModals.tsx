import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Upload } from 'lucide-react';
import type { Product, Category, Order } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../../context/ToastContext';

// 1. PRODUCT FORM MODAL
interface ProductFormModalProps {
  show: boolean;
  editingProduct: Product | null;
  categories: Category[];
  formData: {
    name: string;
    category_id: string;
    brand: string;
    price: string;
    original_price: string;
    stock: string;
    description: string;
    image_url: string;
    status: string;
    gallery: string[];
    features: string[];
    specs: { key: string; value: string }[];
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  show,
  editingProduct,
  categories,
  formData,
  setFormData,
  onSubmit,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (!show) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev: any) => ({
            ...prev,
            gallery: [...(prev.gallery || []), reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    const updated = [...(formData.gallery || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, gallery: updated });
  };

  const handleAddFeature = () => {
    setFormData({
      ...formData,
      features: [...(formData.features || []), ''],
    });
  };

  const handleRemoveFeature = (index: number) => {
    const updated = [...(formData.features || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, features: updated });
  };

  const handleFeatureChange = (index: number, val: string) => {
    const updated = [...(formData.features || [])];
    updated[index] = val;
    setFormData({ ...formData, features: updated });
  };

  const handleAddSpec = () => {
    setFormData({
      ...formData,
      specs: [...(formData.specs || []), { key: '', value: '' }],
    });
  };

  const handleRemoveSpec = (index: number) => {
    const updated = [...(formData.specs || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, specs: updated });
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...(formData.specs || [])];
    updated[index][field] = val;
    setFormData({ ...formData, specs: updated });
  };

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-scale-in border border-cream-200 my-auto max-h-[90vh] flex flex-col cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 flex-shrink-0">
          <div>
            <h3 className="text-xl font-display font-bold text-ink-900">
              {editingProduct ? 'Chỉnh sửa bài đăng sản phẩm' : 'Đăng sản phẩm máy ảnh mới'}
            </h3>
            <p className="text-xs text-ink-400 mt-0.5">Cập nhật đầy đủ hình ảnh, đặc điểm nổi bật và thông số kỹ thuật</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="py-4 space-y-6 overflow-y-auto flex-1 pr-2">
          {/* SECTION 1: THÔNG TIN CƠ BẢN */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">1. Thông tin cơ bản & Phân loại</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Tên máy ảnh / Ống kính *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Sony Alpha A7 IV Body"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Thương hiệu *</label>
                <select
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="Sony">Sony</option>
                  <option value="Canon">Canon</option>
                  <option value="Fujifilm">Fujifilm</option>
                  <option value="Nikon">Nikon</option>
                  <option value="DJI">DJI</option>
                  <option value="Leica">Leica</option>
                  <option value="Panasonic">Panasonic</option>
                  <option value="Sigma">Sigma</option>
                  <option value="Tamron">Tamron</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Danh mục sản phẩm *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input-field text-sm"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Trạng thái kinh doanh *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="active">Đang kinh doanh (Active)</option>
                  <option value="inactive">Tạm ẩn (Inactive)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: GIÁ & KHO HÀNG */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">2. Giá bán & Tồn kho</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Giá bán hiện tại (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="59990000"
                  className="input-field text-sm font-semibold text-accent-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Giá gốc / Giá niêm yết (VNĐ)</label>
                <input
                  type="number"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  placeholder="65000000"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-700 uppercase mb-1">Số lượng trong kho (Chiếc) *</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="10"
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: HÌNH ẢNH & BỘ SƯU TẬP */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">3. Hình ảnh sản phẩm (Upload hoặc URL)</h4>
            
            {/* Ảnh đại diện chính */}
            <div>
              <label className="block text-xs font-bold text-ink-700 mb-1">Ảnh đại diện chính (Cover Image) *</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  required
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://... hoặc bấm tải ảnh bên phải"
                  className="input-field text-sm flex-1"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-ink-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 border border-cream-300 cursor-pointer"
                >
                  <Upload size={14} />
                  <span>Tải ảnh lên</span>
                </button>
              </div>
              {formData.image_url && (
                <div className="mt-2.5 w-24 h-24 rounded-2xl overflow-hidden border border-cream-300 bg-cream-50">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Gallery ảnh kèm theo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-ink-700">Bộ sưu tập ảnh chi tiết (Gallery)</label>
                <input
                  type="file"
                  ref={galleryInputRef}
                  onChange={handleGalleryUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="text-xs font-bold text-accent-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload size={12} />
                  <span>+ Tải thêm ảnh chi tiết</span>
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {(formData.gallery || []).map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-cream-200 group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: ĐẶC ĐIỂM NỔI BẬT */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">4. Đặc điểm nổi bật (Key Features)</h4>
              <button
                type="button"
                onClick={handleAddFeature}
                className="text-xs font-bold text-accent-500 hover:underline"
              >
                + Thêm đặc điểm
              </button>
            </div>

            <div className="space-y-2">
              {(formData.features || []).map((feat, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={feat}
                    onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    placeholder="Ví dụ: Cảm biến Full-frame Exmor R 33MP thế hệ mới"
                    className="input-field text-sm flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="p-2 text-ink-400 hover:text-rose-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: THÔNG SỐ KỸ THUẬT CHI TIẾT */}
          <div className="space-y-4 pt-4 border-t border-cream-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">5. Thông số kỹ thuật chi tiết</h4>
              <button
                type="button"
                onClick={handleAddSpec}
                className="text-xs font-bold text-accent-500 hover:underline"
              >
                + Thêm thông số
              </button>
            </div>

            <div className="space-y-2">
              {(formData.specs || []).map((spec, idx) => (
                <div key={idx} className="grid grid-cols-5 gap-2 items-center">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    placeholder="Tên (Cảm biến...)"
                    className="input-field text-sm col-span-2 font-semibold"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    placeholder="Giá trị (Full-frame 33MP...)"
                    className="input-field text-sm col-span-2"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(idx)}
                    className="p-2 text-ink-400 hover:text-rose-600 col-span-1 justify-self-center"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 6: MÔ TẢ BÀI VIẾT CHI TIẾT */}
          <div className="space-y-2 pt-4 border-t border-cream-200">
            <h4 className="text-xs font-bold text-accent-500 uppercase tracking-wider">6. Bài viết mô tả sản phẩm chi tiết</h4>
            <textarea
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Nhập bài viết đánh giá chi tiết sản phẩm máy ảnh..."
              className="input-field text-sm resize-none"
            />
          </div>

          <div className="pt-4 border-t border-cream-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-cream-300 rounded-xl text-sm font-medium text-ink-700 hover:bg-cream-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button type="submit" className="btn-accent px-6 py-2.5 text-sm font-semibold rounded-xl shadow-sm cursor-pointer">
              {editingProduct ? 'Lưu bài đăng sản phẩm' : 'Đăng sản phẩm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// 2. DELETE CONFIRMATION MODAL
interface DeleteConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  message,
  onConfirm,
  onClose,
}) => {
  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center animate-scale-in border border-cream-200 cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} />
        </div>
        <h4 className="text-lg font-bold text-ink-900 mb-2">{title}</h4>
        <p className="text-xs text-ink-500 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-cream-300 rounded-xl text-sm font-medium text-ink-700 hover:bg-cream-100 cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer"
          >
            Xác nhận Xóa
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 3. PRODUCT VIEW MODAL
interface ProductViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductViewModal: React.FC<ProductViewModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-scale-in border border-cream-200 cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-cream-200">
          <h3 className="text-lg font-bold text-ink-900">Chi tiết sản phẩm</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-20 h-20 rounded-2xl object-cover border border-cream-200 bg-cream-50"
            />
            <div>
              <h4 className="font-bold text-ink-900">{product.name}</h4>
              <p className="text-xs text-ink-500">Hãng: {product.brand}</p>
              <p className="text-lg font-bold text-accent-500 mt-1">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>
          <p className="text-xs text-ink-600 leading-relaxed bg-cream-50 p-3.5 rounded-xl border border-cream-200">
            {product.description || 'Chưa có mô tả chi tiết.'}
          </p>
        </div>
        <div className="pt-3 border-t border-cream-200 text-right">
          <button onClick={onClose} className="btn-primary px-4 py-2 text-sm font-medium rounded-xl cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 4. CATEGORY FORM MODAL
interface CategoryFormModalProps {
  show: boolean;
  editingCategory: Category | null;
  formData: { name: string; description: string };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  show,
  editingCategory,
  formData,
  setFormData,
  onSubmit,
  onClose,
}) => {
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-scale-in border border-cream-200 cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-cream-200">
          <h3 className="text-xl font-display font-bold text-ink-900">
            {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
          </h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase mb-1">
              Tên danh mục *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Máy ảnh Compact & Vlog"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase mb-1">
              Mô tả danh mục
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả..."
              className="input-field text-sm resize-none"
            />
          </div>
          <div className="pt-4 border-t border-cream-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-cream-300 rounded-xl text-sm text-ink-700 cursor-pointer"
            >
              Hủy
            </button>
            <button type="submit" className="btn-accent px-5 py-2 text-sm font-semibold rounded-xl cursor-pointer">
              {editingCategory ? 'Lưu thay đổi' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

// 5. ORDER VIEW MODAL
interface OrderViewModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderViewModal: React.FC<OrderViewModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return createPortal(
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-scale-in border border-cream-200 cursor-default max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 shrink-0">
          <div>
            <h3 className="text-lg font-bold font-mono text-ink-900">
              Đơn hàng #{order.order_code || order.id.substring(0, 8)}
            </h3>
            <p className="text-xs text-ink-400 mt-0.5">
              Ngày đặt: {new Date(order.created_at || Date.now()).toLocaleString('vi-VN')}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-cream-100 flex items-center justify-center text-ink-400 hover:text-ink-700 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Customer & Delivery Information */}
          <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 space-y-2">
            <h4 className="font-bold text-ink-900 text-xs uppercase tracking-wide">Thông tin giao hàng</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-ink-700">
              <p>
                <span className="text-ink-400">Khách hàng:</span> <strong className="text-ink-900">{order.customer_name}</strong>
              </p>
              <p>
                <span className="text-ink-400">Điện thoại:</span> <strong className="text-ink-900">{order.customer_phone}</strong>
              </p>
              <p className="sm:col-span-2">
                <span className="text-ink-400">Email:</span> <span className="font-medium text-ink-900">{order.customer_email || 'Chưa cung cấp'}</span>
              </p>
              <p className="sm:col-span-2">
                <span className="text-ink-400">Địa chỉ:</span> <span className="font-medium text-ink-900">{order.shipping_address}, {order.city}</span>
              </p>
            </div>
          </div>

          {/* Payment & Status Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 space-y-1">
              <span className="text-ink-400 block text-[11px]">Hình thức thanh toán</span>
              <p className="font-bold text-ink-900">
                {order.payment_method === 'vietqr' ? 'VietQR (Vietcombank)' : 'COD (Tiền mặt)'}
              </p>
              <span className={`inline-block text-[11px] font-bold ${order.payment_status === 'completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {order.payment_status === 'completed' ? '● Đã thanh toán' : '○ Chờ thanh toán'}
              </span>
            </div>

            <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 space-y-1">
              <span className="text-ink-400 block text-[11px]">Trạng thái đơn hàng</span>
              <p className="font-bold text-ink-900 capitalize">
                {order.status === 'shipping'
                  ? 'Đang giao hàng'
                  : order.status === 'completed'
                  ? 'Hoàn thành'
                  : order.status === 'cancelled'
                  ? 'Đã hủy'
                  : 'Chờ xử lý'}
              </p>
              <span className="text-[11px] text-ink-400">Đơn vị: GHN Express</span>
            </div>
          </div>

          {/* Ordered Products List */}
          <div>
            <h4 className="font-bold text-ink-900 text-xs uppercase tracking-wide mb-2.5">
              Danh sách sản phẩm ({order.items?.length || 0})
            </h4>
            {(!order.items || order.items.length === 0) ? (
              <p className="text-ink-400 italic p-3 bg-cream-50 rounded-xl border border-cream-100">
                Chưa tải chi tiết các mặt hàng.
              </p>
            ) : (
              <div className="divide-y divide-cream-100 border border-cream-200 rounded-2xl overflow-hidden">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-cream-200 bg-cream-50 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-cream-100 border border-cream-200 shrink-0" />
                      )}
                      <div>
                        <p className="font-bold text-xs text-ink-900 line-clamp-1">{item.name}</p>
                        <p className="text-[11px] text-ink-400">
                          {formatCurrency(item.price)} × {item.quantity}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-xs text-ink-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Amount */}
          <div className="p-4 bg-accent-50/60 rounded-2xl border border-accent-200 flex items-center justify-between">
            <span className="font-bold text-ink-800">Tổng thanh toán:</span>
            <span className="font-display font-bold text-base text-accent-600">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-cream-200 text-right shrink-0">
          <button onClick={onClose} className="btn-primary px-5 py-2 text-xs font-bold rounded-xl cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
