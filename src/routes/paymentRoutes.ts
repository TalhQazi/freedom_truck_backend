import { Router } from 'express';
import {
  processPayment,
  signOfficeReceipt,
  getPaymentReceipt,
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', authorize('service_writer', 'manager', 'admin'), processPayment);
router.post('/:paymentId/sign-office', signOfficeReceipt);
router.get('/receipt/:paymentId', getPaymentReceipt);

export default router;
