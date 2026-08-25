import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Quyền truy cập bị từ chối. Vui lòng đăng nhập bằng tài khoản Quản trị viên.' });
    return;
  }

  next();
};
