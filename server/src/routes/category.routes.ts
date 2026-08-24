import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';

const router = Router();

router.get('/', CategoryController.index);
router.get('/:slug', CategoryController.show);

export default router;
