import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/ui/Toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('docrx_saved_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('docrx_remember_me') !== 'false');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast.error('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('docrx_saved_email', email);
        localStorage.setItem('docrx_remember_me', 'true');
      } else {
        localStorage.removeItem('docrx_saved_email');
        localStorage.setItem('docrx_remember_me', 'false');
      }

      await login(email, password, rememberMe);
      showToast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      showToast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-medical-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-medical-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-medical-600 to-medical-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-medical-600/30">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">DocRx System</h2>
        <p className="text-xs text-slate-400">
          Doctor Digital Prescription Management Platform for Bangladesh
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/60 sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@prescription.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-medical-500/30 focus:border-medical-500 font-mono"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-medical-500 focus:ring-medical-500/30 focus:ring-offset-0 cursor-pointer accent-medical-500"
                />
                <span>Remember me (মনে রাখুন)</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-medical-400 hover:text-medical-300 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-slate-700/60">
            <p className="text-xs text-slate-400">
              New medical practitioner?{' '}
              <Link to="/register" className="text-medical-400 hover:text-medical-300 font-bold">
                Register Doctor Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
