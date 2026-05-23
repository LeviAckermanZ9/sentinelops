import { useEffect } from 'react';

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const icon = toast.type === 'success' ? '✓' : '✕';

  return (
    <div className={`toast ${toast.type}`}>
      <span className="toast-icon">{icon}</span>
      {toast.message}
    </div>
  );
}
