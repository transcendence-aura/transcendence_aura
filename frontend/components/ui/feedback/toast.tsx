'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    ({ message, variant = 'info', duration = 4000 }: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, message, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}

      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex max-w-md flex-col gap-2 p-4"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onClose={() => removeToast(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: ReactNode }> = {
  success: {
    bg: 'bg-card',
    border: 'border-status-online',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-status-online" />,
  },
  error: {
    bg: 'bg-card',
    border: 'border-status-error',
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-status-error" />,
  },
  info: {
    bg: 'bg-card',
    border: 'border-brand-dark',
    icon: <Info className="h-4 w-4 shrink-0 text-brand-dark" />,
  },
};

interface ToastCardProps {
  item: ToastItem;
  onClose: () => void;
}

const ToastCard = ({ item, onClose }: ToastCardProps) => {
  const style = VARIANT_STYLES[item.variant];

  return (
    <div
      role="status"
      className={`shadow-card flex items-center justify-between gap-3 border-l-4 border-y border-r border-border-default p-4 text-xs font-medium text-text-primary transition-all ${style.bg} ${style.border}`}
    >
      <div className="flex items-center gap-3">
        {style.icon}
        <p className="text-body-base leading-snug">{item.message}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-text-muted hover:text-text-primary cursor-pointer transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
