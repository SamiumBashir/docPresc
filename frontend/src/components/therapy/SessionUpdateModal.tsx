import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { therapyApi } from '../../services/endpoints/therapy.api';
import { ITherapySession, TherapySessionStatus } from '../../types';

interface SessionUpdateModalProps {
  session: ITherapySession | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: ITherapySession) => void;
}

const toLocalDatetimeInput = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const toDateInput = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export const SessionUpdateModal: React.FC<SessionUpdateModalProps> = ({
  session,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [status, setStatus] = useState<TherapySessionStatus>('Scheduled');
  const [scheduledAt, setScheduledAt] = useState('');
  const [practitionerNotes, setPractitionerNotes] = useState('');
  const [patientFeedback, setPatientFeedback] = useState('');
  const [nextSessionDate, setNextSessionDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session && isOpen) {
      setStatus(session.status);
      setScheduledAt(toLocalDatetimeInput(session.scheduledAt));
      setPractitionerNotes(session.practitionerNotes || '');
      setPatientFeedback(session.patientFeedback || '');
      setNextSessionDate(toDateInput(session.nextSessionDate));
      setError(null);
    }
  }, [session, isOpen]);

  if (!session) return null;
  const isAlreadyCompleted = session.status === 'Completed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const updated = await therapyApi.updateSession(session._id, {
        version: session.version,
        status: isAlreadyCompleted ? 'Completed' : status,
        scheduledAt:
          !isAlreadyCompleted && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        practitionerNotes,
        patientFeedback,
        nextSessionDate: nextSessionDate ? new Date(nextSessionDate).toISOString() : null,
      });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to update session record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Session #${session.sessionNumber}`}
      subtitle={`Practitioner: ${session.assignedPractitionerName} • Record v${session.version}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isAlreadyCompleted && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
            <Lock className="w-4 h-4 text-[#007086] shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>
              This session is marked Completed. Its completion status is locked to preserve clinical
              history; you can still append practitioner notes or patient feedback.
            </span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Session status</label>
            <select
              value={status}
              disabled={isAlreadyCompleted}
              onChange={(e) => setStatus(e.target.value as TherapySessionStatus)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-100 disabled:text-slate-600"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Missed">Missed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Scheduled date &amp; time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              disabled={isAlreadyCompleted}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] disabled:bg-slate-100 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Practitioner session notes
          </label>
          <textarea
            rows={3}
            value={practitionerNotes}
            onChange={(e) => setPractitionerNotes(e.target.value)}
            placeholder="Clinical observations, tolerance, or administration notes..."
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Patient feedback (optional)
          </label>
          <textarea
            rows={2}
            value={patientFeedback}
            onChange={(e) => setPatientFeedback(e.target.value)}
            placeholder="Reported comfort, symptom response, or bilingual remarks..."
            className="w-full px-3 py-2 text-xs font-bengali bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Next follow-up date (optional)
          </label>
          <input
            type="date"
            value={nextSessionDate}
            onChange={(e) => setNextSessionDate(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007086] tabular-nums"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-xs font-medium text-white bg-[#007086] hover:bg-[#065b6d] rounded-lg disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save session update'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
