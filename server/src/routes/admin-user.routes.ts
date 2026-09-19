import { Router } from 'express';
import { AdminUserController } from '../controllers/admin-user.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Secure all user management routes with Admin authentication
router.use(authenticateToken, requireAdmin);

router.get('/', AdminUserController.getUsers);
router.get('/:id', AdminUserController.getUserDetail);
router.put('/:id/role', AdminUserController.updateUserRole);
router.put('/:id/status', AdminUserController.toggleUserStatus);

export default router;
