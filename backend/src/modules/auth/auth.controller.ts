import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { authService } from './auth.service';
import { ENV } from '../../config/env';
import { logAuditEvent } from '../../middleware/audit';
import { Doctor } from '../../models/Doctor';
import { Chamber } from '../../models/Chamber';
import { Template } from '../../models/Template';
import { Patient } from '../../models/Patient';
import { Prescription } from '../../models/Prescription';
import { User } from '../../models/User';
import {
  RegisterDoctorSchema,
  LoginSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
  ResetPasswordSchema,
} from '../../validators/schemas';

const setAuthCookies = (res: Response, accessToken: string, rawRefreshToken?: string, rememberMe = false) => {
  const isProd = ENV.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };

  // 15-minute access token cookie for web browsers
  res.cookie('token', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  // Long-lived refresh token cookie (7 or 30 days)
  if (rawRefreshToken) {
    const days = rememberMe ? 30 : 7;
    res.cookie('refreshToken', rawRefreshToken, {
      ...cookieOptions,
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }
};

const clearAuthCookies = (res: Response) => {
  const isProd = ENV.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
  res.clearCookie('token', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
};

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    const validated = RegisterDoctorSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.registerDoctor(validated, ipAddress, userAgent);
    setAuthCookies(res, result.accessToken, result.refreshToken, false);

    await logAuditEvent(req, {
      action: 'USER_REGISTER',
      resource: 'User',
      resourceId: result.user.id.toString(),
      details: { email: result.user.email, role: result.user.role },
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: result,
      token: result.accessToken,
    });
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    const validated = LoginSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(validated, ipAddress, userAgent);
    setAuthCookies(res, result.accessToken, result.refreshToken, validated.rememberMe);

    await logAuditEvent(req, {
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: result.user.id.toString(),
      details: { email: result.user.email, role: result.user.role, rememberMe: validated.rememberMe },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: result,
      token: result.accessToken,
    });
  }

  async refresh(req: AuthRequest, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokens = await authService.refreshTokens(rawRefreshToken, ipAddress, userAgent);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully.',
      data: {
        accessToken: tokens.accessToken,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    });
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user?._id?.toString();

    await authService.logout(rawRefreshToken, userId);
    clearAuthCookies(res);

    if (req.user) {
      await logAuditEvent(req, {
        action: 'USER_LOGOUT',
        resource: 'User',
        resourceId: req.user._id.toString(),
      });
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  }

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    let doctor: any = null;
    let chambers: any[] = [];
    if (req.user.role === 'doctor' || req.user.role === 'admin') {
      doctor = await Doctor.findOne({ userId: req.user._id }).populate('defaultChamberId').lean();
      if (doctor) {
        chambers = await Chamber.find({ doctorId: (doctor as any)._id, status: 'active' })
          .sort({ isDefault: -1, createdAt: 1 })
          .lean();
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          role: req.user.role,
        },
        doctor,
        chambers,
      },
    });
  }

  async updateDoctorProfile(req: AuthRequest, res: Response): Promise<void> {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor profile not found.' });
      return;
    }

    const {
      name,
      qualification,
      specialization,
      designation,
      workplace,
      healthcareInstitutions,
      healthcareAuthority,
      healthcareInstitution,
      registrationNumber,
      institutionRegNumbers,
      phone,
      email,
      profileImage,
      signature,
      logo,
      bmdcNumber,
    } = req.body;

    const doctor = req.doctor;
    if (name) doctor.name = name;
    if (qualification) doctor.qualification = qualification;
    if (specialization) doctor.specialization = specialization;
    if (designation !== undefined) doctor.designation = designation;
    if (workplace !== undefined) doctor.workplace = workplace;
    if (healthcareInstitutions !== undefined) {
      doctor.healthcareInstitutions = Array.isArray(healthcareInstitutions)
        ? healthcareInstitutions
        : healthcareInstitutions
        ? [healthcareInstitutions]
        : [];
    }
    if (healthcareAuthority !== undefined) doctor.healthcareAuthority = healthcareAuthority;
    if (healthcareInstitution !== undefined) doctor.healthcareAuthority = healthcareInstitution;
    if (!doctor.healthcareAuthority && doctor.healthcareInstitutions && doctor.healthcareInstitutions.length > 0) {
      doctor.healthcareAuthority = doctor.healthcareInstitutions[0];
    }

    if (institutionRegNumbers !== undefined) {
      doctor.institutionRegNumbers = institutionRegNumbers;
    }

    const effectiveRegNumber =
      registrationNumber !== undefined
        ? registrationNumber
        : bmdcNumber !== undefined
        ? bmdcNumber
        : doctor.healthcareAuthority && doctor.institutionRegNumbers && doctor.institutionRegNumbers[doctor.healthcareAuthority]
        ? doctor.institutionRegNumbers[doctor.healthcareAuthority]
        : undefined;

    if (effectiveRegNumber !== undefined) {
      doctor.registrationNumber = effectiveRegNumber;
      doctor.bmdcNumber = effectiveRegNumber;
    }

    if (phone) doctor.phone = phone;
    if (email) doctor.email = email;
    if (profileImage !== undefined) doctor.profileImage = profileImage;
    if (signature !== undefined) doctor.signature = signature;
    if (logo !== undefined) doctor.logo = logo;

    await doctor.save();

    if (name && req.user) {
      req.user.name = name;
      await req.user.save();
    }

    await logAuditEvent(req, {
      action: 'DOCTOR_PROFILE_UPDATE',
      resource: 'Doctor',
      resourceId: doctor._id.toString(),
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: doctor,
    });
  }

  async updateDoctorSettings(req: AuthRequest, res: Response): Promise<void> {
    if (!req.doctor) {
      res.status(403).json({ success: false, message: 'Doctor profile not found.' });
      return;
    }

    req.doctor.settings = {
      ...req.doctor.settings,
      ...req.body,
    };

    await req.doctor.save();

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      data: req.doctor.settings,
    });
  }

  async forgotPassword(req: AuthRequest, res: Response): Promise<void> {
    const validated = ForgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(validated.email);
    res.json(result);
  }

  async verifyOtp(req: AuthRequest, res: Response): Promise<void> {
    const validated = VerifyOtpSchema.parse(req.body);
    const result = await authService.verifyOtp(validated.email, validated.otp);
    res.json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken: result.resetToken,
      data: result,
    });
  }

  async resendOtp(req: AuthRequest, res: Response): Promise<void> {
    const validated = ResendOtpSchema.parse(req.body);
    const result = await authService.forgotPassword(validated.email);
    res.json(result);
  }

  async resetPassword(req: AuthRequest, res: Response): Promise<void> {
    const tokenParam = req.params?.token;
    const { resetToken, password, newPassword, confirmPassword } = req.body;
    const targetToken = resetToken || tokenParam;
    const targetPassword = newPassword || password;

    if (confirmPassword && targetPassword !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Password confirmation does not match.' });
      return;
    }

    await authService.resetPassword(targetToken, targetPassword);
    clearAuthCookies(res);

    res.json({
      success: true,
      message: 'Your password has been reset successfully. Please sign in.',
    });
  }

  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const userId = req.user._id;
    const doctor = await Doctor.findOne({ userId });
    if (doctor) {
      await Chamber.deleteMany({ doctorId: doctor._id });
      await Template.deleteMany({ doctorId: doctor._id });
      await Patient.deleteMany({ doctorId: doctor._id });
      await Prescription.deleteMany({ doctorId: doctor._id });
      await Doctor.findByIdAndDelete(doctor._id);
    }

    await authService.revokeAllUserSessions(userId.toString());
    await User.findByIdAndDelete(userId);

    await logAuditEvent(req, {
      action: 'USER_ACCOUNT_DELETED',
      resource: 'User',
      resourceId: userId.toString(),
      details: { email: req.user.email, role: req.user.role },
    });

    clearAuthCookies(res);

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  }
}

export const authController = new AuthController();
