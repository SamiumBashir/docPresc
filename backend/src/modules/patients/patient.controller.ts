import { Response } from 'express';
import { patientService, PatientService } from './patient.service';
import { AuthRequest } from '../../shared/types';
import { logAuditEvent } from '../../middleware/audit';
import { PatientSchema } from './patient.validation';

export class PatientController {
  constructor(private service: PatientService = patientService) {}

  getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Doctor scope or admin role required.' });
      return;
    }

    const { search, page, limit } = req.query;
    const result = await this.service.listPatients({
      doctorId: doctorId || '',
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });

    res.json({
      success: true,
      data: result,
    });
  };

  getPatientById = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const patient = await this.service.getPatientById(id, doctorId || '', isAdmin);
    res.json({
      success: true,
      data: patient,
    });
  };

  createPatient = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = PatientSchema.parse(req.body);
    const patient = await this.service.createPatient(validated, doctorId);

    await logAuditEvent(req, {
      action: 'PATIENT_CREATE',
      resource: 'Patient',
      resourceId: patient._id.toString(),
      details: { patientId: patient.patientId, name: patient.name, phone: patient.phone },
    });

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully.',
      data: patient,
    });
  };

  updatePatient = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    const { id } = req.params;

    if (!doctorId) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = PatientSchema.parse(req.body);
    const patient = await this.service.updatePatient(id, doctorId, validated);

    await logAuditEvent(req, {
      action: 'PATIENT_UPDATE',
      resource: 'Patient',
      resourceId: patient._id.toString(),
    });

    res.json({
      success: true,
      message: 'Patient updated successfully.',
      data: patient,
    });
  };

  getPatientMedicalHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    const doctorId = req.doctor?._id;
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const historyData = await this.service.getPatientMedicalHistory(id, doctorId || '', isAdmin);
    res.json({
      success: true,
      data: historyData,
    });
  };
}

export const patientController = new PatientController();
export const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  getPatientMedicalHistory,
} = patientController;
