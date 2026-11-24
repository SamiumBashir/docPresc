import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { getPrescriptionByShareToken } from '../controllers/prescription.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Rate limiting on public prescription verification: 60 requests per 15 minutes per IP
const publicShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

router.get('/prescriptions/share/:token', publicShareLimiter, asyncHandler(getPrescriptionByShareToken));
router.get('/prescriptions/:token', publicShareLimiter, asyncHandler(getPrescriptionByShareToken));

export default router;
