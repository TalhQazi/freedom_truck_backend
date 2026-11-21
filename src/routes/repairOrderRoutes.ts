import { Router } from 'express';
import {
  getRepairOrders,
  getRepairOrderById,
  createIntakeRepairOrder,
  dispatchTechnician,
  updateROStatus,
  managerOverride,
} from '../controllers/repairOrderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getRepairOrders);
router.get('/:id', getRepairOrderById);
router.post('/intake', authorize('service_writer', 'manager', 'admin'), createIntakeRepairOrder);
router.post('/:id/dispatch', authorize('service_writer', 'manager', 'admin'), dispatchTechnician);
router.put('/:id/status', updateROStatus);
router.post('/:id/override', authorize('manager', 'admin'), managerOverride);

export default router;
