import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  updateMarkupMatrix,
  calculateItemPrice,
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getSettings);
router.put('/', authorize('manager', 'admin'), updateSettings);
router.put('/markup-matrix', authorize('manager', 'admin'), updateMarkupMatrix);
router.post('/calculate-price', calculateItemPrice);

export default router;
