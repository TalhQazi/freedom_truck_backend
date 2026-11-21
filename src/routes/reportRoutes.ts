import { Router } from 'express';
import {
  getDashboardStats,
  getFinancialReport,
  getAuditTrail,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/dashboard-stats', getDashboardStats);
router.get('/financial-summary', authorize('manager', 'admin', 'service_writer'), getFinancialReport);
router.get('/audit-trail', authorize('manager', 'admin'), getAuditTrail);

export default router;
