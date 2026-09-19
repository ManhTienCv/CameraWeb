import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import type { AdminUserListItem, User, Address, Order } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../lib/utils';

export const AdminUsersTab: React.FC = () => {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [selectedUserDetail, setSelectedUserDetail] = useState<{
    user: User & { addresses: Address[]; orders: Order[]; totalSpent: number };
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Role Edit Modal
  const [roleEditUser, setRoleEditUser] = useState<AdminUserListItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff' | 'customer'>('customer');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Status Toggle Modal
  const [statusToggleUser, setStatusToggleUser] = useState<AdminUserListItem | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Fetch Users
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.getAdminUsers({
        page,
        limit: pagination.limit,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(res.data || []);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, [roleFilter, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1);
  };

  // View User Detail
  const handleViewDetail = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const res = await api.getAdminUserDetail(userId);
      setSelectedUserDetail(res);
    } catch (err: any) {
      toast.error(err.message || 'Không thể lấy thông tin chi tiết người dùng');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Update Role
  const handleUpdateRole = async () => {
    if (!roleEditUser) return;
    setSubmittingRole(true);
    try {
      const res = await api.updateAdminUserRole(roleEditUser.id, selectedRole);
      toast.success(res.message);
      setRoleEditUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi cập nhật vai trò');
    } finally {
      setSubmittingRole(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async () => {
    if (!statusToggleUser) return;
    setSubmittingStatus(true);
    const newStatus = statusToggleUser.status === 'active' ? 'blocked' : 'active';
    try {
      const res = await api.toggleAdminUserStatus(statusToggleUser.id, newStatus);
      toast.success(res.message);
      setStatusToggleUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thay đổi trạng thái');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield size={12} /> Quản trị viên
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck size={12} /> Nhân viên
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cream-100 text-ink-700 border border-cream-200">
            <UserCheck size={12} /> Khách hàng
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'blocked') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          <Lock size={12} /> Đã khóa
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Unlock size={12} /> Hoạt động
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-ink-900 tracking-tight flex items-center gap-2.5">
            <Users className="text-accent-600" size={26} />
            Quản Lý Tài Khoản & Phân Quyền
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">
            Xem danh sách người dùng, lịch sử chi tiêu, phân quyền vai trò và khóa/mở khóa tài khoản
          </p>
        </div>
        <button
          onClick={() => fetchUsers(pagination.page)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-ink-700 bg-white border border-cream-200 rounded-2xl hover:bg-cream-50 transition-all shadow-2xs cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-3xl border border-cream-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[280px] max-w-md relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 text-sm bg-cream-50/50 border border-cream-200 rounded-2xl focus:outline-hidden focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all text-ink-900 placeholder-ink-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-ink-900 text-white text-xs font-semibold rounded-xl hover:bg-ink-800 transition-colors cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-ink-400" />
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Vai trò:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 focus:outline-hidden focus:border-accent-500 cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên (Admin)</option>
              <option value="staff">Nhân viên (Staff)</option>
              <option value="customer">Khách hàng (Customer)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-cream-50 border border-cream-200 rounded-xl text-ink-800 focus:outline-hidden focus:border-accent-500 cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="blocked">Đã bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. USER TABLE */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50/50 text-xs font-bold text-ink-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Người Dùng</th>
                <th className="py-3.5 px-4">Số Điện Thoại & Địa Chỉ</th>
                <th className="py-3.5 px-4">Vai Trò</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Đơn Hàng</th>
                <th className="py-3.5 px-4 text-right">Tổng Chi Tiêu</th>
                <th className="py-3.5 px-4">Ngày Tham Gia</th>
                <th className="py-3.5 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-accent-600" />
                      <span>Đang tải dữ liệu người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-400">
                    <UserX size={36} className="mx-auto text-ink-300 mb-2" />
                    Không tìm thấy người dùng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-cream-50/60 transition-colors">
                    {/* User info */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              user.fullName
                            )}&background=fef3c7&color=d97706&bold=true`
                          }
                          alt={user.fullName}
                          className="w-10 h-10 rounded-2xl object-cover border border-cream-200 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-ink-900 truncate max-w-[180px]">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-ink-500 truncate max-w-[180px]">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Phone & Address */}
                    <td className="py-4 px-4 text-xs text-ink-600">
                      <p className="font-medium text-ink-800">{user.phone || 'Chưa cập nhật'}</p>
                      <p className="text-ink-400 truncate max-w-[200px]" title={user.defaultAddress || ''}>
                        {user.defaultAddress || 'Chưa có địa chỉ'}
                      </p>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">{getRoleBadge(user.role)}</td>

                    {/* Status */}
                    <td className="py-4 px-4">{getStatusBadge(user.status)}</td>

                    {/* Order Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-ink-900">{user.orderCount}</span>
                      <span className="text-xs text-ink-400 block">
                        ({user.completedOrderCount} thành công)
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-display font-bold text-accent-600">
                        {formatCurrency(user.totalSpent)}
                      </span>
                    </td>

                    {/* Join Date */}
                    <td className="py-4 px-4 text-xs text-ink-500">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View details */}
                        <button
                          onClick={() => handleViewDetail(user.id)}
                          title="Xem chi tiết & lịch sử mua hàng"
                          className="p-2 text-ink-500 hover:text-accent-600 hover:bg-accent-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>

                        {/* Change role */}
                        <button
                          onClick={() => {
                            setRoleEditUser(user);
                            setSelectedRole(user.role as any);
                          }}
                          title="Phân quyền vai trò"
                          className="p-2 text-ink-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Shield size={16} />
                        </button>

                        {/* Toggle lock/unlock */}
                        <button
                          onClick={() => setStatusToggleUser(user)}
                          title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            user.status === 'active'
                              ? 'text-ink-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-cream-200 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-500">
          <div>
            Hiển thị <span className="font-bold text-ink-900">{users.length}</span> /{' '}
            <span className="font-bold text-ink-900">{pagination.totalUsers}</span> người dùng
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="p-2 border border-cream-200 rounded-xl hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-ink-900 px-2">
              Trang {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="p-2 border border-cream-200 rounded-xl hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MODAL: USER DETAIL & ORDER HISTORY */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-cream-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-cream-200 flex items-center justify-between bg-cream-50/50">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedUserDetail.user.avatarUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedUserDetail.user.fullName
                    )}&background=fef3c7&color=d97706&bold=true`
                  }
                  alt={selectedUserDetail.user.fullName}
                  className="w-12 h-12 rounded-2xl object-cover border border-cream-200"
                />
                <div>
                  <h3 className="text-lg font-bold text-ink-900">
                    {selectedUserDetail.user.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-ink-500 mt-0.5">
                    <span>{selectedUserDetail.user.email}</span>
                    <span>•</span>
                    {getRoleBadge(selectedUserDetail.user.role)}
                    {getStatusBadge(selectedUserDetail.user.status || 'active')}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-2 text-ink-400 hover:text-ink-700 hover:bg-cream-200/50 rounded-xl transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Stats overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200">
                  <span className="text-xs text-ink-400 block font-medium">Tổng chi tiêu</span>
                  <span className="text-lg font-bold font-display text-accent-600">
                    {formatCurrency(selectedUserDetail.user.totalSpent)}
                  </span>
                </div>
                <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200">
                  <span className="text-xs text-ink-400 block font-medium">Tổng đơn hàng</span>
                  <span className="text-lg font-bold text-ink-900">
                    {selectedUserDetail.user.totalOrders} đơn
                  </span>
                </div>
                <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200">
                  <span className="text-xs text-ink-400 block font-medium">Ngày gia nhập</span>
                  <span className="text-sm font-semibold text-ink-900 mt-1 block">
                    {formatDate(selectedUserDetail.user.createdAt || '')}
                  </span>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <h4 className="font-bold text-ink-900 text-sm mb-3 flex items-center gap-2">
                  <MapPin size={16} className="text-accent-600" />
                  Sổ Địa Chỉ Giao Hàng ({selectedUserDetail.user.addresses?.length || 0})
                </h4>
                {(!selectedUserDetail.user.addresses || selectedUserDetail.user.addresses.length === 0) ? (
                  <p className="text-xs text-ink-400 italic">Chưa có địa chỉ giao hàng nào.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUserDetail.user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3 rounded-xl border border-cream-200 bg-cream-50/40 flex items-start justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-ink-900 flex items-center gap-2">
                            <span>{addr.recipientName}</span>
                            <span className="text-ink-400 font-normal">({addr.phone})</span>
                            {addr.isDefault && (
                              <span className="bg-accent-100 text-accent-700 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-ink-600 mt-1">
                            {addr.address}, {addr.city}
                          </p>
                        </div>
                        <span className="text-ink-400 text-[11px] font-medium">{addr.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order History */}
              <div>
                <h4 className="font-bold text-ink-900 text-sm mb-3 flex items-center gap-2">
                  <ShoppingBag size={16} className="text-accent-600" />
                  Lịch Sử Mua Hàng ({selectedUserDetail.user.orders?.length || 0} đơn)
                </h4>
                {(!selectedUserDetail.user.orders || selectedUserDetail.user.orders.length === 0) ? (
                  <p className="text-xs text-ink-400 italic">Khách hàng chưa phát sinh đơn hàng nào.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedUserDetail.user.orders.map((ord: any) => (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-cream-200 hover:border-cream-300 transition-colors space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-cream-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink-900">{ord.orderCode}</span>
                            <span className="text-ink-400">•</span>
                            <span className="text-ink-500">{formatDate(ord.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                ord.orderStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : ord.orderStatus === 'cancelled'
                                  ? 'bg-rose-50 text-rose-700'
                                  : ord.orderStatus === 'shipping'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {ord.orderStatus === 'completed'
                                ? 'Giao thành công'
                                : ord.orderStatus === 'cancelled'
                                ? 'Đã hủy'
                                : ord.orderStatus === 'shipping'
                                ? 'Đang giao'
                                : 'Chờ xử lý'}
                            </span>
                            <span className="font-bold font-display text-accent-600 text-sm">
                              {formatCurrency(ord.totalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Order Items preview */}
                        {ord.items && ord.items.length > 0 && (
                          <div className="space-y-2">
                            {ord.items.map((it: any) => (
                              <div key={it.id || it.productId} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  {it.imageUrl && (
                                    <img
                                      src={it.imageUrl}
                                      alt={it.name}
                                      className="w-8 h-8 rounded-lg object-cover border border-cream-200"
                                    />
                                  )}
                                  <span className="font-medium text-ink-800 truncate max-w-xs">
                                    {it.name}
                                  </span>
                                  <span className="text-ink-400">x{it.quantity}</span>
                                </div>
                                <span className="font-semibold text-ink-900">
                                  {formatCurrency(it.price * it.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-cream-200 bg-cream-50/50 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="px-5 py-2 bg-ink-900 text-white text-xs font-bold rounded-xl hover:bg-ink-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT ROLE */}
      {roleEditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-cream-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-ink-900 text-base">Phân Quyền Người Dùng</h3>
                <p className="text-xs text-ink-500">{roleEditUser.fullName} ({roleEditUser.email})</p>
              </div>
            </div>

            <p className="text-xs text-ink-600 leading-relaxed">
              Chọn vai trò mới cho tài khoản này. Lưu ý tài khoản Quản trị viên (Admin) sẽ có toàn quyền truy cập bảng điều khiển và sửa đổi dữ liệu hệ thống.
            </p>

            <div className="space-y-2 pt-2">
              {[
                {
                  id: 'customer',
                  label: 'Khách hàng (Customer)',
                  desc: 'Mua hàng, xem đơn, đánh giá sản phẩm',
                },
                {
                  id: 'staff',
                  label: 'Nhân viên (Staff)',
                  desc: 'Quản lý đơn hàng, hỗ trợ khách hàng',
                },
                {
                  id: 'admin',
                  label: 'Quản trị viên (Admin)',
                  desc: 'Toàn quyền quản trị hệ thống, tài chính và phân quyền',
                },
              ].map((r) => (
                <label
                  key={r.id}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    selectedRole === r.id
                      ? 'border-accent-500 bg-accent-50/30'
                      : 'border-cream-200 hover:bg-cream-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="userRole"
                    value={r.id}
                    checked={selectedRole === r.id}
                    onChange={() => setSelectedRole(r.id as any)}
                    className="mt-0.5 text-accent-600 focus:ring-accent-500"
                  />
                  <div>
                    <span className="font-bold text-xs text-ink-900 block">{r.label}</span>
                    <span className="text-[11px] text-ink-500 leading-tight block">{r.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
              <button
                onClick={() => setRoleEditUser(null)}
                disabled={submittingRole}
                className="px-4 py-2 text-xs font-bold text-ink-600 hover:bg-cream-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={submittingRole}
                className="px-5 py-2 text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-2"
              >
                {submittingRole && <RefreshCw size={12} className="animate-spin" />}
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: TOGGLE STATUS (LOCK / UNLOCK) */}
      {statusToggleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-cream-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  statusToggleUser.status === 'active'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {statusToggleUser.status === 'active' ? <Lock size={20} /> : <Unlock size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-ink-900 text-base">
                  {statusToggleUser.status === 'active'
                    ? 'Khóa Tài Khoản Người Dùng'
                    : 'Mở Khóa Tài Khoản Người Dùng'}
                </h3>
                <p className="text-xs text-ink-500">{statusToggleUser.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-ink-600 leading-relaxed">
              {statusToggleUser.status === 'active'
                ? `Bạn có chắc chắn muốn khóa tài khoản "${statusToggleUser.email}"? Người dùng này sẽ không thể đăng nhập hoặc thực hiện đơn hàng mới cho đến khi được mở khóa.`
                : `Bạn có chắc chắn muốn mở khóa cho tài khoản "${statusToggleUser.email}"? Người dùng sẽ có thể đăng nhập bình thường.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-cream-200">
              <button
                onClick={() => setStatusToggleUser(null)}
                disabled={submittingStatus}
                className="px-4 py-2 text-xs font-bold text-ink-600 hover:bg-cream-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={submittingStatus}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-2 ${
                  statusToggleUser.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submittingStatus && <RefreshCw size={12} className="animate-spin" />}
                {statusToggleUser.status === 'active' ? 'Xác Nhận Khóa' : 'Xác Nhận Mở Khóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
