import crypto from 'crypto';
import mongoose, { Types } from 'mongoose';
import { prescriptionRepository, PrescriptionRepository } from './prescription.repository';
import { IPrescription } from '../../models/Prescription';
import { Patient } from '../../models/Patient';
import { Chamber } from '../../models/Chamber';
import { IDoctor } from '../../models/Doctor';
import { FoodChart } from '../../models/FoodChart';
import { generateNextPrescriptionId } from '../../shared/utils/idGenerator';
import { NotFoundError, ForbiddenError, AppError, BadRequestError } from '../../shared/errors';
import { CreatePrescriptionDTO, UpdatePrescriptionDTO, PrescriptionFilterOptions, PrescriptionListResult } from './prescription.types';

export class PrescriptionService {
  constructor(private repo: PrescriptionRepository = prescriptionRepository) {}

  private sanitizeFollowUp(
    followUp?: { duration?: string; date?: string | null; notes?: string | null } | null
  ) {
    if (!followUp) return undefined;
    let dateVal: Date | undefined = undefined;
    if (followUp.date && typeof followUp.date === 'string' && followUp.date.trim() !== '') {
      const parsed = new Date(followUp.date);
      if (!isNaN(parsed.getTime())) {
        dateVal = parsed;
      }
    }
    return {
      duration: followUp.duration || '7 days',
      notes: followUp.notes || undefined,
      date: dateVal,
    };
  }

  private generateShareToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  private async validateAttachedFoodChart(
    attachedFoodChartId: string | null | undefined,
    doctorId: Types.ObjectId | string,
    patientObjectId: Types.ObjectId | string
  ): Promise<Types.ObjectId | null | undefined> {
    if (attachedFoodChartId === undefined) {
      return undefined;
    }
    if (attachedFoodChartId === null || attachedFoodChartId === '') {
      return null;
    }
    if (!mongoose.Types.ObjectId.isValid(attachedFoodChartId)) {
      throw new BadRequestError('Invalid attached food chart ID.', 'INVALID_FOOD_CHART_ID');
    }

    const chart = await FoodChart.findById(attachedFoodChartId).exec();
    if (!chart) {
      throw new NotFoundError('Attached food chart not found.');
    }
    if (chart.doctorId.toString() !== doctorId.toString()) {
      throw new ForbiddenError('Forbidden: Attached food chart belongs to another doctor.');
    }
    if (chart.patientId.toString() !== patientObjectId.toString()) {
      throw new BadRequestError(
        'Attached food chart must belong to the same patient.',
        'FOOD_CHART_PATIENT_MISMATCH'
      );
    }
    if (chart.status !== 'FINALIZED') {
      throw new BadRequestError(
        'Only finalized food charts can be attached to a prescription.',
        'FOOD_CHART_NOT_FINALIZED'
      );
    }

    return chart._id as Types.ObjectId;
  }

  async listPrescriptions(filters: PrescriptionFilterOptions): Promise<PrescriptionListResult> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (filters.doctorId) query.doctorId = filters.doctorId;
    if (filters.patientId) query.patientId = filters.patientId;
    if (filters.status && filters.status !== 'all') query.status = filters.status;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
      const sRegex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { prescriptionId: sRegex },
        { 'patientSnapshot.name': sRegex },
        { 'patientSnapshot.phone': sRegex },
        { 'patientSnapshot.patientId': sRegex },
      ];
    }

    const [prescriptions, total] = await Promise.all([
      this.repo.find(query, {
        skip,
        limit,
        sort: { createdAt: -1 },
        select:
          'prescriptionId patientId patientSnapshot chamberId status createdAt diagnosis medicines.brandName medicines.dosageForm medicines.strength shareToken',
      }),
      this.repo.count(query),
    ]);

    return {
      prescriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getPrescriptionById(id: string, doctorId: Types.ObjectId | string, isAdmin = false): Promise<IPrescription> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Prescription record not found.');
    }

    const prescription = isAdmin
      ? await this.repo.findById(id)
      : await this.repo.findScopedById(id, doctorId);

    if (!prescription) {
      throw new NotFoundError('Prescription record not found or unauthorized.');
    }

    return prescription;
  }

  async createPrescription(doctor: IDoctor, data: CreatePrescriptionDTO): Promise<IPrescription> {
    if (!doctor || !doctor._id) {
      throw new ForbiddenError('Doctor identity required.');
    }

    // STRICT DOCTOR-SCOPED PATIENT LOOKUP (Anti-IDOR)
    let patient = null;
    if (mongoose.Types.ObjectId.isValid(data.patientId)) {
      patient = await Patient.findOne({ _id: data.patientId, doctorId: doctor._id });
    }
    if (!patient) {
      patient = await Patient.findOne({ patientId: data.patientId, doctorId: doctor._id });
    }
    if (!patient) {
      throw new NotFoundError('Patient record not found under your doctor account.');
    }

    let chamber = null;
    if (data.chamberId && mongoose.Types.ObjectId.isValid(data.chamberId)) {
      chamber = await Chamber.findOne({ _id: data.chamberId, doctorId: doctor._id });
    } else if (doctor.defaultChamberId) {
      chamber = await Chamber.findById(doctor.defaultChamberId);
    }

    const prescriptionId = await generateNextPrescriptionId();
    const shareToken = this.generateShareToken();
    const isFinalized = data.status === 'FINALIZED';
    const validatedFoodChartId = await this.validateAttachedFoodChart(
      data.attachedFoodChartId,
      doctor._id,
      patient._id
    );

    const prescription = await this.repo.create({
      prescriptionId,
      doctorId: doctor._id,
      chamberId: chamber?._id,
      patientId: patient._id,
      patientSnapshot: {
        patientId: patient.patientId,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
      },
      doctorSnapshot: {
        name: doctor.name,
        qualification: doctor.qualification,
        specialization: doctor.specialization,
        designation: doctor.designation,
        workplace: doctor.workplace,
        bmdcNumber: doctor.bmdcNumber,
        phone: doctor.phone,
        email: doctor.email,
        chamberName: chamber?.name || 'Main Chamber',
        chamberAddress: chamber?.address || 'Chamber Address',
        chamberWebsite: chamber?.website,
        signature: doctor.signature || chamber?.signature,
        logo: doctor.logo,
      },
      vitals: data.vitals || undefined,
      chiefComplaints: data.chiefComplaints || [],
      history: data.history || undefined,
      examination: data.examination || undefined,
      diagnosis: data.diagnosis || [],
      medicines: (data.medicines || []).map((m, idx) => ({ ...m, order: idx })),
      investigations: data.investigations || [],
      advice: data.advice || [],
      followUp: this.sanitizeFollowUp(data.followUp),
      notes: data.notes || undefined,
      attachedFoodChartId: validatedFoodChartId ?? null,
      status: isFinalized ? 'FINALIZED' : 'DRAFT',
      finalizedAt: isFinalized ? new Date() : undefined,
      shareToken,
      shareExpiresAt: isFinalized ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      isShareRevoked: false,
      version: 1,
    });

    // Update patient last visit and last diagnosis
    patient.lastVisit = new Date();
    if (data.diagnosis && data.diagnosis.length > 0) {
      patient.lastDiagnosis = data.diagnosis.map((d) => d.name).join(', ');
    }
    await patient.save();

    return prescription;
  }

  async updatePrescription(
    id: string,
    doctor: IDoctor,
    data: UpdatePrescriptionDTO
  ): Promise<IPrescription> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Prescription record not found.');
    }

    const existing = await this.repo.findScopedById(id, doctor._id);
    if (!existing) {
      throw new NotFoundError('Prescription record not found or unauthorized.');
    }

    if (existing.status === 'FINALIZED') {
      throw new AppError(
        'Finalized prescriptions cannot be modified directly. Please create an amendment or clone as a new draft.',
        400,
        'PRESCRIPTION_FINALIZED'
      );
    }

    let chamber = null;
    if (data.chamberId && mongoose.Types.ObjectId.isValid(data.chamberId)) {
      chamber = await Chamber.findOne({ _id: data.chamberId, doctorId: doctor._id });
    }

    existing.vitals = data.vitals as any;
    existing.chiefComplaints = (data.chiefComplaints || []) as any;
    existing.history = data.history as any;
    existing.examination = data.examination as any;
    existing.diagnosis = (data.diagnosis || []) as any;
    existing.medicines = (data.medicines || []).map((m, idx) => ({ ...m, order: idx })) as any;
    existing.investigations = data.investigations as any;
    existing.advice = data.advice as any;
    existing.followUp = this.sanitizeFollowUp(data.followUp) as any;
    existing.notes = data.notes as any;
    if (data.attachedFoodChartId !== undefined) {
      const validatedFoodChartId = await this.validateAttachedFoodChart(
        data.attachedFoodChartId,
        doctor._id,
        existing.patientId
      );
      existing.attachedFoodChartId = (validatedFoodChartId ?? null) as any;
    }

    if (chamber) {
      existing.chamberId = chamber._id as any;
      if (existing.doctorSnapshot) {
        existing.doctorSnapshot.chamberName = chamber.name;
        existing.doctorSnapshot.chamberAddress = chamber.address;
      }
    }

    if (data.status === 'FINALIZED') {
      existing.status = 'FINALIZED';
      existing.finalizedAt = new Date();
      existing.shareExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await existing.save();
    return existing;
  }

  async finalizePrescription(id: string, doctorId: Types.ObjectId | string): Promise<IPrescription> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Prescription record not found.');
    }

    const existing = await this.repo.findScopedById(id, doctorId);
    if (!existing) {
      throw new NotFoundError('Prescription record not found or unauthorized.');
    }

    if (existing.status === 'FINALIZED') {
      return existing;
    }

    existing.status = 'FINALIZED';
    existing.finalizedAt = new Date();
    existing.shareExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await existing.save();

    return existing;
  }

  async clonePrescription(id: string, doctor: IDoctor): Promise<IPrescription> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError('Source prescription not found.');
    }

    const source = await this.repo.findScopedById(id, doctor._id);
    if (!source) {
      throw new NotFoundError('Source prescription not found or unauthorized.');
    }

    const prescriptionId = await generateNextPrescriptionId();
    const shareToken = this.generateShareToken();

    return this.repo.create({
      prescriptionId,
      doctorId: doctor._id,
      chamberId: source.chamberId,
      patientId: source.patientId,
      patientSnapshot: source.patientSnapshot,
      doctorSnapshot: {
        name: doctor.name,
        qualification: doctor.qualification,
        specialization: doctor.specialization,
        designation: doctor.designation,
        workplace: doctor.workplace,
        bmdcNumber: doctor.bmdcNumber,
        phone: doctor.phone,
        email: doctor.email,
        chamberName: source.doctorSnapshot?.chamberName || 'Main Chamber',
        chamberAddress: source.doctorSnapshot?.chamberAddress || 'Chamber Address',
        chamberWebsite: source.doctorSnapshot?.chamberWebsite,
        signature: doctor.signature,
        logo: doctor.logo,
      },
      vitals: source.vitals,
      chiefComplaints: source.chiefComplaints,
      history: source.history,
      examination: source.examination,
      diagnosis: source.diagnosis,
      medicines: source.medicines,
      investigations: source.investigations,
      advice: source.advice,
      followUp: source.followUp,
      status: 'DRAFT',
      shareToken,
      version: 1,
      parentPrescriptionId: source._id,
    });
  }

  async getPublicPrescriptionByShareToken(token: string) {
    if (!token || typeof token !== 'string' || token.length < 16) {
      throw new NotFoundError('Invalid share verification token.');
    }

    const prescription = await this.repo.findByShareToken(token);
    if (!prescription || prescription.status !== 'FINALIZED' || prescription.isShareRevoked) {
      throw new NotFoundError('Prescription not found, not finalized, revoked, or verification link invalid.');
    }

    if (prescription.shareExpiresAt && new Date(prescription.shareExpiresAt) < new Date()) {
      throw new AppError('This public prescription link has expired for security and patient privacy.', 410, 'SHARE_LINK_EXPIRED');
    }

    // Return sanitized public verification DTO (PII Redacted; attachedFoodChartId is excluded intentionally)
    return {
      _id: prescription._id,
      prescriptionId: prescription.prescriptionId,
      createdAt: prescription.createdAt,
      finalizedAt: prescription.finalizedAt,
      status: prescription.status,
      shareToken: prescription.shareToken,
      shareExpiresAt: prescription.shareExpiresAt,
      doctorSnapshot: {
        name: prescription.doctorSnapshot?.name,
        qualification: prescription.doctorSnapshot?.qualification,
        specialization: prescription.doctorSnapshot?.specialization,
        designation: prescription.doctorSnapshot?.designation,
        workplace: prescription.doctorSnapshot?.workplace,
        bmdcNumber: prescription.doctorSnapshot?.bmdcNumber,
        chamberName: prescription.doctorSnapshot?.chamberName,
        chamberAddress: prescription.doctorSnapshot?.chamberAddress,
        chamberWebsite: prescription.doctorSnapshot?.chamberWebsite,
        signature: prescription.doctorSnapshot?.signature,
        logo: prescription.doctorSnapshot?.logo,
      },
      patientSnapshot: {
        patientId: prescription.patientSnapshot.patientId,
        name: prescription.patientSnapshot.name,
        age: prescription.patientSnapshot.age,
        gender: prescription.patientSnapshot.gender,
        bloodGroup: prescription.patientSnapshot.bloodGroup,
        allergies: prescription.patientSnapshot.allergies || [],
      },
      vitals: prescription.vitals,
      chiefComplaints: prescription.chiefComplaints,
      history: prescription.history,
      examination: prescription.examination,
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines,
      investigations: prescription.investigations,
      advice: prescription.advice,
      followUp: prescription.followUp,
      chamberId: prescription.chamberId,
    };
  }
}

export const prescriptionService = new PrescriptionService();
