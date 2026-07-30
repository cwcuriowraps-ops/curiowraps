import { borderRadius, animation } from "./design-tokens";

export const tailwindPreset = {
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        card: "var(--color-card)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
        },
        border: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        muted: "var(--color-muted)",
        ring: "var(--color-ring)",
      },
      borderRadius: {
        sm: borderRadius.sm,
        md: borderRadius.md,
        lg: borderRadius.lg,
        xl: borderRadius.xl,
      },
      transitionDuration: {
        fast: animation.fast,
        normal: animation.normal,
        slow: animation.slow,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
} as const;
