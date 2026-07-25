import { Router } from 'express';
import {
  getAdminStats,
  getAdminDoctors,
  updateDoctorStatus,
  getAuditLogs,
  getDoctorReports,
} from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Doctor reports accessible to authenticated doctor
router.get('/reports', authenticate, getDoctorReports);

// Admin-only endpoints
router.get('/stats', authenticate, requireRole(['admin']), getAdminStats);
router.get('/doctors', authenticate, requireRole(['admin']), getAdminDoctors);
router.put('/doctors/:doctorId/status', authenticate, requireRole(['admin']), updateDoctorStatus);
router.get('/audit-logs', authenticate, requireRole(['admin']), getAuditLogs);

export default router;
