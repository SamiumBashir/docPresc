import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, Calendar, ArrowRight, UserPlus, History } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { api } from '../../api/client';
import { IPatient } from '../../types';

interface QuickPatientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickPatientSearchModal: React.FC<QuickPatientSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      fetchPatients('');
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchPatients = async (query: string) => {
    setIsLoading(true);
    try {
      const res = await api<{ success: boolean; data: { patients: IPatient[] } }>(
        `/patients?search=${encodeURIComponent(query)}&limit=8`
      );
      if (res.success && res.data) {
        setPatients(res.data.patients);
      }
    } catch {
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchPatients(val);
  };

  const handleSelectPatient = (patient: IPatient) => {
    onClose();
    navigate(`/prescriptions/new?patientId=${patient._id}`);
  };

  const handleViewPatientDetails = (patientId: string) => {
    onClose();
    navigate(`/patients/${patientId}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Patient Search"
      subtitle="Search by Patient Name, Phone Number, or Patient ID"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Type '0171...', 'Karim', or 'PAT-2026'..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-all font-medium"
          />
        </div>

        {/* Results List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Searching patient database...</div>
          ) : patients.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-slate-500">No matching patient records found.</p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/patients');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-medical-50 hover:bg-medical-100 text-medical-700 font-semibold text-xs rounded-xl border border-medical-200 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Register New Patient
              </button>
            </div>
          ) : (
            patients.map((p) => (
              <div
                key={p._id}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-medical-200 hover:bg-medical-50/30 transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm group-hover:text-medical-700 transition-colors">
                      {p.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      {p.patientId}
                    </span>
                    <span className="text-xs text-slate-400">
                      {p.age} yrs • {p.gender} • {p.bloodGroup || 'Blood: N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {p.phone}
                    </span>
                    {p.lastDiagnosis && (
                      <span className="text-slate-600 truncate max-w-xs">
                        Last Dx: <span className="font-medium">{p.lastDiagnosis}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewPatientDetails(p._id)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-medical-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    title="View History Timeline"
                  >
                    <History className="w-3.5 h-3.5" /> History
                  </button>
                  <button
                    onClick={() => handleSelectPatient(p)}
                    className="px-3 py-1.5 bg-medical-600 hover:bg-medical-700 text-white font-medium text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                  >
                    Write Rx <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
