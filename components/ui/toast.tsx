"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import clsx from "clsx";
import "./toast.css";

const CloseIcon = ({ className }: { className: string }) => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"
    />
  </svg>
);

const UndoIcon = () => (
  <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16" className="fill-current">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M13.5 8C13.5 4.96643 11.0257 2.5 7.96452 2.5C5.42843 2.5 3.29365 4.19393 2.63724 6.5H5.25H6V8H5.25H0.75C0.335787 8 0 7.66421 0 7.25V2.75V2H1.5V2.75V5.23347C2.57851 2.74164 5.06835 1 7.96452 1C11.8461 1 15 4.13001 15 8C15 11.87 11.8461 15 7.96452 15C5.62368 15 3.54872 13.8617 2.27046 12.1122L1.828 11.5066L3.03915 10.6217L3.48161 11.2273C4.48831 12.6051 6.12055 13.5 7.96452 13.5C11.0257 13.5 13.5 11.0336 13.5 8Z"
    />
  </svg>
);

export type ToastType = "message" | "success" | "warning" | "error";

type Toast = {
  id: number;
  text: string | ReactNode;
  measuredHeight?: number;
  timeout?: ReturnType<typeof setTimeout>;
  remaining?: number;
  start?: number;
  pause?: () => void;
  resume?: () => void;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndoAction?: () => void;
  type: ToastType;
  /** Auto-dismiss time in ms, drives the timer line (absent when preserved). */
  duration?: number;
};

const DEFAULT_DURATION = 3000;

let root: ReturnType<typeof createRoot> | null = null;
let toastId = 0;

const toastStore = {
  toasts: [] as Toast[],
  listeners: new Set<() => void>(),

  add(
    text: string | ReactNode,
    type: ToastType,
    preserve?: boolean,
    action?: string,
    onAction?: () => void,
    onUndoAction?: () => void,
    duration: number = DEFAULT_DURATION
  ) {
    const id = toastId++;

    const toast: Toast = {
      id,
      text,
      preserve,
      action,
      onAction,
      onUndoAction,
      type,
      duration: preserve ? undefined : duration,
    };

    if (!toast.preserve) {
      toast.remaining = duration;
      toast.start = Date.now();

      const close = () => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        this.notify();
      };

      toast.timeout = setTimeout(close, toast.remaining);

      toast.pause = () => {
        if (!toast.timeout) return;
        clearTimeout(toast.timeout);
        toast.timeout = undefined;
        toast.remaining! -= Date.now() - toast.start!;
      };

      toast.resume = () => {
        if (toast.timeout) return;
        toast.start = Date.now();
        toast.timeout = setTimeout(close, toast.remaining);
      };
    }

    this.toasts.push(toast);
    this.notify();
    return id;
  },

  remove(id: number) {
    const toast = toastStore.toasts.find((t) => t.id === id);
    if (toast?.timeout) clearTimeout(toast.timeout);
    toastStore.toasts = toastStore.toasts.filter((t) => t.id !== id);
    toastStore.notify();
  },

  subscribe(listener: () => void) {
    toastStore.listeners.add(listener);
    return () => {
      toastStore.listeners.delete(listener);
    };
  },

  notify() {
    toastStore.listeners.forEach((fn) => fn());
  },
};

const TOAST_WIDTH = "min(420px, calc(100vw - 2rem))";

const TOAST_META: Record<ToastType, { label: string; icon: string }> = {
  message: { label: "Notice", icon: "notifications" },
  success: { label: "Success", icon: "check" },
  warning: { label: "Heads up", icon: "priority_high" },
  error: { label: "Error", icon: "close" },
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>(() => [...toastStore.toasts]);
  const [shownIds, setShownIds] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const measureRef = (toast: Toast) => (node: HTMLDivElement | null) => {
    if (node && toast.measuredHeight == null) {
      toast.measuredHeight = node.getBoundingClientRect().height;
      toastStore.notify();
    }
  };

  useEffect(() => {
    return toastStore.subscribe(() => {
      setToasts([...toastStore.toasts]);
    });
  }, []);

  useEffect(() => {
    const unseen = toasts.filter((t) => !shownIds.includes(t.id)).map((t) => t.id);
    if (unseen.length > 0) {
      requestAnimationFrame(() => {
        setShownIds((prev) => [...prev, ...unseen]);
      });
    }
  }, [toasts, shownIds]);

  const lastVisibleCount = 3;
  const lastVisibleStart = Math.max(0, toasts.length - lastVisibleCount);

  const getFinalTransform = (index: number, length: number) => {
    if (index === length - 1) {
      return "none";
    }
    const offset = length - 1 - index;
    let translateY = toasts[length - 1]?.measuredHeight || 63;
    for (let i = length - 1; i > index; i--) {
      if (isHovered) {
        translateY += (toasts[i - 1]?.measuredHeight || 63) + 10;
      } else {
        translateY += 20;
      }
    }
    const z = -offset;
    const scale = isHovered ? 1 : 1 - 0.05 * offset;
    return `translate3d(0, calc(100% - ${translateY}px), ${z}px) scale(${scale})`;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    toastStore.toasts.forEach((t) => t.pause?.());
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    toastStore.toasts.forEach((t) => t.resume?.());
  };

  const visibleToasts = toasts.slice(lastVisibleStart);
  const containerHeight = visibleToasts.reduce((acc, toast) => {
    return acc + (toast.measuredHeight ?? 63);
  }, 0);

  return (
    <div
      // Phones: sit above the bottom navigation bar.
      className="fixed bottom-24 right-4 z-[9999] pointer-events-none md:bottom-6 md:right-6"
      style={{ height: containerHeight, width: TOAST_WIDTH }}
    >
      <div
        className="relative pointer-events-auto w-full"
        style={{ height: containerHeight }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {toasts.map((toast, index) => {
          const isVisible = index >= lastVisibleStart;

          return (
            <div
              key={toast.id}
              ref={measureRef(toast)}
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              data-type={toast.type}
              className={clsx(
                "dt-toast",
                isVisible ? "opacity-100" : "opacity-0",
                index < lastVisibleStart && "pointer-events-none"
              )}
              style={{
                width: TOAST_WIDTH,
                transition: "all .35s cubic-bezier(.25,.75,.6,.98)",
                transform: shownIds.includes(toast.id)
                  ? getFinalTransform(index, toasts.length)
                  : "translate3d(0, 100%, 150px) scale(1)",
              }}
            >
              <div className="dt-row">
                <span className="dt-icon" aria-hidden>
                  <span className="material-symbols-outlined">{TOAST_META[toast.type].icon}</span>
                </span>
                <div className="dt-body">
                  <span className="dt-label">{TOAST_META[toast.type].label}</span>
                  <span className="dt-text">{toast.text}</span>
                </div>
                {toast.onUndoAction && !toast.action ? (
                  <button
                    type="button"
                    className="dt-close"
                    aria-label="Undo"
                    onClick={() => {
                      toast.onUndoAction?.();
                      toastStore.remove(toast.id);
                    }}
                  >
                    <UndoIcon />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="dt-close"
                  aria-label="Dismiss"
                  onClick={() => toastStore.remove(toast.id)}
                >
                  <CloseIcon className="fill-current" />
                </button>
              </div>
              {toast.action ? (
                <div className="dt-actions">
                  <button
                    type="button"
                    className="dt-btn dt-btn--ghost"
                    onClick={() => toastStore.remove(toast.id)}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    className="dt-btn dt-btn--primary"
                    onClick={() => {
                      toast.onAction?.();
                      toastStore.remove(toast.id);
                    }}
                  >
                    {toast.action}
                  </button>
                </div>
              ) : null}
              {toast.duration ? (
                <span
                  className="dt-progress"
                  aria-hidden
                  style={{
                    animationDuration: `${toast.duration}ms`,
                    animationPlayState: isHovered ? "paused" : "running",
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const mountContainer = () => {
  if (root || typeof document === "undefined") return;
  const el = document.createElement("div");
  el.setAttribute("data-toast-root", "");
  document.body.appendChild(el);
  root = createRoot(el);
  root.render(<ToastContainer />);
};

interface Message {
  text: string | ReactNode;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndoAction?: () => void;
}

export interface PushToastOptions {
  /** Milliseconds before auto-dismiss (default 3000). Ignored when `preserve` is set. */
  duration?: number;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndoAction?: () => void;
}

/** Imperative entry point, used by the app-wide ToastContext. Returns the toast id. */
export function pushToast(text: string | ReactNode, type: ToastType, options: PushToastOptions = {}) {
  mountContainer();
  return toastStore.add(
    text,
    type,
    options.preserve,
    options.action,
    options.onAction,
    options.onUndoAction,
    options.duration
  );
}

export function removeToast(id: number) {
  toastStore.remove(id);
}

export const useToasts = () => {
  return {
    message: useCallback(({ text, preserve, action, onAction, onUndoAction }: Message) => {
      mountContainer();
      toastStore.add(text, "message", preserve, action, onAction, onUndoAction);
    }, []),
    success: useCallback((text: string) => {
      mountContainer();
      toastStore.add(text, "success");
    }, []),
    warning: useCallback((text: string) => {
      mountContainer();
      toastStore.add(text, "warning");
    }, []),
    error: useCallback((text: string) => {
      mountContainer();
      toastStore.add(text, "error");
    }, []),
  };
};
