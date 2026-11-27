import React from 'react';
import {
  ConsentStatus,
  TherapySessionStatus,
  TherapyVerificationStatus,
  TreatmentPlanStatus,
} from '../../types';

export const VerificationBadge: React.FC<{
  status: TherapyVerificationStatus;
  dark?: boolean;
}> = ({ status, dark = false }) => {
  const styles: Record<TherapyVerificationStatus, { light: string; dark: string; label: string }> = {
    APPROVED: {
      light: 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]',
      dark: 'bg-[#4cc38a]/12 border-[#4cc38a]/30 text-[#4cc38a]',
      label: 'Approved',
    },
    PENDING_CLINICAL_REVIEW: {
      light: 'bg-amber-50 border-amber-200 text-amber-800',
      dark: 'bg-amber-400/12 border-amber-400/30 text-amber-300',
      label: 'Pending review',
    },
    NEEDS_TERMINOLOGY_REVIEW: {
      light: 'bg-slate-100 border-slate-300 text-slate-800',
      dark: 'bg-[#2ab0c7]/12 border-[#2ab0c7]/30 text-[#2ab0c7]',
      label: 'Terminology review',
    },
    REJECTED: {
      light: 'bg-rose-50 border-rose-200 text-rose-800',
      dark: 'bg-[#f08b8e]/12 border-[#f08b8e]/30 text-[#f08b8e]',
      label: 'Rejected',
    },
  };

  const cfg = styles[status] || styles.PENDING_CLINICAL_REVIEW;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${
        dark ? cfg.dark : cfg.light
      }`}
    >
      {cfg.label}
    </span>
  );
};

export const PlanStatusBadge: React.FC<{ status: TreatmentPlanStatus }> = ({ status }) => {
  const map: Record<TreatmentPlanStatus, { cls: string; label: string }> = {
    DRAFT: { cls: 'bg-slate-100 border-slate-200 text-slate-700', label: 'Draft' },
    FINALIZED: { cls: 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]', label: 'Finalized' },
    ACTIVE: { cls: 'bg-[#f0f9fa] border-[#007086]/40 text-[#007086]', label: 'Active' },
    COMPLETED: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', label: 'Completed' },
    CANCELLED: { cls: 'bg-slate-100 border-slate-200 text-slate-500', label: 'Cancelled' },
  };
  const cfg = map[status] || map.DRAFT;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};

export const SessionStatusBadge: React.FC<{ status: TherapySessionStatus }> = ({ status }) => {
  const map: Record<TherapySessionStatus, string> = {
    Scheduled: 'bg-white border-slate-300 text-slate-800',
    Completed: 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]',
    Rescheduled: 'bg-amber-50 border-amber-200 text-amber-800',
    Cancelled: 'bg-slate-100 border-slate-200 text-slate-500',
    Missed: 'bg-rose-50 border-rose-200 text-rose-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${
        map[status] || map.Scheduled
      }`}
    >
      {status}
    </span>
  );
};

export const ConsentStatusBadge: React.FC<{ status: ConsentStatus }> = ({ status }) => {
  const map: Record<ConsentStatus, { cls: string; label: string }> = {
    OBTAINED: { cls: 'bg-[#f0f9fa] border-[#aee2e8] text-[#065b6d]', label: 'Consent obtained' },
    PENDING: { cls: 'bg-amber-50 border-amber-200 text-amber-800', label: 'Consent pending' },
    DECLINED: { cls: 'bg-rose-50 border-rose-200 text-rose-800', label: 'Consent declined' },
    NOT_REQUIRED: { cls: 'bg-slate-100 border-slate-200 text-slate-600', label: 'Standard consent' },
  };
  const cfg = map[status] || map.PENDING;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};
