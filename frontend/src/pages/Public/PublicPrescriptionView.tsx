import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';
import { api } from '../../api/client';
import { LivePrescriptionPad } from '../../components/prescription/LivePrescriptionPad';
import { IPrescription, IChamber } from '../../types';

export const PublicPrescriptionView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [prescription, setPrescription] = useState<IPrescription | null>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'A5'>('A4');
  const [isLoading, setIsLoading] = useState(true);

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchPublicRx = async () => {
      try {
        const res = await api<{ success: boolean; data: IPrescription }>(
          `/public/prescriptions/share/${token}`
        );
        if (res.success && res.data) {
          setPrescription(res.data);
          const docSettings = (res.data.doctorSnapshot as any)?.settings;
          if (docSettings?.paperSize) {
            setPaperSize(docSettings.paperSize);
          }
        }
      } catch {
        setPrescription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicRx();
  }, [token]);

  // Non-blocking Native Browser Print
  const handlePrint = () => {
    setIsPrinting(true);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-medical-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying and loading digital prescription...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            ✕
          </div>
          <h2 className="text-lg font-bold text-slate-800">Prescription Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The requested prescription link is invalid, expired, or may have been amended by the doctor.
          </p>
        </div>
      </div>
    );
  }

  const chamber = prescription.chamberId as IChamber | null;

  return (
    <div className="min-h-screen bg-slate-100 py-3 sm:py-6 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Verification Banner */}
        <div className="no-print bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-slate-900 font-mono">
                  {prescription.prescriptionId}
                </p>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Original Record
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Doctor: {prescription.doctorSnapshot?.name} • Issued{' '}
                {new Date(prescription.createdAt).toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              <button
                type="button"
                onClick={() => setPaperSize('A5')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  paperSize === 'A5' ? 'bg-white text-medical-800 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                A5
              </button>
            </div>

            <button
              disabled={isPrinting}
              onClick={handlePrint}
              aria-label="Print prescription"
              className="px-4 py-1.5 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Printer className={`w-3.5 h-3.5 ${isPrinting ? 'animate-pulse text-teal-300' : ''}`} />
              <span>{isPrinting ? 'Printing...' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Prescription Pad */}
        <div className="prescription-print-parent flex flex-col items-center overflow-x-auto print:!block print:!w-full print:p-0 print:m-0">
          <div className="sm:hidden no-print pb-2 text-center text-[11px] text-slate-500 font-medium">
            <span>↔ Swipe horizontally to view full prescription pad</span>
          </div>
          <div className="min-w-[620px] sm:min-w-0 w-full flex justify-center">
            <LivePrescriptionPad
              doctor={prescription.doctorSnapshot as any}
              chamber={chamber}
              patient={prescription.patientSnapshot as any}
              vitals={prescription.vitals}
              chiefComplaints={prescription.chiefComplaints}
              history={prescription.history}
              examination={prescription.examination}
              diagnosis={prescription.diagnosis}
              medicines={prescription.medicines}
              investigations={prescription.investigations}
              advice={prescription.advice}
              followUp={prescription.followUp}
              prescriptionId={prescription.prescriptionId}
              shareToken={prescription.shareToken}
              paperSize={paperSize}
              createdAt={prescription.createdAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
