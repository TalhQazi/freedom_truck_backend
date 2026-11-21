import { Router } from 'express';
import {
  createAuthorization,
  getAuthorizationsByRO,
} from '../controllers/authorizationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', authorize('service_writer', 'manager', 'admin'), createAuthorization);
router.get('/ro/:roId', getAuthorizationsByRO);

export default router;
