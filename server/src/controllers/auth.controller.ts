import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { emailService } from '../lib/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'camerahub-super-secret-key-2026';

interface OtpEntry {
  otp: string;
  expiresAt: number;
  data?: any;
}
const otpStore = new Map<string, OtpEntry>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const authController = {
  // 1. REGISTER
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, fullName, phone } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({ message: 'Vui lòng điền đầy đủ email, mật khẩu và họ tên.' });
        return;
      }

      const existing = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existing) {
        res.status(400).json({ message: 'Email này đã được đăng ký trên hệ thống.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          fullName: fullName.trim(),
          phone: phone?.trim() || null,
          role: 'customer',
        },
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Đăng ký tài khoản thành công!',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Lỗi server khi đăng ký tài khoản.' });
    }
  },

  // 1.1 SEND REGISTER OTP
  sendRegisterOtp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, fullName } = req.body;

      if (!email) {
        res.status(400).json({ message: 'Vui lòng nhập địa chỉ email.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        res.status(400).json({ message: 'Email này đã được đăng ký tài khoản trên hệ thống.' });
        return;
      }

      const otp = generateOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins
      const otpKey = `reg:${cleanEmail}`;
      otpStore.set(otpKey, { otp, expiresAt });

      // Tự động xóa OTP khỏi RAM sau 5 phút để chống Memory Leak
      setTimeout(() => {
        if (otpStore.has(otpKey)) {
          otpStore.delete(otpKey);
        }
      }, 5 * 60 * 1000);

      // Send OTP via SMTP
      await emailService.sendOtpEmail({
        toEmail: cleanEmail,
        otpCode: otp,
        purpose: 'register',
        recipientName: fullName || cleanEmail,
      });

      res.json({
        message: 'Mã xác thực OTP đã được gửi tới hòm thư email của bạn.',
        email: cleanEmail,
      });
    } catch (error) {
      console.error('Send register OTP error:', error);
      res.status(500).json({ message: 'Lỗi server khi gửi mã OTP.' });
    }
  },

  // 1.2 REGISTER WITH OTP
  registerWithOtp: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, fullName, phone, otp } = req.body;

      if (!email || !password || !fullName || !otp) {
        res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin và mã OTP.' });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const cached = otpStore.get(`reg:${cleanEmail}`);

      if (!cached || cached.otp !== otp.trim()) {
        res.status(400).json({ message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' });
        return;
      }

      if (Date.now() > cached.expiresAt) {
        otpStore.delete(`reg:${cleanEmail}`);
        res.status(400).json({ message: 'Mã OTP đã hết hạn (5 phút). Vui lòng yêu cầu mã mới.' });
        return;
      }

      // Check duplicate again
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existing) {
        res.status(400).json({ message: 'Email này đã được đăng ký trên hệ thống.' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash,
          fullName: fullName.trim(),
          phone: phone?.trim() || null,
          role: 'customer',
        },
      });

      // Clear OTP
      otpStore.delete(`reg:${cleanEmail}`);

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Xác thực OTP & Đăng ký tài khoản thành công!',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Register with OTP error:', error);
      res.status(500).json({ message: 'Lỗi server khi đăng ký tài khoản.' });
    }
  },

  // 2. LOGIN
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Đăng nhập thành công!',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
    }
  },

  // 3. GET PROFILE
  getProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          addresses: { orderBy: { isDefault: 'desc' } },
          _count: { select: { orders: true, addresses: true } },
        },
      });

      if (!user) {
        res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        addresses: user.addresses,
        totalOrders: user._count.orders,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Lỗi server khi lấy thông tin tài khoản.' });
    }
  },

  // 4. UPDATE PROFILE
  updateProfile: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { fullName, phone, avatarUrl, currentPassword, newPassword } = req.body;

      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        return;
      }

      let passwordHash = user.passwordHash;
      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.' });
          return;
        }
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
          res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
          return;
        }
        passwordHash = await bcrypt.hash(newPassword, 10);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: fullName ? fullName.trim() : user.fullName,
          phone: phone !== undefined ? phone.trim() : user.phone,
          avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
          passwordHash,
        },
      });

      res.json({
        message: 'Cập nhật thông tin thành công!',
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          phone: updated.phone,
          avatarUrl: updated.avatarUrl,
          role: updated.role,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ.' });
    }
  },

  // 4.1 SEND CHANGE EMAIL OTP
  sendChangeEmailOtp: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { newEmail } = req.body;

      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      if (!newEmail) {
        res.status(400).json({ message: 'Vui lòng nhập địa chỉ email mới.' });
        return;
      }

      const cleanEmail = newEmail.toLowerCase().trim();
      const existing = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existing) {
        res.status(400).json({ message: 'Địa chỉ email này đã có tài khoản khác sử dụng.' });
        return;
      }

      const otp = generateOtp();
      const expiresAt = Date.now() + 5 * 60 * 1000;
      const otpKey = `change_email:${userId}`;
      otpStore.set(otpKey, { otp, expiresAt, data: { newEmail: cleanEmail } });

      setTimeout(() => {
        if (otpStore.has(otpKey)) {
          otpStore.delete(otpKey);
        }
      }, 5 * 60 * 1000);

      await emailService.sendOtpEmail({
        toEmail: cleanEmail,
        otpCode: otp,
        purpose: 'change_email',
      });

      res.json({
        message: 'Mã xác thực OTP đã được gửi đến email mới. Vui lòng kiểm tra hộp thư.',
        newEmail: cleanEmail,
      });
    } catch (error) {
      console.error('Send change email OTP error:', error);
      res.status(500).json({ message: 'Lỗi server khi gửi mã OTP đổi email.' });
    }
  },

  // 4.2 VERIFY CHANGE EMAIL OTP
  verifyChangeEmailOtp: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { newEmail, otp } = req.body;

      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      if (!newEmail || !otp) {
        res.status(400).json({ message: 'Vui lòng nhập đầy đủ email mới và mã OTP.' });
        return;
      }

      const cleanEmail = newEmail.toLowerCase().trim();
      const cached = otpStore.get(`change_email:${userId}`);

      if (!cached || cached.otp !== otp.trim() || cached.data?.newEmail !== cleanEmail) {
        res.status(400).json({ message: 'Mã OTP không chính xác hoặc không khớp với email mới.' });
        return;
      }

      if (Date.now() > cached.expiresAt) {
        otpStore.delete(`change_email:${userId}`);
        res.status(400).json({ message: 'Mã OTP đã hết hạn (5 phút). Vui lòng gửi lại mã mới.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { email: cleanEmail },
      });

      otpStore.delete(`change_email:${userId}`);

      res.json({
        message: 'Cập nhật địa chỉ email thành công!',
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          phone: updated.phone,
          avatarUrl: updated.avatarUrl,
          role: updated.role,
        },
      });
    } catch (error) {
      console.error('Verify change email OTP error:', error);
      res.status(500).json({ message: 'Lỗi server khi xác thực OTP đổi email.' });
    }
  },

  // 5. GET ADDRESSES
  getAddresses: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      const addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      res.json(addresses);
    } catch (error) {
      console.error('Get addresses error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách địa chỉ.' });
    }
  },

  // 6. CREATE ADDRESS
  createAddress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { label, recipientName, phone, address, city, isDefault } = req.body;

      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      if (!recipientName || !phone || !address) {
        res.status(400).json({ message: 'Vui lòng điền đủ tên người nhận, số điện thoại và địa chỉ.' });
        return;
      }

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      const count = await prisma.address.count({ where: { userId } });
      const makeDefault = isDefault || count === 0;

      const newAddress = await prisma.address.create({
        data: {
          userId,
          label: label || 'Nhà riêng',
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city?.trim() || 'TP. Hồ Chí Minh',
          isDefault: makeDefault,
        },
      });

      res.status(201).json({
        message: 'Thêm địa chỉ nhận hàng thành công!',
        address: newAddress,
      });
    } catch (error) {
      console.error('Create address error:', error);
      res.status(500).json({ message: 'Lỗi khi thêm địa chỉ nhận hàng.' });
    }
  },

  // 7. UPDATE ADDRESS
  updateAddress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { label, recipientName, phone, address, city, isDefault } = req.body;

      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      const existing = await prisma.address.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy địa chỉ này.' });
        return;
      }

      if (isDefault) {
        await prisma.address.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await prisma.address.update({
        where: { id },
        data: {
          label: label !== undefined ? label : existing.label,
          recipientName: recipientName ? recipientName.trim() : existing.recipientName,
          phone: phone ? phone.trim() : existing.phone,
          address: address ? address.trim() : existing.address,
          city: city ? city.trim() : existing.city,
          isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
        },
      });

      res.json({
        message: 'Cập nhật địa chỉ thành công!',
        address: updated,
      });
    } catch (error) {
      console.error('Update address error:', error);
      res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ.' });
    }
  },

  // 8. DELETE ADDRESS
  deleteAddress: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      const existing = await prisma.address.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        res.status(404).json({ message: 'Không tìm thấy địa chỉ này.' });
        return;
      }

      await prisma.address.delete({ where: { id } });

      res.json({ message: 'Xóa địa chỉ thành công!' });
    } catch (error) {
      console.error('Delete address error:', error);
      res.status(500).json({ message: 'Lỗi khi xóa địa chỉ.' });
    }
  },

  // 9. GET MY ORDERS
  getMyOrders: async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const email = req.user?.email;

      if (!userId) {
        res.status(401).json({ message: 'Chưa đăng nhập.' });
        return;
      }

      const orders = await prisma.order.findMany({
        where: {
          OR: [{ userId }, { customerEmail: email }],
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(orders);
    } catch (error) {
      console.error('Get my orders error:', error);
      res.status(500).json({ message: 'Lỗi khi lấy danh sách đơn hàng.' });
    }
  },
};
