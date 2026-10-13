import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Award,
  Phone,
  Mail,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api-client';
import { format } from 'date-fns';

export const DoctorManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: doctors = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const res = await api<{ success: boolean; data: any[] }>('/admin/doctors');
      const list = res.data || (res as any).doctors || [];
      return Array.isArray(list) ? list : [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ doctorId, status }: { doctorId: string; status: string }) => {
      return api(`/admin/doctors/${doctorId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const filteredDoctors = doctors.filter((doc) => {
    const docName = doc.name || '';
    const docEmail = (doc.userId && typeof doc.userId === 'object' ? doc.userId.email : doc.email) || '';
    const bmdc = doc.bmdcNumber || doc.bmdcRegNumber || '';
    const specialty = doc.specialization || '';
    const status = (doc.userId && typeof doc.userId === 'object' ? doc.userId.status : doc.status) || 'active';

    const matchesSearch =
      docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bmdc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Doctors & BMDC Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review registered practitioners, BMDC licenses, and control account active status.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by doctor name, email, BMDC number, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Pending Approval</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 sm:px-6">Doctor Details</th>
                <th className="py-3 px-4">BMDC License</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      <span>Loading practitioners...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No doctors matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const status = (doc.userId && typeof doc.userId === 'object' ? doc.userId.status : doc.status) || 'active';
                  const docId = doc._id;
                  const docUserId = doc.userId?._id || (typeof doc.userId === 'string' ? doc.userId : doc._id);

                  return (
                    <tr key={docId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm">
                            {doc.name ? doc.name[0] : 'D'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{doc.name || 'Unnamed Doctor'}</p>
                            <p className="text-xs text-slate-400">
                              Joined: {doc.createdAt ? format(new Date(doc.createdAt), 'MMM d, yyyy') : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 w-fit">
                          <Award className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{doc.bmdcNumber || doc.bmdcRegNumber || 'A-54321'}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-300">
                        {doc.specialization || 'General Practitioner'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{(doc.userId && typeof doc.userId === 'object' ? doc.userId.email : doc.email) || 'N/A'}</span>
                          </div>
                          {doc.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{doc.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status === 'active'
                                ? 'bg-emerald-400'
                                : status === 'pending'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          {status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {status !== 'active' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ doctorId: docUserId, status: 'active' })}
                              disabled={updateStatusMutation.isPending}
                              title="Approve / Activate"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors inline-flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Activate</span>
                            </button>
                          )}
                          {status === 'active' && (
                            <button
                              onClick={() => updateStatusMutation.mutate({ doctorId: docUserId, status: 'suspended' })}
                              disabled={updateStatusMutation.isPending}
                              title="Suspend Access"
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/20 transition-colors inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </button>
                          )}
                        </div>
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
export default DoctorManagement;
