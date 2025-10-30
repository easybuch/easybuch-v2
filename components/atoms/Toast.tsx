'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const icons = {
    success: (
      <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
        <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
      </div>
    ),
    error: (
      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
        <XCircle size={32} className="text-white" strokeWidth={2.5} />
      </div>
    ),
    info: (
      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
        <AlertCircle size={32} className="text-white" strokeWidth={2.5} />
      </div>
    ),
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex flex-col items-center gap-5 px-6 py-8 md:px-10 md:py-10',
        'rounded-2xl bg-white shadow-2xl relative',
        'transition-all duration-300 transform w-[90vw] max-w-md mx-4',
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      )}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Icon */}
      <div className="flex-shrink-0">{icons[toast.type]}</div>

      {/* Message */}
      <p className="text-center text-base md:text-lg font-semibold text-gray-900 leading-relaxed">
        {toast.message}
      </p>
    </div>
  );
}
