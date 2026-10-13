import React from 'react';

interface Props {
  status: 'active' | 'pending' | 'suspended' | string;
}

export const DoctorStatusBadge: React.FC<Props> = ({ status }) => {
  const normalized = status.toLowerCase();
  const config =
    normalized === 'active'
      ? { text: 'ACTIVE', bg: 'bg-emerald-500/10', textCol: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400' }
      : normalized === 'pending'
      ? { text: 'PENDING', bg: 'bg-amber-500/10', textCol: 'text-amber-400', border: 'border-amber-500/20', dot: 'bg-amber-400' }
      : { text: 'SUSPENDED', bg: 'bg-rose-500/10', textCol: 'text-rose-400', border: 'border-rose-500/20', dot: 'bg-rose-400' };

  return (
    <span
      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${config.bg} ${config.textCol} border ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.text}
    </span>
  );
};
