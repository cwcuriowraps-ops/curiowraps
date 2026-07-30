"use client";

import { type InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "../lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, type, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const [showPassword, setShowPassword] = useState(false);
    
    const isPasswordType = type === "password";
    const currentType = isPasswordType && showPassword ? "text" : type;

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            type={currentType}
            className={cn(
              "h-[52px] w-full rounded-2xl border border-border bg-surface px-4 text-base text-text-primary",
              "placeholder:text-text-secondary/60",
              "transition-all duration-200",
              "focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "[&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:theme('colors.text.primary')]",
              isPasswordType && "pr-12",
              error && "border-error focus:border-error focus:ring-error/20",
              className,
            )}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 flex h-full items-center justify-center px-4 text-text-secondary hover:text-text-primary hover:bg-accent/10 focus:text-accent focus:bg-accent/10 focus:outline-none rounded-r-2xl transition-colors duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        {error && <p className="text-[13px] font-medium text-error mt-0.5">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
