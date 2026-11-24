import React from 'react';
import { Stethoscope, Activity } from 'lucide-react';
import { InfinityLoop } from '@/components/loading-ui/infinity';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
  variant?: 'fullscreen' | 'inline';
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Preparing clinical workspace',
  subMessage = 'DocRx Medical Cloud',
  variant = 'inline',
}) => {
  if (variant === 'fullscreen') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={message}
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 select-none"
      >
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center space-y-6">
          {/* Calm Medical Icon */}
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-teal-400 shadow-sm">
            <Stethoscope className="w-8 h-8" aria-hidden="true" />
          </div>

          {/* Infinity Loop Loading Indicator (@loading-ui/infinity) */}
          <div className="flex items-center justify-center text-teal-400 py-1">
            <InfinityLoop className="w-24 h-12" duration="1.8s" strokeWidth={5} />
          </div>

          {/* Typography */}
          <div className="space-y-1.5">
            <h2 className="text-base font-medium text-white tracking-normal">
              {message}
            </h2>
            <p className="text-xs text-slate-400 font-normal flex items-center justify-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>{subMessage}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Inline Variant
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="flex flex-col items-center justify-center min-h-[320px] w-full py-12 px-4 text-center select-none"
    >
      <div className="flex flex-col items-center max-w-sm space-y-4 p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80">
        <div className="flex items-center justify-center text-medical-600 py-1">
          <InfinityLoop className="w-16 h-8" duration="1.8s" strokeWidth={5.5} />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-800">
            {message}
          </p>
          <p className="text-xs text-slate-500 font-normal">
            {subMessage}
          </p>
        </div>
      </div>
    </div>
  );
};
