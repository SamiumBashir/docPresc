import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Printer,
  Download,
  Copy,
  ArrowLeft,
  Share2,
  FileCheck2,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../components/ui/Toast';
import { LivePrescriptionPad } from '../../components/prescription/LivePrescriptionPad';
import { IPrescription, IDoctor, IChamber } from '../../types';

export const PrescriptionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<IPrescription | null>(null);
  const [doctor, setDoctor] = useState<IDoctor | null>(null);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const [rxRes, meRes] = await Promise.all([
          api<{ success: boolean; data: IPrescription }>(`/prescriptions/${id}`),
          api<{ success: boolean; data: { doctor: IDoctor | null } }>('/auth/me'),
        ]);

        if (rxRes.success && rxRes.data) {
          setPrescription(rxRes.data);
        }
        if (meRes.success && meRes.data?.doctor) {
          setDoctor(meRes.data.doctor);
        }
      } catch (err: any) {
        showToast.error('Failed to load prescription.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescription();
  }, [id]);

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

  // High-Fidelity Non-blocking PDF Generation
  const handleDownloadPdf = async () => {
    const element = document.getElementById('prescription-pad');
    if (!element || !prescription || isGeneratingPdf) return;

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
        pdf.save(`${prescription.patientSnapshot.name}_${prescription.prescriptionId}.pdf`);
        showToast.success('PDF downloaded successfully!');
      } catch {
        showToast.error('PDF generation failed. Please use browser print.');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 40);
  };

  const handleCopyShare = () => {
    if (!prescription) return;
    const url = `${window.location.origin}/prescription/share/${prescription.shareToken}`;
    navigator.clipboard.writeText(url);
    showToast.success('Secure public prescription link copied!');
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Loading prescription pad...</div>;
  }

  if (!prescription) {
    return <div className="p-12 text-center text-slate-500">Prescription not found.</div>;
  }

  const chamber = (
    prescription.chamberId && typeof prescription.chamberId === 'object'
      ? prescription.chamberId
      : {
          name: prescription.doctorSnapshot?.chamberName,
          address: prescription.doctorSnapshot?.chamberAddress,
          phone: prescription.doctorSnapshot?.phone,
        }
  ) as IChamber | null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Controls (Hidden on Print) */}
      <div className="no-print bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/prescriptions')}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {prescription.prescriptionId}
              </h2>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                  prescription.status === 'FINALIZED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {prescription.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Patient: {prescription.patientSnapshot.name} • Issued{' '}
              {new Date(prescription.createdAt).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
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

          <button
            onClick={handleCopyShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Share</span>
          </button>

          <Link
            to={`/prescriptions/new?cloneId=${prescription._id}&patientId=${prescription.patientId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-medical-50 hover:bg-medical-100 text-medical-800 rounded-lg text-xs font-semibold border border-medical-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clone as New Rx</span><span className="sm:hidden">Clone</span>
          </Link>

          <button
            disabled={isGeneratingPdf}
            onClick={handleDownloadPdf}
            aria-label="Download prescription as PDF"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce text-teal-300' : ''}`} />
            <span>{isGeneratingPdf ? 'Generating...' : 'PDF'}</span>
          </button>

          <button
            disabled={isPrinting}
            onClick={handlePrint}
            aria-label="Print prescription"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Printer className={`w-3.5 h-3.5 ${isPrinting ? 'animate-pulse text-teal-300' : ''}`} />
            <span>{isPrinting ? 'Printing...' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* Render Prescription Pad */}
      <div className="prescription-print-parent bg-slate-100/60 p-2 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 flex flex-col items-center overflow-x-auto print:bg-transparent print:border-none print:p-0 print:m-0 print:!block print:!w-full">
        <div className="sm:hidden no-print pb-2 text-center text-[11px] text-slate-500 font-medium">
          <span>↔ Swipe horizontally to view full prescription pad</span>
        </div>
        <div className="min-w-[620px] sm:min-w-0 w-full flex justify-center">
          <LivePrescriptionPad
            doctor={doctor}
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
