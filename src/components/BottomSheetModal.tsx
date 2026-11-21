import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  hideHeader?: boolean;
}

export const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  isOpen,
  onClose,
  title,
  maxWidthClass = 'sm:max-w-md',
  children,
  hideHeader = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
          />

          {/* Sheet / Dialog Panel */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full ${maxWidthClass} bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col overflow-hidden pb-safe sm:pb-0`}
          >
            {/* Mobile Drag Handle Affordance */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <div className="w-10 h-1.5 bg-slate-700 rounded-full" />
            </div>

            {!hideHeader && (
              <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
                <h3 className="text-lg font-bold text-slate-100 truncate">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="বন্ধ করুন"
                  className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="overflow-y-auto overscroll-contain flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
