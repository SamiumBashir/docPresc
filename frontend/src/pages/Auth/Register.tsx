import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, User, Lock, Mail, Phone, ShieldCheck, ArrowRight, Eye, EyeOff, CornerDownLeft } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    qualification: '',
    specialization: '',
    bmdcNumber: '',
    workplace: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.bmdcNumber.trim() || !formData.qualification.trim() || !formData.password) {
      showToast.error('Please fill in all required registration fields.');
      return;
    }

    if (formData.password.length < 6) {
      showToast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{ success: boolean; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          password: formData.password,
          qualification: formData.qualification.trim(),
          specialization: formData.specialization.trim() || 'General Physician',
          bmdcNumber: formData.bmdcNumber.trim(),
          workplace: formData.workplace.trim() || undefined,
        }),
      });

      if (res.success) {
        showToast.success('Doctor account registered successfully! Please sign in.');
        navigate('/login');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
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
          Create your verified doctor profile with BMDC credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/60 sm:px-10 space-y-5">
          <form onSubmit={handleSubmit} role="form" aria-label="Doctor Registration Form" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label
                  htmlFor="reg-bmdc"
                  className="block text-xs font-bold text-slate-200 uppercase mb-1"
                >
                  BMDC Number *
                </label>
                <input
                  id="reg-bmdc"
                  name="bmdcNumber"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.bmdcNumber}
                  onChange={(e) => setFormData({ ...formData, bmdcNumber: e.target.value })}
                  placeholder="e.g. A-12345"
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500 font-mono"
                />
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="reg-qual"
                    className="block text-xs font-bold text-slate-200 uppercase"
                  >
                    Qualifications *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('reg-qual') as HTMLTextAreaElement | null;
                      if (el) {
                        const start = el.selectionStart ?? el.value.length;
                        const end = el.selectionEnd ?? el.value.length;
                        const val = formData.qualification;
                        const updated = val.substring(0, start) + '\n' + val.substring(end);
                        setFormData({ ...formData, qualification: updated });
                        setTimeout(() => {
                          el.focus();
                          el.setSelectionRange(start + 1, start + 1);
                        }, 0);
                      } else {
                        setFormData({ ...formData, qualification: formData.qualification + '\n' });
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                    title="নতুন লাইন যোগ করতে ক্লিক করুন"
                  >
                    <CornerDownLeft className="w-3 h-3" />
                    <span>↵ লাইন ব্রেক</span>
                  </button>
                </div>
                <textarea
                  id="reg-qual"
                  name="qualification"
                  rows={2}
                  required
                  autoComplete="off"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder={'e.g. MBBS (DMC)\nFCPS (Medicine)'}
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500 resize-y leading-relaxed"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-spec"
                  className="block text-xs font-bold text-slate-200 uppercase mb-1"
                >
                  Specialization *
                </label>
                <input
                  id="reg-spec"
                  name="specialization"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g. Medicine Specialist"
                  className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="reg-pwd"
                  className="block text-xs font-bold text-slate-200 uppercase"
                >
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-medical-400 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide password (পাসওয়ার্ড লুকান)' : 'Show password (পাসওয়ার্ড দেখুন)'}</span>
                </button>
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
                  placeholder={showPassword ? 'At least 6 characters' : '••••••••'}
                  className="w-full pl-3 pr-10 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-medical-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-label="Submit doctor registration"
              className="w-full py-2.5 bg-medical-600 hover:bg-medical-700 text-white font-bold rounded-xl text-sm shadow-md shadow-medical-600/25 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? <span>Registering...</span> : <span>Complete Doctor Registration</span>}
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
