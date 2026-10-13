import React from 'react';
import { format } from 'date-fns';
import { Clock, Shield } from 'lucide-react';

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
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
      {logs.map((log) => (
        <div key={log._id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-white">
                {log.action} <span className="font-normal text-slate-400">on {log.resource}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                By: {log.userName || 'System'} ({log.userRole || 'admin'})
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm') : '—'}
          </div>
        </div>
      ))}
    </div>
  );
};
