import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';

const router = Router();

router.post('/', OrderController.store);
router.get('/:id', OrderController.show);
router.post('/:id/confirm-payment', OrderController.confirmPayment);

export default router;
