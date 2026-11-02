import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, { type = 'info', duration = 3500 } = {}) => {
      const id = ++idSeq;
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const success = useCallback((msg, opts) => show(msg, { type: 'success', ...opts }), [show]);
  const error = useCallback((msg, opts) => show(msg, { type: 'error', ...opts }), [show]);
  const info = useCallback((msg, opts) => show(msg, { type: 'info', ...opts }), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 sm:right-6" role="region" aria-label="Notifications">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

const TOAST_STYLES = {
  success: 'bg-success text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-peacock-deep text-white',
};

function ToastItem({ toast, onDismiss }) {
  return (
    <div
      className={`flex items-start gap-3 min-w-[260px] max-w-xs rounded-sm px-4 py-3 shadow-card-hover text-sm font-medium animate-in slide-in-from-right-4 ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}`}
      role="alert"
    >
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDismiss} className="text-white/70 hover:text-white leading-none mt-0.5 text-lg" aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
