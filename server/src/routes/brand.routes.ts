import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';

const router = Router();

router.get('/', BrandController.index);

export default router;
