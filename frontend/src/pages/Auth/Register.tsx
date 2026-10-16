import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();

  const passwordCriteria = {
    hasMinLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(formData.password),
  };

  const isPasswordStrong =
    passwordCriteria.hasMinLength &&
    passwordCriteria.hasUpperCase &&
    passwordCriteria.hasLowerCase &&
    passwordCriteria.hasSpecialChar;

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isPhoneValid = formData.phone.trim().length >= 5;
  const isNameValid = formData.name.trim().length >= 2;
  const isConfirmPasswordValid =
    formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  const isFormValid =
    isNameValid &&
    isEmailValid &&
    isPhoneValid &&
    isPasswordStrong &&
    isConfirmPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    try {
      const res = await api<{ success: boolean; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
        }),
      });

      if (res.success) {
        showToast.success('Doctor account registered successfully! A welcome email has been dispatched (please check Inbox and Spam).');
        navigate('/login');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <main
      role="main"
      className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-medical-600 to-medical-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-medical-600/30">
          <Stethoscope className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Doctor Registration</h1>
        <p className="text-xs text-slate-300">
          Create your verified doctor profile
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/60 sm:px-10 space-y-5">
          <form onSubmit={handleSubmit} role="form" aria-label="Doctor Registration Form" className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-bold text-slate-200 uppercase mb-1"
              >
                Full Name *
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Abdul Karim"
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
              />
            </div>

            {/* Email Address & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-bold text-slate-200 uppercase mb-1"
                >
                  Email Address *
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@example.com"
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500 font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-phone"
                  className="block text-xs font-bold text-slate-200 uppercase mb-1"
                >
                  Phone Number *
                </label>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0171..."
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500 font-mono"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="reg-pwd"
                    className="block text-xs font-bold text-slate-200 uppercase"
                  >
                    Password *
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="reg-pwd"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={showPassword ? 'Min 8 characters' : '••••••••'}
                    className={`w-full pl-3 pr-9 py-2 bg-slate-900/80 border rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none font-mono ${
                      formData.password && !isPasswordStrong
                        ? 'border-amber-500/70 focus:ring-1 focus:ring-amber-500'
                        : 'border-slate-700 focus:ring-1 focus:ring-medical-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="reg-confirm-pwd"
                    className="block text-xs font-bold text-slate-200 uppercase"
                  >
                    Confirm Password *
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="reg-confirm-pwd"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={showConfirmPassword ? 'Repeat password' : '••••••••'}
                    className={`w-full pl-3 pr-9 py-2 bg-slate-900/80 border rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none font-mono ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-slate-700 focus:ring-1 focus:ring-medical-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements Live Checklist */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 space-y-1.5 text-[11px]">
              <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                Password Requirements:
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordCriteria.hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      passwordCriteria.hasMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasMinLength ? '✓' : '•'}
                  </span>
                  <span>8+ characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordCriteria.hasUpperCase ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      passwordCriteria.hasUpperCase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasUpperCase ? '✓' : '•'}
                  </span>
                  <span>1 uppercase (A-Z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordCriteria.hasLowerCase ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      passwordCriteria.hasLowerCase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasLowerCase ? '✓' : '•'}
                  </span>
                  <span>1 lowercase (a-z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    passwordCriteria.hasSpecialChar ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      passwordCriteria.hasSpecialChar ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {passwordCriteria.hasSpecialChar ? '✓' : '•'}
                  </span>
                  <span>1 special char (!@#$)</span>
                </div>
              </div>
            </div>

            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-[11px] text-rose-400 font-medium -mt-1">
                Passwords do not match
              </p>
            )}

            {/* Dynamic Sign In Button (Disabled until all fields are valid) */}
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              aria-busy={isLoading}
              aria-label="Submit registration"
              title={
                !isFormValid
                  ? 'Please fill in all fields properly according to password requirements to enable'
                  : 'Click to Sign In'
              }
              className={`w-full py-2.5 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${
                isFormValid && !isLoading
                  ? 'bg-medical-600 hover:bg-medical-700 text-white shadow-md shadow-medical-600/25 cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-slate-700/60 text-slate-400 border border-slate-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-300">
              Already registered?{' '}
              <Link
                to="/login"
                className="text-medical-300 hover:text-medical-200 font-bold underline-offset-2 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
