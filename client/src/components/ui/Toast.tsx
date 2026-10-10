/**
 * Lightweight toast notification system.
 *
 * @module components/ui/Toast
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Fade,
  Portal,
  Typography,
} from '@mui/material';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  variant: ToastVariant;
  title?: string;
  message: string;
}

interface ToastContextValue {
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { ...toast, id }]);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ pushToast, removeToast }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal>
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            maxWidth: 420,
            width: 'calc(100% - 32px)',
          }}
        >
          {toasts.map((t) => (
            <Fade key={t.id} in timeout={300}>
              <Alert
                severity={t.variant}
                variant="filled"
                onClose={() => removeToast(t.id)}
                sx={{
                  boxShadow: 3,
                  borderRadius: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                {t.title && <AlertTitle>{t.title}</AlertTitle>}
                <Typography variant="body2">{t.message}</Typography>
              </Alert>
            </Fade>
          ))}
        </Box>
      </Portal>
    </ToastContext.Provider>
  );
}