import { Response } from 'express';
import { AuthRequest } from '../../shared/types';
import { logAuditEvent } from '../../middleware/audit';
import { therapyService, TherapyService } from './therapy.service';
import { renderTreatmentPlanPdf } from './therapy.pdf';
import {
  CreatePractitionerSchema,
  CreateSessionsSchema,
  CreateTherapyCategorySchema,
  CreateTherapySchema,
  CreateTreatmentPlanSchema,
  ToggleTherapyStatusSchema,
  UpdatePractitionerSchema,
  UpdateSessionSchema,
  UpdateTherapySchema,
  UpdateTreatmentPlanSchema,
  VerifyTherapySchema,
} from './therapy.validation';
import {
  CreatePractitionerDTO,
  CreateSessionsDTO,
  CreateTherapyCategoryDTO,
  CreateTherapyDTO,
  CreateTreatmentPlanDTO,
  TherapySessionStatus,
  TherapyVerificationStatus,
  ToggleTherapyStatusDTO,
  TreatmentPlanStatus,
  UpdatePractitionerDTO,
  UpdateSessionDTO,
  UpdateTherapyDTO,
  UpdateTreatmentPlanDTO,
  VerifyTherapyDTO,
} from './therapy.types';

const sanitizeFilenamePart = (val?: string): string =>
  (val || 'PATIENT')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'PATIENT';

/**
 * Audit details intentionally store ONLY safe structural metadata —
 * never clinical notes, indications, feedback, or ED details.
 */
const buildPlanAuditDetails = (plan: {
  chartNumber: string;
  status: string;
  isEdPlan: boolean;
  version: number;
}) => ({
  chartNumber: plan.chartNumber,
  status: plan.status,
  isEdPlan: Boolean(plan.isEdPlan),
  version: plan.version,
});

export class TherapyController {
  constructor(private service: TherapyService = therapyService) {}

  getOverview = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const overview = await this.service.getOverview(req.user, req.doctor);
    res.json({ success: true, data: overview });
  };

  getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
    const onlyActive = req.query.onlyActive === 'true';
    const categories = await this.service.getCategories(onlyActive);
    res.json({ success: true, data: categories });
  };

  createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
    const validated = CreateTherapyCategorySchema.parse(req.body) as CreateTherapyCategoryDTO;
    const category = await this.service.createCategory(validated);

    await logAuditEvent(req, {
      action: 'THERAPY_CATEGORY_CREATE',
      resource: 'TherapyCategory',
      resourceId: category._id.toString(),
      details: { key: category.key, name: category.name },
    });

    res.status(201).json({
      success: true,
      message: 'Therapy category created.',
      data: category,
    });
  };

  getCatalog = async (req: AuthRequest, res: Response): Promise<void> => {
    const { section, categoryId, verificationStatus, isActive, isAvailable, search, page, limit } =
      req.query;

    const result = await this.service.listCatalog({
      section: section === 'ed' || section === 'main' ? section : 'all',
      categoryId: typeof categoryId === 'string' && categoryId ? categoryId : undefined,
      verificationStatus:
        typeof verificationStatus === 'string' && verificationStatus
          ? (verificationStatus as TherapyVerificationStatus)
          : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 100,
    });

    res.json({ success: true, data: result });
  };

  getTherapyById = async (req: AuthRequest, res: Response): Promise<void> => {
    const therapy = await this.service.getTherapyById(req.params.id);
    res.json({ success: true, data: therapy });
  };

  createTherapy = async (req: AuthRequest, res: Response): Promise<void> => {
    const validated = CreateTherapySchema.parse(req.body) as CreateTherapyDTO;
    const created = await this.service.createTherapy(validated);

    await logAuditEvent(req, {
      action: 'THERAPY_CREATE',
      resource: 'Therapy',
      resourceId: created._id.toString(),
      details: {
        key: created.key,
        name: created.name,
        isEdTreatment: created.isEdTreatment,
        verificationStatus: created.verificationStatus,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Therapy added to catalog pending clinical verification.',
      data: created,
    });
  };

  updateTherapy = async (req: AuthRequest, res: Response): Promise<void> => {
    const validated = UpdateTherapySchema.parse(req.body) as UpdateTherapyDTO;
    const updated = await this.service.updateTherapy(req.params.id, validated);

    await logAuditEvent(req, {
      action: 'THERAPY_UPDATE',
      resource: 'Therapy',
      resourceId: updated._id.toString(),
      details: {
        key: updated.key,
        name: updated.name,
        verificationStatus: updated.verificationStatus,
      },
    });

    res.json({
      success: true,
      message: 'Therapy catalog entry updated.',
      data: updated,
    });
  };

  toggleTherapyStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    const validated = ToggleTherapyStatusSchema.parse(req.body) as ToggleTherapyStatusDTO;
    const updated = await this.service.toggleTherapyStatus(req.params.id, validated);

    await logAuditEvent(req, {
      action: 'THERAPY_STATUS_TOGGLE',
      resource: 'Therapy',
      resourceId: updated._id.toString(),
      details: {
        key: updated.key,
        isActive: updated.isActive,
        isAvailable: updated.isAvailable,
      },
    });

    res.json({
      success: true,
      message: updated.isActive ? 'Therapy service enabled.' : 'Therapy service disabled.',
      data: updated,
    });
  };

  verifyTherapy = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const validated = VerifyTherapySchema.parse(req.body) as VerifyTherapyDTO;
    const verified = await this.service.verifyTherapy(req.params.id, req.user, validated);

    await logAuditEvent(req, {
      action: 'THERAPY_VERIFY',
      resource: 'Therapy',
      resourceId: verified._id.toString(),
      details: {
        key: verified.key,
        verificationStatus: verified.verificationStatus,
        verifiedBy: req.user.name,
      },
    });

    res.json({
      success: true,
      message: `Therapy verification status updated to ${verified.verificationStatus}.`,
      data: verified,
    });
  };

  // Practitioners
  getPractitioners = async (req: AuthRequest, res: Response): Promise<void> => {
    const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === 'true';
    const practitioners = await this.service.listPractitioners(includeInactive);
    res.json({ success: true, data: practitioners });
  };

  createPractitioner = async (req: AuthRequest, res: Response): Promise<void> => {
    const validated = CreatePractitionerSchema.parse(req.body) as CreatePractitionerDTO;
    const created = await this.service.createPractitioner(validated);

    await logAuditEvent(req, {
      action: 'PRACTITIONER_CREATE',
      resource: 'User',
      resourceId: created._id.toString(),
      details: { name: created.name, role: created.role },
    });

    res.status(201).json({
      success: true,
      message: 'Authorized therapy practitioner account created.',
      data: created,
    });
  };

  updatePractitioner = async (req: AuthRequest, res: Response): Promise<void> => {
    const validated = UpdatePractitionerSchema.parse(req.body) as UpdatePractitionerDTO;
    const updated = await this.service.updatePractitioner(req.params.id, validated);

    await logAuditEvent(req, {
      action: 'PRACTITIONER_UPDATE',
      resource: 'User',
      resourceId: updated._id.toString(),
      details: {
        status: updated.status,
        isAuthorizedPractitioner: updated.isAuthorizedPractitioner,
      },
    });

    res.json({
      success: true,
      message: 'Practitioner authorization updated.',
      data: updated,
    });
  };

  // Treatment Plans
  getTreatmentPlans = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    if (req.user.role !== 'doctor' && req.user.role !== 'staff') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only clinicians and assigned staff may browse clinical plans.',
      });
      return;
    }

    const { patientId, therapyId, status, isEdPlan, search, page, limit } = req.query;

    const result = await this.service.listTreatmentPlans({
      doctorId: req.user.role === 'doctor' ? req.doctor?._id : undefined,
      assignedPractitionerId: req.user.role === 'staff' ? req.user._id : undefined,
      patientId: typeof patientId === 'string' && patientId ? patientId : undefined,
      therapyId: typeof therapyId === 'string' && therapyId ? therapyId : undefined,
      isEdPlan: isEdPlan === 'true' ? true : isEdPlan === 'false' ? false : undefined,
      status:
        typeof status === 'string' && status ? (status as TreatmentPlanStatus) : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });

    res.json({ success: true, data: result });
  };

  getPatientTreatmentPlans = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor?._id) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const patientId = req.params.patientId || req.params.id;
    const plans = await this.service.listPatientTreatmentPlans(patientId, req.doctor._id);
    res.json({ success: true, data: plans });
  };

  getPatientTreatmentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor?._id) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const patientId = req.params.patientId || req.params.id;
    const history = await this.service.getPatientTreatmentHistory(patientId, req.doctor._id);
    res.json({ success: true, data: history });
  };

  getTreatmentPlanById = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const detail = await this.service.getTreatmentPlanDetail(req.params.id, req.user, req.doctor);

    await logAuditEvent(req, {
      action: 'TREATMENT_PLAN_VIEW',
      resource: 'TreatmentPlan',
      resourceId: detail.plan._id.toString(),
      details: buildPlanAuditDetails(detail.plan),
    });

    res.json({ success: true, data: detail });
  };

  createTreatmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = CreateTreatmentPlanSchema.parse(req.body) as CreateTreatmentPlanDTO;
    const result = await this.service.createTreatmentPlan(req.doctor, validated);

    await logAuditEvent(req, {
      action:
        result.plan.status === 'FINALIZED' || result.plan.status === 'ACTIVE'
          ? 'TREATMENT_PLAN_FINALIZE'
          : 'TREATMENT_PLAN_CREATE',
      resource: 'TreatmentPlan',
      resourceId: result.plan._id.toString(),
      details: buildPlanAuditDetails(result.plan),
    });

    res.status(201).json({
      success: true,
      message: 'Treatment plan created.',
      data: result,
    });
  };

  updateTreatmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = UpdateTreatmentPlanSchema.parse(req.body) as UpdateTreatmentPlanDTO;
    const updated = await this.service.updateTreatmentPlan(req.params.id, req.doctor, validated);

    await logAuditEvent(req, {
      action: 'TREATMENT_PLAN_UPDATE',
      resource: 'TreatmentPlan',
      resourceId: updated._id.toString(),
      details: buildPlanAuditDetails(updated),
    });

    res.json({
      success: true,
      message: 'Treatment plan updated.',
      data: updated,
    });
  };

  finalizeTreatmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const finalized = await this.service.finalizeTreatmentPlan(req.params.id, req.doctor);

    await logAuditEvent(req, {
      action: 'TREATMENT_PLAN_FINALIZE',
      resource: 'TreatmentPlan',
      resourceId: finalized._id.toString(),
      details: buildPlanAuditDetails(finalized),
    });

    res.json({
      success: true,
      message: 'Treatment plan finalized.',
      data: finalized,
    });
  };

  downloadTreatmentPlanPdf = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const detail = await this.service.getTreatmentPlanDetail(req.params.id, req.user, req.doctor);
    const pdfBuffer = await renderTreatmentPlanPdf(detail.plan, detail.sessions);

    await logAuditEvent(req, {
      action: 'TREATMENT_PLAN_PDF',
      resource: 'TreatmentPlan',
      resourceId: detail.plan._id.toString(),
      details: buildPlanAuditDetails(detail.plan),
    });

    const patientCode = sanitizeFilenamePart(
      detail.plan.patientSnapshot?.patientId || detail.plan.chartNumber
    );
    const datePart = new Date(
      detail.plan.finalizedAt || detail.plan.createdAt || Date.now()
    )
      .toISOString()
      .slice(0, 10);
    const filename = `Treatment-Plan-${patientCode}-${datePart}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Cache-Control',
      'private, no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  };

  // Sessions
  getSessions = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    if (req.user.role !== 'doctor' && req.user.role !== 'staff') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only clinicians and assigned staff may browse clinical sessions.',
      });
      return;
    }

    const { treatmentPlanId, patientId, status, fromDate, toDate, page, limit } = req.query;
    const result = await this.service.listSessions({
      doctorId: req.user.role === 'doctor' ? req.doctor?._id : undefined,
      assignedPractitionerId: req.user.role === 'staff' ? req.user._id : undefined,
      treatmentPlanId:
        typeof treatmentPlanId === 'string' && treatmentPlanId ? treatmentPlanId : undefined,
      patientId: typeof patientId === 'string' && patientId ? patientId : undefined,
      status:
        typeof status === 'string' && status ? (status as TherapySessionStatus) : undefined,
      fromDate: typeof fromDate === 'string' ? fromDate : undefined,
      toDate: typeof toDate === 'string' ? toDate : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 25,
    });

    res.json({ success: true, data: result });
  };

  createSessionsForPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const validated = CreateSessionsSchema.parse(req.body) as CreateSessionsDTO;
    const sessions = await this.service.createSessionsForPlan(
      req.params.planId,
      req.doctor,
      validated
    );

    await logAuditEvent(req, {
      action: 'THERAPY_SESSION_CREATE',
      resource: 'TreatmentPlan',
      resourceId: req.params.planId,
      details: { count: sessions.length },
    });

    res.status(201).json({
      success: true,
      message: `${sessions.length} therapy session(s) scheduled.`,
      data: sessions,
    });
  };

  updateSession = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const validated = UpdateSessionSchema.parse(req.body) as UpdateSessionDTO;
    const updated = await this.service.updateSession(
      req.params.id,
      req.user,
      req.doctor,
      validated
    );

    await logAuditEvent(req, {
      action: 'THERAPY_SESSION_UPDATE',
      resource: 'TherapySession',
      resourceId: updated._id.toString(),
      details: {
        treatmentPlanId: updated.treatmentPlanId.toString(),
        sessionNumber: updated.sessionNumber,
        status: updated.status,
        version: updated.version,
      },
    });

    res.json({
      success: true,
      message: 'Therapy session updated.',
      data: updated,
    });
  };

  deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor scope required.' });
      return;
    }

    const deleted = await this.service.deleteSession(req.params.id, req.doctor);

    await logAuditEvent(req, {
      action: 'THERAPY_SESSION_DELETE',
      resource: 'TherapySession',
      resourceId: deleted._id.toString(),
      details: {
        treatmentPlanId: deleted.treatmentPlanId.toString(),
        sessionNumber: deleted.sessionNumber,
      },
    });

    res.json({
      success: true,
      message: 'Scheduled session cancelled/removed.',
    });
  };
}

export const therapyController = new TherapyController();
