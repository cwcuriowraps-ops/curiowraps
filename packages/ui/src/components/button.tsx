import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "../lib/utils";

const variants = {
  primary:
    "bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/15 border border-accent/20 active:scale-[0.98] transition-all duration-150 ease-out",
  default:
    "bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/15 border border-accent/20 active:scale-[0.98] transition-all duration-150 ease-out",
  secondary:
    "bg-surface text-text-primary border border-border/80 hover:bg-muted hover:border-border hover:shadow-xs active:scale-[0.98] transition-all duration-150 ease-out",
  outline:
    "border border-border/80 bg-transparent text-text-primary hover:bg-muted/70 hover:border-text-secondary/60 active:scale-[0.98] transition-all duration-150 ease-out",
  ghost:
    "bg-transparent text-text-secondary hover:bg-muted hover:text-text-primary active:scale-[0.98] transition-all duration-150 ease-out",
  danger:
    "bg-error/95 text-white hover:bg-error shadow-sm shadow-error/15 border border-error/20 active:scale-[0.98] transition-all duration-150 ease-out",
  destructive:
    "bg-error/95 text-white hover:bg-error shadow-sm shadow-error/15 border border-error/20 active:scale-[0.98] transition-all duration-150 ease-out",
  warning:
    "bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/15 border border-amber-500/20 active:scale-[0.98] transition-all duration-150 ease-out",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/15 border border-emerald-600/20 active:scale-[0.98] transition-all duration-150 ease-out",
  link:
    "bg-transparent text-accent underline-offset-4 hover:underline p-0 h-auto font-medium transition-colors",
} as const;

const sizes = {
  xs: "h-7 px-2.5 text-[11px] font-medium rounded-md gap-1.5 shrink-0 inline-flex items-center justify-center whitespace-nowrap",
  sm: "h-8 px-3 text-xs font-medium rounded-lg gap-2 shrink-0 inline-flex items-center justify-center whitespace-nowrap",
  md: "h-10 px-4 text-sm font-medium rounded-lg gap-2 shrink-0 inline-flex items-center justify-center whitespace-nowrap",
  lg: "h-12 px-8 text-base font-semibold rounded-xl gap-2.5 shrink-0 inline-flex items-center justify-center whitespace-nowrap",
  xl: "h-14 px-9 text-base font-semibold rounded-xl gap-3 shrink-0 inline-flex items-center justify-center whitespace-nowrap",
  "icon-xs": "h-7 w-7 p-0 rounded-md shrink-0 flex items-center justify-center",
  "icon-sm": "h-8 w-8 p-0 rounded-lg shrink-0 flex items-center justify-center",
  "icon": "h-10 w-10 p-0 rounded-lg shrink-0 flex items-center justify-center",
  "icon-lg": "h-12 w-12 p-0 rounded-xl shrink-0 flex items-center justify-center",
  "icon-xl": "h-14 w-14 p-0 rounded-xl shrink-0 flex items-center justify-center",
} as const;

const widths = {
  auto: "w-auto",
  full: "w-full",
  auth: "w-full sm:w-[240px] min-w-[200px]",
  action: "min-w-[140px] sm:min-w-[160px]",
  sm: "min-w-[100px]",
  md: "min-w-[140px]",
  lg: "min-w-[180px]",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  width?: keyof typeof widths;
  loading?: boolean;
  loadingText?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      width,
      loading,
      loadingText,
      disabled,
      title,
      children,
      ...props
    },
    ref
  ) => {
    const ariaLabel = props["aria-label"] || (typeof title === "string" ? title : undefined);

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        title={title}
        aria-label={ariaLabel}
        aria-busy={loading ? true : undefined}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-center transition-all duration-150 ease-out cursor-pointer select-none relative overflow-hidden",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-65 disabled:shadow-none disabled:transform-none",
          variants[variant] || variants.primary,
          sizes[size] || sizes.md,
          width ? widths[width] : undefined,
          className
        )}
        {...props}
      >
        <span className="inline-flex items-center justify-center gap-2 relative z-10">
          {loading && (
            <span className="relative flex h-2 w-2 shrink-0 items-center justify-center" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
            </span>
          )}
          <span>{loading && loadingText ? loadingText : children}</span>
          {loading && (
            <span className="inline-flex items-center gap-0.5 shrink-0 ml-0.5" aria-hidden="true">
              <span className="h-1 w-1 rounded-full bg-current opacity-75 animate-[pulse_1s_ease-in-out_infinite]" />
              <span className="h-1 w-1 rounded-full bg-current opacity-75 animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
              <span className="h-1 w-1 rounded-full bg-current opacity-75 animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
            </span>
          )}
        </span>
        {loading && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] pointer-events-none" />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
