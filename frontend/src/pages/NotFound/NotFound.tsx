import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, LayoutDashboard, Stethoscope } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
        {/* Brand header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-50 border border-medical-200 text-medical-700 text-xs font-semibold">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>DocRx Bangladesh</span>
        </div>

        {/* 404 Illustration / Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
            <FileQuestion className="w-10 h-10 text-medical-600" aria-hidden="true" />
          </div>
          <span className="absolute -bottom-2 px-3 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs shadow-md">
            404
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            The clinical route or resource you are trying to access doesn&apos;t exist, was relocated, or has an invalid URL.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            to="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
