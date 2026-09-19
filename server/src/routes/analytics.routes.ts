import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Secure all analytics routes with Admin authentication
router.use(authenticateToken, requireAdmin);

router.get('/overview', AnalyticsController.getOverviewStats);
router.get('/revenue-trend', AnalyticsController.getRevenueTrend);
router.get('/monthly', AnalyticsController.getMonthlyRevenue);
router.get('/categories', AnalyticsController.getCategoryDistribution);
router.get('/payment-methods', AnalyticsController.getPaymentMethodStats);
router.get('/order-statuses', AnalyticsController.getOrderStatusStats);
router.get('/top-products', AnalyticsController.getTopProducts);

export default router;
