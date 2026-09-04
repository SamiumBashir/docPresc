import React, { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Phone, Calendar, Clock, Check, Edit2, Trash2, Globe, Upload, PenTool } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { IChamber } from '../../types';

export const ChamberList: React.FC = () => {
  const { chambers, setActiveChamber, activeChamber, refreshProfile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChamber, setEditingChamber] = useState<IChamber | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    appointmentPhone: '',
    website: '',
    signature: '',
    visitingDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
    visitingHours: '5:00 PM - 9:00 PM',
    roomNo: '',
    isDefault: false,
  });

  const handleOpenCreate = () => {
    setEditingChamber(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      appointmentPhone: '',
      website: '',
      signature: '',
      visitingDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      visitingHours: '5:00 PM - 9:00 PM',
      roomNo: '',
      isDefault: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ch: IChamber) => {
    setEditingChamber(ch);
    setFormData({
      name: ch.name,
      address: ch.address,
      phone: ch.phone || '',
      appointmentPhone: ch.appointmentPhone || '',
      website: ch.website || '',
      signature: ch.signature || '',
      visitingDays: ch.visitingDays || ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      visitingHours: ch.visitingHours || '5:00 PM - 9:00 PM',
      roomNo: ch.roomNo || '',
      isDefault: ch.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error('Signature file size must be less than 5MB.');
      return;
    }

    setIsUploadingSignature(true);
    try {
      const uploadData = new FormData();
      uploadData.append('signature', file);

      const res = await api<{ success: boolean; message: string; data: { url: string } }>('/upload/signature', {
        method: 'POST',
        body: uploadData,
      });

      if (res.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, signature: res.data.url }));
        showToast.success('Signature uploaded successfully.');
      } else {
        throw new Error(res.message || 'Failed to upload signature.');
      }
    } catch (err: any) {
      showToast.error(err.message || 'Error uploading signature.');
    } finally {
      setIsUploadingSignature(false);
      if (signatureInputRef.current) {
        signatureInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      showToast.error('Chamber name and address are required.');
      return;
    }

    try {
      if (editingChamber) {
        await api(`/chambers/${editingChamber._id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        showToast.success('Chamber updated.');
      } else {
        await api('/chambers', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        showToast.success('New chamber added.');
      }

      setIsModalOpen(false);
      await refreshProfile();
    } catch (err: any) {
      showToast.error(err.message || 'Failed to save chamber.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this chamber?')) return;
    try {
      await api(`/chambers/${id}`, { method: 'DELETE' });
      showToast.success('Chamber removed.');
      await refreshProfile();
    } catch (err: any) {
      showToast.error('Failed to remove chamber.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Consultation Chambers</h2>
          <p className="text-xs text-slate-500">
            Manage your hospital affiliations, visiting hours, and chamber letterhead details
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Chamber</span>
        </button>
      </div>

      {/* Chambers Grid */}
      {chambers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-medical-50 border border-medical-200 text-medical-600 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Chambers Added Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You haven't added any consultation chambers yet. Add your hospital or clinic chamber to appear on your prescription letterhead.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-semibold text-xs transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Chamber</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chambers.map((ch) => {
          const isActive = activeChamber?._id === ch._id;
          return (
            <div
              key={ch._id}
              className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs flex flex-col justify-between transition-all group ${
                isActive ? 'border-medical-500 ring-2 ring-medical-500/20' : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-medical-700 transition-colors">
                        {ch.name}
                      </h3>
                      {ch.roomNo && <p className="text-[11px] text-slate-400">{ch.roomNo}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(ch)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {chambers.length > 1 && (
                      <button
                        onClick={() => handleDelete(ch._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{ch.address}</p>

                <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                  {ch.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {ch.phone}
                    </p>
                  )}
                  {ch.website && (
                    <p className="flex items-center gap-1.5 text-medical-700 font-medium font-sans">
                      <Globe className="w-3.5 h-3.5 text-medical-500 shrink-0" />
                      <a
                        href={ch.website.startsWith('http') ? ch.website : `https://${ch.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        title={`Appointment Website: ${ch.website}`}
                      >
                        {ch.website}
                      </a>
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {ch.visitingHours}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] font-sans">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {ch.visitingDays?.join(', ')}
                  </p>
                  {ch.signature && (
                    <p className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium font-sans pt-1 border-t border-slate-100">
                      <PenTool className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Footer Signature Attached</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Active Chamber
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveChamber(ch)}
                    className="px-3 py-1 text-xs font-semibold text-medical-700 hover:bg-medical-50 rounded-lg border border-medical-200 transition-colors"
                  >
                    Set as Active
                  </button>
                )}

                {ch.isDefault && (
                  <span className="text-[10px] uppercase font-bold text-slate-400">Default</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Chamber Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChamber ? 'Edit Chamber' : 'Add Consultation Chamber'}
        subtitle="This information will appear on the prescription header"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Chamber Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dhanmondi Specialized Chamber"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Address *
            </label>
            <textarea
              rows={2}
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. House #42, Road #7/A, Dhanmondi, Dhaka"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chamber Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 2-966..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Visiting Hours
              </label>
              <input
                type="text"
                value={formData.visitingHours}
                onChange={(e) => setFormData({ ...formData, visitingHours: e.target.value })}
                placeholder="5:00 PM - 9:00 PM"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Website (For Appointment)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="e.g. www.medigohealth.com or https://appointment.hospital.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Appointment website link displayed on your prescription letterhead.
            </p>
          </div>

          {/* Upload Signature Section */}
          <div className="border border-dashed border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Chamber Signature (for Prescription Footer)
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload doctor's signature image to appear in the footer when prescribing for this chamber
                </p>
              </div>
              {formData.signature && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, signature: '' })}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {formData.signature ? (
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
                <div className="h-14 w-36 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                  <img
                    src={formData.signature}
                    alt="Chamber Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Check className="w-3 h-3" /> Signature Attached
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Will appear automatically in the footer of prescriptions for this chamber.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleSignatureUpload}
                  className="hidden"
                  id="chamber-signature-file"
                />
                <label
                  htmlFor="chamber-signature-file"
                  className={`flex flex-col items-center justify-center p-4 border border-dashed rounded-xl cursor-pointer transition-colors ${
                    isUploadingSignature
                      ? 'bg-slate-100 border-slate-300 pointer-events-none'
                      : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-medical-400 text-slate-600 hover:text-medical-700'
                  }`}
                >
                  {isUploadingSignature ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <div className="w-4 h-4 border-2 border-medical-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Uploading to Cloudinary...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Upload className="w-4 h-4 text-medical-600" />
                      <span>Upload Signature Image (PNG / JPG)</span>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Room No (Optional)
              </label>
              <input
                type="text"
                value={formData.roomNo}
                onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                placeholder="Room #402"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-medical-600 focus:ring-medical-500"
                />
                <span>Set as Default Chamber</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-medical-600 hover:bg-medical-700 text-white rounded-xl shadow-xs"
            >
              Save Chamber
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
