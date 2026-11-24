import { Router } from 'express';
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  duplicatePrescription,
  finalizePrescription,
} from '../controllers/prescription.controller';
import { authenticate, requireDoctor } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/', asyncHandler(getPrescriptions));
router.post('/', asyncHandler(createPrescription));
router.get('/:id', asyncHandler(getPrescriptionById));
router.put('/:id', asyncHandler(updatePrescription));
router.post('/:id/finalize', asyncHandler(finalizePrescription));
router.post('/:id/clone', asyncHandler(duplicatePrescription));
router.post('/:id/duplicate', asyncHandler(duplicatePrescription));

export default router;
