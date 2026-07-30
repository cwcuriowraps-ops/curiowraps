"use client";

import { type ReactNode, useEffect } from "react";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, title, children }: ModalProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0">
      <div className="w-full max-w-lg rounded-xl bg-surface shadow-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface">
          {title && <h2 className="text-lg font-semibold text-text-primary">{title}</h2>}
          <button
            onClick={() => onOpenChange(false)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="p-6 bg-surface max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
