import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = {
            success: {
              icon: <CheckCircle2 className="w-5 h-5 text-[#3FA17C] shrink-0" />,
              border: 'border-[#3FA17C]/30',
              bg: 'bg-[#0E1814]/95',
              glow: 'shadow-[0_4px_20px_rgba(63,161,124,0.15)]'
            },
            info: {
              icon: <Info className="w-5 h-5 text-[#4FA3A5] shrink-0" />,
              border: 'border-[#4FA3A5]/30',
              bg: 'bg-[#0E1814]/95',
              glow: 'shadow-[0_4px_20px_rgba(79,163,165,0.15)]'
            },
            warning: {
              icon: <AlertTriangle className="w-5 h-5 text-[#E0A94F] shrink-0" />,
              border: 'border-[#E0A94F]/30',
              bg: 'bg-[#0E1814]/95',
              glow: 'shadow-[0_4px_20px_rgba(224,169,79,0.15)]'
            },
            error: {
              icon: <AlertCircle className="w-5 h-5 text-[#D9776B] shrink-0" />,
              border: 'border-[#D9776B]/30',
              bg: 'bg-[#0E1814]/95',
              glow: 'shadow-[0_4px_20px_rgba(217,119,107,0.15)]'
            }
          }[toast.type];

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${config.border} ${config.bg} ${config.glow} backdrop-blur-xl`}
            >
              {config.icon}
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
