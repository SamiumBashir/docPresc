import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import medicineRoutes from './medicine.routes';
import prescriptionRoutes from './prescription.routes';
import chamberRoutes from './chamber.routes';
import templateRoutes from './template.routes';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/medicines', medicineRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/chambers', chamberRoutes);
router.use('/templates', templateRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);

export default router;
