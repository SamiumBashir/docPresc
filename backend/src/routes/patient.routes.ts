import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientMedicalHistory,
} from '../controllers/patient.controller';
import { authenticate, requireDoctor } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.put('/:id', updatePatient);
router.get('/:id/history', getPatientMedicalHistory);

export default router;
