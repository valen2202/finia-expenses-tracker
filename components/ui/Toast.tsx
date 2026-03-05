'use client';

import { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onClose]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-slide-up min-w-[260px] max-w-sm ${
        isSuccess ? 'bg-emerald-600' : 'bg-red-600'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <p className="flex-1">{toast.message}</p>
      <button onClick={() => onClose(toast.id)} className="hover:opacity-75 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  );
}
