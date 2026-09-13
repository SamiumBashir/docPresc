import React from 'react';
import { AlertCircle, RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'banner' | 'card' | 'inline';
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  isNetworkError?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'card',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
  isNetworkError = false,
}) => {
  const IconComponent = isNetworkError ? WifiOff : AlertCircle;

  if (variant === 'inline') {
    return (
      <div
        role="alert"
        className={`flex items-center gap-2 text-sm text-rose-600 font-medium ${className}`}
      >
        <IconComponent className="w-4 h-4 shrink-0 text-rose-500" aria-hidden="true" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-semibold underline hover:text-rose-800 transition-colors shrink-0"
          >
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        role="alert"
        className={`w-full p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-sm ${className}`}
      >
        <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600 shrink-0">
          <IconComponent className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-semibold text-sm text-rose-900 mb-0.5">{title}</h4>}
          <p className="text-xs sm:text-sm text-rose-700 leading-relaxed break-words">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  // Card Variant (default)
  return (
    <div
      role="alert"
      className={`p-6 rounded-2xl bg-white border border-rose-100 shadow-sm text-center flex flex-col items-center space-y-4 max-w-md mx-auto my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
        <IconComponent className="w-6 h-6" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h4 className="text-base font-bold text-slate-800">
          {title || (isNetworkError ? 'Connection Issue' : 'Unable to complete request')}
        </h4>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-medical-500 focus:ring-offset-2"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </button>
      )}
    </div>
  );
};
