import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Lock, Mail, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/ui/Toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('docrx_saved_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('docrx_remember_me') !== 'false');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Only redirect if both user and active token exist
  useEffect(() => {
    const token = localStorage.getItem('docrx_token');
    if (user && token) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Strictly prevent multiple hits / rapid clicks while authentication is running
    if (isLoading || isSubmittingRef.current) {
      return;
    }

    const cleanEmail = email.trim();
    const cleanPassword = password;

    // 2. First check email & password validity locally before sending to server
    if (!cleanEmail || !cleanPassword) {
      const msg = 'Please enter both email address and password. (অনুগ্রহ করে ইমেইল ও পাসওয়ার্ড লিখুন)';
      setErrorMessage(msg);
      showToast.error(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      const msg = 'Please enter a valid email address. (সঠিক ইমেইল ঠিকানা দিন)';
      setErrorMessage(msg);
      showToast.error(msg);
      return;
    }

    if (cleanPassword.length < 1) {
      const msg = 'Please enter your password. (পাসওয়ার্ড লিখুন)';
      setErrorMessage(msg);
      showToast.error(msg);
      return;
    }

    // Synchronously lock submission before awaiting network response
    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('docrx_saved_email', cleanEmail);
        localStorage.setItem('docrx_remember_me', 'true');
      } else {
        localStorage.removeItem('docrx_saved_email');
        localStorage.setItem('docrx_remember_me', 'false');
      }

      // 3. Authenticate with server to verify email & password
      await login(cleanEmail, cleanPassword, rememberMe);

      // 4. Access granted only after server successfully verifies credentials
      showToast.success('Credentials verified. Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const rawMessage = err?.message || '';
      let friendlyError = 'Wrong email or password. Please check your credentials and try again. (ভুল ইমেইল বা পাসওয়ার্ড! সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন)';
      if (rawMessage.toLowerCase().includes('suspended') || rawMessage.toLowerCase().includes('pending')) {
        friendlyError = rawMessage;
      } else if (rawMessage && !rawMessage.toLowerCase().includes('status')) {
        friendlyError = `${rawMessage} — Wrong email or password.`;
      }
      setErrorMessage(friendlyError);
      showToast.error(friendlyError, 'Authentication Failed');
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
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-medical-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-medical-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-medical-600 to-medical-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-medical-600/30">
          <Stethoscope className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">DocRx System</h1>
        <p className="text-xs text-slate-300">
          Doctor Digital Prescription Management Platform for Bangladesh
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/60 sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} role="form" aria-label="Doctor Sign In Form" className="space-y-4">
            {/* Prominent Authentication Warning Banner */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="assertive"
                className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-start gap-3 text-rose-200 text-xs shadow-lg shadow-rose-950/20 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 space-y-0.5">
                  <p className="font-bold text-rose-100 text-xs flex items-center gap-1.5">
                    <span>Authentication Warning (ভুল তথ্য)</span>
                  </p>
                  <p className="text-[11px] text-rose-300 leading-relaxed font-sans">
                    {errorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-200 uppercase mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  aria-required="true"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="doctor@prescription.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 font-mono disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                    errorMessage
                      ? 'border-rose-500/80 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'border-slate-700 focus:ring-medical-500/30 focus:border-medical-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-200 uppercase"
                >
                  Password
                </label>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-medical-400 flex items-center gap-1.5 transition-colors cursor-pointer select-none disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide password (পাসওয়ার্ড লুকান)' : 'Show password (পাসওয়ার্ড দেখুন)'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  aria-required="true"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={showPassword ? 'Enter your password' : '••••••••'}
                  className={`w-full pl-10 pr-11 py-2.5 bg-slate-900/80 border rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 font-mono disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${
                    errorMessage
                      ? 'border-rose-500/80 focus:ring-rose-500/30 focus:border-rose-500'
                      : 'border-slate-700 focus:ring-medical-500/30 focus:border-medical-500'
                  }`}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label
                htmlFor="login-remember-me"
                className={`flex items-center gap-2 select-none text-slate-200 transition-colors ${
                  isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:text-white'
                }`}
              >
                <input
                  id="login-remember-me"
                  name="rememberMe"
                  type="checkbox"
                  disabled={isLoading}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-medical-600 focus:ring-medical-500/30 focus:ring-offset-0 cursor-pointer accent-medical-600 disabled:cursor-not-allowed"
                />
                <span>Remember me (মনে রাখুন)</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-medical-300 hover:text-medical-200 font-semibold transition-colors underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              aria-label="Sign in to DocRx account"
              className="w-full py-2.5 bg-medical-600 hover:bg-medical-700 disabled:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:scale-100 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                  <span>Verifying Credentials... (যাচাই করা হচ্ছে...)</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-700/60">
            <p className="text-xs text-slate-300">
              New medical practitioner?{' '}
              <Link
                to="/register"
                className="text-medical-300 hover:text-medical-200 font-bold underline-offset-2 hover:underline"
              >
                Register Doctor Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
