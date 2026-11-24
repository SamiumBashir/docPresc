import { Router } from 'express';
import { prescriptionController } from './prescription.controller';
import { authenticate, requireDoctor } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/', asyncHandler(prescriptionController.getPrescriptions));
router.post('/', asyncHandler(prescriptionController.createPrescription));
router.get('/:id', asyncHandler(prescriptionController.getPrescriptionById));
router.put('/:id', asyncHandler(prescriptionController.updatePrescription));
router.post('/:id/finalize', asyncHandler(prescriptionController.finalizePrescription));
router.post('/:id/clone', asyncHandler(prescriptionController.duplicatePrescription));
router.post('/:id/duplicate', asyncHandler(prescriptionController.duplicatePrescription));

export default router;
