export interface StoreSettings {
  storeName: string;
  phone: string;
  email: string;
  address: string;
  shippingFee: number;
  returnPolicy: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'CameraHub',
  phone: '1900 6868',
  email: 'support@camerahub.vn',
  address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  shippingFee: 30000,
  returnPolicy: 'Bảo hành chính hãng 24 tháng, 1 đổi 1 trong 30 ngày.',
};

export function getStoreSettings(): StoreSettings {
  try {
    const data = localStorage.getItem('camerahub_store_settings');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        shippingFee: Number(parsed.shippingFee) || 30000,
      };
    }
  } catch (e) {
    console.error('Failed to load store settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoreSettings(settings: Partial<StoreSettings>): StoreSettings {
  const current = getStoreSettings();
  const updated: StoreSettings = {
    ...current,
    ...settings,
    shippingFee: Number(settings.shippingFee ?? current.shippingFee),
  };
  try {
    localStorage.setItem('camerahub_store_settings', JSON.stringify(updated));
    window.dispatchEvent(new Event('store_settings_updated'));
  } catch (e) {
    console.error('Failed to save store settings:', e);
  }
  return updated;
}
