import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import { api } from '../../api/client';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage('Password must contain at least one uppercase letter (A-Z).');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setErrorMessage('Password must contain at least one lowercase letter (a-z).');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage('Password must contain at least one special character (!@#$%^&* etc.).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{ success: boolean; message: string }>(
        `/auth/reset-password/${token}`,
        {
          method: 'POST',
          body: JSON.stringify({ password }),
        }
      );

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Password reset failed or link has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-medical-400 mx-auto">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Set new password</h2>
        <p className="text-xs text-slate-400">
          Create a new strong password for your DocPresc doctor account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800 py-8 px-6 rounded-2xl border border-slate-700 sm:px-10 space-y-6">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    New password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-slate-400 hover:text-medical-400 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters (e.g. Doctor123!)"
                    className="w-full pl-10 pr-11 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>Password strength</span>
                      <span className="font-semibold text-slate-300">{strength.label}</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Confirm new password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-xs text-slate-400 hover:text-medical-400 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showConfirmPassword ? 'Hide password' : 'Show password'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-11 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Real-time Password Rules Checklist */}
              <div className="mt-2.5 p-3 bg-slate-900 border border-slate-700 rounded-lg space-y-1.5 text-[11px]">
                <div className="text-xs font-medium text-slate-400 mb-1">
                  Password requirements:
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${password.length >= 8 ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${password.length >= 8 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {password.length >= 8 ? '✓' : '•'}
                  </div>
                  <span>At least 8 characters long</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${/[A-Z]/.test(password) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[A-Z]/.test(password) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {/[A-Z]/.test(password) ? '✓' : '•'}
                  </div>
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${/[a-z]/.test(password) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[a-z]/.test(password) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {/[a-z]/.test(password) ? '✓' : '•'}
                  </div>
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 transition-colors ${/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400 font-medium' : 'text-slate-400'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${/[^A-Za-z0-9]/.test(password) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {/[^A-Za-z0-9]/.test(password) ? '✓' : '•'}
                  </div>
                  <span>One special character (!@#$%^&* etc.)</span>
                </div>
                {confirmPassword && (
                  <div className={`flex items-center gap-1.5 transition-colors ${password === confirmPassword ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${password === confirmPassword ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {password === confirmPassword ? '✓' : '×'}
                    </div>
                    <span>{password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-medical-600 hover:bg-medical-500 text-white font-medium rounded-lg text-xs transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <InfinityLoop className="w-7 h-3.5 text-white" duration="1.6s" strokeWidth={7} />
                    <span>Saving new password...</span>
                  </div>
                ) : (
                  <>
                    <span>Update password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <Link
                  to="/forgot-password"
                  className="hover:text-medical-400 transition-colors underline"
                >
                  Request new OTP or code
                </Link>
                <Link
                  to="/login"
                  className="hover:text-white transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Password updated</h3>
                <p className="text-xs text-slate-300">
                  Your password has been successfully reset. Redirecting to login...
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-2 bg-medical-600 hover:bg-medical-500 text-white font-medium rounded-lg text-xs transition-colors active:scale-[0.98]"
              >
                <span>Proceed to login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
