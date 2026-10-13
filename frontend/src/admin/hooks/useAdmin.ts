import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await adminService.getStats();
      return (res as any)?.data?.stats || (res as any)?.stats || {};
    },
  });
};

export const useAdminDoctors = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const res = await adminService.getDoctors();
      return (res as any)?.data || (res as any)?.doctors || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ doctorId, status }: { doctorId: string; status: string }) =>
      adminService.updateDoctorStatus(doctorId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return { ...query, updateStatus };
};

export const useAdminAuditLogs = (limit = 100) => {
  return useQuery({
    queryKey: ['admin-audit-logs', limit],
    queryFn: async () => {
      const res = await adminService.getAuditLogs(limit);
      return (res as any)?.data?.logs || (res as any)?.logs || [];
    },
  });
};
