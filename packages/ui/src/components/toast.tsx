"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { cn } from "../lib/utils";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
  loading: "⏳",
};

const colors: Record<ToastType, string> = {
  success: "border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-l-4 border-l-emerald-500 shadow-md",
  error: "border-rose-500/40 bg-rose-50/90 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-l-4 border-l-rose-500 shadow-md",
  warning: "border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/90 text-amber-800 dark:text-amber-200 border-l-4 border-l-amber-500 shadow-md",
  info: "border-accent/40 bg-accent/10 dark:bg-accent/20 text-accent border-l-4 border-l-accent shadow-md",
  loading: "border-sky-500/40 bg-sky-50/90 dark:bg-sky-950/90 text-sky-800 dark:text-sky-200 border-l-4 border-l-sky-500 shadow-md",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toastInput: Omit<Toast, "id">): string => {
    const type = toastInput.type || "info";
    const title = toastInput.title || "";
    const description = toastInput.description || "";
    const duration = toastInput.duration || (type === "loading" ? 30000 : 4000);
    const id = crypto.randomUUID();

    setToasts((prev) => {
      // Duplicate prevention: check if identical toast is already active
      const isDuplicate = prev.some(
        (t) => t.type === type && t.title === title && t.description === description
      );
      if (isDuplicate) return prev;

      if (type !== "loading") {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return [...prev, { ...toastInput, type, title, description, duration, id }];
    });

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div 
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 backdrop-blur-md transition-all duration-200 animate-fade-in-slide-down",
              colors[toast.type]
            )}
            style={{
              animation: "fade-in-slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
            role="alert"
          >
            <span className="mt-0.5 text-base font-bold select-none">{icons[toast.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug break-words">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-xs font-light opacity-90 leading-relaxed break-words">{toast.description}</p>
              )}
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    removeToast(toast.id);
                  }}
                  className="mt-2 text-xs font-semibold underline hover:opacity-80 block cursor-pointer"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-xs font-bold opacity-60 hover:opacity-100 transition-opacity p-1 -mr-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
