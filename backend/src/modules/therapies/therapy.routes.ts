import { Router } from 'express';
import { authenticate, requireDoctor, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';
import { therapyController } from './therapy.controller';

const router = Router();

router.use(authenticate);

// Overview & Role Metrics (doctor | staff | admin)
router.get(
  '/overview',
  requireRole(['doctor', 'staff', 'admin']),
  asyncHandler(therapyController.getOverview)
);

// Categories (read: all authenticated clinicians/staff/admin; write: admin only)
router.get(
  '/categories',
  requireRole(['doctor', 'staff', 'admin']),
  asyncHandler(therapyController.getCategories)
);
router.post(
  '/categories',
  requireRole(['admin']),
  asyncHandler(therapyController.createCategory)
);

// Therapy Catalog & Clinical Verification (read: doctor/staff/admin; manage/verify: admin only)
router.get(
  '/catalog',
  requireRole(['doctor', 'staff', 'admin']),
  asyncHandler(therapyController.getCatalog)
);
router.get(
  '/catalog/:id',
  requireRole(['doctor', 'staff', 'admin']),
  asyncHandler(therapyController.getTherapyById)
);
router.post(
  '/catalog',
  requireRole(['admin']),
  asyncHandler(therapyController.createTherapy)
);
router.put(
  '/catalog/:id',
  requireRole(['admin']),
  asyncHandler(therapyController.updateTherapy)
);
router.patch(
  '/catalog/:id/status',
  requireRole(['admin']),
  asyncHandler(therapyController.toggleTherapyStatus)
);
router.post(
  '/catalog/:id/verify',
  requireRole(['admin']),
  asyncHandler(therapyController.verifyTherapy)
);

// Authorized Practitioners (read active: doctor/staff/admin; manage staff accounts: admin only)
router.get(
  '/practitioners',
  requireRole(['doctor', 'staff', 'admin']),
  asyncHandler(therapyController.getPractitioners)
);
router.post(
  '/practitioners',
  requireRole(['admin']),
  asyncHandler(therapyController.createPractitioner)
);
router.patch(
  '/practitioners/:id',
  requireRole(['admin']),
  asyncHandler(therapyController.updatePractitioner)
);

// Patient Treatment History & Plans (doctor ownership strictly enforced)
router.get(
  '/patients/:patientId/plans',
  requireDoctor,
  asyncHandler(therapyController.getPatientTreatmentPlans)
);
router.get(
  '/patients/:patientId/history',
  requireDoctor,
  asyncHandler(therapyController.getPatientTreatmentHistory)
);

// Treatment Plans (read/PDF: owning doctor or assigned staff; create/update/finalize: doctor)
router.get(
  '/plans',
  requireRole(['doctor', 'staff']),
  asyncHandler(therapyController.getTreatmentPlans)
);
router.post(
  '/plans',
  requireDoctor,
  asyncHandler(therapyController.createTreatmentPlan)
);
router.get(
  '/plans/:id',
  requireRole(['doctor', 'staff']),
  asyncHandler(therapyController.getTreatmentPlanById)
);
router.get(
  '/plans/:id/pdf',
  requireRole(['doctor', 'staff']),
  asyncHandler(therapyController.downloadTreatmentPlanPdf)
);
router.put(
  '/plans/:id',
  requireDoctor,
  asyncHandler(therapyController.updateTreatmentPlan)
);
router.post(
  '/plans/:id/finalize',
  requireDoctor,
  asyncHandler(therapyController.finalizeTreatmentPlan)
);

// Sessions (list/update: owning doctor or assigned staff; create/delete non-completed: doctor)
router.post(
  '/plans/:planId/sessions',
  requireDoctor,
  asyncHandler(therapyController.createSessionsForPlan)
);
router.get(
  '/sessions',
  requireRole(['doctor', 'staff']),
  asyncHandler(therapyController.getSessions)
);
router.patch(
  '/sessions/:id',
  requireRole(['doctor', 'staff']),
  asyncHandler(therapyController.updateSession)
);
router.delete(
  '/sessions/:id',
  requireDoctor,
  asyncHandler(therapyController.deleteSession)
);

export default router;
