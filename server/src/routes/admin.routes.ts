import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { CategoryController } from '../controllers/category.controller';
import { OrderController } from '../controllers/order.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';
import analyticsRoutes from './analytics.routes';
import adminUserRoutes from './admin-user.routes';

const router = Router();

// Secure all admin routes
router.use(authenticateToken, requireAdmin);

// Product Admin
router.post('/products', ProductController.store);
router.put('/products/:id', ProductController.update);
router.delete('/products/:id', ProductController.destroy);

// Category Admin
router.post('/categories', CategoryController.store);
router.put('/categories/:id', CategoryController.update);
router.delete('/categories/:id', CategoryController.destroy);

// Order Admin
router.get('/orders', OrderController.index);
router.put('/orders/:id', OrderController.updateStatus);
router.post('/orders/:id/confirm-refund', OrderController.confirmRefund);

// Analytics & Reports Admin
router.use('/analytics', analyticsRoutes);

// User Management Admin
router.use('/users', adminUserRoutes);

export default router;
