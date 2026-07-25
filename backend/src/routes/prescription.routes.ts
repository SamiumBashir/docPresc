import { Router } from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  duplicatePrescription,
} from '../controllers/prescription.controller';
import { authenticate, requireDoctor } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/', getPrescriptions);
router.post('/', createPrescription);
router.get('/:id', getPrescriptionById);
router.put('/:id', updatePrescription);
router.post('/:id/duplicate', duplicatePrescription);

export default router;
