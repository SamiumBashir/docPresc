import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  FilePlus,
  History,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { IPatient } from '../../types';

export const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State for New/Edit Patient
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<IPatient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'Unknown',
    address: '',
    emergencyContact: '',
    allergies: '',
    medicalHistory: '',
    notes: '',
  });

  const navigate = useNavigate();

  const fetchPatients = async (query = '', pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await api<{
        success: boolean;
        data: {
          patients: IPatient[];
          pagination: { page: number; totalPages: number; total: number };
        };
      }>(`/patients?search=${encodeURIComponent(query)}&page=${pageNum}&limit=15`);

      if (res.success && res.data) {
        setPatients(res.data.patients);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err: any) {
      showToast.error('Failed to load patients.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(search, page);
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients(search, 1);
  };

  const handleOpenCreateModal = () => {
    setEditingPatient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      age: '',
      gender: 'Male',
      bloodGroup: 'Unknown',
      address: '',
      emergencyContact: '',
      allergies: '',
      medicalHistory: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: IPatient) => {
    setEditingPatient(p);
    setFormData({
      name: p.name,
      phone: p.phone,
      email: p.email || '',
      age: p.age.toString(),
      gender: p.gender,
      bloodGroup: p.bloodGroup || 'Unknown',
      address: p.address || '',
      emergencyContact: p.emergencyContact || '',
      allergies: p.allergies?.join(', ') || '',
      medicalHistory: p.medicalHistory?.join(', ') || '',
      notes: p.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.age) {
      showToast.error('Name, Phone, and Age are required.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        age: Number(formData.age),
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address.trim() || undefined,
        emergencyContact: formData.emergencyContact.trim() || undefined,
        allergies: formData.allergies
          ? formData.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        notes: formData.notes.trim() || undefined,
      };

      if (editingPatient) {
        await api(`/patients/${editingPatient._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast.success('Patient record updated.');
      } else {
        await api('/patients', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast.success('New patient registered successfully.');
      }

      setIsModalOpen(false);
      fetchPatients(search, page);
    } catch (err: any) {
      showToast.error(err.message || 'Failed to save patient.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Patient Management</h2>
          <p className="text-xs text-slate-500">
            Registered patients ({totalCount}) with complete medical history timelines
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Patient Name, Phone Number, or Patient ID (PAT-2026)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name & Demographics</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Last Visit & Diagnosis</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading patient records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <p>No patients found.</p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="text-xs text-medical-600 font-semibold"
                    >
                      + Add your first patient
                    </button>
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Patient ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {p.patientId}
                    </td>

                    {/* Name & Demographics */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <Link
                        to={`/patients/${p._id}`}
                        className="font-bold text-slate-900 text-sm hover:text-medical-600 transition-colors block"
                      >
                        {p.name}
                      </Link>
                      <p className="text-[11px] text-slate-500">
                        {p.age} yrs • {p.gender} {p.bloodGroup && `• Blood: ${p.bloodGroup}`}
                      </p>
                    </td>

                    {/* Contact Info */}
                    <td className="py-3.5 px-4 space-y-0.5 text-slate-600 font-mono">
                      <p className="font-semibold text-slate-800">{p.phone}</p>
                      {p.address && <p className="text-[11px] text-slate-400 font-sans truncate max-w-xs">{p.address}</p>}
                    </td>

                    {/* Last Visit & Diagnosis */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      {p.lastVisit ? (
                        <>
                          <p className="text-slate-800 font-medium">
                            {new Date(p.lastVisit).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          {p.lastDiagnosis && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-medical-50 text-medical-800 border border-medical-200">
                              {p.lastDiagnosis}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">First visit</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/prescriptions/new?patientId=${p._id}`}
                          className="px-3 py-1.5 bg-medical-600 hover:bg-medical-700 text-white font-semibold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <FilePlus className="w-3.5 h-3.5" /> Write Rx
                        </Link>
                        <Link
                          to={`/patients/${p._id}`}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-medical-700 hover:bg-slate-100 rounded-lg transition-colors font-medium text-xs flex items-center gap-1"
                          title="View History Timeline"
                        >
                          <History className="w-3.5 h-3.5" /> History
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Demographics"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} total patients)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-30 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? 'Edit Patient Details' : 'Register New Patient'}
        subtitle="Only Name, Phone, and Age are mandatory for fast prescription writing"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Mohammad Abdul Karim"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0171..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Age (Years) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="130"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="45"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Address (Optional)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Dhanmondi, Dhaka"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="e.g. Son: 017..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Drug Allergies (Comma separated)
              </label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Chronic Medical Conditions
              </label>
              <input
                type="text"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                placeholder="e.g. Hypertension, Diabetes, Asthma"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
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
              {editingPatient ? 'Update Patient' : 'Save Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
