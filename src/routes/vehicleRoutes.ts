import { Router } from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
} from '../controllers/vehicleController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);

export default router;
