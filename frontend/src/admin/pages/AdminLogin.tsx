import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Activity, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { InfinityLoop } from '@/components/loading-ui/infinity';

export const AdminLogin: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const fillDemoAdmin = () => {
    setEmail('admin@prescription.com');
    setPassword('Admin123!');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      const storedUser = JSON.parse(localStorage.getItem('docrx_user') || '{}');
      if (storedUser.role !== 'admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please verify admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1119] flex flex-col justify-center items-center px-4 text-[#eef0f5] antialiased">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#007086] text-white mx-auto">
            <Activity className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-medium text-[#eef0f5] tracking-[-0.01em]">
            DocRx Clinical Governance
          </h1>
          <p className="text-xs text-[#a3a9b8]">Administrator portal sign in</p>
        </div>

        <div className="bg-[#131924] border border-white/[0.08] rounded-xl p-6 sm:p-7">
          {error && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-lg bg-[#e5484d]/10 border border-[#e5484d]/25 flex items-center gap-2.5 text-[#f08b8e] text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#a3a9b8] mb-1.5">
                Administrator email
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-[#757d90] absolute left-3 top-2.5 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@prescription.com"
                  className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 pl-9 pr-3 text-[13px] text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#007086] focus:ring-1 focus:ring-[#007086] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#a3a9b8]">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-[#757d90] hover:text-[#eef0f5] flex items-center gap-1.5 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={1.5} />
                  )}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-[#757d90] absolute left-3 top-2.5 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-[#0d1119] border border-white/[0.1] rounded-lg py-2 pl-9 pr-3 text-[13px] text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#007086] focus:ring-1 focus:ring-[#007086] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 px-4 rounded-lg bg-[#007086] hover:bg-[#088097] text-white font-medium text-[13px] transition-colors disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <InfinityLoop className="w-7 h-3.5 text-white" duration="1.6s" strokeWidth={7} />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in to admin portal'
              )}
            </button>

            <div className="pt-3 border-t border-white/[0.08] text-center">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-xs text-[#a3a9b8] hover:text-[#eef0f5] font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-[#2ab0c7]" strokeWidth={1.5} />
                <span>Fill demo admin credentials</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
