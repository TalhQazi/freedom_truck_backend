import { Router } from 'express';
import {
  getDailyCashUps,
  getTodayCashSummary,
  submitDailyCashUp,
  managerReviewCashUp,
  downloadCashUpPDF,
} from '../controllers/cashUpController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getDailyCashUps);
router.get('/today', getTodayCashSummary);
router.post('/', authorize('service_writer', 'manager', 'admin'), submitDailyCashUp);
router.post('/:id/manager-review', authorize('manager', 'admin'), managerReviewCashUp);
router.get('/:id/pdf', downloadCashUpPDF);

export default router;
