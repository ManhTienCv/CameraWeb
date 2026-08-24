import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/', ProductController.index);
router.get('/featured', ProductController.featured);
router.get('/search', ProductController.search);
router.get('/:slug', ProductController.show);

export default router;
