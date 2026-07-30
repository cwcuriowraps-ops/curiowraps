import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface LoaderProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  fullscreen?: boolean;
}

export function Loader({ size = "md", fullscreen = false, className, ...props }: LoaderProps) {
  const sizeClasses = {
    sm: "w-48 h-48",
    md: "w-64 h-64",
    lg: "w-80 h-80",
    xl: "w-96 h-96",
  };

  const content = (
    <div
      className={cn(
        "curio-loader-container relative flex items-center justify-center bg-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {/* Component-scoped self-contained animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes curio-loader-fade-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes curio-loader-breathing {
          0%, 100% { transform: scale(0.98); }
          50% { transform: scale(1.02); }
        }
        @keyframes curio-loader-spin-clockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes curio-loader-spin-counter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes curio-loader-sparkle {
          0%, 100% { opacity: 0.1; transform: scale(0.5) rotate(0deg); }
          50% { opacity: 0.95; transform: scale(1.2) rotate(90deg); }
        }
        @keyframes curio-loader-glow-pulse {
          0%, 100% { opacity: 0.25; filter: blur(4px); }
          50% { opacity: 0.45; filter: blur(6px); }
        }

        .curio-loader-container {
          animation: curio-loader-fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .curio-loader-logo {
          animation: curio-loader-breathing 5s ease-in-out infinite;
          transform-origin: 100px 100px;
        }
        .curio-loader-outer-group {
          animation: curio-loader-spin-clockwise 6s linear infinite;
          transform-origin: 100px 100px;
        }
        .curio-loader-inner-ring {
          animation: curio-loader-spin-counter 16s linear infinite;
          transform-origin: 100px 100px;
        }
        .curio-loader-sparkle-1 {
          animation: curio-loader-sparkle 4s ease-in-out infinite;
          transform-origin: 40px 40px;
        }
        .curio-loader-sparkle-2 {
          animation: curio-loader-sparkle 5s ease-in-out infinite;
          transform-origin: 160px 160px;
        }
        .curio-loader-glow-shadow {
          animation: curio-loader-glow-pulse 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .curio-loader-logo {
            animation: none;
          }
          .curio-loader-outer-group {
            animation: curio-loader-spin-clockwise 24s linear infinite;
          }
          .curio-loader-inner-ring {
            animation: curio-loader-spin-counter 48s linear infinite;
          }
          .curio-loader-sparkle-1,
          .curio-loader-sparkle-2 {
            animation: none;
            opacity: 0.5;
          }
        }
      `}} />

      {/* Background SVG Wrapper */}
      <svg
        className="w-full h-full text-text-primary"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="curio-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Perfectly centered ultra-thin circular outer ring */}
        {/* Color matches text-primary: Black in Light Mode, White in Dark Mode */}
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="currentColor"
          strokeWidth="0.75"
          className="opacity-15 dark:opacity-20"
        />

        {/* 2. Faint dashed inner ring slowly rotating in reverse */}
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="3 6"
          className="opacity-10 dark:opacity-15 curio-loader-inner-ring"
        />

        {/* 3. Glowing dot smoothly traveling around outer ring */}
        <g className="curio-loader-outer-group">
          {/* Subtle trail effect */}
          <path
            d="M 100 10 A 90 90 0 0 1 125 13.5"
            stroke="#F5AFC5"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="opacity-30"
          />
          {/* Main glowing dot */}
          <circle
            cx="100"
            cy="10"
            r="3.5"
            fill="#F5AFC5"
            filter="url(#curio-glow)"
          />
        </g>

        {/* 4. Decorative Sparkles appearing around the ring */}
        {/* Sparkle 1 (top-left) */}
        <path
          d="M 40 37 L 40 43 M 37 40 L 43 40"
          stroke="#F5AFC5"
          strokeWidth="0.75"
          className="curio-loader-sparkle-1"
        />
        {/* Sparkle 2 (bottom-right) */}
        <path
          d="M 160 157 L 160 163 M 157 160 L 163 160"
          stroke="#F5AFC5"
          strokeWidth="0.75"
          className="curio-loader-sparkle-2"
        />

        {/* 5. Center content group (breathing scale animation) */}
        <g className="curio-loader-logo">
          {/* Soft shadow beneath the logo (faint blur) */}
          <ellipse
            cx="100"
            cy="148"
            rx="25"
            ry="4"
            fill="currentColor"
            className="opacity-5 dark:opacity-10"
          />

          {/* Tiny pink glow beneath the gift box */}
          <ellipse
            cx="100"
            cy="90"
            rx="12"
            ry="2.5"
            fill="#F5AFC5"
            className="curio-loader-glow-shadow"
          />

          {/* Minimal outline Gift Box Icon */}
          <g transform="translate(88, 55)" stroke="#F5AFC5" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            {/* Box Body */}
            <path d="M 2 11 L 2 21 A 1 1 0 0 0 3 22 L 21 22 A 1 1 0 0 0 22 21 L 22 11" fill="none" />
            {/* Box Lid */}
            <rect x="0" y="8" width="24" height="3" rx="0.5" fill="none" />
            {/* Ribbon Line */}
            <line x1="12" y1="8" x2="12" y2="22" />
            {/* Ribbon Heart Loop left */}
            <path d="M 12 8 C 8 5, 8 1, 12 4" fill="none" />
            {/* Ribbon Heart Loop right */}
            <path d="M 12 8 C 16 5, 16 1, 12 4" fill="none" />
          </g>

          {/* CURIO Serif Typography */}
          <text
            x="100"
            y="114"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-cormorant), Cormorant Garamond, serif"
            fontSize="18"
            letterSpacing="0.22em"
            className="font-medium font-serif"
          >
            CURIO
          </text>

          {/* WRAP Sans-serif Typography + Decorative horizontal lines */}
          <g transform="translate(100, 130)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#F5AFC5"
              fontFamily="var(--font-inter), Inter, sans-serif"
              fontSize="7"
              fontWeight="300"
              letterSpacing="0.45em"
              className="tracking-[0.45em]"
            >
              WRAP
            </text>
            {/* Left Line */}
            <line x1="-38" y1="-2.5" x2="-26" y2="-2.5" stroke="#F5AFC5" strokeWidth="0.5" className="opacity-60" />
            {/* Right Line */}
            <line x1="26" y1="-2.5" x2="38" y2="-2.5" stroke="#F5AFC5" strokeWidth="0.5" className="opacity-60" />
          </g>

          {/* Crafted with Love Tagline */}
          <text
            x="100"
            y="142"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="var(--font-inter), Inter, sans-serif"
            fontSize="5"
            fontWeight="300"
            letterSpacing="0.15em"
            className="opacity-60 tracking-[0.15em]"
          >
            CRAFTED WITH LOVE
          </text>
        </g>
      </svg>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-500">
        {content}
      </div>
    );
  }

  return content;
}
