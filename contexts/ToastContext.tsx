"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";

export type ToastVariant = "error" | "success" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ShowToastOptions {
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Defaults by variant (errors linger longer). */
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => void;
  /** Convenience wrapper for the common case: showToast(message, { variant: "error" }). */
  showErrorToast: (message: string, options?: Omit<ShowToastOptions, "variant">) => void;
  dismissToast: (id: number) => void;
}

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  error: 6000,
  success: 3500,
  info: 4000,
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  error: "border-error/30 bg-error-container text-on-error-container",
  success: "border-primary/30 bg-primary-container text-on-primary-container",
  info: "border-outline-variant/30 bg-surface-container-high text-on-surface",
};

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

/**
 * App-wide toast system, mounted once in ClientProviders so every page can
 * call useToast() instead of rendering its own inline error banner. Replaces
 * the ad-hoc per-page "error" state + `<div className="bg-error-container">`
 * pattern that used to push page content down and stick around until the
 * user manually fixed things.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, options?: ShowToastOptions) => {
      const variant = options?.variant ?? "error";
      const duration = options?.duration ?? DEFAULT_DURATION[variant];
      const id = ++idCounter;

      setToasts((prev) => [...prev, { id, message, variant }]);

      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  const showErrorToast = useCallback(
    (message: string, options?: Omit<ShowToastOptions, "variant">) => {
      showToast(message, { ...options, variant: "error" });
    },
    [showToast]
  );

  const value = useMemo(
    () => ({ showToast, showErrorToast, dismissToast }),
    [showToast, showErrorToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-4 bottom-24 z-[100] flex flex-col items-end gap-2 md:inset-x-auto md:bottom-6 md:left-auto md:right-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              role="status"
              aria-live="assertive"
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto flex w-[min(92vw,24rem)] items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl ${VARIANT_CLASSES[toast.variant]}`}
            >
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
                className="shrink-0 rounded-full p-0.5 opacity-70 transition hover:opacity-100"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
