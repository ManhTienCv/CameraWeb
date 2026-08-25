import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 3500) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast('success', message, title || 'Thành công', duration),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast('error', message, title || 'Có lỗi xảy ra', duration),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast('warning', message, title || 'Cảnh báo', duration),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) =>
      showToast('info', message, title || 'Thông báo', duration),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, warning, info, removeToast }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const getTheme = () => {
            switch (t.type) {
              case 'success':
                return {
                  border: 'border-emerald-200 bg-white/95 text-emerald-900 shadow-emerald-500/10',
                  icon: <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />,
                  bgIcon: 'bg-emerald-50 text-emerald-600 border border-emerald-200/70',
                  defaultTitle: 'Thành công',
                };
              case 'error':
                return {
                  border: 'border-rose-200 bg-white/95 text-rose-900 shadow-rose-500/10',
                  icon: <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />,
                  bgIcon: 'bg-rose-50 text-rose-600 border border-rose-200/70',
                  defaultTitle: 'Lỗi',
                };
              case 'warning':
                return {
                  border: 'border-amber-200 bg-white/95 text-amber-900 shadow-amber-500/10',
                  icon: <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />,
                  bgIcon: 'bg-amber-50 text-amber-600 border border-amber-200/70',
                  defaultTitle: 'Lưu ý',
                };
              case 'info':
              default:
                return {
                  border: 'border-blue-200 bg-white/95 text-blue-900 shadow-blue-500/10',
                  icon: <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />,
                  bgIcon: 'bg-blue-50 text-blue-600 border border-blue-200/70',
                  defaultTitle: 'Thông báo',
                };
            }
          };

          const theme = getTheme();

          return (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-2xl border ${theme.border} p-4 shadow-xl backdrop-blur-md transition-all animate-fade-in flex items-start gap-3`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${theme.bgIcon}`}>
                {theme.icon}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <p className="font-bold text-xs text-ink-900">
                  {t.title || theme.defaultTitle}
                </p>
                <p className="text-xs text-ink-600 mt-0.5 leading-relaxed break-words">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-ink-400 hover:text-ink-700 p-1 rounded-lg hover:bg-cream-100 transition-colors shrink-0 cursor-pointer"
                title="Đóng"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
