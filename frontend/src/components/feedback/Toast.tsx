import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { classNames } from '@/utils/helpers';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-success-50 text-success-800 border-success-200',
  error: 'bg-danger-50 text-danger-800 border-danger-200',
  warning: 'bg-warning-50 text-warning-800 border-warning-200',
  info: 'bg-primary-50 text-primary-800 border-primary-200',
};

export const Toast: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={classNames(
              'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md',
              'animate-in slide-in-from-right-full duration-300',
              styles[toast.type]
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
