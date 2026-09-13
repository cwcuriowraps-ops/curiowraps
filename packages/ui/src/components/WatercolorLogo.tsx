import React, { useId } from "react";

export interface WatercolorLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  className?: string;
}
export function WatercolorLogo({
  size = 120,
  className = "",
  style,
  ...props
}: WatercolorLogoProps) {
  const filterId = useId();
  const blurId = useId();
  const baseGradId = useId();
  const coreGradId = useId();
  const bloomGradId = useId();
  const strokeGradId = useId();

  const height = size;
  const width = size * 2.33;

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none text-[#111111] dark:text-white transition-colors duration-300 ${className}`}
      style={{ width, height, aspectRatio: "720 / 460", ...style }}
      {...props}
    >
      <style>{`
        @keyframes watercolorBreathe {
          0%, 100% {
            transform: translate(0, 215px) scale(1);
            opacity: 0.94;
          }
          50% {
            transform: translate(0, 215px) scale(1.012);
            opacity: 1;
          }
        }
        .animate-watercolor-breathe {
          animation: watercolorBreathe 8s ease-in-out infinite alternate;
          transform-origin: center center;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-watercolor-breathe {
            animation: none !important;
          }
        }
      `}</style>

      <svg
        className="w-full h-full block overflow-visible"
        viewBox="150 220 720 460"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Curio wraps - LOVE GIVER -"
      >
        <defs>
          <filter
            id={filterId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022"
              numOctaves="5"
              result="paperNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="paperNoise"
              scale="24"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedBrush"
            />
            <feGaussianBlur
              in="displacedBrush"
              stdDeviation="2.4"
              result="softFeather"
            />
          </filter>

          <filter id={blurId}>
            <feGaussianBlur stdDeviation="0.4" />
          </filter>

          <radialGradient id={baseGradId} cx="44%" cy="46%" r="55%">
            <stop offset="0%" stopColor="#e8b8d6" stopOpacity="0.92" />
            <stop offset="42%" stopColor="#ecc4dd" stopOpacity="0.8" />
            <stop offset="78%" stopColor="#f5dceb" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fcf0f7" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={coreGradId} cx="38%" cy="42%" r="45%">
            <stop offset="0%" stopColor="#d494ba" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#e2a8ca" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ecc4dd" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={bloomGradId} cx="48%" cy="35%" r="38%">
            <stop offset="0%" stopColor="#fbf0f6" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#f3d8e8" stopOpacity="0" />
          </radialGradient>

          <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e4aed0" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#eecce1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d997be" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        <g transform="translate(0, 215)" className="animate-watercolor-breathe">
          <path
            d="M 265,300 C 295,255 350,230 410,208 C 450,195 510,215 570,215 C 640,215 710,210 750,235 C 775,250 782,275 768,295 C 750,320 705,322 660,325 C 590,328 525,355 460,358 C 385,362 315,342 275,328 C 248,318 248,308 265,300 Z"
            fill={`url(#${baseGradId})`}
            filter={`url(#${filterId})`}
          />

          <path
            d="M 290,290 C 330,248 395,225 455,215 C 515,205 575,222 635,222 C 690,222 735,228 745,248 C 755,268 720,295 675,308 C 600,320 520,335 450,335 C 375,335 315,320 295,308 C 280,298 282,295 290,290 Z"
            fill={`url(#${coreGradId})`}
            filter={`url(#${filterId})`}
          />

          <path
            d="M 330,270 C 380,230 450,218 515,212 C 570,208 620,225 655,232 C 680,238 670,265 620,278 C 550,292 470,285 410,292 C 360,298 340,285 330,270 Z"
            fill={`url(#${bloomGradId})`}
            filter={`url(#${filterId})`}
          />

          <path
            d="M 310,280 C 370,235 440,220 520,212 C 600,205 670,225 720,238"
            stroke={`url(#${strokeGradId})`}
            strokeWidth="28"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
            filter={`url(#${filterId})`}
          />

          <g fill="#c882aa" filter={`url(#${blurId})`}>
            <circle cx="312" cy="188" r="3.5" opacity="0.65" />
            <circle cx="330" cy="204" r="6" opacity="0.75" />
            <circle cx="334" cy="198" r="2" opacity="0.5" />
            <circle cx="616" cy="204" r="3.5" opacity="0.6" />
            <circle cx="658" cy="194" r="6.5" opacity="0.7" />
            <circle cx="664" cy="190" r="2" opacity="0.45" />
            <circle cx="718" cy="202" r="4" opacity="0.55" />
            <circle cx="320" cy="362" r="4.5" opacity="0.6" />
          </g>
        </g>

        <g fill="currentColor" className="transition-colors duration-300">
          <use href="/logo-letters.svg#letters" />
        </g>
      </svg>
    </div>
  );
}

export default WatercolorLogo;
