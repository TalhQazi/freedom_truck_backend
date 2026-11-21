import { Router } from 'express';
import {
  getWorksheets,
  getWorksheetById,
  updateLightingInspection,
  updateLiftSafety,
  updateFullInspection,
  updateFluidsVerification,
  initialTechnicianSignoff,
  independentQCSignoff,
  updateExitObservation,
  serviceWriterReleaseVerification,
} from '../controllers/technicianController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/worksheets', getWorksheets);
router.get('/worksheets/:id', getWorksheetById);
router.put('/worksheets/:id/lighting', updateLightingInspection);
router.put('/worksheets/:id/lift', updateLiftSafety);
router.put('/worksheets/:id/inspection', updateFullInspection);
router.put('/worksheets/:id/fluids', updateFluidsVerification);
router.post('/worksheets/:id/tech1-signoff', initialTechnicianSignoff);
router.post(
  '/worksheets/:id/qc-signoff',
  authorize('qc_technician', 'technician', 'manager', 'admin'),
  independentQCSignoff
);
router.put('/worksheets/:id/exit-observation', updateExitObservation);
router.post(
  '/worksheets/:id/service-writer-release',
  authorize('service_writer', 'manager', 'admin'),
  serviceWriterReleaseVerification
);

export default router;
