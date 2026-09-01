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
import { api } from '../../api/client';
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
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
            Loading doctors list...
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            No doctors found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Doctor Info</th>
                  <th className="py-3.5 px-4">BMDC Reg</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDoctors.map((doc) => {
                  const docEmail =
                    (doc.userId && typeof doc.userId === 'object' ? doc.userId.email : doc.email) ||
                    '';
                  const docStatus =
                    (doc.userId && typeof doc.userId === 'object' ? doc.userId.status : doc.status) ||
                    'active';
                  const docDate =
                    (doc.userId && typeof doc.userId === 'object' ? doc.userId.createdAt : doc.createdAt) ||
                    doc.createdAt;
                  const bmdc = doc.bmdcNumber || doc.bmdcRegNumber;

                  return (
                    <tr key={doc._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-sm">
                            {doc.name ? doc.name[0]?.toUpperCase() : 'D'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{doc.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{docEmail}</span>
                            </div>
                            {doc.phone && (
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{doc.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {bmdc ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs">
                            <Award className="w-3.5 h-3.5" />
                            <span>{bmdc}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Not Provided</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <p className="text-slate-200 font-medium">
                          {doc.specialization || 'General Practitioner'}
                        </p>
                        {doc.qualification && (
                          <p className="text-xs text-slate-400 mt-0.5">{doc.qualification}</p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            docStatus === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : docStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              docStatus === 'active'
                                ? 'bg-emerald-400'
                                : docStatus === 'pending'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          {docStatus}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-400 font-mono text-xs">
                        {docDate ? format(new Date(docDate), 'MMM dd, yyyy') : '—'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {docStatus !== 'active' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  doctorId: doc._id,
                                  status: 'active',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          )}

                          {docStatus !== 'suspended' && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  doctorId: doc._id,
                                  status: 'suspended',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
