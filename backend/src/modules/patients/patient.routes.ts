import { Router } from 'express';
import { patientController } from './patient.controller';
import { authenticate, requireDoctor } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/', asyncHandler(patientController.getPatients));
router.post('/', asyncHandler(patientController.createPatient));
router.get('/:id', asyncHandler(patientController.getPatientById));
router.put('/:id', asyncHandler(patientController.updatePatient));
router.get('/:id/history', asyncHandler(patientController.getPatientMedicalHistory));
router.get('/:id/timeline', asyncHandler(patientController.getPatientMedicalHistory));

export default router;
