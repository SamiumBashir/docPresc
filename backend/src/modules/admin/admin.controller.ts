import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { adminService } from './admin.service';
import { logAuditEvent } from '../../middleware/audit';

export class AdminController {
  async getAdminStats(req: AuthRequest, res: Response): Promise<void> {
    const data = await adminService.getStats();
    res.json({ success: true, data });
  }

  async getAdminDoctors(req: AuthRequest, res: Response): Promise<void> {
    const doctors = await adminService.getDoctors();
    res.json({ success: true, data: doctors });
  }

  async updateDoctorStatus(req: AuthRequest, res: Response): Promise<void> {
    const { doctorId } = req.params;
    const { status } = req.body;

    const doctor = await adminService.updateDoctorStatus(doctorId, status);

    await logAuditEvent(req, {
      action: 'ADMIN_UPDATE_DOCTOR_STATUS',
      resource: 'Doctor',
      resourceId: doctorId,
      details: { doctorName: doctor.name, newStatus: status },
    });

    res.json({
      success: true,
      message: `Doctor status updated to ${status}.`,
    });
  }

  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    const { page, limit, action, resource } = req.query;
    const data = await adminService.getAuditLogs({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      action: action as string,
      resource: resource as string,
    });

    res.json({ success: true, data });
  }

  async getDoctorReports(req: AuthRequest, res: Response): Promise<void> {
    const doctorId = req.doctor?._id;
    if (!doctorId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Doctor scope or admin role required.' });
      return;
    }

    const data = await adminService.getReports(doctorId);
    res.json({ success: true, data });
  }
}

export const adminController = new AdminController();
