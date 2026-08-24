import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import type { Product, Category, Order, Page } from '../types';
import { api } from '../lib/api';

import { AdminSidebar, type AdminTab } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminDashboardTab } from '../components/admin/AdminDashboardTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminReviewsTab } from '../components/admin/AdminReviewsTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import {
  ProductFormModal,
  DeleteConfirmModal,
  ProductViewModal,
  CategoryFormModal,
  OrderViewModal,
} from '../components/admin/AdminModals';

interface AdminPageProps {
  onNavigate: (page: Page) => void;
  initialTab?: AdminTab;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate, initialTab = 'dashboard' }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Success Banner State
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Auto-hide success banner after 3.5 seconds
  useEffect(() => {
    if (successBanner) {
      const timer = setTimeout(() => {
        setSuccessBanner(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successBanner]);

  // Product Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState({
    name: '',
    category_id: '',
    brand: 'Sony',
    price: '',
    original_price: '',
    stock: '10',
    description: '',
    image_url: '',
    status: 'active',
    gallery: [] as string[],
    features: [] as string[],
    specs: [] as { key: string; value: string }[],
  });

  // Category Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });

  // Order Detail Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, ords] = await Promise.all([
        api.getProducts({ sort: 'newest' }),
        api.getCategories(),
        api.getAdminOrders().catch(() => []),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
      setOrders(ords || []);
      if (cats && cats.length > 0 && !productFormData.category_id) {
        setProductFormData((prev) => ({ ...prev, category_id: cats[0].id }));
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // PRODUCT HANDLERS
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductFormData({
      name: '',
      category_id: categories[0]?.id || '',
      brand: 'Sony',
      price: '',
      original_price: '',
      stock: '10',
      description: '',
      image_url: '',
      status: 'active',
      gallery: [],
      features: [''],
      specs: [{ key: '', value: '' }],
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);

    const specsArray = product.specs
      ? Object.entries(product.specs).map(([key, value]) => ({ key, value }))
      : [];

    setProductFormData({
      name: product.name,
      category_id: product.category_id || categories[0]?.id || '',
      brand: product.brand || 'Sony',
      price: product.price.toString(),
      original_price: product.original_price ? product.original_price.toString() : '',
      stock: product.stock.toString(),
      description: product.description || '',
      image_url: product.image_url || '',
      status: product.status || 'active',
      gallery: product.gallery || (product.image_url ? [product.image_url] : []),
      features: product.features && product.features.length > 0 ? product.features : [''],
      specs: specsArray.length > 0 ? specsArray : [{ key: '', value: '' }],
    });
    setShowProductModal(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const specsObj: Record<string, string> = {};
      productFormData.specs.forEach((s) => {
        if (s.key.trim() && s.value.trim()) {
          specsObj[s.key.trim()] = s.value.trim();
        }
      });

      const payload = {
        name: productFormData.name,
        category_id: productFormData.category_id,
        brand: productFormData.brand,
        price: parseFloat(productFormData.price),
        original_price: productFormData.original_price ? parseFloat(productFormData.original_price) : undefined,
        stock: parseInt(productFormData.stock, 10),
        description: productFormData.description,
        image_url: productFormData.image_url || (productFormData.gallery[0] || ''),
        status: productFormData.status,
        gallery: productFormData.gallery.filter(Boolean),
        features: productFormData.features.filter((f) => f.trim() !== ''),
        specs: specsObj,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        setSuccessBanner(`Sản phẩm "${productFormData.name}" đã được cập nhật thành công!`);
      } else {
        await api.createProduct(payload);
        setSuccessBanner(`Sản phẩm "${productFormData.name}" đã được thêm mới thành công!`);
      }
      setShowProductModal(false);
      loadData();
    } catch {
      alert('Có lỗi xảy ra khi lưu sản phẩm!');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProductId) return;
    try {
      const prod = products.find((p) => p.id === deletingProductId);
      await api.deleteProduct(deletingProductId);
      setSuccessBanner(`Đã xóa sản phẩm "${prod?.name || ''}" thành công!`);
      setDeletingProductId(null);
      loadData();
    } catch {
      alert('Không thể xóa sản phẩm!');
    }
  };

  const handleToggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateProduct(product.id, { status: newStatus });
      setSuccessBanner(
        `Đã đổi trạng thái sản phẩm "${product.name}" sang ${
          newStatus === 'active' ? 'Đang bán' : 'Tạm ẩn'
        }!`
      );
      loadData();
    } catch {
      alert('Không thể đổi trạng thái!');
    }
  };

  // CATEGORY HANDLERS
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({ name: '', description: '' });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryFormData({ name: cat.name, description: cat.description || '' });
    setShowCategoryModal(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, categoryFormData);
        setSuccessBanner(`Danh mục "${categoryFormData.name}" đã được cập nhật thành công!`);
      } else {
        await api.createCategory(categoryFormData);
        setSuccessBanner(`Danh mục "${categoryFormData.name}" đã được tạo mới thành công!`);
      }
      setShowCategoryModal(false);
      loadData();
    } catch {
      alert('Có lỗi khi lưu danh mục!');
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    try {
      await api.deleteCategory(deletingCategoryId);
      setSuccessBanner('Đã xóa danh mục thành công!');
      setDeletingCategoryId(null);
      loadData();
    } catch {
      alert('Không thể xóa danh mục!');
    }
  };

  // ORDER HANDLERS
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setSuccessBanner(`Đã cập nhật trạng thái đơn hàng sang "${newStatus}"!`);
      loadData();
    } catch {
      alert('Không thể cập nhật trạng thái đơn hàng!');
    }
  };

  return (
    <div className="h-screen bg-cream-50 flex text-ink-800 font-sans overflow-hidden">
      {/* Sidebar - Fixed Position */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onNavigate={onNavigate} />

      {/* Main Right Area - Independent Scrollable Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <AdminHeader onNavigate={onNavigate} />

        <main className="p-8 flex-1">
          {/* Success Banner */}
          {successBanner && (
            <div className="bg-cream-100 border border-accent-200 text-ink-800 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-xs animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-accent-500" />
                <span className="text-sm font-medium">{successBanner}</span>
              </div>
              <button onClick={() => setSuccessBanner(null)} className="text-ink-400 hover:text-ink-700 p-1">
                <X size={18} />
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              products={products}
              orders={orders}
              setActiveTab={setActiveTab}
              onOpenAddProduct={handleOpenAddProduct}
              onOpenAddCategory={handleOpenAddCategory}
              onNavigate={onNavigate}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductsTab
              products={products}
              categories={categories}
              loading={loading}
              onOpenAddModal={handleOpenAddProduct}
              onOpenEditModal={handleOpenEditProduct}
              onViewProduct={setViewingProduct}
              onDeleteProduct={setDeletingProductId}
              onToggleStatus={handleToggleProductStatus}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesTab
              categories={categories}
              onOpenAddCategory={handleOpenAddCategory}
              onOpenEditCategory={handleOpenEditCategory}
              onDeleteCategory={setDeletingCategoryId}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersTab
              orders={orders}
              onUpdateStatus={handleUpdateOrderStatus}
              onViewOrder={setViewingOrder}
            />
          )}

          {activeTab === 'reviews' && <AdminReviewsTab />}

          {activeTab === 'settings' && (
            <AdminSettingsTab
              onSaveSuccess={() =>
                setSuccessBanner('Cài đặt hệ thống cửa hàng đã được lưu thành công!')
              }
            />
          )}
        </main>

        <footer className="py-6 border-t border-cream-200 text-center text-xs text-ink-400 bg-white">
          © 2026 CameraHub Management System - Pure React & Node.js Architecture
        </footer>
      </div>

      {/* ALL MODALS */}
      <ProductFormModal
        show={showProductModal}
        editingProduct={editingProduct}
        categories={categories}
        formData={productFormData}
        setFormData={setProductFormData}
        onSubmit={handleSubmitProduct}
        onClose={() => setShowProductModal(false)}
      />

      {deletingProductId && (
        <DeleteConfirmModal
          title="Xác nhận xóa sản phẩm?"
          message="Hành động này sẽ xóa sản phẩm khỏi hệ thống và không thể khôi phục."
          onConfirm={handleDeleteProduct}
          onClose={() => setDeletingProductId(null)}
        />
      )}

      <ProductViewModal product={viewingProduct} onClose={() => setViewingProduct(null)} />

      <CategoryFormModal
        show={showCategoryModal}
        editingCategory={editingCategory}
        formData={categoryFormData}
        setFormData={setCategoryFormData}
        onSubmit={handleSubmitCategory}
        onClose={() => setShowCategoryModal(false)}
      />

      {deletingCategoryId && (
        <DeleteConfirmModal
          title="Xóa danh mục này?"
          message="Lưu ý: Thao tác này sẽ xóa phân loại khỏi hệ thống!"
          onConfirm={handleDeleteCategory}
          onClose={() => setDeletingCategoryId(null)}
        />
      )}

      <OrderViewModal order={viewingOrder} onClose={() => setViewingOrder(null)} />
    </div>
  );
};
