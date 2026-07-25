import { Router } from 'express';
import { getPrescriptionByShareToken } from '../controllers/prescription.controller';

const router = Router();

router.get('/prescriptions/share/:token', getPrescriptionByShareToken);

export default router;
