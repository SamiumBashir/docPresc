import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

let toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let currentToasts: ToastMessage[] = [];

export const showToast = {
  success: (message: string, title?: string) => addToast('success', message, title),
  error: (message: string, title?: string) => addToast('error', message, title),
  info: (message: string, title?: string) => addToast('info', message, title),
};

const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { id, type, message, title };
  currentToasts = [...currentToasts, newToast];
  notify();

  setTimeout(() => {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
};

const removeToast = (id: string) => {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  notify();
};

const notify = () => {
  toastListeners.forEach((listener) => listener([...currentToasts]));
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
              : toast.type === 'error'
              ? 'bg-rose-50/95 border-rose-200 text-rose-900'
              : 'bg-medical-50/95 border-medical-200 text-medical-900'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-medical-600 shrink-0 mt-0.5" />}
          <div className="flex-1 text-sm">
            {toast.title && <p className="font-semibold">{toast.title}</p>}
            <p className="leading-snug">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
