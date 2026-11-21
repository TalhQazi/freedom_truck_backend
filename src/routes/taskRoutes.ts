import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  updateTaskStatus,
  reviewTask,
  addTaskComment,
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id/status', updateTaskStatus);
router.post('/:id/review', authorize('manager', 'admin'), reviewTask);
router.post('/:id/comments', addTaskComment);

export default router;
