import { Request, Response } from 'express';
import { prescriptionService, PrescriptionService } from './prescription.service';
import { AuthRequest } from '../../shared/types';
import { logAuditEvent } from '../../middleware/audit';
import { PrescriptionSchema } from './prescription.validation';

export class PrescriptionController {
  constructor(private service: PrescriptionService = prescriptionService) {}

  getPrescriptions = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Doctor scope or admin role required.' });
      return;
    }

    const { patientId, status, startDate, endDate, search, page, limit } = req.query;

    const result = await this.service.listPrescriptions({
      doctorId: doctorId || undefined,
      patientId: patientId as string,
      status: status as string,
      startDate: startDate as string,
      endDate: endDate as string,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.json({
      success: true,
      data: result,
    });
  };

  getPrescriptionById = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const prescription = await this.service.getPrescriptionById(id, doctorId || '', isAdmin);
    res.json({
      success: true,
      data: prescription,
    });
  };

  createPrescription = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = PrescriptionSchema.parse(req.body);
    const prescription = await this.service.createPrescription(doctor, validated as any);

    await logAuditEvent(req, {
      action: prescription.status === 'FINALIZED' ? 'PRESCRIPTION_FINALIZE' : 'PRESCRIPTION_CREATE_DRAFT',
      resource: 'Prescription',
      resourceId: prescription._id.toString(),
      details: {
        prescriptionId: prescription.prescriptionId,
        patientName: prescription.patientSnapshot.name,
        status: prescription.status,
      },
    });

    res.status(201).json({
      success: true,
      message:
        prescription.status === 'FINALIZED'
          ? 'Prescription finalized successfully.'
          : 'Prescription saved as draft.',
      data: prescription,
    });
  };

  updatePrescription = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    const { id } = req.params;

    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = PrescriptionSchema.parse(req.body);
    const updated = await this.service.updatePrescription(id, doctor, validated as any);

    await logAuditEvent(req, {
      action: updated.status === 'FINALIZED' ? 'PRESCRIPTION_FINALIZE' : 'PRESCRIPTION_UPDATE_DRAFT',
      resource: 'Prescription',
      resourceId: updated._id.toString(),
      details: { prescriptionId: updated.prescriptionId, status: updated.status },
    });

    res.json({
      success: true,
      message:
        updated.status === 'FINALIZED'
          ? 'Prescription finalized successfully.'
          : 'Prescription draft updated.',
      data: updated,
    });
  };

  finalizePrescription = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    const { id } = req.params;

    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const finalized = await this.service.finalizePrescription(id, doctor._id);

    await logAuditEvent(req, {
      action: 'PRESCRIPTION_FINALIZE',
      resource: 'Prescription',
      resourceId: finalized._id.toString(),
      details: { prescriptionId: finalized.prescriptionId, status: finalized.status },
    });

    res.json({
      success: true,
      message: 'Prescription finalized successfully and locked against modification.',
      data: finalized,
    });
  };

  duplicatePrescription = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctor = req.doctor;
    const { id } = req.params;

    if (!doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const cloned = await this.service.clonePrescription(id, doctor);

    await logAuditEvent(req, {
      action: 'PRESCRIPTION_DUPLICATE',
      resource: 'Prescription',
      resourceId: cloned._id.toString(),
      details: { newId: cloned.prescriptionId },
    });

    res.status(201).json({
      success: true,
      message: 'Prescription cloned as a new draft ready for editing.',
      data: cloned,
    });
  };

  getPrescriptionByShareToken = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const publicData = await this.service.getPublicPrescriptionByShareToken(token);
    res.json({
      success: true,
      data: publicData,
    });
  };
}

export const prescriptionController = new PrescriptionController();
export const {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  updatePrescription,
  finalizePrescription,
  duplicatePrescription,
  getPrescriptionByShareToken,
} = prescriptionController;
