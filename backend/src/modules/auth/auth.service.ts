import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../../models/User';
import { Doctor, IDoctor } from '../../models/Doctor';
import { Chamber } from '../../models/Chamber';
import { Session } from '../../models/Session';
import { PasswordResetOtp } from '../../models/PasswordResetOtp';
import { ENV } from '../../config/env';
import { UnauthorizedError, ForbiddenError, NotFoundError, AppError } from '../../shared/errors';
import {
  generateSecureOtp,
  hashOtp,
  verifyOtpMatch,
  generateResetGrant,
  sha256,
} from '../../services/otp.service';
import { sendPasswordResetOtpEmail, sendWelcomeEmail, maskEmail } from '../../services/email.service';
import { AuthTokens, LoginResult } from './auth.types';

export class AuthService {
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateAccessToken(userId: string, role: string): string {
    return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
      expiresIn: (ENV.JWT_EXPIRES_IN as any) || '15m',
    });
  }

  async createSession(
    user: IUser,
    rememberMe = false,
    ipAddress?: string,
    userAgent?: string,
    familyId?: string
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user._id.toString(), user.role);

    // Cryptographically secure refresh token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const days = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      familyId: familyId || crypto.randomUUID(),
      ipAddress,
      userAgent,
      isValid: true,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async registerDoctor(data: any, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new AppError('An account with this email already exists.', 400, 'ACCOUNT_EXISTS');
    }

    if (data.bmdcNumber && data.bmdcNumber.trim()) {
      const existingBmdc = await Doctor.findOne({ bmdcNumber: data.bmdcNumber.trim() });
      if (existingBmdc) {
        throw new AppError('A doctor with this BMDC registration number already exists.', 400, 'BMDC_EXISTS');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      passwordHash,
      role: 'doctor',
      status: 'active',
    });

    const doctor = await Doctor.create({
      userId: user._id,
      name: data.name,
      qualification: data.qualification || 'MBBS',
      specialization: data.specialization || 'General Physician',
      healthcareAuthority: 'BMDC',
      registrationNumber: data.bmdcNumber || '',
      institutionRegNumbers: data.bmdcNumber ? { BMDC: data.bmdcNumber } : {},
      bmdcNumber: data.bmdcNumber || '',
      workplace: data.workplace || '',
      phone: data.phone,
      email: data.email.toLowerCase().trim(),
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

    const tokens = await this.createSession(user, false, ipAddress, userAgent);

    // Welcome email (asynchronous, non-blocking)
    const frontendBaseUrl =
      ENV.NODE_ENV === 'production'
        ? 'https://doc-presc.vercel.app'
        : (process.env.FRONTEND_URL || 'http://localhost:5173');

    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      specialization: doctor.specialization,
      loginUrl: `${frontendBaseUrl.replace(/\/$/, '')}/login`,
    }).catch(() => {});

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      doctor,
      chambers: [],
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async login(data: any, ipAddress?: string, userAgent?: string): Promise<LoginResult> {
    const user = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'active') {
      throw new ForbiddenError(
        'Account is pending approval or has been suspended. Please contact admin.',
        'ACCOUNT_INACTIVE'
      );
    }

    let isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch && user.role === 'admin' && ENV.NODE_ENV !== 'production') {
      // In development mode, accept either Admin123! or DevAdmin#2026 to prevent admin lockout
      if (data.password === 'Admin123!' || data.password === 'DevAdmin#2026') {
        const altPassword = data.password === 'Admin123!' ? 'DevAdmin#2026' : 'Admin123!';
        const altMatch = await bcrypt.compare(altPassword, user.passwordHash);
        if (altMatch) {
          isMatch = true;
          const newSalt = await bcrypt.genSalt(10);
          user.passwordHash = await bcrypt.hash(data.password, newSalt);
          await user.save();
        }
      }
    }
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    let doctor: any = null;
    let chambers: any[] = [];
    if (user.role === 'doctor') {
      doctor = await Doctor.findOne({ userId: user._id }).populate('defaultChamberId').lean();
      if (doctor) {
        chambers = await Chamber.find({ doctorId: doctor._id, status: 'active' })
          .sort({ isDefault: -1, createdAt: 1 })
          .lean();
      }
    }

    const tokens = await this.createSession(user, data.rememberMe, ipAddress, userAgent);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      doctor,
      chambers,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async refreshTokens(rawRefreshToken: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    if (!rawRefreshToken) {
      throw new UnauthorizedError('Refresh token required.', 'MISSING_REFRESH_TOKEN');
    }

    const hash = this.hashToken(rawRefreshToken);
    const session = await Session.findOne({ refreshTokenHash: hash });

    if (!session) {
      throw new UnauthorizedError('Invalid or expired refresh token.', 'INVALID_REFRESH_TOKEN');
    }

    // Token reuse detection: if a revoked session is presented, revoke the entire token family!
    if (!session.isValid) {
      console.warn(`[Security Alert] Refresh token reuse detected for user ${session.userId}. Revoking family.`);
      if (session.familyId) {
        await Session.updateMany({ familyId: session.familyId }, { isValid: false });
      } else {
        await Session.updateMany({ userId: session.userId }, { isValid: false });
      }
      throw new UnauthorizedError('Suspicious session activity detected. Please sign in again.', 'SESSION_REUSED');
    }

    if (session.expiresAt < new Date()) {
      session.isValid = false;
      await session.save();
      throw new UnauthorizedError('Refresh session expired. Please sign in again.', 'SESSION_EXPIRED');
    }

    const user = await User.findById(session.userId);
    if (!user || user.status !== 'active') {
      session.isValid = false;
      await session.save();
      throw new UnauthorizedError('User account not found or suspended.', 'ACCOUNT_INACTIVE');
    }

    // Mark old session as consumed / rotated
    session.isValid = false;
    await session.save();

    // Issue rotated refresh token under the same family
    const newAccessToken = this.generateAccessToken(user._id.toString(), user.role);
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHash = this.hashToken(newRawRefreshToken);

    await Session.create({
      userId: user._id,
      refreshTokenHash: newHash,
      familyId: session.familyId,
      ipAddress,
      userAgent,
      isValid: true,
      expiresAt: session.expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: 900,
    };
  }

  async logout(rawRefreshToken?: string, userId?: string): Promise<void> {
    if (rawRefreshToken) {
      const hash = this.hashToken(rawRefreshToken);
      await Session.findOneAndUpdate({ refreshTokenHash: hash }, { isValid: false });
    } else if (userId) {
      await Session.updateMany({ userId }, { isValid: false });
    }
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await Session.updateMany({ userId }, { isValid: false });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    // Anti-enumeration: return identical success message even if account does not exist
    if (!user) {
      return {
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.',
      };
    }

    // Cooldown check (60s)
    const existingOtp = await PasswordResetOtp.findOne({ email: cleanEmail });
    const cooldownMs = ENV.OTP_RESEND_COOLDOWN * 1000;
    if (existingOtp && Date.now() - existingOtp.lastSentAt.getTime() < cooldownMs) {
      const wait = Math.ceil((cooldownMs - (Date.now() - existingOtp.lastSentAt.getTime())) / 1000);
      throw new AppError(`Please wait ${wait} seconds before requesting a new code.`, 429, 'COOLDOWN_ACTIVE');
    }

    const otp = generateSecureOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + ENV.OTP_EXPIRES_IN * 1000);

    await PasswordResetOtp.findOneAndUpdate(
      { email: cleanEmail },
      {
        email: cleanEmail,
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

    const emailRes = await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      expiresInMinutes: Math.round(ENV.OTP_EXPIRES_IN / 60),
    });

    if (!emailRes.success) {
      await PasswordResetOtp.deleteOne({ email: cleanEmail });
      throw new AppError('Unable to deliver verification code. Please try again shortly.', 503, 'EMAIL_FAILED');
    }

    return {
      success: true,
      message: 'Verification code has been sent to your email.',
    };
  }

  async verifyOtp(email: string, inputOtp: string) {
    const cleanEmail = email.toLowerCase().trim();
    const record = await PasswordResetOtp.findOne({ email: cleanEmail });

    if (!record || !record.otpHash || record.expiresAt < new Date()) {
      throw new AppError('OTP has expired or no active request was found. Please request a new code.', 400, 'OTP_EXPIRED');
    }

    if (record.attempts >= 5) {
      record.otpHash = '';
      await record.save();
      throw new AppError('Too many failed verification attempts. Please request a new code.', 429, 'OTP_LOCKED');
    }

    const isMatch = verifyOtpMatch(inputOtp.trim(), record.otpHash);
    if (!isMatch) {
      record.attempts += 1;
      if (record.attempts >= 5) record.otpHash = '';
      await record.save();
      const remaining = Math.max(0, 5 - record.attempts);
      throw new AppError(`Invalid code. You have ${remaining} attempts remaining.`, 400, 'INVALID_OTP');
    }

    const { rawToken, hashedToken, expiresAt } = generateResetGrant();

    record.otpHash = '';
    record.resetTokenHash = hashedToken;
    record.resetTokenExpiresAt = expiresAt;
    record.verifiedAt = new Date();
    await record.save();

    return {
      resetToken: rawToken,
      expiresInMinutes: 10,
    };
  }

  async resetPassword(token: string, newPass: string) {
    if (!token) throw new AppError('Reset authorization token required.', 400, 'MISSING_TOKEN');
    if (!newPass || newPass.length < 8) {
      throw new AppError('Password must be at least 8 characters.', 400, 'WEAK_PASSWORD');
    }

    const hashedToken = sha256(token);
    const otpRecord = await PasswordResetOtp.findOne({
      resetTokenHash: hashedToken,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    let user = null;
    if (otpRecord) {
      user = await User.findOne({ email: otpRecord.email });
    } else {
      user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: new Date() },
      });
    }

    if (!user) {
      throw new AppError('Invalid, expired, or consumed reset token. Please request a new OTP.', 400, 'INVALID_GRANT');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPass, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = new Date();
    await user.save();

    // Revoke all existing active sessions immediately
    await this.revokeAllUserSessions(user._id.toString());

    if (otpRecord) {
      await PasswordResetOtp.findByIdAndDelete(otpRecord._id);
    }
  }
}

export const authService = new AuthService();
