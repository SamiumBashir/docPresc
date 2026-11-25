import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { InfinityLoop } from '@/components/loading-ui/infinity';
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
  X,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../api/client';

type WizardStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

const maskEmail = (emailStr: string): string => {
  if (!emailStr || !emailStr.includes('@')) return emailStr;
  const [local, domain] = emailStr.split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const visibleStart = local.slice(0, 2);
  const visibleEnd = local.slice(-1);
  const maskedLength = Math.max(3, local.length - 3);
  return `${visibleStart}${'*'.repeat(maskedLength)}${visibleEnd}@${domain}`;
};

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isSubmittingRef = useRef(false);

  // Countdown timer for OTP Resend cooldown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'OTP' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Step 1: Send OTP strictly to email (never expose OTP on screen)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading || isSubmittingRef.current) return;

    setErrorMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address');
      return;
    }

    isSubmittingRef.current = true;
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
        setAttemptsRemaining(5);
        setOtp(['', '', '', '', '', '']);

        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send verification code');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // OTP Input Change Handler (Auto-advance)
  const handleOtpChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);

    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Dedicated paste handler supporting full 6-digit paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split('').forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtp(newOtp);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSubmittingRef.current) return;

    setErrorMessage(null);
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Enter all 6 verification digits');
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
        resetToken?: string;
        data?: { resetToken: string };
      }>('/auth/verify-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpCode }),
      });

      const token = res.resetToken || res.data?.resetToken;
      if (res.success && token) {
        setResetToken(token);
        setStep('PASSWORD');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired code');
      if (err.message && err.message.includes('attempts remaining')) {
        const match = err.message.match(/(\d+)\s+attempt/);
        if (match) setAttemptsRemaining(parseInt(match[1], 10));
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Resend OTP handler with cooldown check
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading || isSubmittingRef.current) return;

    setErrorMessage(null);
    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
      }>('/auth/resend-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (res.success) {
        setResendTimer(60);
        setAttemptsRemaining(5);
        setOtp(['', '', '', '', '', '']);

        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to resend verification code');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSubmittingRef.current) return;

    setErrorMessage(null);
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setErrorMessage('Include at least one uppercase letter (A-Z)');
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setErrorMessage('Include at least one lowercase letter (a-z)');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      setErrorMessage('Include at least one special character');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    isSubmittingRef.current = true;
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
          newPassword,
          confirmPassword,
        }),
      });

      if (res.success) {
        setStep('SUCCESS');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update password');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
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

  const passwordRules = [
    { met: newPassword.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(newPassword), label: 'One uppercase letter (A-Z)' },
    { met: /[a-z]/.test(newPassword), label: 'One lowercase letter (a-z)' },
    { met: /[^A-Za-z0-9]/.test(newPassword), label: 'One special character' },
  ];

  return (
    <main
      role="main"
      className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      {/* Header Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-teal-400 mx-auto">
          {step === 'PASSWORD' || step === 'SUCCESS' ? (
            <ShieldCheck className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <KeyRound className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
          )}
        </div>

        <h1 className="text-2xl font-medium text-white tracking-tight">
          {step === 'EMAIL' && 'Reset password'}
          {step === 'OTP' && 'Verify your email'}
          {step === 'PASSWORD' && 'Create new password'}
          {step === 'SUCCESS' && 'Password updated'}
        </h1>

        <p className="text-xs text-slate-400">
          {step === 'EMAIL' && 'Receive a 6-digit verification code at your registered email'}
          {step === 'OTP' && 'Check your email inbox for the 6-digit code'}
          {step === 'PASSWORD' && 'Choose a strong password for your doctor account'}
          {step === 'SUCCESS' && 'Your account credentials have been updated'}
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
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono tabular-nums transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border border-emerald-500'
                      : isCurrent
                      ? 'bg-medical-600 text-white border border-teal-400'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" strokeWidth={2} /> : i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-8 h-px transition-colors ${
                      isCompleted ? 'bg-emerald-500/80' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-lg rounded-2xl border border-slate-700/80 sm:px-8 space-y-6">
          {errorMessage && step !== 'SUCCESS' && (
            <div
              role="alert"
              className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}
          {/* ========================================================================= */}
          {/* STEP 1: EMAIL INPUT                                                        */}
          {/* ========================================================================= */}
          {step === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered doctor account email. We will send a 6-digit One-Time Password (OTP) to your inbox.
              </p>

              <div>
                <label htmlFor="recovery-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Registered email address
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/25 focus:border-medical-500 font-mono transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-medical-600 hover:bg-medical-700 active:scale-[0.98] text-white font-medium rounded-lg text-sm transition-[background-color,transform] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <InfinityLoop className="w-7 h-3.5 text-white" duration="1.6s" strokeWidth={7} />
                    <span>Sending code</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    <span>Send verification code</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: 6-DIGIT OTP VERIFICATION                                          */}
          {/* ========================================================================= */}
          {step === 'OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center space-y-2">
                <p className="text-xs text-slate-300">
                  Enter the 6-digit verification code sent to
                </p>
                <div className="text-xs font-mono font-medium text-teal-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/80 inline-block">
                  {maskEmail(email)}
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
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    aria-label={`OTP digit ${index + 1}`}
                    className="w-11 h-12 sm:w-12 sm:h-12 text-center text-lg font-mono tabular-nums font-medium text-white bg-slate-900 border border-slate-700 rounded-lg focus:border-medical-500 focus:ring-2 focus:ring-medical-500/25 focus:outline-none transition-colors selection:bg-transparent"
                  />
                ))}
              </div>

              {attemptsRemaining !== null && attemptsRemaining < 5 && (
                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    <strong className="font-medium tabular-nums">{attemptsRemaining}</strong> attempts remaining before this code locks
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.join('').length !== 6}
                className="w-full h-10 bg-medical-600 hover:bg-medical-700 active:scale-[0.98] text-white font-medium rounded-lg text-sm transition-[background-color,transform] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <InfinityLoop className="w-7 h-3.5 text-white" duration="1.6s" strokeWidth={7} />
                    <span>Verifying code</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    <span>Verify code</span>
                  </>
                )}
              </button>

              {/* Resend Cooldown Section */}
              <div className="pt-4 text-center border-t border-slate-700/60 space-y-2">
                <p className="text-xs text-slate-400">
                  Check your inbox or Spam folder if the email takes a moment to arrive. (ইনবক্সে না পেলে স্প্যাম ফোল্ডারটি চেক করুন)
                </p>
                {resendTimer > 0 ? (
                  <div className="text-xs text-slate-400 font-mono tabular-nums flex items-center justify-center gap-1.5">
                    <span>Resend in</span>
                    <span className="text-teal-400 font-medium">
                      00:{resendTimer.toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                    <span>Resend verification code</span>
                  </button>
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('EMAIL');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CREATE NEW PASSWORD                                               */}
          {/* ========================================================================= */}
          {step === 'PASSWORD' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Email verified. Enter and confirm your new account password below.
              </p>

              <div>
                <label htmlFor="new-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/25 focus:border-medical-500 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Password strength</span>
                      <span className="font-medium text-slate-200">{strength.label}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full rounded-full transition-colors duration-200 ${
                          strength.score >= 1 ? strength.color : 'bg-transparent'
                        } flex-1`}
                      />
                      <div
                        className={`h-full rounded-full transition-colors duration-200 ${
                          strength.score >= 2 ? strength.color : 'bg-transparent'
                        } flex-1`}
                      />
                      <div
                        className={`h-full rounded-full transition-colors duration-200 ${
                          strength.score >= 3 ? strength.color : 'bg-transparent'
                        } flex-1`}
                      />
                    </div>
                  </div>
                )}

                {/* Real-time Password Rules Checklist */}
                <div className="mt-3 p-3 bg-slate-900 border border-slate-700/70 rounded-lg space-y-1.5 text-xs">
                  <div className="text-[11px] font-medium text-slate-400 mb-1">
                    Password requirements
                  </div>
                  {passwordRules.map((rule) => (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-2 transition-colors ${
                        rule.met ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          rule.met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {rule.met ? (
                          <Check className="w-3 h-3" strokeWidth={2} />
                        ) : (
                          <span className="w-1 h-1 rounded-full bg-slate-500" />
                        )}
                      </div>
                      <span>{rule.label}</span>
                    </div>
                  ))}
                  {confirmPassword && (
                    <div
                      className={`flex items-center gap-2 transition-colors ${
                        newPassword === confirmPassword ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          newPassword === confirmPassword ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {newPassword === confirmPassword ? (
                          <Check className="w-3 h-3" strokeWidth={2} />
                        ) : (
                          <X className="w-3 h-3" strokeWidth={2} />
                        )}
                      </div>
                      <span>{newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock
                    className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/25 focus:border-medical-500 font-mono transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 bg-medical-600 hover:bg-medical-700 active:scale-[0.98] text-white font-medium rounded-lg text-sm transition-[background-color,transform] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <InfinityLoop className="w-7 h-3.5 text-white" duration="1.6s" strokeWidth={7} />
                    <span>Updating password</span>
                  </div>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    <span>Reset password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: SUCCESS CONFIRMATION                                              */}
          {/* ========================================================================= */}
          {step === 'SUCCESS' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-medium text-white">Password reset complete</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your password has been updated. All previous sessions have been signed out for security.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium rounded-lg text-xs transition-[background-color,transform]"
              >
                <span>Return to sign in</span>
              </Link>
            </div>
          )}

          {/* Footer Back to Login Link */}
          {step !== 'SUCCESS' && (
            <div className="text-center pt-4 border-t border-slate-700/60">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
                <span>Back to sign in</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
