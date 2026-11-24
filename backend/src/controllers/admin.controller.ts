import { adminController } from '../modules/admin/admin.controller';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

export const getAdminStats = (req: AuthRequest, res: Response) => adminController.getAdminStats(req, res);
export const getAdminDoctors = (req: AuthRequest, res: Response) => adminController.getAdminDoctors(req, res);
export const updateDoctorStatus = (req: AuthRequest, res: Response) => adminController.updateDoctorStatus(req, res);
export const getAuditLogs = (req: AuthRequest, res: Response) => adminController.getAuditLogs(req, res);
export const getDoctorReports = (req: AuthRequest, res: Response) => adminController.getDoctorReports(req, res);
