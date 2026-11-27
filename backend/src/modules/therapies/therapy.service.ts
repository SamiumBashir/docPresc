import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { FilterQuery, Types } from 'mongoose';
import { IDoctor, Doctor } from '../../models/Doctor';
import { IUser, User } from '../../models/User';
import { Patient, IPatient } from '../../models/Patient';
import { Chamber, IChamber } from '../../models/Chamber';
import { Therapy, ITherapy } from '../../models/Therapy';
import { ITherapyCategory } from '../../models/TherapyCategory';
import { ITreatmentPlan, ConsentStatus } from '../../models/TreatmentPlan';
import { ITherapySession } from '../../models/TherapySession';
import { ensureTherapyCatalogSeeded } from '../../seeds/therapyCatalog';
import { generateNextTreatmentPlanNumber } from '../../shared/utils/idGenerator';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors';
import { therapyRepository, TherapyRepository } from './therapy.repository';
import {
  AuthorizedPractitionerItem,
  CreatePractitionerDTO,
  CreateSessionsDTO,
  CreateTherapyCategoryDTO,
  CreateTherapyDTO,
  CreateTreatmentPlanDTO,
  TherapyCatalogFilterOptions,
  TherapyCatalogListResult,
  TherapySessionFilterOptions,
  TherapySessionListResult,
  ToggleTherapyStatusDTO,
  TreatmentPlanFilterOptions,
  TreatmentPlanListResult,
  UpdatePractitionerDTO,
  UpdateSessionDTO,
  UpdateTherapyDTO,
  UpdateTreatmentPlanDTO,
  VerifyTherapyDTO,
} from './therapy.types';

const slugifyCategoryKey = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length >= 2) return base;
  return `cat-${crypto.randomBytes(4).toString('hex')}`;
};

export class TherapyService {
  constructor(private repo: TherapyRepository = therapyRepository) {}

  private assertValidObjectId(id: string, label = 'Resource'): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError(`Invalid ${label} ID format`, 'INVALID_ID');
    }
  }

  private async verifyDoctorPatient(
    patientId: string,
    doctorId: Types.ObjectId | string
  ): Promise<IPatient> {
    this.assertValidObjectId(patientId, 'patient');
    const patient = await Patient.findById(patientId).exec();
    if (!patient) {
      throw new NotFoundError('Patient record not found');
    }
    if (patient.doctorId.toString() !== doctorId.toString()) {
      throw new ForbiddenError('Forbidden: You do not have access to this patient record');
    }
    return patient;
  }

  private async resolveDoctorChamber(
    doctor: IDoctor,
    chamberId?: string | null
  ): Promise<IChamber | null> {
    if (chamberId && Types.ObjectId.isValid(chamberId)) {
      const chamber = await Chamber.findOne({ _id: chamberId, doctorId: doctor._id }).exec();
      if (!chamber) {
        throw new ForbiddenError('Selected clinic chamber does not belong to this doctor');
      }
      return chamber;
    }

    if (doctor.defaultChamberId) {
      const def = await Chamber.findOne({
        _id: doctor.defaultChamberId,
        doctorId: doctor._id,
      }).exec();
      if (def) return def;
    }

    return Chamber.findOne({ doctorId: doctor._id, status: 'active' })
      .sort({ isDefault: -1, createdAt: 1 })
      .exec();
  }

  private buildPatientSnapshot(patient: IPatient): ITreatmentPlan['patientSnapshot'] {
    return {
      patientId: patient.patientId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      bloodGroup: patient.bloodGroup,
    };
  }

  private buildDoctorSnapshot(
    doctor: IDoctor,
    chamber: IChamber | null
  ): ITreatmentPlan['doctorSnapshot'] {
    return {
      name: doctor.name,
      qualification: doctor.qualification || '',
      specialization: doctor.specialization || '',
      designation: doctor.designation,
      workplace: doctor.workplace,
      bmdcNumber: doctor.bmdcNumber,
      healthcareAuthority: doctor.healthcareAuthority || 'BMDC',
      registrationNumber: doctor.registrationNumber || doctor.bmdcNumber,
      chamberName: chamber?.name || doctor.workplace,
      chamberAddress: chamber?.address,
      phone: chamber?.phone || doctor.phone,
      appointmentPhone: chamber?.appointmentPhone,
      visitingDays: chamber?.visitingDays,
      visitingHours: chamber?.visitingHours,
      roomNo: chamber?.roomNo,
      website: chamber?.website,
      logo: doctor.logo,
      signature: chamber?.signature || doctor.signature,
    };
  }

  private buildTherapySnapshot(therapy: ITherapy): ITreatmentPlan['therapySnapshot'] {
    return {
      key: therapy.key,
      name: therapy.name,
      englishName: therapy.englishName || therapy.name,
      bengaliName: therapy.bengaliName || '',
      categoryName: therapy.categoryName,
      isEdTreatment: Boolean(therapy.isEdTreatment),
      verificationStatus: therapy.verificationStatus,
      verificationNotes: therapy.verificationNotes || '',
      requiredProviderQualifications: therapy.requiredProviderQualifications || '',
      requiredEquipment: therapy.requiredEquipment || '',
    };
  }

  private async resolveValidatedTherapies(input: {
    therapyId?: string;
    therapyIds?: string[];
  }): Promise<ITherapy[]> {
    const rawIds =
      input.therapyIds && input.therapyIds.length > 0
        ? input.therapyIds
        : input.therapyId
        ? [input.therapyId]
        : [];

    const orderedUniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const rawId of rawIds) {
      const trimmed = String(rawId || '').trim();
      if (!trimmed || seen.has(trimmed)) continue;
      this.assertValidObjectId(trimmed, 'therapy');
      seen.add(trimmed);
      orderedUniqueIds.push(trimmed);
    }

    if (orderedUniqueIds.length === 0) {
      throw new BadRequestError('Select at least one approved therapy.', 'THERAPY_REQUIRED');
    }

    const docs = await this.repo.findTherapiesByIds(orderedUniqueIds);
    const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));

    const resolved: ITherapy[] = [];
    for (const id of orderedUniqueIds) {
      const therapy = byId.get(id);
      if (!therapy) {
        throw new NotFoundError('Therapy catalog entry not found');
      }
      if (!therapy.isActive || !therapy.isAvailable) {
        throw new BadRequestError(
          `Therapy "${therapy.name}" is currently disabled or unavailable and cannot be assigned.`,
          'THERAPY_DISABLED'
        );
      }
      if (therapy.verificationStatus !== 'APPROVED') {
        throw new BadRequestError(
          `Therapy "${therapy.name}" has verification status "${therapy.verificationStatus}" and requires clinical approval before assignment.`,
          'THERAPY_NOT_APPROVED'
        );
      }
      resolved.push(therapy);
    }

    return resolved;
  }

  private async resolveAuthorizedPractitioner(
    practitionerUserId: string
  ): Promise<ITreatmentPlan['practitionerSnapshot']> {
    this.assertValidObjectId(practitionerUserId, 'practitioner');
    const user = await User.findById(practitionerUserId).select('-passwordHash').exec();
    if (!user) {
      throw new BadRequestError('Assigned practitioner account not found.', 'INVALID_PRACTITIONER');
    }
    if (user.status !== 'active') {
      throw new BadRequestError(
        'Assigned practitioner account is not active.',
        'INACTIVE_PRACTITIONER'
      );
    }
    if (user.role !== 'doctor' && user.role !== 'staff') {
      throw new BadRequestError(
        'Only authorized doctors or clinical staff practitioners can be assigned.',
        'INVALID_PRACTITIONER_ROLE'
      );
    }
    if (user.isAuthorizedPractitioner === false) {
      throw new BadRequestError(
        'Selected practitioner is not currently authorized for therapy delivery.',
        'UNAUTHORIZED_PRACTITIONER'
      );
    }

    let qualification = user.qualification || '';
    let registrationNumber = user.registrationNumber || '';
    let designation = user.designation || '';
    let phone = user.phone || '';

    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id }).lean().exec();
      if (doctorProfile) {
        qualification = qualification || doctorProfile.qualification || '';
        registrationNumber =
          registrationNumber || doctorProfile.registrationNumber || doctorProfile.bmdcNumber || '';
        designation = designation || doctorProfile.designation || '';
        phone = phone || doctorProfile.phone || '';
      }
    }

    return {
      userId: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone,
      qualification,
      registrationNumber,
      designation,
    };
  }

  // =========================================================================
  // Overview & Metrics
  // =========================================================================

  async getOverview(user: IUser, doctor?: IDoctor) {
    await ensureTherapyCatalogSeeded();

    const planScope: FilterQuery<ITreatmentPlan> = {};
    const sessionScope: FilterQuery<ITherapySession> = {};

    if (user.role === 'staff') {
      planScope.assignedPractitionerId = user._id;
      sessionScope.assignedPractitionerId = user._id;
    } else if (user.role === 'doctor' && doctor) {
      planScope.doctorId = doctor._id;
      sessionScope.doctorId = doctor._id;
    }

    const [
      totalTherapies,
      activeTherapies,
      approvedTherapies,
      pendingClinicalReview,
      needsTerminologyReview,
      edTherapiesCount,
      scheduledPlans,
      completedSessions,
      upcomingSessionsCount,
      recentPendingReviews,
      upcomingSessions,
    ] = await Promise.all([
      Therapy.countDocuments({}),
      Therapy.countDocuments({ isActive: true, isAvailable: true }),
      Therapy.countDocuments({
        isActive: true,
        isAvailable: true,
        verificationStatus: 'APPROVED',
      }),
      Therapy.countDocuments({
        verificationStatus: { $in: ['PENDING_CLINICAL_REVIEW', 'NEEDS_TERMINOLOGY_REVIEW'] },
      }),
      Therapy.countDocuments({ terminologyReviewRequired: true, verificationStatus: { $ne: 'APPROVED' } }),
      Therapy.countDocuments({ isEdTreatment: true }),
      this.repo.countPlans({
        ...planScope,
        status: { $in: ['FINALIZED', 'ACTIVE'] },
      }),
      this.repo.countSessions({
        ...sessionScope,
        status: 'Completed',
      }),
      this.repo.countSessions({
        ...sessionScope,
        status: { $in: ['Scheduled', 'Rescheduled'] },
      }),
      user.role === 'admin'
        ? this.repo.findTherapies(
            { verificationStatus: { $in: ['PENDING_CLINICAL_REVIEW', 'NEEDS_TERMINOLOGY_REVIEW'] } },
            { limit: 8, sort: { isEdTreatment: 1, sortOrder: 1 } }
          )
        : Promise.resolve([]),
      user.role === 'doctor' || user.role === 'staff'
        ? this.repo.findSessionsWithPlan(
            { ...sessionScope, status: { $in: ['Scheduled', 'Rescheduled'] } },
            { limit: 8, sort: { scheduledAt: 1 } }
          )
        : Promise.resolve([]),
    ]);

    return {
      metrics: {
        totalTherapies,
        activeTherapies,
        approvedTherapies,
        pendingClinicalReview,
        needsTerminologyReview,
        edTherapiesCount,
        scheduledPlans,
        completedSessions,
        upcomingSessionsCount,
      },
      recentPendingReviews,
      upcomingSessions,
    };
  }

  // =========================================================================
  // Categories & Therapy Catalog
  // =========================================================================

  async getCategories(onlyActive = false): Promise<ITherapyCategory[]> {
    await ensureTherapyCatalogSeeded();
    return this.repo.findCategories(onlyActive);
  }

  async createCategory(dto: CreateTherapyCategoryDTO): Promise<ITherapyCategory> {
    await ensureTherapyCatalogSeeded();
    const key = slugifyCategoryKey(dto.name);
    const existing = await this.repo.findCategoryByKeyOrName(key, dto.name);
    if (existing) {
      throw new ConflictError('A therapy category with this name already exists.', 'CATEGORY_EXISTS');
    }

    const categories = await this.repo.findCategories(false);
    const maxSort = categories.reduce((acc, c) => Math.max(acc, c.sortOrder || 0), 0);

    return this.repo.createCategory({
      key,
      name: dto.name.trim(),
      nameBn: dto.nameBn || '',
      description: dto.description || '',
      isProtected: false,
      isSensitiveClinicalGroup: Boolean(dto.isSensitiveClinicalGroup),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      sortOrder: dto.sortOrder ?? maxSort + 1,
    });
  }

  async listCatalog(options: TherapyCatalogFilterOptions): Promise<TherapyCatalogListResult> {
    await ensureTherapyCatalogSeeded();

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(200, Math.max(1, options.limit || 100));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ITherapy> = {};

    if (options.section === 'ed') {
      filter.isEdTreatment = true;
    } else if (options.section === 'main') {
      filter.isEdTreatment = false;
    }

    if (options.categoryId) {
      this.assertValidObjectId(options.categoryId, 'category');
      filter.categoryId = new Types.ObjectId(options.categoryId);
    }

    if (options.verificationStatus) {
      filter.verificationStatus = options.verificationStatus;
    }

    if (typeof options.isActive === 'boolean') {
      filter.isActive = options.isActive;
    }

    if (typeof options.isAvailable === 'boolean') {
      filter.isAvailable = options.isAvailable;
    }

    if (options.search && options.search.trim()) {
      const escaped = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: regex },
        { englishName: regex },
        { bengaliName: regex },
        { categoryName: regex },
        { description: regex },
      ];
    }

    const [therapies, categories, total] = await Promise.all([
      this.repo.findTherapies(filter, {
        skip,
        limit,
        sort: { isEdTreatment: 1, sortOrder: 1, name: 1 },
      }),
      this.repo.findCategories(false),
      this.repo.countTherapies(filter),
    ]);

    return {
      therapies,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getTherapyById(id: string): Promise<ITherapy> {
    await ensureTherapyCatalogSeeded();
    this.assertValidObjectId(id, 'therapy');
    const therapy = await this.repo.findTherapyById(id);
    if (!therapy) {
      throw new NotFoundError('Therapy catalog entry not found');
    }
    return therapy;
  }

  async createTherapy(dto: CreateTherapyDTO): Promise<ITherapy> {
    await ensureTherapyCatalogSeeded();
    this.assertValidObjectId(dto.categoryId, 'category');
    const category = await this.repo.findCategoryById(dto.categoryId);
    if (!category) {
      throw new NotFoundError('Therapy category not found');
    }

    const key = `custom-${crypto.randomBytes(5).toString('hex')}`;
    const isEd = Boolean(category.isSensitiveClinicalGroup || category.key === 'ed-treatments');
    const totalCount = await this.repo.countTherapies({ categoryId: category._id });

    return this.repo.createTherapy({
      key,
      name: dto.name.trim(),
      englishName: (dto.englishName || dto.name).trim(),
      bengaliName: dto.bengaliName || '',
      categoryId: category._id,
      categoryName: category.name,
      isEdTreatment: isEd,
      description: dto.description ?? '',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isAvailable: dto.isAvailable !== undefined ? dto.isAvailable : true,
      verificationStatus: dto.terminologyReviewRequired
        ? 'NEEDS_TERMINOLOGY_REVIEW'
        : 'PENDING_CLINICAL_REVIEW',
      terminologyReviewRequired: Boolean(dto.terminologyReviewRequired),
      specialReviewFlags: dto.specialReviewFlags || [],
      governanceNotice: dto.governanceNotice ?? '',
      requiredProviderQualifications: dto.requiredProviderQualifications ?? '',
      requiredEquipment: dto.requiredEquipment ?? '',
      defaultSessionDurationMinutes:
        dto.defaultSessionDurationMinutes !== undefined ? dto.defaultSessionDurationMinutes : null,
      price: dto.price !== undefined ? dto.price : null,
      administrativeNotes: dto.administrativeNotes ?? '',
      consentRequired: Boolean(dto.consentRequired || isEd),
      sortOrder: totalCount + 1,
    });
  }

  async updateTherapy(id: string, dto: UpdateTherapyDTO): Promise<ITherapy> {
    const existing = await this.getTherapyById(id);

    const updatePayload: Record<string, any> = {};
    if (dto.name !== undefined) {
      updatePayload.name = dto.name.trim();
      if (dto.englishName === undefined) {
        updatePayload.englishName = dto.name.trim();
      }
    }
    if (dto.englishName !== undefined) updatePayload.englishName = dto.englishName.trim();
    if (dto.bengaliName !== undefined) updatePayload.bengaliName = dto.bengaliName || '';
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.isActive !== undefined) updatePayload.isActive = dto.isActive;
    if (dto.isAvailable !== undefined) updatePayload.isAvailable = dto.isAvailable;
    if (dto.requiredProviderQualifications !== undefined) {
      updatePayload.requiredProviderQualifications = dto.requiredProviderQualifications;
    }
    if (dto.requiredEquipment !== undefined) updatePayload.requiredEquipment = dto.requiredEquipment;
    if (dto.defaultSessionDurationMinutes !== undefined) {
      updatePayload.defaultSessionDurationMinutes = dto.defaultSessionDurationMinutes;
    }
    if (dto.price !== undefined) updatePayload.price = dto.price;
    if (dto.administrativeNotes !== undefined) {
      updatePayload.administrativeNotes = dto.administrativeNotes;
    }
    if (dto.consentRequired !== undefined) updatePayload.consentRequired = dto.consentRequired;
    if (dto.terminologyReviewRequired !== undefined) {
      updatePayload.terminologyReviewRequired = dto.terminologyReviewRequired;
    }
    if (dto.specialReviewFlags !== undefined) {
      updatePayload.specialReviewFlags = dto.specialReviewFlags;
    }
    if (dto.governanceNotice !== undefined) updatePayload.governanceNotice = dto.governanceNotice;

    if (dto.categoryId && dto.categoryId !== existing.categoryId.toString()) {
      this.assertValidObjectId(dto.categoryId, 'category');
      const category = await this.repo.findCategoryById(dto.categoryId);
      if (!category) {
        throw new NotFoundError('Target therapy category not found');
      }
      updatePayload.categoryId = category._id;
      updatePayload.categoryName = category.name;
      updatePayload.isEdTreatment = Boolean(
        category.isSensitiveClinicalGroup || category.key === 'ed-treatments'
      );
    }

    const updated = await this.repo.updateTherapyById(id, updatePayload);
    if (!updated) {
      throw new NotFoundError('Therapy catalog entry not found');
    }
    return updated;
  }

  async toggleTherapyStatus(id: string, dto: ToggleTherapyStatusDTO): Promise<ITherapy> {
    await this.getTherapyById(id);
    const updatePayload: Record<string, any> = { isActive: dto.isActive };
    if (dto.isAvailable !== undefined) {
      updatePayload.isAvailable = dto.isAvailable;
    }
    const updated = await this.repo.updateTherapyById(id, updatePayload);
    if (!updated) {
      throw new NotFoundError('Therapy catalog entry not found');
    }
    return updated;
  }

  async verifyTherapy(id: string, adminUser: IUser, dto: VerifyTherapyDTO): Promise<ITherapy> {
    const existing = await this.getTherapyById(id);

    if (dto.verificationStatus === 'APPROVED') {
      if (existing.terminologyReviewRequired && dto.terminologyConfirmed !== true) {
        throw new BadRequestError(
          `Terminology verification must be explicitly confirmed before approving "${existing.name}".`,
          'TERMINOLOGY_CONFIRMATION_REQUIRED'
        );
      }

      if (
        Array.isArray(existing.specialReviewFlags) &&
        existing.specialReviewFlags.length > 0 &&
        dto.governanceReviewed !== true
      ) {
        throw new BadRequestError(
          `Clinical governance review acknowledgment is required before approving "${existing.name}".`,
          'GOVERNANCE_REVIEW_REQUIRED'
        );
      }
    }

    const updatePayload: Record<string, any> = {
      verificationStatus: dto.verificationStatus,
      verificationNotes: dto.verificationNotes ?? existing.verificationNotes ?? '',
      verifiedByUserId: adminUser._id,
      verifiedByName: adminUser.name,
      verifiedAt: new Date(),
    };

    if (dto.requiredProviderQualifications !== undefined) {
      updatePayload.requiredProviderQualifications = dto.requiredProviderQualifications;
    }
    if (dto.consentRequired !== undefined) {
      updatePayload.consentRequired = dto.consentRequired;
    }
    if (dto.isAvailable !== undefined) {
      updatePayload.isAvailable = dto.isAvailable;
    }

    const updated = await this.repo.updateTherapyById(id, updatePayload);
    if (!updated) {
      throw new NotFoundError('Therapy catalog entry not found');
    }
    return updated;
  }

  // =========================================================================
  // Authorized Practitioners Management
  // =========================================================================

  async listPractitioners(includeInactive = false): Promise<AuthorizedPractitionerItem[]> {
    const filter: FilterQuery<IUser> = includeInactive
      ? { role: { $in: ['doctor', 'staff'] } }
      : {
          role: { $in: ['doctor', 'staff'] },
          status: 'active',
          isAuthorizedPractitioner: { $ne: false },
        };

    const users = await User.find(filter)
      .select(
        'name email role status phone qualification specialization designation registrationNumber isAuthorizedPractitioner'
      )
      .sort({ role: 1, name: 1 })
      .lean()
      .exec();

    const doctorUserIds = users.filter((u) => u.role === 'doctor').map((u) => u._id);
    const doctorProfiles =
      doctorUserIds.length > 0
        ? await Doctor.find({ userId: { $in: doctorUserIds } })
            .select('userId qualification specialization designation registrationNumber bmdcNumber phone')
            .lean()
            .exec()
        : [];

    const doctorByUserId = new Map<string, any>(
      doctorProfiles.map((d) => [d.userId.toString(), d])
    );

    return users.map((u) => {
      const docProf = doctorByUserId.get(u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role as 'doctor' | 'staff',
        status: u.status,
        phone: u.phone || docProf?.phone || '',
        qualification: u.qualification || docProf?.qualification || '',
        specialization: u.specialization || docProf?.specialization || '',
        designation: u.designation || docProf?.designation || '',
        registrationNumber:
          u.registrationNumber || docProf?.registrationNumber || docProf?.bmdcNumber || '',
        isAuthorizedPractitioner: u.isAuthorizedPractitioner !== false,
      };
    });
  }

  async createPractitioner(dto: CreatePractitionerDTO): Promise<AuthorizedPractitionerItem> {
    const emailNormalized = dto.email.trim().toLowerCase();
    const existing = await User.findOne({ email: emailNormalized }).exec();
    if (existing) {
      throw new ConflictError('An account with this email already exists.', 'USER_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await User.create({
      name: dto.name.trim(),
      email: emailNormalized,
      phone: dto.phone || '',
      passwordHash,
      role: 'staff',
      status: 'active',
      qualification: dto.qualification || '',
      specialization: dto.specialization || '',
      designation: dto.designation || 'Therapy Practitioner',
      registrationNumber: dto.registrationNumber || '',
      isAuthorizedPractitioner: true,
    });

    return {
      _id: created._id,
      name: created.name,
      email: created.email,
      role: 'staff',
      status: created.status,
      phone: created.phone,
      qualification: created.qualification,
      specialization: created.specialization,
      designation: created.designation,
      registrationNumber: created.registrationNumber,
      isAuthorizedPractitioner: true,
    };
  }

  async updatePractitioner(
    id: string,
    dto: UpdatePractitionerDTO
  ): Promise<AuthorizedPractitionerItem> {
    this.assertValidObjectId(id, 'practitioner');
    const existing = await User.findById(id).exec();
    if (!existing || existing.role !== 'staff') {
      throw new NotFoundError('Staff practitioner account not found');
    }

    const updatePayload: Record<string, any> = {};
    if (dto.status !== undefined) updatePayload.status = dto.status;
    if (dto.isAuthorizedPractitioner !== undefined) {
      updatePayload.isAuthorizedPractitioner = dto.isAuthorizedPractitioner;
    }
    if (dto.phone !== undefined) updatePayload.phone = dto.phone;
    if (dto.qualification !== undefined) updatePayload.qualification = dto.qualification;
    if (dto.specialization !== undefined) updatePayload.specialization = dto.specialization;
    if (dto.designation !== undefined) updatePayload.designation = dto.designation;
    if (dto.registrationNumber !== undefined) {
      updatePayload.registrationNumber = dto.registrationNumber;
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    )
      .select('-passwordHash')
      .exec();

    if (!updated) {
      throw new NotFoundError('Staff practitioner account not found');
    }

    return {
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: 'staff',
      status: updated.status,
      phone: updated.phone,
      qualification: updated.qualification,
      specialization: updated.specialization,
      designation: updated.designation,
      registrationNumber: updated.registrationNumber,
      isAuthorizedPractitioner: updated.isAuthorizedPractitioner !== false,
    };
  }

  // =========================================================================
  // Patient-Specific Treatment Plans
  // =========================================================================

  private assertPlanClinicalRequirements(params: {
    status: string;
    clinicianApprovalConfirmed: boolean;
    consentRequired: boolean;
    consentStatus: ConsentStatus;
  }) {
    if (params.status === 'FINALIZED' || params.status === 'ACTIVE') {
      if (!params.clinicianApprovalConfirmed) {
        throw new BadRequestError(
          'Clinician approval confirmation is required before finalizing or activating a treatment plan.',
          'CLINICIAN_APPROVAL_REQUIRED'
        );
      }
      if (params.consentRequired && params.consentStatus !== 'OBTAINED') {
        throw new BadRequestError(
          'Patient informed consent must be obtained before finalizing or activating this treatment plan.',
          'PATIENT_CONSENT_REQUIRED'
        );
      }
    }
  }

  private async getAccessiblePlanOrThrow(
    planId: string,
    actorUser: IUser,
    actorDoctor?: IDoctor
  ): Promise<ITreatmentPlan> {
    this.assertValidObjectId(planId, 'treatment plan');
    const plan = await this.repo.findPlanById(planId);
    if (!plan) {
      throw new NotFoundError('Treatment plan not found');
    }

    if (actorUser.role === 'doctor') {
      if (!actorDoctor || plan.doctorId.toString() !== actorDoctor._id.toString()) {
        throw new ForbiddenError('Forbidden: You do not have access to this treatment plan');
      }
      return plan;
    }

    if (actorUser.role === 'staff') {
      if (plan.assignedPractitionerId.toString() !== actorUser._id.toString()) {
        throw new ForbiddenError(
          'Forbidden: Staff practitioners can only access treatment plans assigned to them'
        );
      }
      return plan;
    }

    throw new ForbiddenError('Forbidden: Insufficient role permission to view this clinical plan');
  }

  async createTreatmentPlan(
    doctor: IDoctor,
    dto: CreateTreatmentPlanDTO
  ): Promise<{ plan: ITreatmentPlan; sessions: ITherapySession[] }> {
    const patient = await this.verifyDoctorPatient(dto.patientId, doctor._id);
    const chamber = await this.resolveDoctorChamber(doctor, dto.chamberId);

    const therapies = await this.resolveValidatedTherapies(dto);
    const primaryTherapy = therapies[0];
    const anyConsentRequired = therapies.some((t) => Boolean(t.consentRequired));
    const anyEdTreatment = therapies.some((t) => Boolean(t.isEdTreatment));

    const practitionerSnapshot = await this.resolveAuthorizedPractitioner(dto.assignedPractitionerId);
    const nextStatus = dto.status || 'DRAFT';
    const consentStatus: ConsentStatus =
      dto.consentStatus || (anyConsentRequired ? 'PENDING' : 'NOT_REQUIRED');

    this.assertPlanClinicalRequirements({
      status: nextStatus,
      clinicianApprovalConfirmed: Boolean(dto.clinicianApprovalConfirmed),
      consentRequired: anyConsentRequired,
      consentStatus,
    });

    const chartNumber = await generateNextTreatmentPlanNumber();
    const isFinalizedState = nextStatus === 'FINALIZED' || nextStatus === 'ACTIVE';

    const createdPlan = await this.repo.createPlan({
      chartNumber,
      doctorId: doctor._id,
      patientId: patient._id,
      chamberId: chamber?._id || null,
      therapyId: primaryTherapy._id,
      therapySnapshot: this.buildTherapySnapshot(primaryTherapy),
      therapyIds: therapies.map((t) => t._id),
      therapySnapshots: therapies.map((t) => this.buildTherapySnapshot(t)),
      assignedPractitionerId: practitionerSnapshot.userId,
      practitionerSnapshot,
      patientSnapshot: this.buildPatientSnapshot(patient),
      doctorSnapshot: this.buildDoctorSnapshot(doctor, chamber),
      treatmentObjective: dto.treatmentObjective ?? '',
      clinicalIndication: dto.clinicalIndication ?? '',
      clinicianApprovalConfirmed: Boolean(dto.clinicianApprovalConfirmed),
      status: nextStatus,
      plannedSessions: dto.plannedSessions !== undefined ? dto.plannedSessions : null,
      sessionDuration: dto.sessionDuration ?? '',
      frequency: dto.frequency ?? '',
      scheduleSummary: dto.scheduleSummary ?? '',
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      precautions: dto.precautions ?? '',
      patientInstructions: dto.patientInstructions ?? '',
      consentStatus,
      consentNotes: dto.consentNotes ?? '',
      consentRecordedAt: consentStatus === 'OBTAINED' || consentStatus === 'DECLINED' ? new Date() : null,
      isEdPlan: anyEdTreatment,
      version: 1,
      finalizedAt: isFinalizedState ? new Date() : null,
    });

    let createdSessions: ITherapySession[] = [];
    if (dto.initialSessions && dto.initialSessions.length > 0) {
      const sessionDocs: Array<Partial<ITherapySession>> = [];
      for (let i = 0; i < dto.initialSessions.length; i++) {
        const item = dto.initialSessions[i];
        const sessPrac = item.assignedPractitionerId
          ? await this.resolveAuthorizedPractitioner(item.assignedPractitionerId)
          : practitionerSnapshot;

        sessionDocs.push({
          treatmentPlanId: createdPlan._id,
          doctorId: doctor._id,
          patientId: patient._id,
          therapyId: primaryTherapy._id,
          assignedPractitionerId: sessPrac.userId,
          assignedPractitionerName: sessPrac.name,
          sessionNumber: i + 1,
          scheduledAt: new Date(item.scheduledAt),
          status: 'Scheduled',
          practitionerNotes: item.practitionerNotes ?? '',
          version: 1,
        });
      }
      createdSessions = await this.repo.createSessions(sessionDocs);
    }

    const populated = (await this.repo.findPlanById(createdPlan._id)) || createdPlan;
    return { plan: populated, sessions: createdSessions };
  }

  async listTreatmentPlans(options: TreatmentPlanFilterOptions): Promise<TreatmentPlanListResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ITreatmentPlan> = {};
    const andClauses: FilterQuery<ITreatmentPlan>[] = [];

    if (options.doctorId) filter.doctorId = options.doctorId;
    if (options.assignedPractitionerId) {
      filter.assignedPractitionerId = options.assignedPractitionerId;
    }
    if (options.patientId) {
      this.assertValidObjectId(options.patientId, 'patient');
      filter.patientId = new Types.ObjectId(options.patientId);
    }
    if (options.therapyId) {
      this.assertValidObjectId(options.therapyId, 'therapy');
      const tObjId = new Types.ObjectId(options.therapyId);
      andClauses.push({ $or: [{ therapyId: tObjId }, { therapyIds: tObjId }] });
    }
    if (typeof options.isEdPlan === 'boolean') {
      filter.isEdPlan = options.isEdPlan;
    }
    if (options.status) {
      filter.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const escaped = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      andClauses.push({
        $or: [
          { chartNumber: regex },
          { 'patientSnapshot.name': regex },
          { 'patientSnapshot.patientId': regex },
          { 'therapySnapshot.name': regex },
          { 'therapySnapshots.name': regex },
          { 'practitionerSnapshot.name': regex },
        ],
      });
    }

    if (andClauses.length > 0) {
      filter.$and = andClauses;
    }

    const [plans, total] = await Promise.all([
      this.repo.findPlans(filter, { skip, limit, sort: { updatedAt: -1, createdAt: -1 } }),
      this.repo.countPlans(filter),
    ]);

    return {
      plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async listPatientTreatmentPlans(
    patientId: string,
    doctorId: Types.ObjectId | string
  ): Promise<ITreatmentPlan[]> {
    await this.verifyDoctorPatient(patientId, doctorId);
    return this.repo.findPlans(
      { doctorId, patientId: new Types.ObjectId(patientId) },
      { sort: { createdAt: -1 } }
    );
  }

  async getTreatmentPlanDetail(id: string, actorUser: IUser, actorDoctor?: IDoctor) {
    const plan = await this.getAccessiblePlanOrThrow(id, actorUser, actorDoctor);
    const sessions = await this.repo.findSessions(
      { treatmentPlanId: plan._id },
      { sort: { sessionNumber: 1, scheduledAt: 1 } }
    );

    const summary = sessions.reduce(
      (acc, sess) => {
        acc.total += 1;
        if (sess.status === 'Scheduled') acc.scheduled += 1;
        else if (sess.status === 'Completed') acc.completed += 1;
        else if (sess.status === 'Cancelled') acc.cancelled += 1;
        else if (sess.status === 'Missed') acc.missed += 1;
        else if (sess.status === 'Rescheduled') acc.rescheduled += 1;
        return acc;
      },
      { total: 0, scheduled: 0, completed: 0, cancelled: 0, missed: 0, rescheduled: 0 }
    );

    return { plan, sessions, summary };
  }

  async updateTreatmentPlan(
    id: string,
    doctor: IDoctor,
    dto: UpdateTreatmentPlanDTO
  ): Promise<ITreatmentPlan> {
    this.assertValidObjectId(id, 'treatment plan');
    const existing = await this.repo.findPlanById(id);
    if (!existing) {
      throw new NotFoundError('Treatment plan not found');
    }
    if (existing.doctorId.toString() !== doctor._id.toString()) {
      throw new ForbiddenError('Forbidden: You do not have permission to update this treatment plan');
    }

    const updatingTherapies = dto.therapyIds !== undefined || dto.therapyId !== undefined;
    let effectiveTherapies: ITherapy[];
    if (updatingTherapies) {
      if (existing.status !== 'DRAFT') {
        throw new BadRequestError(
          'Selected therapies cannot be modified after the treatment plan is finalized.',
          'PLAN_THERAPIES_LOCKED'
        );
      }
      effectiveTherapies = await this.resolveValidatedTherapies(dto);
    } else {
      const existingIds =
        existing.therapyIds && existing.therapyIds.length > 0
          ? existing.therapyIds
          : [existing.therapyId];
      effectiveTherapies = await this.repo.findTherapiesByIds(existingIds);
    }

    const chamber = await this.resolveDoctorChamber(
      doctor,
      dto.chamberId !== undefined ? dto.chamberId : existing.chamberId?.toString()
    );

    const nextStatus = dto.status || existing.status;
    const nextApproval =
      dto.clinicianApprovalConfirmed !== undefined
        ? dto.clinicianApprovalConfirmed
        : existing.clinicianApprovalConfirmed;
    const nextConsent = dto.consentStatus || existing.consentStatus;

    this.assertPlanClinicalRequirements({
      status: nextStatus,
      clinicianApprovalConfirmed: nextApproval,
      consentRequired: effectiveTherapies.some((t) => Boolean(t.consentRequired)),
      consentStatus: nextConsent,
    });

    const updatePayload: Record<string, any> = {
      chamberId: chamber?._id || null,
      doctorSnapshot: this.buildDoctorSnapshot(doctor, chamber),
      status: nextStatus,
      clinicianApprovalConfirmed: nextApproval,
      consentStatus: nextConsent,
    };

    if (updatingTherapies && effectiveTherapies.length > 0) {
      const primaryTherapy = effectiveTherapies[0];
      updatePayload.therapyId = primaryTherapy._id;
      updatePayload.therapySnapshot = this.buildTherapySnapshot(primaryTherapy);
      updatePayload.therapyIds = effectiveTherapies.map((t) => t._id);
      updatePayload.therapySnapshots = effectiveTherapies.map((t) => this.buildTherapySnapshot(t));
      updatePayload.isEdPlan = effectiveTherapies.some((t) => Boolean(t.isEdTreatment));
    }

    if (dto.assignedPractitionerId && dto.assignedPractitionerId !== existing.assignedPractitionerId.toString()) {
      const prac = await this.resolveAuthorizedPractitioner(dto.assignedPractitionerId);
      updatePayload.assignedPractitionerId = prac.userId;
      updatePayload.practitionerSnapshot = prac;
    }

    if (dto.treatmentObjective !== undefined) updatePayload.treatmentObjective = dto.treatmentObjective;
    if (dto.clinicalIndication !== undefined) updatePayload.clinicalIndication = dto.clinicalIndication;
    if (dto.plannedSessions !== undefined) updatePayload.plannedSessions = dto.plannedSessions;
    if (dto.sessionDuration !== undefined) updatePayload.sessionDuration = dto.sessionDuration;
    if (dto.frequency !== undefined) updatePayload.frequency = dto.frequency;
    if (dto.scheduleSummary !== undefined) updatePayload.scheduleSummary = dto.scheduleSummary;
    if (dto.startDate !== undefined) {
      updatePayload.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      updatePayload.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.precautions !== undefined) updatePayload.precautions = dto.precautions;
    if (dto.patientInstructions !== undefined) updatePayload.patientInstructions = dto.patientInstructions;
    if (dto.consentNotes !== undefined) updatePayload.consentNotes = dto.consentNotes;

    if (
      dto.consentStatus &&
      (dto.consentStatus === 'OBTAINED' || dto.consentStatus === 'DECLINED') &&
      dto.consentStatus !== existing.consentStatus
    ) {
      updatePayload.consentRecordedAt = new Date();
    }

    if ((nextStatus === 'FINALIZED' || nextStatus === 'ACTIVE') && !existing.finalizedAt) {
      updatePayload.finalizedAt = new Date();
    }

    const updated = await this.repo.updatePlanById(id, updatePayload);
    if (!updated) {
      throw new NotFoundError('Treatment plan not found');
    }
    return updated;
  }

  async finalizeTreatmentPlan(id: string, doctor: IDoctor): Promise<ITreatmentPlan> {
    this.assertValidObjectId(id, 'treatment plan');
    const existing = await this.repo.findPlanById(id);
    if (!existing) {
      throw new NotFoundError('Treatment plan not found');
    }
    if (existing.doctorId.toString() !== doctor._id.toString()) {
      throw new ForbiddenError('Forbidden: You do not have permission to finalize this treatment plan');
    }
    if (existing.status === 'CANCELLED') {
      throw new BadRequestError('Cancelled plans cannot be finalized.', 'PLAN_CANCELLED');
    }

    const existingIds =
      existing.therapyIds && existing.therapyIds.length > 0
        ? existing.therapyIds
        : [existing.therapyId];
    const therapies = await this.repo.findTherapiesByIds(existingIds);
    this.assertPlanClinicalRequirements({
      status: 'FINALIZED',
      clinicianApprovalConfirmed: existing.clinicianApprovalConfirmed,
      consentRequired: therapies.some((t) => Boolean(t.consentRequired)),
      consentStatus: existing.consentStatus,
    });

    const chamber = await this.resolveDoctorChamber(doctor, existing.chamberId?.toString());
    const updated = await this.repo.updatePlanById(id, {
      status: existing.status === 'ACTIVE' || existing.status === 'COMPLETED' ? existing.status : 'FINALIZED',
      finalizedAt: existing.finalizedAt || new Date(),
      chamberId: chamber?._id || null,
      doctorSnapshot: this.buildDoctorSnapshot(doctor, chamber),
    });

    if (!updated) {
      throw new NotFoundError('Treatment plan not found');
    }
    return updated;
  }

  async getPatientTreatmentHistory(patientId: string, doctorId: Types.ObjectId | string) {
    const patient = await this.verifyDoctorPatient(patientId, doctorId);
    const patientObjId = new Types.ObjectId(patientId);

    const [plans, sessions] = await Promise.all([
      this.repo.findPlans({ doctorId, patientId: patientObjId }, { sort: { createdAt: -1 } }),
      this.repo.findSessionsWithPlan(
        { doctorId, patientId: patientObjId },
        { sort: { scheduledAt: -1, sessionNumber: -1 } }
      ),
    ]);

    const activePlans = plans.filter((p) =>
      p.status === 'ACTIVE' || p.status === 'FINALIZED' || p.status === 'DRAFT'
    );
    const previousPlans = plans.filter((p) => p.status === 'COMPLETED' || p.status === 'CANCELLED');

    const completedSessionsCount = sessions.filter((s) => s.status === 'Completed').length;
    const upcomingSessionsCount = sessions.filter(
      (s) => s.status === 'Scheduled' || s.status === 'Rescheduled'
    ).length;

    return {
      patient: this.buildPatientSnapshot(patient),
      summary: {
        totalPlans: plans.length,
        activePlansCount: activePlans.length,
        completedSessionsCount,
        upcomingSessionsCount,
      },
      activePlans,
      previousPlans,
      sessions,
    };
  }

  // =========================================================================
  // Session Scheduling & Tracking
  // =========================================================================

  async listSessions(options: TherapySessionFilterOptions): Promise<TherapySessionListResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 25));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ITherapySession> = {};
    if (options.doctorId) filter.doctorId = options.doctorId;
    if (options.assignedPractitionerId) {
      filter.assignedPractitionerId = options.assignedPractitionerId;
    }
    if (options.treatmentPlanId) {
      this.assertValidObjectId(options.treatmentPlanId, 'treatment plan');
      filter.treatmentPlanId = new Types.ObjectId(options.treatmentPlanId);
    }
    if (options.patientId) {
      this.assertValidObjectId(options.patientId, 'patient');
      filter.patientId = new Types.ObjectId(options.patientId);
    }
    if (options.status) {
      filter.status = options.status;
    }
    if (options.fromDate || options.toDate) {
      filter.scheduledAt = {};
      if (options.fromDate) filter.scheduledAt.$gte = new Date(options.fromDate);
      if (options.toDate) filter.scheduledAt.$lte = new Date(options.toDate);
    }

    const [sessions, total] = await Promise.all([
      this.repo.findSessionsWithPlan(filter, { skip, limit, sort: { scheduledAt: 1, sessionNumber: 1 } }),
      this.repo.countSessions(filter),
    ]);

    return {
      sessions: sessions as ITherapySession[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createSessionsForPlan(
    planId: string,
    doctor: IDoctor,
    dto: CreateSessionsDTO
  ): Promise<ITherapySession[]> {
    this.assertValidObjectId(planId, 'treatment plan');
    const plan = await this.repo.findPlanById(planId);
    if (!plan) {
      throw new NotFoundError('Treatment plan not found');
    }
    if (plan.doctorId.toString() !== doctor._id.toString()) {
      throw new ForbiddenError('Forbidden: You cannot schedule sessions on another doctor\'s plan');
    }
    if (plan.status === 'CANCELLED' || plan.status === 'COMPLETED') {
      throw new BadRequestError(
        `Cannot schedule new sessions on a ${plan.status.toLowerCase()} treatment plan.`,
        'PLAN_NOT_SCHEDULABLE'
      );
    }

    let nextNumber = (await this.repo.getMaxSessionNumber(plan._id)) + 1;
    const docs: Array<Partial<ITherapySession>> = [];

    for (const entry of dto.sessions) {
      const assignedPrac = entry.assignedPractitionerId
        ? await this.resolveAuthorizedPractitioner(entry.assignedPractitionerId)
        : plan.practitionerSnapshot;

      const seq = entry.sessionNumber || nextNumber;
      if (!entry.sessionNumber) {
        nextNumber += 1;
      } else {
        nextNumber = Math.max(nextNumber, seq + 1);
      }

      docs.push({
        treatmentPlanId: plan._id,
        doctorId: plan.doctorId,
        patientId: plan.patientId,
        therapyId: plan.therapyId,
        assignedPractitionerId: assignedPrac.userId,
        assignedPractitionerName: assignedPrac.name,
        sessionNumber: seq,
        scheduledAt: new Date(entry.scheduledAt),
        status: 'Scheduled',
        practitionerNotes: entry.practitionerNotes ?? '',
        version: 1,
      });
    }

    try {
      return await this.repo.createSessions(docs);
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictError(
          'Session number conflict detected for this treatment plan.',
          'SESSION_NUMBER_EXISTS'
        );
      }
      throw err;
    }
  }

  async updateSession(
    sessionId: string,
    actorUser: IUser,
    actorDoctor: IDoctor | undefined,
    dto: UpdateSessionDTO
  ): Promise<ITherapySession> {
    this.assertValidObjectId(sessionId, 'session');
    const existing = await this.repo.findSessionById(sessionId);
    if (!existing) {
      throw new NotFoundError('Therapy session not found');
    }

    if (actorUser.role === 'doctor') {
      if (!actorDoctor || existing.doctorId.toString() !== actorDoctor._id.toString()) {
        throw new ForbiddenError('Forbidden: You do not have permission to update this session');
      }
    } else if (actorUser.role === 'staff') {
      if (existing.assignedPractitionerId.toString() !== actorUser._id.toString()) {
        throw new ForbiddenError(
          'Forbidden: Staff practitioners can only update sessions assigned to them'
        );
      }
      if (
        dto.assignedPractitionerId &&
        dto.assignedPractitionerId !== existing.assignedPractitionerId.toString()
      ) {
        throw new ForbiddenError(
          'Forbidden: Staff practitioners cannot reassign sessions to another practitioner'
        );
      }
    } else {
      throw new ForbiddenError('Forbidden: Insufficient clinical permission to update sessions');
    }

    // Preserve historical integrity of completed clinical sessions
    if (existing.status === 'Completed' && dto.status && dto.status !== 'Completed') {
      throw new BadRequestError(
        'Completed therapy sessions cannot be reverted to preserve clinical history.',
        'COMPLETED_SESSION_IMMUTABLE'
      );
    }

    const updateFields: Record<string, any> = {
      updatedByUserId: actorUser._id,
    };

    if (dto.status !== undefined) {
      updateFields.status = dto.status;
      if (dto.status === 'Completed') {
        updateFields.completedAt = dto.completedAt
          ? new Date(dto.completedAt)
          : existing.completedAt || new Date();
      }
    } else if (dto.completedAt !== undefined) {
      updateFields.completedAt = dto.completedAt ? new Date(dto.completedAt) : null;
    }

    if (dto.scheduledAt !== undefined && dto.scheduledAt !== null) {
      updateFields.scheduledAt = new Date(dto.scheduledAt);
    }
    if (dto.practitionerNotes !== undefined) {
      updateFields.practitionerNotes = dto.practitionerNotes;
    }
    if (dto.patientFeedback !== undefined) {
      updateFields.patientFeedback = dto.patientFeedback;
    }
    if (dto.nextSessionDate !== undefined) {
      updateFields.nextSessionDate = dto.nextSessionDate ? new Date(dto.nextSessionDate) : null;
    }

    if (dto.assignedPractitionerId && actorUser.role === 'doctor') {
      const prac = await this.resolveAuthorizedPractitioner(dto.assignedPractitionerId);
      updateFields.assignedPractitionerId = prac.userId;
      updateFields.assignedPractitionerName = prac.name;
    }

    const updated = await this.repo.updateSessionWithLock(sessionId, dto.version, updateFields);
    if (!updated) {
      throw new ConflictError(
        'This therapy session was modified by another user. Refresh and retry with the latest version.',
        'SESSION_CONFLICT'
      );
    }

    // Promote FINALIZED plan to ACTIVE cleanly once a session is recorded as Completed
    if (updated.status === 'Completed') {
      const parentPlan = await this.repo.findPlanById(updated.treatmentPlanId);
      if (parentPlan && parentPlan.status === 'FINALIZED') {
        await this.repo.updatePlanById(parentPlan._id, { status: 'ACTIVE' });
      }
    }

    return updated;
  }

  async deleteSession(sessionId: string, doctor: IDoctor): Promise<ITherapySession> {
    this.assertValidObjectId(sessionId, 'session');
    const existing = await this.repo.findSessionById(sessionId);
    if (!existing) {
      throw new NotFoundError('Therapy session not found');
    }
    if (existing.doctorId.toString() !== doctor._id.toString()) {
      throw new ForbiddenError('Forbidden: You do not have permission to delete this session');
    }
    if (existing.status === 'Completed') {
      throw new BadRequestError(
        'Completed therapy sessions are permanent clinical records and cannot be deleted.',
        'COMPLETED_SESSION_IMMUTABLE'
      );
    }

    const deleted = await this.repo.deleteNonCompletedSession(sessionId);
    if (!deleted) {
      throw new BadRequestError(
        'Unable to delete session because it has already been marked completed.',
        'COMPLETED_SESSION_IMMUTABLE'
      );
    }

    return deleted;
  }
}

export const therapyService = new TherapyService();
