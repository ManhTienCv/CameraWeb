import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

router.post('/momo/create', PaymentController.createMomoPayment);
router.post('/momo/pay-again', PaymentController.payAgain);
router.get('/momo/callback', PaymentController.handleMomoCallback);
router.post('/momo/ipn', PaymentController.handleMomoIpn);

export default router;
