import React, { useState, useEffect } from 'react';
import { getStoreSettings, saveStoreSettings } from '../../lib/settings';

interface AdminSettingsTabProps {
  onSaveSuccess: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ onSaveSuccess }) => {
  const [settingsData, setSettingsData] = useState({
    storeName: 'CameraHub Vietnam',
    phone: '1900 6868',
    email: 'support@camerahub.vn',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    shippingFee: '30000',
    returnPolicy: 'Bảo hành chính hãng 24 tháng, 1 đổi 1 trong 30 ngày.',
  });

  useEffect(() => {
    const loaded = getStoreSettings();
    setSettingsData({
      storeName: loaded.storeName,
      phone: loaded.phone,
      email: loaded.email,
      address: loaded.address,
      shippingFee: loaded.shippingFee.toString(),
      returnPolicy: loaded.returnPolicy,
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoreSettings({
      storeName: settingsData.storeName,
      phone: settingsData.phone,
      email: settingsData.email,
      address: settingsData.address,
      shippingFee: parseFloat(settingsData.shippingFee) || 30000,
      returnPolicy: settingsData.returnPolicy,
    });
    onSaveSuccess();
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h3 className="text-2xl font-display font-bold text-ink-900">Cài đặt Cửa hàng</h3>
        <p className="text-sm text-ink-500 mt-1">Cấu hình thông tin hệ thống E-Commerce CameraHub</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-cream-200 shadow-xs space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase mb-2">Tên cửa hàng</label>
            <input
              type="text"
              required
              value={settingsData.storeName}
              onChange={(e) => setSettingsData({ ...settingsData, storeName: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase mb-2">Hotline tư vấn</label>
            <input
              type="text"
              required
              value={settingsData.phone}
              onChange={(e) => setSettingsData({ ...settingsData, phone: e.target.value })}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase mb-2">Email hỗ trợ</label>
            <input
              type="email"
              required
              value={settingsData.email}
              onChange={(e) => setSettingsData({ ...settingsData, email: e.target.value })}
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-700 uppercase mb-2">Phí vận chuyển (VND)</label>
            <input
              type="number"
              required
              value={settingsData.shippingFee}
              onChange={(e) => setSettingsData({ ...settingsData, shippingFee: e.target.value })}
              className="input-field text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 uppercase mb-2">Địa chỉ Showroom chính</label>
          <input
            type="text"
            required
            value={settingsData.address}
            onChange={(e) => setSettingsData({ ...settingsData, address: e.target.value })}
            className="input-field text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-700 uppercase mb-2">Chính sách bảo hành & Đổi trả</label>
          <textarea
            rows={3}
            required
            value={settingsData.returnPolicy}
            onChange={(e) => setSettingsData({ ...settingsData, returnPolicy: e.target.value })}
            className="input-field text-sm resize-none"
          />
        </div>

        <div className="pt-4 border-t border-cream-200 text-right">
          <button type="submit" className="btn-accent px-6 py-2.5 text-sm font-semibold rounded-xl shadow-sm">
            Lưu cấu hình hệ thống
          </button>
        </div>
      </form>
    </div>
  );
};
