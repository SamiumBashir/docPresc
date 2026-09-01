import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, KeyRound } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        message: string;
        data?: { resetUrl?: string };
      }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (res.success) {
        setIsSent(true);
        if (res.data?.resetUrl) {
          setDevResetUrl(res.data.resetUrl);
        }
        showToast.success(res.message || 'Password reset link sent to your email.');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to request password reset. Please try again.');
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
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Forgot Password</h2>
        <p className="text-xs text-slate-400">
          Recover your DocRx doctor account password securely
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/60 sm:px-10 space-y-6">
          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered email address below. We'll generate a secure password recovery link for you.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-medical-500 hover:bg-medical-600 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Sending reset link...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Reset Link Generated</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We have sent instructions and a secure reset link for{' '}
                  <span className="text-medical-400 font-mono font-bold">{email}</span>.
                </p>
              </div>

              {devResetUrl && (
                <div className="bg-slate-900/90 p-3 rounded-xl border border-medical-500/30 text-left space-y-1.5">
                  <p className="text-[10px] font-bold text-medical-400 uppercase tracking-wider">
                    Instant Development Reset Link:
                  </p>
                  <a
                    href={devResetUrl}
                    className="text-xs font-mono text-emerald-400 hover:underline break-all block"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              <p className="text-[11px] text-slate-400">
                Didn't receive the email? Check your spam folder or try again in a few minutes.
              </p>
            </div>
          )}

          <div className="text-center pt-2 border-t border-slate-700/60">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login (লগইন এ ফিরে যান)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
