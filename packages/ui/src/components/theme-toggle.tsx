"use client";

import { useTheme } from "./theme-provider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycle = () => {
    const order: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const current = order.indexOf(theme);
    const next = order[(current + 1) % order.length]!;
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Current theme: ${theme}. Click to change.`}
      className="text-text-secondary hover:text-accent transition-colors"
    >
      {resolvedTheme === "dark" ? (
        <Moon className="h-[18px] w-[18px]" />
      ) : (
        <Sun className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
