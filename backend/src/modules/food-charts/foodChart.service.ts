import { Types, FilterQuery } from 'mongoose';
import { IDoctor } from '../../models/Doctor';
import { Patient, IPatient } from '../../models/Patient';
import { Chamber, IChamber } from '../../models/Chamber';
import {
  FoodChart,
  IFoodChart,
  IFoodChartDoctorSnapshot,
  IFoodChartEntry,
  IFoodChartPatientSnapshot,
  IFoodChartSupplement,
} from '../../models/FoodChart';
import { ensureFoodCatalogSeeded } from '../../seeds/foodCatalog';
import { generateNextFoodChartNumber } from '../../shared/utils/idGenerator';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors';
import { foodChartRepository, FoodChartRepository } from './foodChart.repository';
import {
  CreateFoodChartDTO,
  FoodChartFilterOptions,
  FoodChartListResult,
  UpdateFoodChartDTO,
} from './foodChart.types';

const normalizeOrder = <T extends { order?: number }>(items: T[] = []): (T & { order: number })[] =>
  items.map((item, idx) => ({
    ...item,
    order: typeof item.order === 'number' && Number.isFinite(item.order) ? item.order : idx,
  }));

export class FoodChartService {
  constructor(private repo: FoodChartRepository = foodChartRepository) {}

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

  private buildPatientSnapshot(patient: IPatient): IFoodChartPatientSnapshot {
    return {
      patientId: patient.patientId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      bloodGroup: patient.bloodGroup,
    };
  }

  private buildDoctorSnapshot(doctor: IDoctor, chamber: IChamber | null): IFoodChartDoctorSnapshot {
    return {
      name: doctor.name,
      qualification: doctor.qualification || '',
      specialization: doctor.specialization || '',
      designation: doctor.designation,
      workplace: doctor.workplace,
      bmdcNumber: doctor.bmdcNumber,
      healthcareAuthority: doctor.healthcareAuthority || 'BMDC',
      registrationNumber: doctor.registrationNumber || doctor.bmdcNumber,
      institutionRegNumbers: doctor.institutionRegNumbers || {},
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

  private async getOwnedChartOrThrow(
    id: string,
    doctorId: Types.ObjectId | string
  ): Promise<IFoodChart> {
    this.assertValidObjectId(id, 'food chart');
    const chart = await this.repo.findById(id);
    if (!chart) {
      throw new NotFoundError('Food chart not found');
    }
    if (chart.doctorId.toString() !== doctorId.toString()) {
      throw new ForbiddenError('Forbidden: You do not have permission to access this food chart');
    }
    return chart;
  }

  async getCatalog() {
    await ensureFoodCatalogSeeded();
    const items = await this.repo.findCatalogItems();
    const allowed = items.filter((item) => item.section === 'allowed');
    const avoided = items.filter((item) => item.section === 'avoided');
    return {
      allowed,
      avoided,
      items,
      total: items.length,
    };
  }

  async listFoodCharts(options: FoodChartFilterOptions): Promise<FoodChartListResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<IFoodChart> = {
      doctorId: options.doctorId,
    };

    if (options.patientId) {
      this.assertValidObjectId(options.patientId, 'patient');
      filter.patientId = new Types.ObjectId(options.patientId);
    }

    if (options.status && (options.status === 'DRAFT' || options.status === 'FINALIZED')) {
      filter.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const escaped = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { chartNumber: regex },
        { 'patientSnapshot.name': regex },
        { 'patientSnapshot.patientId': regex },
        { 'patientSnapshot.phone': regex },
      ];
    }

    const [charts, total] = await Promise.all([
      this.repo.find(filter, {
        skip,
        limit,
        sort: { updatedAt: -1, createdAt: -1 },
      }),
      this.repo.count(filter),
    ]);

    return {
      charts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async listPatientFoodCharts(
    patientId: string,
    doctorId: Types.ObjectId | string,
    status?: string
  ): Promise<any[]> {
    await this.verifyDoctorPatient(patientId, doctorId);

    const filter: FilterQuery<IFoodChart> = {
      doctorId,
      patientId: new Types.ObjectId(patientId),
    };

    if (status === 'DRAFT' || status === 'FINALIZED') {
      filter.status = status;
    }

    return this.repo.find(filter, {
      sort: { version: -1, createdAt: -1 },
    });
  }

  async getFoodChartById(id: string, doctorId: Types.ObjectId | string): Promise<IFoodChart> {
    return this.getOwnedChartOrThrow(id, doctorId);
  }

  async getVersionHistory(id: string, doctorId: Types.ObjectId | string): Promise<any[]> {
    const chart = await this.getOwnedChartOrThrow(id, doctorId);
    const rootId = chart.rootChartId || chart._id;
    return this.repo.findVersionsByRoot(rootId, doctorId);
  }

  async createFoodChart(doctor: IDoctor, data: CreateFoodChartDTO): Promise<IFoodChart> {
    const patient = await this.verifyDoctorPatient(data.patientId, doctor._id);
    const chamber = await this.resolveDoctorChamber(doctor, data.chamberId);
    const chartNumber = await generateNextFoodChartNumber();

    const assignedId = new Types.ObjectId();
    const status = data.status === 'FINALIZED' ? 'FINALIZED' : 'DRAFT';

    const created = await this.repo.create({
      _id: assignedId,
      chartNumber,
      doctorId: doctor._id,
      patientId: patient._id,
      chamberId: chamber?._id || null,
      patientSnapshot: this.buildPatientSnapshot(patient),
      doctorSnapshot: this.buildDoctorSnapshot(doctor, chamber),
      status,
      allowedFoods: normalizeOrder<IFoodChartEntry>(data.allowedFoods || []),
      avoidedFoods: normalizeOrder<IFoodChartEntry>(data.avoidedFoods || []),
      supplements: normalizeOrder<IFoodChartSupplement>(data.supplements || []),
      dietaryInstructions: data.dietaryInstructions ?? '',
      additionalNotes: data.additionalNotes ?? '',
      version: 1,
      parentChartId: null,
      rootChartId: assignedId,
      finalizedAt: status === 'FINALIZED' ? new Date() : null,
    });

    const populated = await this.repo.findScopedById(created._id, doctor._id);
    return populated || created;
  }

  async updateFoodChart(
    id: string,
    doctor: IDoctor,
    data: UpdateFoodChartDTO
  ): Promise<IFoodChart> {
    const existing = await this.getOwnedChartOrThrow(id, doctor._id);

    if (existing.status === 'FINALIZED') {
      throw new BadRequestError(
        'Finalized food charts are immutable and cannot be edited directly. Create a new revision instead.',
        'FOOD_CHART_FINALIZED'
      );
    }

    const chamber = await this.resolveDoctorChamber(
      doctor,
      data.chamberId !== undefined ? data.chamberId : existing.chamberId?.toString()
    );

    // Refresh patient snapshot safely if patient record still exists under doctor
    const patient = await Patient.findOne({ _id: existing.patientId, doctorId: doctor._id }).exec();

    const nextStatus = data.status === 'FINALIZED' ? 'FINALIZED' : 'DRAFT';
    const updatePayload: Record<string, any> = {
      chamberId: chamber?._id || null,
      doctorSnapshot: this.buildDoctorSnapshot(doctor, chamber),
      allowedFoods: normalizeOrder<IFoodChartEntry>(data.allowedFoods || []),
      avoidedFoods: normalizeOrder<IFoodChartEntry>(data.avoidedFoods || []),
      supplements: normalizeOrder<IFoodChartSupplement>(data.supplements || []),
      dietaryInstructions: data.dietaryInstructions ?? '',
      additionalNotes: data.additionalNotes ?? '',
      status: nextStatus,
    };

    if (patient) {
      updatePayload.patientSnapshot = this.buildPatientSnapshot(patient);
    }

    if (nextStatus === 'FINALIZED') {
      updatePayload.finalizedAt = new Date();
    }

    const updated = await this.repo.updateScoped(id, doctor._id, updatePayload);
    if (!updated) {
      throw new BadRequestError(
        'Unable to update food chart because it is no longer an editable draft.',
        'FOOD_CHART_FINALIZED'
      );
    }

    return updated;
  }

  async finalizeFoodChart(id: string, doctor: IDoctor): Promise<IFoodChart> {
    const existing = await this.getOwnedChartOrThrow(id, doctor._id);

    if (existing.status === 'FINALIZED') {
      throw new BadRequestError('Food chart is already finalized.', 'FOOD_CHART_ALREADY_FINALIZED');
    }

    const chamber = await this.resolveDoctorChamber(doctor, existing.chamberId?.toString());
    const patient = await Patient.findOne({ _id: existing.patientId, doctorId: doctor._id }).exec();

    const updatePayload: Record<string, any> = {
      status: 'FINALIZED',
      finalizedAt: new Date(),
      chamberId: chamber?._id || null,
      doctorSnapshot: this.buildDoctorSnapshot(doctor, chamber),
    };

    if (patient) {
      updatePayload.patientSnapshot = this.buildPatientSnapshot(patient);
    }

    const finalized = await this.repo.updateScoped(id, doctor._id, updatePayload);
    if (!finalized) {
      throw new BadRequestError(
        'Food chart is already finalized.',
        'FOOD_CHART_ALREADY_FINALIZED'
      );
    }

    return finalized;
  }

  async reviseFoodChart(id: string, doctor: IDoctor): Promise<IFoodChart> {
    const source = await this.getOwnedChartOrThrow(id, doctor._id);
    const patient = await this.verifyDoctorPatient(source.patientId.toString(), doctor._id);
    const chamber = await this.resolveDoctorChamber(doctor, source.chamberId?.toString());

    const rootChartId = source.rootChartId || source._id;
    const maxVersion = await this.repo.getMaxVersionForRoot(rootChartId, doctor._id);
    const nextVersion = maxVersion + 1;
    const chartNumber = await generateNextFoodChartNumber();

    const cloneEntries = (entries: IFoodChartEntry[]): IFoodChartEntry[] =>
      (entries || []).map((entry, idx) => ({
        catalogItemId: entry.catalogItemId || null,
        labelBn: entry.labelBn,
        category: entry.category,
        isCustom: Boolean(entry.isCustom),
        portion: entry.portion,
        timing: entry.timing,
        prepNote: entry.prepNote,
        order: typeof entry.order === 'number' ? entry.order : idx,
      }));

    const cloneSupplements = (supplements: IFoodChartSupplement[]): IFoodChartSupplement[] =>
      (supplements || []).map((sup, idx) => ({
        name: sup.name,
        dosage: sup.dosage,
        frequency: sup.frequency,
        duration: sup.duration,
        instructions: sup.instructions,
        order: typeof sup.order === 'number' ? sup.order : idx,
      }));

    const revised = await this.repo.create({
      chartNumber,
      doctorId: doctor._id,
      patientId: patient._id,
      chamberId: chamber?._id || null,
      patientSnapshot: this.buildPatientSnapshot(patient),
      doctorSnapshot: this.buildDoctorSnapshot(doctor, chamber),
      status: 'DRAFT',
      allowedFoods: cloneEntries(source.allowedFoods),
      avoidedFoods: cloneEntries(source.avoidedFoods),
      supplements: cloneSupplements(source.supplements),
      dietaryInstructions: source.dietaryInstructions || '',
      additionalNotes: source.additionalNotes || '',
      version: nextVersion,
      parentChartId: source._id,
      rootChartId,
      finalizedAt: null,
    });

    const populated = await this.repo.findScopedById(revised._id, doctor._id);
    return populated || revised;
  }

  async deleteDraftFoodChart(id: string, doctorId: Types.ObjectId | string): Promise<IFoodChart> {
    const existing = await this.getOwnedChartOrThrow(id, doctorId);

    if (existing.status === 'FINALIZED') {
      throw new BadRequestError(
        'Finalized food charts are permanent medical records and cannot be deleted.',
        'FOOD_CHART_FINALIZED'
      );
    }

    const deleted = await this.repo.deleteDraftScoped(id, doctorId);
    if (!deleted) {
      throw new BadRequestError(
        'Unable to delete food chart because it is no longer a draft.',
        'FOOD_CHART_FINALIZED'
      );
    }

    return existing;
  }
}

export const foodChartService = new FoodChartService();
