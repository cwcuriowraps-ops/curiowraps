"use client";

import { type ReactNode, useEffect } from "react";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
  full: "max-w-[95vw]",
};

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  size = "md",
  className = "",
  contentClassName = "",
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const widthClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6">
      <div
        className={`w-full ${widthClass} max-h-[92vh] flex flex-col rounded-2xl bg-surface shadow-2xl border border-border overflow-hidden ${className}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3.5 bg-surface shrink-0">
          {title && <h2 className="text-base sm:text-lg font-semibold text-text-primary truncate pr-2">{title}</h2>}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className={`p-4 sm:p-6 bg-surface overflow-y-auto overflow-x-hidden flex-1 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
