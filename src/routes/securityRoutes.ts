import { Router } from 'express';
import {
  getModificationRequests,
  submitModificationRequest,
  reviewModificationRequest,
  implementModification,
  getDailySecurityChecklists,
  submitDailySecurityChecklist,
  getSecurityIncidents,
  reportSecurityIncident,
} from '../controllers/securityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Computer Modifications (OFF-004, 005, 006)
router.get('/modifications', getModificationRequests);
router.post('/modifications', submitModificationRequest);
router.put('/modifications/:id/review', authorize('manager', 'admin'), reviewModificationRequest);
router.put('/modifications/:id/implement', implementModification);

// Daily Security Checklists (OFF-008, 009, 010)
router.get('/checklists', getDailySecurityChecklists);
router.post('/checklists', submitDailySecurityChecklist);

// Security Incidents (OFF-012)
router.get('/incidents', getSecurityIncidents);
router.post('/incidents', reportSecurityIncident);

export default router;
