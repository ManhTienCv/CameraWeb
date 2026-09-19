export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  products_count?: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: string;
  category_name?: string;
  image_url: string;
  gallery: string[];
  specs: Record<string, string>;
  features: string[];
  rating: number;
  review_count: number;
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  status?: string;
  created_at?: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
  product?: Product;
}

export interface Cart {
  id: string;
  session_id: string;
  created_at?: string;
  updated_at?: string;
  items?: CartItem[];
}

export interface Order {
  id: string;
  order_code?: string;
  session_id?: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  payment_method?: string;
  payment_status?: string;
  total_amount: number;
  shipping_fee?: number;
  discount_amount?: number;
  shipping_partner?: string;
  tracking_code?: string | null;
  ghn_order_code?: string | null;
  expected_delivery_time?: string | null;
  cancel_reason?: string | null;
  refund_bank_name?: string | null;
  refund_account_number?: string | null;
  refund_account_holder?: string | null;
  refund_transaction_code?: string | null;
  refund_note?: string | null;
  refunded_at?: string | null;
  status: string;
  order_status?: string;
  notes?: string | null;
  items: OrderItem[];
  created_at?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  googleId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  status?: string;
  createdAt?: string;
  totalOrders?: number;
  addresses?: Address[];
}

export interface Address {
  id: string;
  userId?: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  isDefault: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface Review {
  id: string;
  productId: string;
  orderId?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  variant?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  defaultAddress: string | null;
  orderCount: number;
  completedOrderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

export interface AnalyticsOverview {
  totalRevenue: number;
  recent30Revenue: number;
  revenueGrowth: number;
  totalOrders: number;
  recentOrdersCount: number;
  orderGrowth: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  shippingOrdersCount: number;
  cancelledOrdersCount: number;
  completionRate: number;
  totalCustomers: number;
  averageOrderValue: number;
  totalProducts: number;
}

export interface DailyRevenueItem {
  date: string;
  label: string;
  revenue: number;
  orderCount: number;
}

export interface MonthlyRevenueItem {
  month: string;
  label: string;
  revenue: number;
  orderCount: number;
}

export interface CategoryRevenueItem {
  id: string;
  name: string;
  revenue: number;
  itemCount: number;
  percentage: number;
  color: string;
}

export interface PaymentMethodStatItem {
  method: string;
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
  amountPercentage: number;
  color: string;
}

export interface OrderStatusStatItem {
  status: string;
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
  color: string;
}

export interface TopProductItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryName: string;
  brandName: string;
  totalSold: number;
  totalRevenue: number;
}

export type Page =
  | { name: 'home' }
  | { name: 'catalog'; categorySlug?: string }
  | { name: 'product'; slug: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'order-success'; orderId: string }
  | { name: 'search'; query: string }
  | { name: 'orders' }
  | { name: 'profile'; tab?: 'profile' | 'addresses' }
  | { name: 'admin'; tab?: 'dashboard' | 'products' | 'categories' | 'orders' | 'users' | 'reviews' | 'settings' };

