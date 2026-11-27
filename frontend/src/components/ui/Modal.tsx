import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  dark?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  dark = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Freeze body scrolling so modal stays fixed in center without page shift
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Semi-transparent backdrop */}
      <div
        className={`fixed inset-0 transition-opacity duration-150 ${
          dark ? 'bg-black/75' : 'bg-slate-900/60'
        } backdrop-blur-xs`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative rounded-xl border w-full ${maxWidth} max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden z-10 ${
          dark
            ? 'bg-[#131924] border-white/[0.1] text-[#eef0f5]'
            : 'bg-white border-slate-200 text-slate-900 shadow-lg'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0 ${
            dark ? 'border-white/[0.08] bg-[#18202e]' : 'border-slate-100 bg-slate-50/80'
          }`}
        >
          <div>
            <h3
              className={`text-base font-medium leading-snug ${
                dark ? 'text-[#eef0f5]' : 'text-slate-900'
              }`}
            >
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs mt-0.5 ${dark ? 'text-[#a3a9b8]' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
              dark
                ? 'text-[#757d90] hover:text-[#eef0f5] hover:bg-white/[0.06]'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body
  );
};
