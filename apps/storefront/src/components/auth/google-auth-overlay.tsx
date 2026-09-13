"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface GoogleAuthOverlayProps {
  open: boolean;
  onClose?: () => void;
  message?: string;
}

export function GoogleAuthOverlay({
  open,
  onClose,
  message = "Authenticating with Google...",
}: GoogleAuthOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and prevent background interaction while overlay is open
  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const body = document.body;

    const scrollY = window.scrollY;
    const originalPosition = body.style.position;
    const originalTop = body.style.top;
    const originalWidth = body.style.width;
    const originalOverflow = body.style.overflow;
    const originalPaddingRight = body.style.paddingRight;
    const originalTouchAction = body.style.touchAction;

    // Compensate for scrollbar disappearance to prevent layout shift
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      body.style.position = originalPosition;
      body.style.top = originalTop;
      body.style.width = originalWidth;
      body.style.overflow = originalOverflow;
      body.style.paddingRight = originalPaddingRight;
      body.style.touchAction = originalTouchAction;

      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);

      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 touch-none select-none"
      aria-modal="true"
      role="dialog"
      aria-label="Google Authentication"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className="flex flex-col items-center justify-center bg-surface/95 border border-border p-8 sm:p-10 rounded-[24px] shadow-[0_16px_40px_rgba(0,0,0,0.14)] max-w-sm w-full text-center backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent mb-3.5" />
        <p className="text-sm font-medium text-text-primary">
          {message}
        </p>
        <p className="text-xs text-text-secondary mt-1.5">
          Please wait while we connect your account
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-5 text-xs text-text-secondary hover:text-accent transition-colors underline underline-offset-4"
          >
            Cancel
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
