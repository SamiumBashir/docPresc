import React from 'react';

interface Props {
  status: 'active' | 'pending' | 'suspended' | string;
}

export const DoctorStatusBadge: React.FC<Props> = ({ status }) => {
  const normalized = status.toLowerCase();
  const config =
    normalized === 'active'
      ? {
          text: 'Active',
          cls: 'bg-[#4cc38a]/10 text-[#4cc38a] border-[#4cc38a]/25',
          dot: 'bg-[#4cc38a]',
        }
      : normalized === 'pending'
      ? {
          text: 'Pending',
          cls: 'bg-amber-400/10 text-amber-300 border-amber-400/25',
          dot: 'bg-amber-400',
        }
      : {
          text: 'Suspended',
          cls: 'bg-[#e5484d]/10 text-[#f08b8e] border-[#e5484d]/25',
          dot: 'bg-[#e5484d]',
        };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded inline-flex items-center gap-1.5 border ${config.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.text}</span>
    </span>
  );
};
