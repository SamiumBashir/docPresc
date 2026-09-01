import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';

type WizardStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<WizardStep>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Countdown timer for OTP Resend cooldown
  useEffect(() => {
    let interval: any = null;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Send OTP to email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      showToast.error('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
      }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (res.success) {
        setStep('OTP');
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        setAttemptsRemaining(5);
        showToast.success('6-digit OTP has been sent to your email.');
        // Focus first OTP input
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Change Handler (Auto-advance & Paste support)
  const handleOtpChange = (index: number, value: string) => {
    // If pasted multi-character string
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, idx) => {
        newOtp[idx] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const singleDigit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);

    // Auto-advance to next box
    if (singleDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      showToast.error('Please enter the full 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
        data?: { resetToken: string };
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpCode }),
      });

      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setStep('PASSWORD');
        showToast.success('OTP verified. Please create your new password.');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Invalid or expired OTP.');
      if (err.message && err.message.includes('attempts remaining')) {
        const match = err.message.match(/(\d+)\s+attempt/);
        if (match) setAttemptsRemaining(parseInt(match[1], 10));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP handler with rate limit check
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;

    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
      }>('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.success) {
        setResendTimer(60);
        setOtp(['', '', '', '', '', '']);
        setAttemptsRemaining(5);
        showToast.success('A new OTP has been dispatched to your email.');
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      showToast.error(err.message || 'Unable to resend OTP at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
      }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          resetToken,
          password: newPassword,
        }),
      });

      if (res.success) {
        setStep('SUCCESS');
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        showToast.success('Password updated successfully!');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Strength Calculator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-medical-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-medical-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-medical-600 to-medical-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-medical-600/30">
          {step === 'PASSWORD' || step === 'SUCCESS' ? (
            <ShieldCheck className="w-8 h-8" />
          ) : (
            <KeyRound className="w-8 h-8" />
          )}
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight">
          {step === 'EMAIL' && 'Forgot Password'}
          {step === 'OTP' && 'Verify Email OTP'}
          {step === 'PASSWORD' && 'Create New Password'}
          {step === 'SUCCESS' && 'Reset Complete!'}
        </h2>

        <p className="text-xs text-slate-400">
          {step === 'EMAIL' && 'Enter your email to receive a secure 6-digit OTP'}
          {step === 'OTP' && 'We sent a verification code to your registered email'}
          {step === 'PASSWORD' && 'Choose a strong, unique password for your account'}
          {step === 'SUCCESS' && 'Your account security credentials have been updated'}
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {['Email', 'OTP', 'Reset'].map((name, i) => {
            const stepIndex = step === 'EMAIL' ? 0 : step === 'OTP' ? 1 : 2;
            const isCompleted = stepIndex > i || step === 'SUCCESS';
            const isCurrent = stepIndex === i && step !== 'SUCCESS';

            return (
              <div key={name} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-medical-500 text-white ring-4 ring-medical-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-8 h-0.5 rounded-full transition-colors ${
                      isCompleted ? 'bg-emerald-500/80' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/60 sm:px-10 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: EMAIL INPUT                                                        */}
          {/* ========================================================================= */}
          {step === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered doctor account email address below. We'll send a 6-digit One-Time Password (OTP) for verification.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@prescription.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Sending OTP...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Verification OTP</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: 6-DIGIT OTP VERIFICATION                                          */}
          {/* ========================================================================= */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-300">
                  Enter the 6-digit verification code sent to:
                </p>
                <div className="text-xs font-mono font-bold text-medical-400 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-700 inline-block">
                  {email}
                </div>
              </div>

              {/* 6 Digit Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-mono font-black text-white bg-slate-900/90 border-2 border-slate-700 rounded-xl focus:border-medical-500 focus:ring-4 focus:ring-medical-500/20 focus:outline-none transition-all selection:bg-transparent"
                  />
                ))}
              </div>

              {attemptsRemaining !== null && attemptsRemaining < 5 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Warning: You have <strong>{attemptsRemaining}</strong> attempts remaining before this OTP is invalidated.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Verifying OTP...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify OTP Code</span>
                  </>
                )}
              </button>

              {/* Resend Cooldown Section */}
              <div className="pt-2 text-center border-t border-slate-700/60 space-y-2">
                <p className="text-xs text-slate-400">Didn't receive the OTP code?</p>
                {resendTimer > 0 ? (
                  <div className="text-xs text-slate-400 font-mono flex items-center justify-center gap-1.5">
                    <span>Resend available in:</span>
                    <span className="text-medical-400 font-bold">
                      00:{resendTimer.toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-medical-400 hover:text-medical-300 hover:underline transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP Code</span>
                  </button>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setStep('EMAIL')}
                    className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                  >
                    Change email address
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CREATE NEW PASSWORD                                               */}
          {/* ========================================================================= */}
          {step === 'PASSWORD' && (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-300 leading-relaxed">
                Your email identity has been verified. Enter and confirm your new secure password.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Password Strength</span>
                      <span className="font-bold text-slate-300">{strength.label}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strength.score >= 1 ? strength.color : 'bg-transparent'
                        } flex-1`}
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strength.score >= 2 ? strength.color : 'bg-transparent'
                        } flex-1`}
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strength.score >= 3 ? strength.color : 'bg-transparent'
                        } flex-1`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Updating password...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION                                              */}
          {/* ========================================================================= */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Password Reset Successful</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your password has been updated securely. You can now login to your doctor portal with your new credentials.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Go to Login (লগইন করুন)</span>
              </Link>
            </div>
          )}

          {/* Footer Back to Login Link (if not already success) */}
          {step !== 'SUCCESS' && (
            <div className="text-center pt-2 border-t border-slate-700/60">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login (লগইন এ ফিরে যান)</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
