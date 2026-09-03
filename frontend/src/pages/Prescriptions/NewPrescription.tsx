import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Save,
  Printer,
  Download,
  FileCheck2,
  Bookmark,
  Sparkles,
  User,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  FileText,
  AlertTriangle,
  RotateCcw,
  FileEdit,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { LivePrescriptionPad } from '../../components/prescription/LivePrescriptionPad';
import { MedicineAutocomplete } from '../../components/prescription/MedicineAutocomplete';
import { QuickDosePills } from '../../components/prescription/QuickDosePills';
import { MedicineTable } from '../../components/prescription/MedicineTable';
import { VitalsWidget } from '../../components/prescription/VitalsWidget';
import { ChiefComplaintsInput } from '../../components/prescription/ChiefComplaintsInput';
import { DiagnosisSelector } from '../../components/prescription/DiagnosisSelector';
import { InvestigationsSelector } from '../../components/prescription/InvestigationsSelector';
import { AdviceSelector } from '../../components/prescription/AdviceSelector';
import { FollowUpSelector } from '../../components/prescription/FollowUpSelector';
import { TemplateModal } from '../../components/prescription/TemplateModal';
import {
  IPatient,
  IMedicine,
  IPrescriptionMedicine,
  IPrescriptionChiefComplaint,
  IPrescriptionDiagnosis,
  IPrescriptionVitals,
  ITemplate,
  IPrescription,
} from '../../types';

export const NewPrescription: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { doctor, activeChamber } = useAuth();
  const { t } = useLanguage();

  // Patient Selection State
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    address: '',
    age: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: 'Unknown',
  });

  // Clinical Prescription State
  const [vitals, setVitals] = useState<IPrescriptionVitals>({});
  const [chiefComplaints, setChiefComplaints] = useState<IPrescriptionChiefComplaint[]>([]);
  const [history, setHistory] = useState('');
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState<IPrescriptionDiagnosis[]>([]);
  const [medicines, setMedicines] = useState<IPrescriptionMedicine[]>([]);
  const [investigations, setInvestigations] = useState<string[]>([]);
  const [advice, setAdvice] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState<{ duration: string; date?: string; notes?: string }>({
    duration: '7 days',
  });

  // Current Medicine Input State for Quick Add
  const [activeMedicine, setActiveMedicine] = useState<IMedicine | null>(null);
  const [medDose, setMedDose] = useState('1 tablet');
  const [medFrequency, setMedFrequency] = useState('1+0+1');
  const [medDuration, setMedDuration] = useState('5 days');
  const [medInstruction, setMedInstruction] = useState('After meal (খাবার পর)');

  // Mobile / Tablet Tab Switcher ('form' vs 'preview')
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  // UI / Action State
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [prescriptionId, setPrescriptionId] = useState('RX-NEW-DRAFT');
  const [shareToken, setShareToken] = useState('draft_token');
  const [existingPrescriptionId, setExistingPrescriptionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'DRAFT' | 'FINALIZED' | 'CANCELLED'>('DRAFT');

  // Modals & Recovery
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateModalMode, setTemplateModalMode] = useState<'apply' | 'save'>('apply');
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [hasAutosaveDraft, setHasAutosaveDraft] = useState(false);

  // Initialize from query params or autosave
  useEffect(() => {
    const patientIdParam = searchParams.get('patientId');
    const cloneIdParam = searchParams.get('cloneId');

    if (patientIdParam) {
      api<{ success: boolean; data: IPatient }>(`/patients/${patientIdParam}`)
        .then((res) => {
          if (res.success && res.data) {
            setSelectedPatient(res.data);
          }
        })
        .catch(() => {});
    }

    if (cloneIdParam) {
      api<{ success: boolean; data: IPrescription }>(`/prescriptions/${cloneIdParam}`)
        .then((res) => {
          if (res.success && res.data) {
            const rx = res.data;
            setVitals(rx.vitals || {});
            setChiefComplaints(rx.chiefComplaints || []);
            setHistory(rx.history || '');
            setExamination(rx.examination || '');
            setDiagnosis(rx.diagnosis || []);
            setMedicines(rx.medicines || []);
            setInvestigations(rx.investigations || []);
            setAdvice(rx.advice || []);
            if (rx.followUp) setFollowUp(rx.followUp);
            showToast.info('Cloned previous prescription contents ready for editing.');
          }
        })
        .catch(() => {});
    }

    // Check for saved local draft
    const savedDraft = localStorage.getItem('docrx_autosave_draft');
    if (savedDraft && !cloneIdParam && !patientIdParam) {
      setHasAutosaveDraft(true);
    }
  }, [searchParams]);

  // Search patients on typing
  useEffect(() => {
    if (!patientSearch.trim()) {
      setPatients([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api<{ success: boolean; data: { patients: IPatient[] } }>(
          `/patients?search=${encodeURIComponent(patientSearch.trim())}&limit=6`
        );
        if (res.success && res.data) {
          setPatients(res.data.patients);
          setShowPatientDropdown(true);
        }
      } catch {
        setPatients([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Autosave to localStorage (Debounced)
  useEffect(() => {
    if (medicines.length > 0 || chiefComplaints.length > 0 || diagnosis.length > 0) {
      const draftData = {
        selectedPatient,
        vitals,
        chiefComplaints,
        history,
        examination,
        diagnosis,
        medicines,
        investigations,
        advice,
        followUp,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('docrx_autosave_draft', JSON.stringify(draftData));
    }
  }, [selectedPatient, vitals, chiefComplaints, history, examination, diagnosis, medicines, investigations, advice, followUp]);

  // Keyboard shortcut: Ctrl + S to save draft, Ctrl + P to print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSavePrescription('DRAFT');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatient, medicines, diagnosis, chiefComplaints, vitals]);

  const handleRestoreAutosave = () => {
    const saved = localStorage.getItem('docrx_autosave_draft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.selectedPatient) setSelectedPatient(data.selectedPatient);
        if (data.vitals) setVitals(data.vitals);
        if (data.chiefComplaints) setChiefComplaints(data.chiefComplaints);
        if (data.history) setHistory(data.history);
        if (data.examination) setExamination(data.examination);
        if (data.diagnosis) setDiagnosis(data.diagnosis);
        if (data.medicines) setMedicines(data.medicines);
        if (data.investigations) setInvestigations(data.investigations);
        if (data.advice) setAdvice(data.advice);
        if (data.followUp) setFollowUp(data.followUp);
        showToast.success('Unfinished draft restored successfully!');
      } catch {}
    }
    setHasAutosaveDraft(false);
  };

  const handleDismissAutosave = () => {
    localStorage.removeItem('docrx_autosave_draft');
    setHasAutosaveDraft(false);
  };

  // Medicine Selection
  const handleSelectMedicine = (med: IMedicine) => {
    setActiveMedicine(med);
    // Set appropriate default dose
    if (med.dosageForm === 'Syrup' || med.dosageForm === 'Suspension') {
      setMedDose('10 ml (2 tsp)');
    } else if (med.dosageForm === 'Inhaler') {
      setMedDose('2 puffs');
    } else {
      setMedDose('1 tablet');
    }
  };

  const handleAddMedicineToPrescription = () => {
    if (!activeMedicine) return;

    const newMed: IPrescriptionMedicine = {
      medicineId: activeMedicine._id,
      brandName: activeMedicine.brandName,
      genericName: activeMedicine.genericName,
      dosageForm: activeMedicine.dosageForm,
      strength: activeMedicine.strength,
      dose: medDose,
      frequency: medFrequency,
      duration: medDuration,
      instruction: medInstruction,
      order: medicines.length,
    };

    setMedicines([...medicines, newMed]);
    setActiveMedicine(null);
    showToast.success(`Added ${newMed.brandName} to prescription.`);
  };

  const handleUpdateMedicine = (index: number, updated: Partial<IPrescriptionMedicine>) => {
    const next = [...medicines];
    next[index] = { ...next[index], ...updated };
    setMedicines(next);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMoveMedicine = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const next = [...medicines];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      setMedicines(next);
    } else if (direction === 'down' && index < medicines.length - 1) {
      const next = [...medicines];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      setMedicines(next);
    }
  };

  // Quick Add Patient
  const handleCreateQuickPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientForm.name || !newPatientForm.age) {
      showToast.error('Name and Age are required.');
      return;
    }

    try {
      const res = await api<{ success: boolean; data: IPatient }>('/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: newPatientForm.name.trim(),
          address: newPatientForm.address.trim() || undefined,
          age: Number(newPatientForm.age),
          gender: newPatientForm.gender,
          bloodGroup: newPatientForm.bloodGroup,
        }),
      });

      if (res.success && res.data) {
        setSelectedPatient(res.data);
        setShowNewPatientModal(false);
        setNewPatientForm({ name: '', address: '', age: '', gender: 'Male', bloodGroup: 'Unknown' });
        showToast.success(`Patient ${res.data.name} created!`);
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to create patient.');
    }
  };

  // Template Application
  const handleApplyTemplate = (template: ITemplate) => {
    if (template.chiefComplaints && template.chiefComplaints.length > 0) {
      setChiefComplaints(template.chiefComplaints);
    }
    if (template.diagnosis && template.diagnosis.length > 0) {
      setDiagnosis(template.diagnosis.map((d) => ({ name: d.name, icdCode: d.icdCode, type: 'provisional' })));
    }
    if (template.medicines && template.medicines.length > 0) {
      setMedicines(template.medicines);
    }
    if (template.investigations && template.investigations.length > 0) {
      setInvestigations(template.investigations);
    }
    if (template.advice && template.advice.length > 0) {
      setAdvice(template.advice);
    }
    if (template.followUpDuration) {
      setFollowUp({ duration: template.followUpDuration });
    }
    showToast.success(`Applied template: "${template.name}"`);
  };

  // Save Prescription (DRAFT or FINALIZED)
  const handleSavePrescription = async (saveStatus: 'DRAFT' | 'FINALIZED') => {
    if (!selectedPatient) {
      showToast.error('Please select or register a patient first.');
      return;
    }

    if (medicines.length === 0 && advice.length === 0 && investigations.length === 0) {
      showToast.error('Please add at least one medicine, investigation, or advice.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        chamberId: activeChamber?._id,
        vitals,
        chiefComplaints,
        history: history.trim() || undefined,
        examination: examination.trim() || undefined,
        diagnosis,
        medicines,
        investigations,
        advice,
        followUp,
        status: saveStatus,
      };

      let res;
      if (existingPrescriptionId) {
        res = await api<{ success: boolean; data: IPrescription }>(
          `/prescriptions/${existingPrescriptionId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await api<{ success: boolean; data: IPrescription }>('/prescriptions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res.success && res.data) {
        setExistingPrescriptionId(res.data._id);
        setPrescriptionId(res.data.prescriptionId);
        setShareToken(res.data.shareToken);
        setStatus(res.data.status);
        localStorage.removeItem('docrx_autosave_draft');

        if (saveStatus === 'FINALIZED') {
          setFinalizeConfirmOpen(false);
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
          showToast.success(`Prescription ${res.data.prescriptionId} finalized successfully!`);
        } else {
          showToast.success('Prescription draft saved.');
        }
      }
    } catch (err: any) {
      showToast.error(err.message || 'Failed to save prescription.');
    } finally {
      setIsSaving(false);
    }
  };

  // Native Browser Print (non-blocking async to eliminate INP latency)
  const handlePrint = () => {
    setIsPrinting(true);
    // Yield to the browser immediately so the click event returns in <1ms
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          window.print();
        } finally {
          setIsPrinting(false);
        }
      }, 40);
    });
  };

  // High-Fidelity Non-blocking PDF Generation
  const handleDownloadPdf = async () => {
    const element = document.getElementById('prescription-pad');
    if (!element || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    showToast.info('Preparing PDF document...');

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const isLetter = paperSize === 'Letter';
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: isLetter ? 'letter' : 'a4',
        });

        const pdfWidth = isLetter ? 215.9 : 210;
        const pdfHeight = isLetter ? 279.4 : 297;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${selectedPatient?.name || 'Patient'}_${prescriptionId}.pdf`);
        showToast.success('PDF downloaded successfully!');
      } catch (err: any) {
        showToast.error('PDF generation failed. Please try browser print (Ctrl+P).');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 40);
  };

  return (
    <div className="space-y-3 max-w-7xl mx-auto pb-12 -mt-2 sm:-mt-4">
      {/* Autosave Recovery Banner */}
      {hasAutosaveDraft && (
        <div className="no-print bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900">Unfinished prescription draft found</p>
              <p className="text-[11px] text-amber-700">
                You have unsaved changes from a previous session. Would you like to restore them?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismissAutosave}
              className="px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 rounded-lg transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleRestoreAutosave}
              className="px-3 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Draft
            </button>
          </div>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="no-print bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-700 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 leading-none">
                {t('rx_workspace_title')}
              </h2>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  status === 'FINALIZED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {prescriptionId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Paper Size Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setPaperSize('A4')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                paperSize === 'A4' ? 'bg-white text-medical-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              A4
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('Letter')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                paperSize === 'Letter' ? 'bg-white text-medical-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Letter
            </button>
          </div>

          {/* Templates Dropdown Button */}
          <button
            type="button"
            onClick={() => {
              setTemplateModalMode('apply');
              setTemplateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-medical-600" />
            <span className="hidden sm:inline">{t('rx_apply_template')}</span>
          </button>

          {/* Save as Template */}
          <button
            type="button"
            onClick={() => {
              setTemplateModalMode('save');
              setTemplateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            title="Save current prescription as reusable template"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">{t('rx_save_as_template')}</span>
          </button>

          {/* Print */}
          <button
            type="button"
            disabled={isPrinting}
            onClick={handlePrint}
            aria-label="Print prescription"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Printer className={`w-3.5 h-3.5 ${isPrinting ? 'animate-pulse text-teal-300' : ''}`} />
            <span>{isPrinting ? 'Printing...' : 'Print'}</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            aria-label="Download prescription as PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce text-teal-300' : ''}`} />
            <span className="hidden sm:inline">{isGeneratingPdf ? 'Generating...' : 'PDF'}</span>
          </button>

          {/* Save Draft */}
          {status !== 'FINALIZED' && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSavePrescription('DRAFT')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('rx_save_draft')}</span>
            </button>
          )}

          {/* Finalize Prescription Button */}
          {status !== 'FINALIZED' && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setFinalizeConfirmOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>{t('rx_finalize')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile/Tablet Workspace View Switcher Tab Bar (< xl) */}
      <div className="no-print xl:hidden bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'form'
              ? 'bg-white text-medical-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileEdit className="w-4 h-4 text-medical-600" />
          <span>Prescription Form</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'preview'
              ? 'bg-white text-medical-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Eye className="w-4 h-4 text-medical-600" />
          <span>Live Pad Preview</span>
          {medicines.length > 0 && (
            <span className="px-1.5 py-0.2 bg-medical-100 text-medical-800 rounded-full text-[10px] font-mono">
              {medicines.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Two-Column Prescription Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Input Form Controls (Hidden on Print)        */}
        {/* ========================================================= */}
        <div className={`no-print xl:col-span-6 space-y-4 ${mobileTab === 'form' ? 'block' : 'hidden xl:block'}`}>
          {/* 1. Patient Selector Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-medical-600" /> Patient Demographics
              </h4>
              <button
                type="button"
                onClick={() => setShowNewPatientModal(true)}
                className="text-xs text-medical-600 hover:text-medical-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Register New Patient
              </button>
            </div>

            {selectedPatient ? (
              <div className="p-3 bg-medical-50/70 border border-medical-200/80 rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{selectedPatient.name}</span>
                    <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-white border border-medical-200 text-medical-800">
                      {selectedPatient.patientId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {selectedPatient.age} yrs • {selectedPatient.gender} • {selectedPatient.phone}
                    {selectedPatient.bloodGroup && ` • Blood: ${selectedPatient.bloodGroup}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Change Patient
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient by name, phone (017...), or ID..."
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
                />

                {showPatientDropdown && patients.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {patients.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientDropdown(false);
                          setPatientSearch('');
                        }}
                        className="p-2.5 hover:bg-medical-50/50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{p.name}</p>
                          <p className="text-slate-500 text-[11px]">
                            {p.age} yrs • {p.gender} • {p.phone}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {p.patientId}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Clinical Vitals */}
          <VitalsWidget vitals={vitals} onChange={setVitals} />

          {/* 3. Chief Complaints */}
          <ChiefComplaintsInput complaints={chiefComplaints} onChange={setChiefComplaints} />

          {/* 4. History & Examination Accordion / Textareas */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Clinical History & Examination (O/E)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Past History / Drug History
                </label>
                <textarea
                  rows={2}
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                  placeholder="e.g. Known hypertensive for 5 years, Non-smoker..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  On Examination (O/E Findings)
                </label>
                <textarea
                  rows={2}
                  value={examination}
                  onChange={(e) => setExamination(e.target.value)}
                  placeholder="e.g. Anemia: Nil, Jaundice: Nil, Chest: Clear, Heart: S1+S2..."
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-medical-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Diagnosis */}
          <DiagnosisSelector diagnoses={diagnosis} onChange={setDiagnosis} />

          {/* 6. Smart Medicine Search & Dose Configurator */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Prescribe Medicine (Rx)
              </h4>
              <span className="text-[11px] text-slate-400">Search 100+ Bangladesh medicines</span>
            </div>

            {/* Autocomplete */}
            <MedicineAutocomplete onSelect={handleSelectMedicine} />

            {/* Quick Dose Configurator when medicine selected */}
            {activeMedicine && (
              <div className="p-3 bg-medical-50/50 border border-medical-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-medical-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-medical-700 text-white">
                      {activeMedicine.dosageForm}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{activeMedicine.brandName}</span>
                    <span className="font-semibold text-medical-800 text-xs">
                      {activeMedicine.strength}
                    </span>
                    <span className="text-xs text-slate-500 italic">- {activeMedicine.genericName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveMedicine(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                {/* Quick Dose Pills */}
                <QuickDosePills
                  frequency={medFrequency}
                  onFrequencyChange={setMedFrequency}
                  dose={medDose}
                  onDoseChange={setMedDose}
                  duration={medDuration}
                  onDurationChange={setMedDuration}
                  instruction={medInstruction}
                  onInstructionChange={setMedInstruction}
                  dosageForm={activeMedicine.dosageForm}
                />

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddMedicineToPrescription}
                    className="px-4 py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add Medicine to Table
                  </button>
                </div>
              </div>
            )}

            {/* Prescribed Medicine Table */}
            <MedicineTable
              medicines={medicines}
              onUpdateMedicine={handleUpdateMedicine}
              onRemoveMedicine={handleRemoveMedicine}
              onMoveMedicine={handleMoveMedicine}
            />
          </div>

          {/* 7. Investigations */}
          <InvestigationsSelector investigations={investigations} onChange={setInvestigations} />

          {/* 8. Advice */}
          <AdviceSelector advice={advice} onChange={setAdvice} />

          {/* 9. Follow-Up */}
          <FollowUpSelector followUp={followUp} onChange={setFollowUp} />
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Real-Time Interactive Live Preview Pad     */}
        {/* ========================================================= */}
        <div className={`prescription-print-parent xl:col-span-6 sticky top-24 print:!block print:!static print:!w-full print:!p-0 print:!m-0 ${mobileTab === 'preview' ? 'block' : 'hidden xl:block'}`}>
          <div className="no-print flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Live Prescription Pad Preview ({paperSize})
            </span>
            <span className="text-[11px] text-slate-400">Updates instantly on every change</span>
          </div>

          <div className="rx-pad-scroll-wrapper overflow-x-auto p-2 bg-slate-200/50 rounded-2xl border border-slate-200 shadow-inner max-h-[85vh] overflow-y-auto print:bg-transparent print:border-none print:shadow-none print:p-0 print:m-0 print:max-h-none print:overflow-visible">
            <LivePrescriptionPad
              doctor={doctor}
              chamber={activeChamber}
              patient={selectedPatient}
              vitals={vitals}
              chiefComplaints={chiefComplaints}
              history={history}
              examination={examination}
              diagnosis={diagnosis}
              medicines={medicines}
              investigations={investigations}
              advice={advice}
              followUp={followUp}
              prescriptionId={prescriptionId}
              shareToken={shareToken}
              paperSize={paperSize}
            />
          </div>
        </div>
      </div>

      {/* Quick New Patient Modal */}
      <Modal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        title="Register New Patient"
        subtitle="Quickly register patient to write prescription"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateQuickPatient} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Patient Name *</label>
            <input
              type="text"
              required
              value={newPatientForm.name}
              onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
              placeholder="Full name (e.g. Abdul Karim)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
              <input
                type="text"
                value={newPatientForm.address}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, address: e.target.value })}
                placeholder="e.g. Mirpur, Dhaka"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Age (Years) *</label>
              <input
                type="number"
                required
                min="0"
                max="130"
                value={newPatientForm.age}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                placeholder="35"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-medical-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender *</label>
              <select
                value={newPatientForm.gender}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Blood Group</label>
              <select
                value={newPatientForm.bloodGroup}
                onChange={(e) => setNewPatientForm({ ...newPatientForm, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
              >
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewPatientModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-medical-600 hover:bg-medical-700 text-white rounded-xl shadow-xs"
            >
              Save & Select Patient
            </button>
          </div>
        </form>
      </Modal>

      {/* Template Modal */}
      <TemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        mode={templateModalMode}
        currentPrescriptionData={{
          chiefComplaints,
          diagnosis,
          medicines,
          investigations,
          advice,
          followUpDuration: followUp.duration,
        }}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Finalize Confirmation Modal */}
      <Modal
        isOpen={finalizeConfirmOpen}
        onClose={() => setFinalizeConfirmOpen(false)}
        title="Finalize Prescription"
        subtitle="Confirm final medical documentation"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
            <p className="font-bold">Medical Safety & Immutability Notice:</p>
            <p className="leading-relaxed">
              Once finalized, this prescription will be locked as a permanent medical record. Any subsequent
              corrections should create an amendment or new prescription.
            </p>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>
              • Patient: <span className="font-bold text-slate-800">{selectedPatient?.name}</span>
            </p>
            <p>
              • Medicines: <span className="font-bold text-slate-800">{medicines.length} prescribed</span>
            </p>
            <p>
              • Chamber:{' '}
              <span className="font-bold text-slate-800">{activeChamber?.name || 'Main Chamber'}</span>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFinalizeConfirmOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSavePrescription('FINALIZED')}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Confirm & Finalize
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
