import { User } from '../../models/User';
import { Doctor } from '../../models/Doctor';
import { Chamber } from '../../models/Chamber';
import { Patient } from '../../models/Patient';
import { Prescription } from '../../models/Prescription';
import { Medicine } from '../../models/Medicine';
import { AuditLog } from '../../models/AuditLog';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import mongoose, { Types } from 'mongoose';

export class AdminService {
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalDoctors,
      activeDoctors,
      pendingDoctors,
      totalPatients,
      totalPrescriptions,
      todayPrescriptions,
      totalMedicines,
      totalChambers,
      recentAuditLogs,
    ] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'doctor', status: 'active' }),
      User.countDocuments({ role: 'doctor', status: 'pending' }),
      Patient.countDocuments(),
      Prescription.countDocuments(),
      Prescription.countDocuments({ createdAt: { $gte: today } }),
      Medicine.countDocuments(),
      Chamber.countDocuments({ status: 'active' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email role'),
    ]);

    return {
      stats: {
        totalDoctors,
        activeDoctors,
        pendingDoctors,
        totalPatients,
        totalPrescriptions,
        todayPrescriptions,
        totalMedicines,
        totalChambers,
      },
      recentLogs: recentAuditLogs,
    };
  }

  async getDoctors() {
    return Doctor.find()
      .populate('userId', 'email status createdAt')
      .sort({ createdAt: -1 });
  }

  async updateDoctorStatus(doctorId: string, status: string) {
    if (!['active', 'pending', 'suspended'].includes(status)) {
      throw new BadRequestError('Invalid status');
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new NotFoundError('Doctor not found');
    }

    let doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      // Fallback: look up by linked userId in case client provided user ID
      doctor = await Doctor.findOne({ userId: doctorId });
    }

    if (doctor) {
      await User.findByIdAndUpdate(doctor.userId, { status });
      return doctor;
    }

    // Fallback: check if direct user exists with doctor role
    const user = await User.findById(doctorId);
    if (user && user.role === 'doctor') {
      await User.findByIdAndUpdate(user._id, { status });
      return { _id: user._id, name: user.name, userId: user._id } as any;
    }

    throw new NotFoundError('Doctor not found');
  }

  async getAuditLogs(params: { page?: number; limit?: number; action?: string; resource?: string }) {
    const pageNum = params.page || 1;
    const limitNum = params.limit || 30;
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (params.action) query.action = params.action;
    if (params.resource) query.resource = params.resource;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email role'),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getReports(doctorId?: Types.ObjectId | string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filter: any = doctorId ? { doctorId } : {};

    const [
      totalPatients,
      todayPatients,
      totalPrescriptions,
      todayPrescriptions,
      monthPrescriptions,
      allPrescriptions,
    ] = await Promise.all([
      Patient.countDocuments(filter),
      Patient.countDocuments({ ...filter, createdAt: { $gte: today } }),
      Prescription.countDocuments(filter),
      Prescription.countDocuments({ ...filter, createdAt: { $gte: today } }),
      Prescription.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
      Prescription.find(filter).select('medicines diagnosis createdAt status').limit(200),
    ]);

    const medCounts: Record<string, number> = {};
    const diagnosisCounts: Record<string, number> = {};

    allPrescriptions.forEach((rx) => {
      rx.medicines.forEach((m) => {
        const key = m.brandName;
        medCounts[key] = (medCounts[key] || 0) + 1;
      });
      rx.diagnosis.forEach((d) => {
        if (d.name) {
          diagnosisCounts[d.name] = (diagnosisCounts[d.name] || 0) + 1;
        }
      });
    });

    const topMedicines = Object.entries(medCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topDiagnoses = Object.entries(diagnosisCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      stats: {
        totalPatients,
        todayPatients,
        totalPrescriptions,
        todayPrescriptions,
        monthPrescriptions,
      },
      topMedicines,
      topDiagnoses,
    };
  }
}

export const adminService = new AdminService();
