import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện thao tác này.' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Truy cập bị từ chối. Chỉ dành cho Quản trị viên.' });
    return;
  }

  next();
};
