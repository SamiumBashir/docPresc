import React from 'react';
import { Stethoscope, Activity, Sparkles, Heart } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
  variant?: 'fullscreen' | 'inline';
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Preparing clinical workspace...',
  subMessage = 'DocRx Bangladesh Medical Cloud',
  variant = 'inline',
}) => {
  if (variant === 'fullscreen') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={message}
        className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
      >
        {/* Calming ambient background glow orbs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-medical-500/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-700" />

        {/* Central Card with Heartbeat Rhythm */}
        <div className="relative z-10 flex flex-col items-center max-w-sm text-center space-y-6">
          {/* Animated Medical Badge with Ripple Rings */}
          <div className="relative flex items-center justify-center">
            {/* Outer gentle ripple ring */}
            <div className="absolute w-24 h-24 rounded-3xl bg-medical-500/20 animate-ping duration-1000 pointer-events-none" />
            <div className="absolute w-28 h-28 rounded-3xl bg-teal-400/10 animate-pulse duration-700 pointer-events-none" />

            {/* Core Icon Badge */}
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-medical-700 via-medical-600 to-teal-400 p-0.5 shadow-xl shadow-medical-500/30 flex items-center justify-center transform transition-transform duration-300">
              <div className="w-full h-full bg-slate-900/90 rounded-[22px] flex items-center justify-center backdrop-blur-md">
                <Stethoscope className="w-10 h-10 text-teal-300 animate-pulse" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Calming Animated ECG Pulse Waveform SVG */}
          <div className="w-64 h-12 relative flex items-center justify-center">
            <svg
              className="w-full h-full stroke-medical-400"
              viewBox="0 0 300 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Dim baseline guide */}
              <path
                d="M 0 30 L 70 30 L 85 15 L 100 48 L 115 10 L 130 35 L 140 30 L 300 30"
                stroke="currentColor"
                strokeWidth="2"
                strokeOpacity="0.15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Luminous Animated ECG wave */}
              <path
                className="ecg-pulse-line"
                d="M 0 30 L 70 30 L 85 15 L 100 48 L 115 10 L 130 35 L 140 30 L 300 30"
                stroke="url(#ecg-gradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="ecg-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#008ba3" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#2dd4bf" stopOpacity="1" />
                  <stop offset="100%" stopColor="#008ba3" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Comfortable Typography & Reassuring Messages */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center justify-center gap-2">
              <span>{message}</span>
              <span className="inline-flex">
                <span className="animate-bounce delay-100 font-bold text-teal-400">.</span>
                <span className="animate-bounce delay-200 font-bold text-teal-400">.</span>
                <span className="animate-bounce delay-300 font-bold text-teal-400">.</span>
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center justify-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" aria-hidden="true" />
              <span>{subMessage}</span>
            </p>
          </div>

          {/* Calming progress track */}
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
            <div className="loading-progress-sweep absolute inset-y-0 bg-gradient-to-r from-medical-500 via-teal-400 to-emerald-400 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Inline Variant (for route changes and container suspense)
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="flex flex-col items-center justify-center min-h-[380px] w-full py-16 px-4 text-center select-none animate-in fade-in duration-300"
    >
      {/* Soft Glow Card Container */}
      <div className="relative flex flex-col items-center max-w-sm space-y-5 p-8 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-soft">
        {/* Calming Pulse Badge */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-2xl bg-medical-500/15 animate-ping duration-1000" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-medical-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-medical-500/25">
            <Activity className="w-7 h-7 text-white animate-pulse" aria-hidden="true" />
          </div>
        </div>

        {/* Text and Smooth Status */}
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            <span>{message}</span>
            <span className="inline-flex text-medical-600 font-black">
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
              <span className="animate-bounce delay-300">.</span>
            </span>
          </p>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-medical-500" aria-hidden="true" />
            <span>{subMessage}</span>
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-44 h-1.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/60">
          <div className="loading-progress-sweep absolute inset-y-0 bg-gradient-to-r from-medical-500 via-teal-400 to-medical-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};
