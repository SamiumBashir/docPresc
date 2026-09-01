import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Printer, Download, CheckCircle2, ShieldCheck, Stethoscope } from 'lucide-react';
import { api } from '../../api/client';
import { LivePrescriptionPad } from '../../components/prescription/LivePrescriptionPad';
import { IPrescription, IChamber } from '../../types';

export const PublicPrescriptionView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [prescription, setPrescription] = useState<IPrescription | null>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicRx = async () => {
      try {
        const res = await api<{ success: boolean; data: IPrescription }>(
          `/public/prescriptions/share/${token}`
        );
        if (res.success && res.data) {
          setPrescription(res.data);
        }
      } catch {
        setPrescription(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicRx();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('prescription-pad');
    if (!element || !prescription) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
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
      pdf.save(`${prescription.patientSnapshot.name}_${prescription.prescriptionId}.pdf`);
    } catch {
      window.print();
    }
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
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Verification Banner */}
        <div className="no-print bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
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
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
          </div>
        </div>

        {/* Prescription Pad */}
        <div className="flex justify-center">
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
  );
};
