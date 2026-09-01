import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Chamber } from '../models/Chamber';
import { Patient } from '../models/Patient';
import { Prescription } from '../models/Prescription';
import { Template } from '../models/Template';
import { PasswordResetOtp } from '../models/PasswordResetOtp';
import { sendPasswordResetOtpEmail } from '../services/email.service';
import { ENV } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';
import {
  RegisterDoctorSchema,
  LoginSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
  ResetPasswordSchema,
} from '../validators/schemas';

const generateToken = (id: string, role: string, rememberMe?: boolean): string => {
  return jwt.sign({ id, role }, ENV.JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : ((ENV.JWT_EXPIRES_IN as any) || '7d'),
  });
};

const setAuthCookie = (res: Response, token: string, rememberMe?: boolean) => {
  const days = rememberMe ? 30 : 7;
  res.cookie('token', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
  });
};

export const registerDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = RegisterDoctorSchema.parse(req.body);

  const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    return;
  }

  const existingBmdc = await Doctor.findOne({ bmdcNumber: validated.bmdcNumber });
  if (existingBmdc) {
    res.status(400).json({ success: false, message: 'A doctor with this BMDC registration number already exists.' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(validated.password, salt);

  const user = await User.create({
    name: validated.name,
    email: validated.email.toLowerCase(),
    phone: validated.phone,
    passwordHash,
    role: 'doctor',
    status: 'active',
  });

  const doctor = await Doctor.create({
    userId: user._id,
    name: validated.name,
    qualification: validated.qualification,
    specialization: validated.specialization,
    bmdcNumber: validated.bmdcNumber,
    workplace: validated.workplace,
    phone: validated.phone,
    email: validated.email.toLowerCase(),
    settings: {
      paperSize: 'A4',
      defaultLanguage: 'en',
      defaultFollowUp: '7 days',
      headerVisibility: true,
      footerVisibility: true,
      themeColor: '#008ba3',
      showWatermark: true,
      showQrCode: true,
    },
  });

  const token = generateToken(user._id.toString(), user.role);
  setAuthCookie(res, token);

  await logAuditEvent(req, {
    action: 'DOCTOR_REGISTER',
    resource: 'Doctor',
    resourceId: doctor._id.toString(),
    details: { email: user.email, bmdcNumber: doctor.bmdcNumber },
  });

  res.status(201).json({
    success: true,
    message: 'Doctor account registered successfully.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      doctor,
      token,
    },
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = LoginSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email.toLowerCase() });
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({
      success: false,
      message: 'Account is pending approval or has been suspended. Please contact admin.',
    });
    return;
  }

  const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid email or password.' });
    return;
  }

  let doctor = null;
  if (user.role === 'doctor') {
    doctor = await Doctor.findOne({ userId: user._id }).populate('defaultChamberId');
  }

  const token = generateToken(user._id.toString(), user.role, validated.rememberMe);
  setAuthCookie(res, token, validated.rememberMe);

  await logAuditEvent(req, {
    action: 'USER_LOGIN',
    resource: 'User',
    resourceId: user._id.toString(),
    details: { email: user.email, role: user.role, rememberMe: validated.rememberMe },
  });

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      doctor,
      token,
    },
  });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  let doctor = null;
  if (req.user.role === 'doctor') {
    doctor = await Doctor.findOne({ userId: req.user._id }).populate('defaultChamberId');
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
    },
  });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
};

export const updateDoctorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
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
  if (phone) doctor.phone = phone;
  if (email) doctor.email = email;
  if (profileImage !== undefined) doctor.profileImage = profileImage;
  if (signature !== undefined) doctor.signature = signature;
  if (logo !== undefined) doctor.logo = logo;
  if (bmdcNumber) doctor.bmdcNumber = bmdcNumber;

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
};

export const updateDoctorSettings = async (req: AuthRequest, res: Response): Promise<void> => {
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
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = ForgotPasswordSchema.parse(req.body);
  const email = validated.email.toLowerCase();

  const user = await User.findOne({ email });
  if (user) {
    // Check if there is an active cooldown
    const existingOtp = await PasswordResetOtp.findOne({ email });
    const now = Date.now();
    const cooldownMs = ENV.OTP_RESEND_COOLDOWN * 1000;

    if (existingOtp && now - existingOtp.lastSentAt.getTime() < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - (now - existingOtp.lastSentAt.getTime())) / 1000);
      res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
      });
      return;
    }

    // Cryptographically secure 6-digit OTP: between 100000 and 999999 inclusive
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + ENV.OTP_EXPIRES_IN * 1000); // 5 minutes

    await PasswordResetOtp.findOneAndUpdate(
      { email },
      {
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        resetTokenHash: undefined,
        resetTokenExpiresAt: undefined,
        verifiedAt: undefined,
      },
      { upsert: true, new: true }
    );

    // Dispatch transactional email via Resend
    await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      expiresInMinutes: Math.round(ENV.OTP_EXPIRES_IN / 60),
    });

    await logAuditEvent(req, {
      action: 'PASSWORD_RESET_OTP_REQUESTED',
      resource: 'User',
      resourceId: user._id.toString(),
      details: { email: user.email },
    });
  }

  // Generic anti-enumeration response
  res.json({
    success: true,
    message: 'If an account exists for this email, a 6-digit password reset OTP has been sent.',
  });
};

export const verifyOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = VerifyOtpSchema.parse(req.body);
  const email = validated.email.toLowerCase();
  const inputOtp = validated.otp.trim();

  const record = await PasswordResetOtp.findOne({ email });

  if (!record || !record.otpHash || record.expiresAt < new Date()) {
    res.status(400).json({
      success: false,
      message: 'OTP has expired or no active reset request was found. Please request a new OTP.',
    });
    return;
  }

  // Max 5 attempts check
  if (record.attempts >= 5) {
    res.status(429).json({
      success: false,
      message: 'Too many failed verification attempts. For your security, please request a new OTP.',
    });
    return;
  }

  const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex');

  if (inputHash !== record.otpHash) {
    record.attempts += 1;
    await record.save();
    const remaining = Math.max(0, 5 - record.attempts);
    res.status(400).json({
      success: false,
      message:
        remaining > 0
          ? `Invalid OTP. You have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`
          : 'Too many failed verification attempts. Please request a new OTP.',
    });
    return;
  }

  // OTP is valid -> Issue short-lived cryptographically secure reset authorization token (15 mins)
  const rawResetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

  record.otpHash = ''; // Invalidate OTP immediately to prevent re-use
  record.resetTokenHash = resetTokenHash;
  record.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  record.verifiedAt = new Date();
  await record.save();

  res.json({
    success: true,
    message: 'OTP verified successfully.',
    data: {
      resetToken: rawResetToken,
    },
  });
};

export const resendOtp = async (req: AuthRequest, res: Response): Promise<void> => {
  const validated = ResendOtpSchema.parse(req.body);
  const email = validated.email.toLowerCase();

  const record = await PasswordResetOtp.findOne({ email });
  const now = Date.now();
  const cooldownMs = ENV.OTP_RESEND_COOLDOWN * 1000;

  if (record && now - record.lastSentAt.getTime() < cooldownMs) {
    const waitSeconds = Math.ceil((cooldownMs - (now - record.lastSentAt.getTime())) / 1000);
    res.status(429).json({
      success: false,
      message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
    });
    return;
  }

  const user = await User.findOne({ email });
  if (user) {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + ENV.OTP_EXPIRES_IN * 1000);

    await PasswordResetOtp.findOneAndUpdate(
      { email },
      {
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        resetTokenHash: undefined,
        resetTokenExpiresAt: undefined,
        verifiedAt: undefined,
      },
      { upsert: true, new: true }
    );

    await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      expiresInMinutes: Math.round(ENV.OTP_EXPIRES_IN / 60),
    });

    await logAuditEvent(req, {
      action: 'PASSWORD_RESET_OTP_RESENT',
      resource: 'User',
      resourceId: user._id.toString(),
      details: { email: user.email },
    });
  }

  res.json({
    success: true,
    message: 'If an account exists for this email, a new password reset OTP has been sent.',
  });
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const tokenParam = req.params.token;
  const { resetToken, password } = req.body;

  const targetToken = resetToken || tokenParam;
  if (!targetToken) {
    res.status(400).json({
      success: false,
      message: 'Reset authorization token is required.',
    });
    return;
  }

  if (!password || password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
    return;
  }

  const hashedToken = crypto.createHash('sha256').update(targetToken).digest('hex');

  // 1. Check in PasswordResetOtp collection (OTP Flow)
  const otpRecord = await PasswordResetOtp.findOne({
    resetTokenHash: hashedToken,
    resetTokenExpiresAt: { $gt: new Date() },
  });

  let targetUser = null;

  if (otpRecord) {
    targetUser = await User.findOne({ email: otpRecord.email });
  } else {
    // 2. Legacy fallback to User model reset token if exists
    targetUser = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });
  }

  if (!targetUser) {
    res.status(400).json({
      success: false,
      message: 'Invalid or expired password reset session. Please request a new OTP.',
    });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  targetUser.passwordHash = await bcrypt.hash(password, salt);
  targetUser.resetPasswordToken = undefined;
  targetUser.resetPasswordExpire = undefined;
  await targetUser.save();

  // Invalidate OTP record immediately to prevent any reuse
  if (otpRecord) {
    await PasswordResetOtp.findByIdAndDelete(otpRecord._id);
  }

  await logAuditEvent(req, {
    action: 'PASSWORD_RESET_SUCCESS',
    resource: 'User',
    resourceId: targetUser._id.toString(),
    details: { email: targetUser.email },
  });

  res.json({
    success: true,
    message: 'Your password has been reset successfully. You can now log in with your new password.',
  });
};

export const deleteAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated.' });
    return;
  }

  const userId = req.user._id;

  // If user is a doctor, cascade delete related records
  const doctor = await Doctor.findOne({ userId });
  if (doctor) {
    await Chamber.deleteMany({ doctorId: doctor._id });
    await Template.deleteMany({ doctorId: doctor._id });
    await Patient.deleteMany({ doctorId: doctor._id });
    await Prescription.deleteMany({ doctorId: doctor._id });
    await Doctor.findByIdAndDelete(doctor._id);
  }

  await User.findByIdAndDelete(userId);

  await logAuditEvent(req, {
    action: 'USER_ACCOUNT_DELETED',
    resource: 'User',
    resourceId: userId.toString(),
    details: { email: req.user.email, role: req.user.role },
  });

  res.clearCookie('token');

  res.json({
    success: true,
    message: 'Your account and all associated data have been permanently deleted.',
  });
};
