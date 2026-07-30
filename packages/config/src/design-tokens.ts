export const designTokens = {
  light: {
    background: "#F8F9FA",
    surface: "#FFFFFF",
    card: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#374151",
    accent: "#C9A227",
    accentHover: "#B08E1F",
    border: "#E5E7EB",
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    muted: "#F3F4F6",
    ring: "#C9A227",
  },
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    card: "#111827",
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    accent: "#D4AF37",
    accentHover: "#C9A227",
    border: "#334155",
    success: "#22C55E",
    warning: "#FBBF24",
    error: "#EF4444",
    muted: "#1E293B",
    ring: "#D4AF37",
  },
} as const;

export type ThemeMode = "light" | "dark" | "system";

export const cssVariables = {
  light: {
    "--color-background": designTokens.light.background,
    "--color-surface": designTokens.light.surface,
    "--color-card": designTokens.light.card,
    "--color-text-primary": designTokens.light.textPrimary,
    "--color-text-secondary": designTokens.light.textSecondary,
    "--color-accent": designTokens.light.accent,
    "--color-accent-hover": designTokens.light.accentHover,
    "--color-border": designTokens.light.border,
    "--color-success": designTokens.light.success,
    "--color-warning": designTokens.light.warning,
    "--color-error": designTokens.light.error,
    "--color-muted": designTokens.light.muted,
    "--color-ring": designTokens.light.ring,
  },
  dark: {
    "--color-background": designTokens.dark.background,
    "--color-surface": designTokens.dark.surface,
    "--color-card": designTokens.dark.card,
    "--color-text-primary": designTokens.dark.textPrimary,
    "--color-text-secondary": designTokens.dark.textSecondary,
    "--color-accent": designTokens.dark.accent,
    "--color-accent-hover": designTokens.dark.accentHover,
    "--color-border": designTokens.dark.border,
    "--color-success": designTokens.dark.success,
    "--color-warning": designTokens.dark.warning,
    "--color-error": designTokens.dark.error,
    "--color-muted": designTokens.dark.muted,
    "--color-ring": designTokens.dark.ring,
  },
} as const;

export const borderRadius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  full: "9999px",
} as const;

export const animation = {
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
} as const;

export const spacing = {
  page: "1.5rem",
  section: "4rem",
} as const;
