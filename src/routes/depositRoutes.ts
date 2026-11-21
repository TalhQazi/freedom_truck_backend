import { Router } from 'express';
import {
  collectDeposit,
  getDepositsByRO,
} from '../controllers/depositController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', authorize('service_writer', 'manager', 'admin'), collectDeposit);
router.get('/ro/:roId', getDepositsByRO);

export default router;
