import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary",
            "transition-colors duration-normal",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus:border-error focus:ring-error/20",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
