import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InfinityLoop } from '@/components/loading-ui/infinity';
import {
  Search,
  CheckCircle2,
  XCircle,
  Award,
  Phone,
  Mail,
} from 'lucide-react';
import { api } from '../../services/api-client';
import { DoctorStatusBadge } from '../components/DoctorStatusBadge';
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
    const docEmail =
      (doc.userId && typeof doc.userId === 'object' ? doc.userId.email : doc.email) || '';
    const bmdc = doc.bmdcNumber || doc.bmdcRegNumber || '';
    const specialty = doc.specialization || '';
    const status =
      (doc.userId && typeof doc.userId === 'object' ? doc.userId.status : doc.status) || 'active';

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
      <div>
        <h1 className="text-xl sm:text-2xl font-medium text-[#eef0f5] tracking-[-0.01em]">
          Doctors &amp; BMDC Verification
        </h1>
        <p className="text-xs text-[#a3a9b8] mt-1">
          Verify registration numbers and manage clinician account access
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search
            className="w-4 h-4 text-[#757d90] absolute left-3 top-2.5 pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Search doctors by name, email, or BMDC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#131924] border border-white/[0.1] rounded-lg pl-9 pr-3 text-[13px] text-[#eef0f5] placeholder-[#757d90] focus:outline-none focus:border-[#007086] transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter doctors by status"
          className="h-9 bg-[#131924] border border-white/[0.1] rounded-lg px-3 text-xs text-[#eef0f5] focus:outline-none focus:border-[#007086] transition-colors"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending approval</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Doctors Table */}
      <div className="rounded-xl bg-[#131924] border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#18202e] border-b border-white/[0.08] text-xs font-medium text-[#a3a9b8]">
              <tr>
                <th className="py-3 px-4 sm:px-5">Doctor</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 sm:px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[13px]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#a3a9b8]">
                    <div className="flex flex-col items-center gap-2">
                      <InfinityLoop className="w-12 h-6 text-[#2ab0c7]" duration="1.6s" />
                      <span className="text-xs">Loading clinicians...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#757d90]">
                    No doctors match your criteria.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc) => {
                  const status =
                    (doc.userId && typeof doc.userId === 'object' ? doc.userId.status : doc.status) ||
                    'active';
                  const docId = doc._id;
                  const docUserId =
                    doc.userId?._id || (typeof doc.userId === 'string' ? doc.userId : doc._id);

                  return (
                    <tr key={docId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#1b2232] border border-white/[0.08] text-[#eef0f5] font-medium flex items-center justify-center text-xs shrink-0">
                            {doc.name ? doc.name[0] : 'D'}
                          </div>
                          <div>
                            <p className="font-medium text-[#eef0f5]">
                              {doc.name || 'Unnamed Doctor'}
                            </p>
                            <p className="text-xs text-[#757d90] tabular-nums">
                              Joined{' '}
                              {doc.createdAt
                                ? format(new Date(doc.createdAt), 'MMM d, yyyy')
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#eef0f5] bg-[#1b2232] px-2 py-0.5 rounded border border-white/[0.08] tabular-nums">
                          <Award className="w-4 h-4 text-[#757d90]" strokeWidth={1.5} />
                          <span>{doc.bmdcNumber || doc.bmdcRegNumber || 'N/A'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#a3a9b8]">
                        {doc.specialization || 'General Practitioner'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs text-[#a3a9b8]">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4 text-[#757d90]" strokeWidth={1.5} />
                            <span>
                              {(doc.userId && typeof doc.userId === 'object'
                                ? doc.userId.email
                                : doc.email) || 'N/A'}
                            </span>
                          </div>
                          {doc.phone && (
                            <div className="flex items-center gap-1.5 tabular-nums">
                              <Phone className="w-4 h-4 text-[#757d90]" strokeWidth={1.5} />
                              <span>{doc.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <DoctorStatusBadge status={status} />
                      </td>

                      <td className="py-3.5 px-4 sm:px-5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {status !== 'active' ? (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  doctorId: docId || docUserId,
                                  status: 'active',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="h-8 px-2.5 rounded-lg bg-[#007086] hover:bg-[#088097] text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                              <span>Activate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  doctorId: docId || docUserId,
                                  status: 'suspended',
                                })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="h-8 px-2.5 rounded-lg bg-[#1b2232] hover:bg-[#e5484d]/15 text-[#a3a9b8] hover:text-[#f08b8e] text-xs font-medium border border-white/[0.1] hover:border-[#e5484d]/30 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" strokeWidth={1.5} />
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
