import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    const newToast = {
      id,
      type: toast.type || 'info',
      message: toast.message,
      title: toast.title,
      duration: toast.duration !== undefined ? toast.duration : 5000,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, title = 'Success', duration = 5000) => {
      return addToast({ type: 'success', message, title, duration });
    },
    [addToast]
  );

  const error = useCallback(
    (message, title = 'Error', duration = 7000) => {
      return addToast({ type: 'error', message, title, duration });
    },
    [addToast]
  );

  const info = useCallback(
    (message, title = 'Info', duration = 5000) => {
      return addToast({ type: 'info', message, title, duration });
    },
    [addToast]
  );

  const warning = useCallback(
    (message, title = 'Warning', duration = 6000) => {
      return addToast({ type: 'warning', message, title, duration });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
};

