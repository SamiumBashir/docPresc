import { Router } from 'express';
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientMedicalHistory,
} from '../controllers/patient.controller';
import { foodChartController } from '../modules/food-charts';
import { therapyController } from '../modules/therapies';
import { authenticate, requireDoctor } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate, requireDoctor);

router.get('/', asyncHandler(getPatients));
router.post('/', asyncHandler(createPatient));
router.get('/:id', asyncHandler(getPatientById));
router.put('/:id', asyncHandler(updatePatient));
router.get('/:id/history', asyncHandler(getPatientMedicalHistory));
router.get('/:id/timeline', asyncHandler(getPatientMedicalHistory));
router.get('/:patientId/food-charts', asyncHandler(foodChartController.getPatientFoodCharts));
router.get('/:patientId/treatment-plans', asyncHandler(therapyController.getPatientTreatmentPlans));
router.get('/:patientId/treatment-history', asyncHandler(therapyController.getPatientTreatmentHistory));

export default router;
