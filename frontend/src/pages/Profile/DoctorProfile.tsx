import React, { useState } from 'react';
import { User, ShieldCheck, Phone, Mail, Award, Building, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';

export const DoctorProfile: React.FC = () => {
  const { doctor, user, refreshProfile, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: doctor?.name || user?.name || '',
    qualification: doctor?.qualification || '',
    specialization: doctor?.specialization || '',
    bmdcNumber: doctor?.bmdcNumber || '',
    designation: doctor?.designation || '',
    workplace: doctor?.workplace || '',
    phone: doctor?.phone || '',
    email: doctor?.email || user?.email || '',
    signature: doctor?.signature || '',
    logo: doctor?.logo || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        showToast.success('Doctor profile credentials updated.');
        await refreshProfile();
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteText !== 'DELETE') {
      showToast.error('Please type DELETE to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await api<{ success: boolean; message: string }>('/auth/account', {
        method: 'DELETE',
      });

      if (res.success) {
        showToast.success('Account deleted successfully.');
        localStorage.clear();
        await logout();
        window.location.href = '/login';
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Doctor Profile & Credentials</h2>
        <p className="text-xs text-slate-500">
          Update your medical qualifications, BMDC registration number, and chamber affiliations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Verification Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">BMDC Registered Practitioner</p>
              <p className="text-[11px] text-emerald-700">Registration Number: {doctor?.bmdcNumber}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs">
            Verified Status
          </span>
        </div>

        {/* Primary Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sabina Yasmin"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              BMDC Registration Number *
            </label>
            <input
              type="text"
              required
              value={formData.bmdcNumber}
              onChange={(e) => setFormData({ ...formData, bmdcNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Degrees & Specialization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Medical Qualifications / Degrees *
            </label>
            <input
              type="text"
              required
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder="e.g. MBBS (DMC), FCPS (Medicine), CCD (BIRDEM)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Specialization *
            </label>
            <input
              type="text"
              required
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Consultant Physician & Diabetologist"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Designation & Hospital */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Official Designation
            </label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder="e.g. Associate Professor, Dept of Medicine"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Workplace / Hospital
            </label>
            <input
              type="text"
              value={formData.workplace}
              onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
              placeholder="e.g. Dhaka Medical College Hospital"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Profile Details
          </button>
        </div>
      </form>

      {/* Danger Zone: Delete Account */}
      <div className="bg-rose-50/70 border border-rose-200/80 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Danger Zone — Delete Account (অ্যাকাউন্ট মুছে ফেলুন)
            </h3>
            <p className="text-xs text-rose-700 leading-relaxed max-w-2xl">
              Permanently delete your doctor account, all linked chambers, prescription templates, and associated records. This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmDeleteText('');
              setShowDeleteModal(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        title="Delete Account Permanently"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Are you absolutely sure?</p>
              <p className="text-[11px] mt-0.5 text-rose-700">
                This will immediately and permanently erase your account, login credentials, registered chambers, prescription history, and templates.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Type <span className="font-mono text-rose-600 font-black">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={confirmDeleteText !== 'DELETE' || isDeleting}
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isDeleting ? (
                <span>Deleting Account...</span>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
