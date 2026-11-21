import { Router } from 'express';
import {
  login,
  register,
  getMe,
  getUsers,
  updateUserStatus,
  acknowledgePolicy,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', protect, authorize('admin', 'manager'), register);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);
router.put('/users/:id/status', protect, authorize('admin', 'manager'), updateUserStatus);
router.post('/acknowledge-policy', protect, acknowledgePolicy);

export default router;
