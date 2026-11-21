import { Router } from 'express';
import {
  getEstimates,
  getEstimateById,
  createEstimate,
  reviseEstimate,
  convertEstimateToRO,
} from '../controllers/estimateController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getEstimates);
router.get('/:id', getEstimateById);
router.post('/', authorize('service_writer', 'manager', 'admin'), createEstimate);
router.put('/:id', authorize('service_writer', 'manager', 'admin'), reviseEstimate);
router.post('/:id/convert-ro', authorize('service_writer', 'manager', 'admin'), convertEstimateToRO);

export default router;
