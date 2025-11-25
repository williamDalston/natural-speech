import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const Toast = ({ toast, onClose }) => {
  const Icon = icons[toast.type] || Info;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const colors = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  };

  // ARIA live region announcement for screen readers
  const announcement = toast.title 
    ? `${toast.title}. ${toast.message}` 
    : toast.message;

  return (
    <>
      {/* ARIA Live Region for Screen Reader Announcements */}
      <div
        role="status"
        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-md ${colors[toast.type]} relative overflow-hidden`}
        role="alert"
        aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.5 }}
      >
        <Icon size={20} className="flex-shrink-0 mt-0.5 relative z-10" />
      </motion.div>
      <div className="flex-1 relative z-10">
        {toast.title && (
          <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
        )}
        <p className="text-sm opacity-90 leading-relaxed">{toast.message}</p>
      </div>
      <motion.button
        onClick={onClose}
        className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity rounded-lg p-1 hover:bg-white/10 relative z-10"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Close notification"
      >
        <X size={16} aria-hidden="true" />
      </motion.button>
      </motion.div>
    </>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-md">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast, index) => (
          <motion.div 
            key={toast.id} 
            className="pointer-events-auto"
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Toast toast={toast} onClose={() => removeToast(toast.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;

