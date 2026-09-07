import React, { useState, useEffect, useRef } from 'react';
import { User, ShieldCheck, Phone, Mail, Award, Building, Save, Trash2, AlertTriangle, PenTool, Upload, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';

const HEALTHCARE_INSTITUTIONS = [
  {
    id: 'BMDC',
    name: 'BMDC',
    fullName: 'Bangladesh Medical & Dental Council',
    banglaName: 'বাংলাদেশ মেডিকেল অ্যান্ড ডেন্টাল কাউন্সিল',
    tag: 'Regulatory Authority',
    fieldLabel: 'BMDC Registration Number',
    banglaLabel: 'বিএমডিসি রেজিস্ট্রেশন নম্বর',
    placeholder: 'e.g. A-54321 or B-76497',
    desc: 'Official practitioner registration number issued by Bangladesh Medical & Dental Council.',
  },
  {
    id: 'DGHS',
    name: 'DGHS',
    fullName: 'Directorate General of Health Services',
    banglaName: 'স্বাস্থ্য অধিদপ্তর',
    tag: 'Directorate',
    fieldLabel: 'DGHS Registration / License Number',
    banglaLabel: 'ডিজিএইচএস রেজিস্ট্রেশন নম্বর',
    placeholder: 'e.g. DGHS-2024-9871',
    desc: 'Official practitioner or facility license number issued by Directorate General of Health Services.',
  },
  {
    id: 'DGDA',
    name: 'DGDA',
    fullName: 'Directorate General of Drug Administration',
    banglaName: 'ঔষধ প্রশাসন অধিদপ্তর',
    tag: 'Drug Authority',
    fieldLabel: 'DGDA Registration / License Number',
    banglaLabel: 'ডিজিডিএ রেজিস্ট্রেশন নম্বর',
    placeholder: 'e.g. DGDA-REG-5432',
    desc: 'Official registration or practitioner certification issued by Directorate General of Drug Administration.',
  },
  {
    id: 'BIRDEM',
    name: 'BIRDEM',
    fullName: 'BIRDEM General Hospital / BADAS',
    banglaName: 'বারডেম জেনারেল হাসপাতাল / বাডাস',
    tag: 'Specialized Institute',
    fieldLabel: 'BIRDEM Registration / Faculty ID',
    banglaLabel: 'বারডেম রেজিস্ট্রেশন নম্বর',
    placeholder: 'e.g. BIRDEM-FAC-1029',
    desc: 'Official BIRDEM / Diabetic Association of Bangladesh doctor registration or faculty ID.',
  },
  {
    id: 'BSMMU',
    name: 'BSMMU',
    fullName: 'Bangabandhu Sheikh Mujib Medical University',
    banglaName: 'বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয়',
    tag: 'Medical University',
    fieldLabel: 'BSMMU Registration / ID Number',
    banglaLabel: 'বিএসএমএমইউ রেজিস্ট্রেশন নম্বর',
    placeholder: 'e.g. BSMMU-MD-4089',
    desc: 'Official BSMMU doctor registration, postgraduate trainee, or faculty registration ID.',
  },
];

export const DoctorProfile: React.FC = () => {
  const { doctor, user, refreshProfile, logout } = useAuth();

  const getInitialState = () => {
    const defaultAuth =
      doctor?.healthcareAuthority ||
      (doctor?.healthcareInstitutions && doctor.healthcareInstitutions[0]) ||
      'BMDC';

    const defaultRegNumber =
      doctor?.registrationNumber ||
      (doctor?.institutionRegNumbers && doctor.institutionRegNumbers[defaultAuth]) ||
      doctor?.bmdcNumber ||
      '';

    const regMap: Record<string, string> = {
      ...(doctor?.institutionRegNumbers || {}),
    };
    if (!regMap[defaultAuth]) {
      regMap[defaultAuth] = defaultRegNumber;
    }
    if (doctor?.bmdcNumber && !regMap['BMDC']) {
      regMap['BMDC'] = doctor.bmdcNumber;
    }

    return {
      name: doctor?.name || user?.name || '',
      qualification: doctor?.qualification || '',
      specialization: doctor?.specialization || '',
      designation: doctor?.designation || '',
      workplace: doctor?.workplace || '',
      selectedAuthority: defaultAuth,
      registrationNumber: defaultRegNumber,
      institutionRegNumbers: regMap,
      phone: doctor?.phone || '',
      email: doctor?.email || user?.email || '',
      signature: doctor?.signature || '',
      logo: doctor?.logo || '',
    };
  };

  const [formData, setFormData] = useState(getInitialState);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (doctor) {
      const defaultAuth =
        doctor.healthcareAuthority ||
        (doctor.healthcareInstitutions && doctor.healthcareInstitutions[0]) ||
        'BMDC';

      const defaultRegNumber =
        doctor.registrationNumber ||
        (doctor.institutionRegNumbers && doctor.institutionRegNumbers[defaultAuth]) ||
        doctor.bmdcNumber ||
        '';

      const regMap: Record<string, string> = {
        ...(doctor.institutionRegNumbers || {}),
      };
      if (!regMap[defaultAuth]) {
        regMap[defaultAuth] = defaultRegNumber;
      }
      if (doctor.bmdcNumber && !regMap['BMDC']) {
        regMap['BMDC'] = doctor.bmdcNumber;
      }

      setFormData((prev) => {
        const currentAuth = prev.selectedAuthority || defaultAuth;
        const currentReg = prev.registrationNumber || regMap[currentAuth] || defaultRegNumber;
        return {
          ...prev,
          name: doctor.name || user?.name || prev.name,
          qualification: doctor.qualification || prev.qualification,
          specialization: doctor.specialization || prev.specialization,
          designation: doctor.designation || prev.designation,
          workplace: doctor.workplace || prev.workplace,
          selectedAuthority: currentAuth,
          registrationNumber: currentReg,
          institutionRegNumbers: {
            ...regMap,
            ...prev.institutionRegNumbers,
            [currentAuth]: currentReg,
          },
          phone: doctor.phone || prev.phone,
          email: doctor.email || user?.email || prev.email,
          signature: doctor.signature || prev.signature,
          logo: doctor.logo || prev.logo,
        };
      });
    }
  }, [doctor, user]);

  const handleSelectAuthority = (id: string) => {
    setFormData((prev) => {
      const savedNumberForThisAuth =
        prev.institutionRegNumbers[id] ||
        (id === 'BMDC' ? doctor?.bmdcNumber || '' : '');

      return {
        ...prev,
        selectedAuthority: id,
        registrationNumber: savedNumberForThisAuth,
        institutionRegNumbers: {
          ...prev.institutionRegNumbers,
          [id]: savedNumberForThisAuth,
        },
      };
    });
  };

  const handleRegNumberChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      registrationNumber: value,
      institutionRegNumbers: {
        ...prev.institutionRegNumbers,
        [prev.selectedAuthority]: value,
      },
    }));
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
        showToast.success('Signature uploaded. Click "Save Profile Details" to save changes.');
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

  const selectedAuthorityInfo =
    HEALTHCARE_INSTITUTIONS.find((i) => i.id === formData.selectedAuthority) || HEALTHCARE_INSTITUTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selectedAuthority) {
      showToast.error('Please select a Healthcare Institution or Authority.');
      return;
    }

    const trimmedRegNum = formData.registrationNumber?.trim() || '';
    if (!trimmedRegNum) {
      showToast.error(`Please enter your registration number for ${formData.selectedAuthority}.`);
      return;
    }

    setIsSaving(true);
    try {
      const bmdcNum =
        formData.selectedAuthority === 'BMDC'
          ? trimmedRegNum
          : formData.institutionRegNumbers['BMDC'] || trimmedRegNum;

      const payload = {
        name: formData.name,
        qualification: formData.qualification,
        specialization: formData.specialization,
        designation: formData.designation,
        workplace: formData.workplace,
        healthcareInstitutions: [formData.selectedAuthority],
        healthcareAuthority: formData.selectedAuthority,
        registrationNumber: trimmedRegNum,
        institutionRegNumbers: {
          ...formData.institutionRegNumbers,
          [formData.selectedAuthority]: trimmedRegNum,
        },
        bmdcNumber: bmdcNum,
        phone: formData.phone,
        email: formData.email,
        signature: formData.signature,
        logo: formData.logo,
      };

      const res = await api('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
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
          Update your medical qualifications, authority registration number, and chamber affiliations
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Verification Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">
                {formData.selectedAuthority} Registered Practitioner
              </p>
              <p className="text-[11px] text-emerald-700 font-mono">
                {formData.selectedAuthority} Reg: {formData.registrationNumber || 'Pending entry'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs self-start sm:self-auto">
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
              placeholder="e.g. Dr. Sabina Yasmin"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-semibold"
            />
          </div>

          <div>
            <label htmlFor="doctor-specialization" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Specialization *
            </label>
            <input
              id="doctor-specialization"
              type="text"
              required
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Consultant Physician & Diabetologist"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Degrees & Specialization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="doctor-qualification" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Medical Qualifications / Degrees *
            </label>
            <textarea
              id="doctor-qualification"
              required
              rows={3}
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              placeholder={'e.g. MBBS (DMC)\nFCPS (Medicine)\nCCD (BIRDEM)'}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-medium leading-relaxed resize-y"
            />
          </div>

          <div>
            <label htmlFor="doctor-designation" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Official Designation
            </label>
            <textarea
              id="doctor-designation"
              rows={3}
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              placeholder={'e.g. Associate Professor\nDept of Medicine'}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Workplace / Hospital */}
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

        {/* Healthcare Institutions & Authorities (Single Select Radio) */}
        <div className="space-y-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-medical-600" />
                Healthcare Institutions & Authorities / স্বাস্থ্যসেবা প্রতিষ্ঠান ও কর্তৃপক্ষ *
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Select your recognized authority or institution (choose one) to enter its official registration number
              </p>
            </div>
            <span className="text-[11px] font-semibold text-medical-800 bg-medical-50/90 border border-medical-200 px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-medical-500"></span>
              Selected: {formData.selectedAuthority}
            </span>
          </div>

          {/* 5 Institution Radio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1" role="radiogroup" aria-label="Healthcare Institutions & Authorities">
            {HEALTHCARE_INSTITUTIONS.map((inst) => {
              const isSelected = formData.selectedAuthority === inst.id;
              return (
                <button
                  key={inst.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectAuthority(inst.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-medical-50/90 border-medical-500 shadow-2xs ring-2 ring-medical-500/20'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Radio Indicator */}
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isSelected
                        ? 'border-2 border-medical-600 bg-white shadow-2xs'
                        : 'border border-slate-300 bg-slate-50'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-medical-600 animate-in zoom-in-75 duration-150" />
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold ${isSelected ? 'text-medical-950' : 'text-slate-800'}`}>
                        {inst.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 text-slate-500 bg-slate-100 rounded font-medium">
                        {inst.tag}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-tight truncate ${isSelected ? 'text-medical-800 font-medium' : 'text-slate-500'}`}>
                      {inst.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {inst.banglaName}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Registration Number Input Field for the Selected Authority */}
          {selectedAuthorityInfo && (
            <div className="pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="authority-reg-number" className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-medical-600" />
                  {selectedAuthorityInfo.fieldLabel} * ({selectedAuthorityInfo.banglaLabel})
                </label>
                <span className="text-[10px] font-bold text-medical-700 bg-medical-50 px-2.5 py-0.5 rounded-md border border-medical-200">
                  {selectedAuthorityInfo.name}
                </span>
              </div>
              <div className="relative sm:max-w-md">
                <input
                  id="authority-reg-number"
                  type="text"
                  required
                  value={formData.registrationNumber}
                  onChange={(e) => handleRegNumberChange(e.target.value)}
                  placeholder={selectedAuthorityInfo.placeholder}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 focus:outline-none font-mono font-bold text-slate-900 tracking-wide bg-white shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {selectedAuthorityInfo.desc}
              </p>
            </div>
          )}
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

        {/* Doctor Signature (for Prescription Footer) */}
        <div className="border border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-medical-600" />
                Doctor Signature (Prescription Footer) / প্রেসক্রিপশন স্বাক্ষর
              </label>
              <p className="text-[11px] text-slate-500">
                Upload doctor's signature image to automatically appear on the footer of all your prescriptions
              </p>
            </div>
            {formData.signature && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, signature: '' })}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:underline cursor-pointer"
              >
                Remove Signature
              </button>
            )}
          </div>

          {formData.signature ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
              <div className="h-16 w-48 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                <img
                  src={formData.signature}
                  alt="Doctor Signature"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  <Check className="w-3 h-3" /> Signature Active
                </span>
                <p className="text-[11px] text-slate-500">
                  This signature will appear automatically above your name on the bottom right of all printed and digital prescriptions.
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
                id="doctor-signature-file"
              />
              <label
                htmlFor="doctor-signature-file"
                className={`flex flex-col items-center justify-center p-5 border border-dashed rounded-xl cursor-pointer transition-colors ${
                  isUploadingSignature
                    ? 'bg-slate-100 border-slate-300 pointer-events-none'
                    : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-medical-400 text-slate-600 hover:text-medical-700'
                }`}
              >
                {isUploadingSignature ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <div className="w-4 h-4 border-2 border-medical-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading signature to Cloudinary...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <div className="w-8 h-8 rounded-full bg-medical-50 flex items-center justify-center text-medical-600">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Upload Doctor Signature Image (PNG / JPG / WEBP)</span>
                    <span className="text-[11px] text-slate-400">Max file size: 5MB. Clean transparent PNG or white background recommended.</span>
                  </div>
                )}
              </label>
            </div>
          )}
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
