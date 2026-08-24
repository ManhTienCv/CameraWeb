import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authController.register);
router.post('/send-register-otp', authController.sendRegisterOtp);
router.post('/register-with-otp', authController.registerWithOtp);
router.post('/login', authController.login);

// Authenticated routes
router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/send-change-email-otp', authenticateToken, authController.sendChangeEmailOtp);
router.post('/verify-change-email-otp', authenticateToken, authController.verifyChangeEmailOtp);
router.get('/addresses', authenticateToken, authController.getAddresses);
router.post('/addresses', authenticateToken, authController.createAddress);
router.put('/addresses/:id', authenticateToken, authController.updateAddress);
router.delete('/addresses/:id', authenticateToken, authController.deleteAddress);
router.get('/orders', authenticateToken, authController.getMyOrders);

export default router;
