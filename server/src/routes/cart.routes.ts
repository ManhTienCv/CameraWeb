import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';

const router = Router();

router.get('/', CartController.show);
router.post('/items', CartController.addItem);
router.put('/items/:id', CartController.updateItem);
router.delete('/items/:id', CartController.removeItem);
router.delete('/', CartController.clear);

export default router;
