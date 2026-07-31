import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/ui/Toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await login(email, password);
      showToast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      showToast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoRole: 'doctor' | 'admin') => {
    if (demoRole === 'doctor') {
      setEmail('doctor@prescription.com');
      setPassword('Doctor123!');
    } else {
      setEmail('admin@prescription.com');
      setPassword('Admin123!');
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
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

          {/* Quick 1-Click Demo Logins */}
          <div className="pt-4 border-t border-slate-700/60 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Quick 1-Click Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('doctor')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-medical-950/60 border border-slate-700/80 hover:border-medical-600/40 text-left transition-all group"
              >
                <p className="text-xs font-bold text-white group-hover:text-medical-400">
                  Doctor Demo
                </p>
                <p className="text-[10px] text-slate-400 truncate">Dr. Moshfiqur Rahman</p>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-emerald-950/60 border border-slate-700/80 hover:border-emerald-600/40 text-left transition-all group"
              >
                <p className="text-xs font-bold text-white group-hover:text-emerald-400">Admin Demo</p>
                <p className="text-[10px] text-slate-400 truncate">System Manager</p>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
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
