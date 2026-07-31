import React, { useState, useEffect } from 'react';
import { Stethoscope, ShieldCheck, Check, X, Search, ChevronRight } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { IDoctor } from '../../types';

export const AdminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await api<{ success: boolean; data: any[] }>('/admin/doctors');
      if (res.success && res.data) {
        setDoctors(res.data);
      }
    } catch {
      showToast.error('Failed to load doctors list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleUpdateStatus = async (doctorId: string, status: 'active' | 'suspended') => {
    try {
      const res = await api(`/admin/doctors/${doctorId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        showToast.success(`Doctor account status set to ${status}.`);
        fetchDoctors();
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Manage Doctors</h2>
        <p className="text-xs text-slate-500">
          Verify BMDC registration numbers, approve registrations, or suspend doctor privileges
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Doctor Name & BMDC</th>
                <th className="py-3 px-4">Qualifications & Specialization</th>
                <th className="py-3 px-4">Hospital / Workplace</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading doctors directory...
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => {
                  const status = doc.userId?.status || 'active';
                  return (
                    <tr key={doc._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                        <p className="text-[11px] font-mono text-medical-700 font-semibold">
                          BMDC: {doc.bmdcNumber}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="font-semibold text-slate-800">{doc.qualification}</p>
                        <p className="text-[11px] text-slate-500">{doc.specialization}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {doc.workplace || 'Private Practice'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {status === 'active' ? (
                          <button
                            onClick={() => handleUpdateStatus(doc._id, 'suspended')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 transition-colors"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(doc._id, 'active')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg border border-emerald-200 transition-colors"
                          >
                            Activate / Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
