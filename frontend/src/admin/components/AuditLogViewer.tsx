import React from 'react';
import { format } from 'date-fns';
import { Shield } from 'lucide-react';

interface AuditLogItem {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userName?: string;
  userRole?: string;
  details?: Record<string, any>;
  createdAt: string;
}

interface Props {
  logs: AuditLogItem[];
}

export const AuditLogViewer: React.FC<Props> = ({ logs }) => {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#131924] divide-y divide-white/[0.06] overflow-hidden">
      {logs.map((log) => (
        <div
          key={log._id}
          className="px-4 py-3 flex items-center justify-between text-xs hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-md bg-[#1b2232] border border-white/[0.08] text-[#757d90] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-[#eef0f5] truncate">
                {log.action} <span className="font-normal text-[#a3a9b8]">on {log.resource}</span>
              </p>
              <p className="text-[11px] text-[#757d90]">
                By {log.userName || 'System'} ({log.userRole || 'admin'})
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-[#757d90] font-mono tabular-nums shrink-0">
            {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm') : '—'}
          </div>
        </div>
      ))}
    </div>
  );
};
