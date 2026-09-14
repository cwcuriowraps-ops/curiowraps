"use client";

export interface GoogleAuthIndicatorProps {
  isLoading: boolean;
  onCancel?: () => void;
  message?: string;
  className?: string;
}

export function GoogleAuthIndicator({
  isLoading,
  onCancel,
  message = "Authenticating with Google...",
  className = "",
}: GoogleAuthIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative overflow-hidden w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-accent/10 border border-accent/30 dark:bg-accent/5 dark:border-accent/20 text-text-primary shadow-xs transition-all duration-300 animate-in fade-in slide-in-from-top-1 ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
          <div className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        </div>
        <span className="text-xs sm:text-sm font-medium tracking-tight text-text-primary truncate">
          {message}
        </span>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="flex-shrink-0 text-xs font-medium text-text-secondary hover:text-accent transition-colors px-2 py-1 rounded-md hover:bg-surface/80 dark:hover:bg-surface/40 cursor-pointer"
          aria-label="Cancel Google authentication"
        >
          Cancel
        </button>
      )}

      {/* Subtle bottom accent buffer bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent/20 overflow-hidden">
        <div className="h-full bg-accent/70 animate-pulse w-full" />
      </div>
    </div>
  );
}
