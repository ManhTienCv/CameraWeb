import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Only admin can list all orders or manually confirm payment
router.get('/', authenticateToken, requireAdmin, OrderController.index);
router.post('/', OrderController.store);
router.get('/:id', OrderController.show);
router.post('/:id/confirm-payment', authenticateToken, requireAdmin, OrderController.confirmPayment);
router.post('/:id/cancel', OrderController.cancelOrder);


export default router;
