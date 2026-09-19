import { Router } from 'express';
import { ShippingController } from '../controllers/shipping.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.get('/ghn/provinces', ShippingController.getProvinces);
router.get('/ghn/districts/:provinceId', ShippingController.getDistricts);
router.get('/ghn/wards/:districtId', ShippingController.getWards);
router.post('/ghn/fee', ShippingController.calculateFee);
router.post('/ghn/create-order/:orderId', authenticateToken, requireAdmin, ShippingController.createGhnOrder);


export default router;
