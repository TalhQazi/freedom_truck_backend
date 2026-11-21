import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoiceFromRO,
  downloadInvoicePDF,
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/from-ro/:roId', authorize('service_writer', 'manager', 'admin'), createInvoiceFromRO);
router.get('/:id/pdf', downloadInvoicePDF);

export default router;
