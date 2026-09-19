import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';

export const AdminUserController = {
  // 1. GET /api/v1/admin/users - Danh sách người dùng phân trang kèm bộ lọc
  getUsers: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
      const search = (req.query.search as string || '').trim().toLowerCase();
      const roleFilter = (req.query.role as string || 'all').trim().toLowerCase();
      const statusFilter = (req.query.status as string || 'all').trim().toLowerCase();

      // Build where conditions
      const where: any = {};

      if (roleFilter !== 'all' && ['admin', 'staff', 'customer'].includes(roleFilter)) {
        where.role = roleFilter;
      }

      if (statusFilter !== 'all' && ['active', 'blocked'].includes(statusFilter)) {
        where.status = statusFilter;
      }

      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const totalUsers = await prisma.user.count({ where });
      const totalPages = Math.ceil(totalUsers / limit);

      const users = await prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          addresses: {
            where: { isDefault: true },
            take: 1,
            select: {
              address: true,
              city: true,
            },
          },
          orders: {
            select: {
              id: true,
              orderCode: true,
              totalAmount: true,
              orderStatus: true,
              paymentStatus: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      const formattedUsers = users.map((u) => {
        const completedOrders = u.orders.filter(
          (o) => o.orderStatus !== 'cancelled' && (o.paymentStatus === 'completed' || o.orderStatus === 'completed')
        );
        const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const defaultAddress = u.addresses[0];

        return {
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          role: u.role,
          status: u.status,
          createdAt: u.createdAt,
          defaultAddress: defaultAddress ? `${defaultAddress.address}, ${defaultAddress.city}` : null,
          orderCount: u.orders.length,
          completedOrderCount: completedOrders.length,
          totalSpent,
          lastOrderDate: u.orders[0]?.createdAt || null,
        };
      });

      res.json({
        data: formattedUsers,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Admin get users error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách người dùng.' });
    }
  },

  // 2. GET /api/v1/admin/users/:id - Chi tiết người dùng & lịch sử mua hàng
  getUserDetail: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          addresses: true,
          orders: {
            include: {
              items: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        res.status(404).json({ message: 'Không tìm thấy người dùng này trong hệ thống.' });
        return;
      }

      const completedOrders = user.orders.filter(
        (o) => o.orderStatus !== 'cancelled' && (o.paymentStatus === 'completed' || o.orderStatus === 'completed')
      );
      const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          addresses: user.addresses,
          totalOrders: user.orders.length,
          totalSpent,
          orders: user.orders,
        },
      });
    } catch (error) {
      console.error('Admin get user detail error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin chi tiết người dùng.' });
    }
  },

  // 3. PUT /api/v1/admin/users/:id/role - Phân quyền tài khoản
  updateUserRole: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!['admin', 'staff', 'customer'].includes(role)) {
        res.status(400).json({ message: 'Vai trò không hợp lệ (chỉ chấp nhận admin, staff, customer).' });
        return;
      }

      // Safeguard: Prevent admin from changing their own role
      if (req.user?.userId === id && role !== 'admin') {
        res.status(400).json({ message: 'Bạn không thể tự hạ quyền quản trị viên của chính mình!' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
        },
      });

      res.json({
        message: `Đã cập nhật vai trò của ${updatedUser.fullName} thành ${role}.`,
        user: updatedUser,
      });
    } catch (error) {
      console.error('Admin update user role error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật vai trò người dùng.' });
    }
  },

  // 4. PUT /api/v1/admin/users/:id/status - Khóa / Mở khóa tài khoản
  toggleUserStatus: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'blocked'].includes(status)) {
        res.status(400).json({ message: 'Trạng thái không hợp lệ (chỉ chấp nhận active hoặc blocked).' });
        return;
      }

      // Safeguard: Prevent admin from locking their own account
      if (req.user?.userId === id && status === 'blocked') {
        res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản quản trị viên của chính mình!' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
        },
      });

      res.json({
        message: status === 'blocked'
          ? `Đã khóa tài khoản của ${updatedUser.fullName}.`
          : `Đã kích hoạt lại tài khoản của ${updatedUser.fullName}.`,
        user: updatedUser,
      });
    } catch (error) {
      console.error('Admin toggle user status error:', error);
      res.status(500).json({ message: 'Lỗi máy chủ khi thay đổi trạng thái tài khoản.' });
    }
  },
};
