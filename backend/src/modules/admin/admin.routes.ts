import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { asyncHandler } from '../../shared/utils/asyncHandler';

const router = Router();

// Doctor reports accessible to authenticated doctor or admin
router.get('/reports', authenticate, asyncHandler((req, res) => adminController.getDoctorReports(req, res)));

// Admin-only endpoints
router.get('/stats', authenticate, requireRole(['admin']), asyncHandler((req, res) => adminController.getAdminStats(req, res)));
router.get('/doctors', authenticate, requireRole(['admin']), asyncHandler((req, res) => adminController.getAdminDoctors(req, res)));
router.put('/doctors/:doctorId/status', authenticate, requireRole(['admin']), asyncHandler((req, res) => adminController.updateDoctorStatus(req, res)));
router.get('/audit-logs', authenticate, requireRole(['admin']), asyncHandler((req, res) => adminController.getAuditLogs(req, res)));

export default router;
