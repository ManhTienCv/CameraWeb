import type {
  Category,
  Product,
  Cart,
  Order,
  User,
  Address,
  AuthResponse,
  AdminUserListItem,
  AnalyticsOverview,
  DailyRevenueItem,
  MonthlyRevenueItem,
  CategoryRevenueItem,
  PaymentMethodStatItem,
  OrderStatusStatItem,
  TopProductItem,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1';

// Session ID for cart persistence
function getSessionId(): string {
  let id = localStorage.getItem('camera_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('camera_session_id', id);
  }
  return id;
}

function getAuthToken(): string | null {
  return localStorage.getItem('camera_auth_token');
}

// In-memory cache for GET requests to eliminate page switch flashing
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (isGet && apiCache.has(url)) {
    const cached = apiCache.get(url)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Session-ID': getSessionId(),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `API error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) errMsg = errData.message;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  if (isGet) {
    apiCache.set(url, { data, timestamp: Date.now() });
  } else {
    // If mutating data, clear cache so fresh data is fetched
    apiCache.clear();
  }

  return data;
}

export const api = {
  // Authentication & Profile
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  googleLogin: (credential: string) =>
    request<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),


  register: (data: { email: string; password: string; fullName: string; phone?: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendRegisterOtp: (data: { email: string; fullName?: string }) =>
    request<{ message: string; email: string }>('/auth/send-register-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  registerWithOtp: (data: { email: string; password: string; fullName: string; phone?: string; otp: string }) =>
    request<AuthResponse>('/auth/register-with-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendChangeEmailOtp: (data: { newEmail: string }) =>
    request<{ message: string; newEmail: string }>('/auth/send-change-email-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyChangeEmailOtp: (data: { newEmail: string; otp: string }) =>
    request<{ message: string; user: User }>('/auth/verify-change-email-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: () => request<User>('/auth/me'),

  updateProfile: (data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
    currentPassword?: string;
    newPassword?: string;
  }) =>
    request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAddresses: () => request<Address[]>('/auth/addresses'),

  createAddress: (data: {
    label: string;
    recipientName: string;
    phone: string;
    address: string;
    city: string;
    isDefault?: boolean;
  }) =>
    request<{ message: string; address: Address }>('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAddress: (
    id: string,
    data: {
      label?: string;
      recipientName?: string;
      phone?: string;
      address?: string;
      city?: string;
      isDefault?: boolean;
    }
  ) =>
    request<{ message: string; address: Address }>(`/auth/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteAddress: (id: string) =>
    request<{ message: string }>(`/auth/addresses/${id}`, {
      method: 'DELETE',
    }),

  getMyOrders: () => request<Order[]>('/auth/orders'),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  getCategory: (slug: string) => request<{ category: Category; products: Product[] }>(`/categories/${slug}`),

  // Brands
  getBrands: () => request<Array<{ id: string; name: string; slug: string; logo_url: string | null }>>('/brands'),

  // Products
  getProducts: (params?: { category?: string; brand?: string; sort?: string; q?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.brand) searchParams.append('brand', params.brand);
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.q) searchParams.append('q', params.q);
    const query = searchParams.toString();
    return request<Product[]>(`/products${query ? `?${query}` : ''}`);
  },

  getFeaturedProducts: (type: 'featured' | 'new' = 'featured') =>
    request<Product[]>(`/products/featured?type=${type}`),

  searchProducts: (q: string, init?: RequestInit) =>
    request<Product[]>(`/products/search?q=${encodeURIComponent(q)}`, init),

  getProductBySlug: (slug: string) =>
    request<Product>(`/products/${slug}`),

  // Cart
  getCart: () => request<Cart>('/cart'),

  addToCart: (productId: string, quantity: number = 1) =>
    request<Cart>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  updateCartItem: (itemId: string, quantity: number) =>
    request<Cart>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeCartItem: (itemId: string) =>
    request<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    }),

  clearCart: () =>
    request<{ message: string }>('/cart', {
      method: 'DELETE',
    }),

  // Orders
  createOrder: (orderData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    city: string;
    payment_method?: string;
    shipping_partner?: string;
    shipping_fee?: number;
    discount_amount?: number;
    items: Array<{ product_id: string; name: string; price: number; quantity: number; image_url: string }>;
  }) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  getOrder: (id: string) => request<Order>(`/orders/${id}`),

  confirmPayment: (id: string) =>
    request<{ message: string; order: Order }>(`/orders/${id}/confirm-payment`, {
      method: 'POST',
    }),

  // Admin APIs
  createProduct: (data: Partial<Product>) =>
    request<{ message: string; product: Product }>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Partial<Product>) =>
    request<{ message: string; product: Product }>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),

  createCategory: (data: { name: string; description?: string }) =>
    request<{ message: string; category: Category }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: { name?: string; description?: string }) =>
    request<{ message: string; category: Category }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  getAdminOrders: () =>
    request<Order[]>('/admin/orders'),

  updateOrderStatus: (id: string, status: string) =>
    request<{ message: string; order: Order }>(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  confirmOrderRefund: (
    id: string,
    data?: { refundTransactionCode?: string; refundNote?: string }
  ) =>
    request<{ message: string; order: Order }>(`/admin/orders/${id}/confirm-refund`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  // Analytics & Reports APIs
  getAnalyticsOverview: () =>
    request<AnalyticsOverview>('/admin/analytics/overview'),

  getRevenueTrend: () =>
    request<{ data: DailyRevenueItem[] }>('/admin/analytics/revenue-trend'),

  getMonthlyRevenue: () =>
    request<{ data: MonthlyRevenueItem[] }>('/admin/analytics/monthly'),

  getCategoryDistribution: () =>
    request<{ data: CategoryRevenueItem[]; grandTotal: number }>('/admin/analytics/categories'),

  getPaymentMethodStats: () =>
    request<{ data: PaymentMethodStatItem[]; totalOrders: number; totalAmount: number }>('/admin/analytics/payment-methods'),

  getOrderStatusStats: () =>
    request<{ data: OrderStatusStatItem[]; total: number }>('/admin/analytics/order-statuses'),

  getTopSellingProducts: () =>
    request<{ data: TopProductItem[] }>('/admin/analytics/top-products'),

  // Admin User Management APIs
  getAdminUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.role && params.role !== 'all') query.set('role', params.role);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    const qs = query.toString();
    return request<{
      data: AdminUserListItem[];
      pagination: { page: number; limit: number; totalUsers: number; totalPages: number };
    }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  getAdminUserDetail: (id: string) =>
    request<{ user: User & { addresses: Address[]; orders: Order[]; totalSpent: number } }>(`/admin/users/${id}`),

  updateAdminUserRole: (id: string, role: string) =>
    request<{ message: string; user: any }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  toggleAdminUserStatus: (id: string, status: string) =>
    request<{ message: string; user: any }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getOrders: (params?: { status?: string }) =>
    request<Order[]>('/orders' + (params?.status ? `?status=${params.status}` : '')),

  cancelOrder: (
    id: string,
    data?:
      | string
      | {
          reason?: string;
          refundBankName?: string;
          refundAccountNumber?: string;
          refundAccountHolder?: string;
        }
  ) => {
    const payload = typeof data === 'string' ? { reason: data } : data || {};
    return request<{ message: string; order: Order }>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // MoMo Payment Gateway
  createMomoPayment: (orderId: string, redirectUrl?: string) =>
    request<{
      success: boolean;
      payUrl?: string;
      qrCodeUrl?: string;
      deeplink?: string;
      orderCode?: string;
      amount?: number;
      message?: string;
    }>('/payment/momo/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, redirectUrl }),
    }),

  payAgainMomo: (orderId: string, redirectUrl?: string) =>
    request<{
      success: boolean;
      payUrl?: string;
      qrCodeUrl?: string;
      deeplink?: string;
      orderCode?: string;
      message?: string;
    }>('/payment/momo/pay-again', {
      method: 'POST',
      body: JSON.stringify({ orderId, redirectUrl }),
    }),

  // GHN Express Shipping APIs
  getGhnProvinces: () =>
    request<{ success: boolean; data: Array<{ ProvinceID: number; ProvinceName: string; Code: string }> }>(
      '/shipping/ghn/provinces'
    ),

  getGhnDistricts: (provinceId: number) =>
    request<{ success: boolean; data: Array<{ DistrictID: number; ProvinceID: number; DistrictName: string; Code: string }> }>(
      `/shipping/ghn/districts/${provinceId}`
    ),

  getGhnWards: (districtId: number) =>
    request<{ success: boolean; data: Array<{ WardCode: string; DistrictID: number; WardName: string }> }>(
      `/shipping/ghn/wards/${districtId}`
    ),

  calculateGhnFee: (params: { toDistrictId: number; toWardCode: string; weightGram?: number; insuranceValue?: number }) =>
    request<{
      success: boolean;
      data: { total: number; service_fee: number; insurance_fee: number; is_live: boolean };
    }>('/shipping/ghn/fee', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  createGhnShippingOrder: (orderId: string, data?: { toDistrictId?: number; toWardCode?: string }) =>
    request<{
      success: boolean;
      tracking_code: string;
      expected_delivery_time?: string;
      total_fee?: number;
      order?: Order;
      message?: string;
    }>(`/shipping/ghn/create-order/${orderId}`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
};
