const fs = require('fs');
const puppeteer = require('puppeteer');

const pathD = fs.readFileSync(__dirname + '/text_path.txt', 'utf8');

// 1. Create WatercolorLogo.module.css
const moduleCss = `/* WatercolorLogo.module.css - Pure Procedural SVG & CSS Design System */

.container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  width: 100%;
  max-width: 850px;
  aspect-ratio: 720 / 380;
  margin: 0 auto;
}

.svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

/* Subtle Floating / Breathing animation for luxury presentation */
@keyframes watercolorBreathe {
  0%, 100% {
    transform: translate(0, 150px) scale(1);
    opacity: 0.94;
  }
  50% {
    transform: translate(0, 150px) scale(1.012);
    opacity: 1;
  }
}

.watercolorGroup {
  animation: watercolorBreathe 8s ease-in-out infinite alternate;
  transform-origin: center center;
}

@media (prefers-reduced-motion: reduce) {
  .watercolorGroup {
    animation: none !important;
  }
}
`;

// 2. Create WatercolorLogo.tsx
const watercolorLogoTsx = `import React, { useId } from "react";
import styles from "./WatercolorLogo.module.css";

export interface WatercolorLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  className?: string;
}

// Inline SVG vector lettering path for exact Curio wraps & tagline match
const textVectorPath = "${pathD}";

export function WatercolorLogo({
  size = 120,
  className = "",
  style,
  ...props
}: WatercolorLogoProps) {
  const filterId = useId();
  const mainGradId = useId();
  const coreGradId = useId();
  const highlightGradId = useId();

  const height = size;
  const width = size * 2.33;

  return (
    <div
      className={\`\${styles.container} \${className}\`}
      style={{ width, height, ...style }}
      {...props}
    >
      <svg
        className={styles.svg}
        viewBox="150 240 720 380"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Curio wraps - LOVE GIVER -"
      >
        <defs>
          {/* Procedural Watercolor SVG Filter: Organic edge displacement + multi-octave paper texture */}
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
              baseFrequency="0.018"
              numOctaves="5"
              result="paperNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="paperNoise"
              scale="32"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displacedBrush"
            />
            <feGaussianBlur
              in="displacedBrush"
              stdDeviation="3.2"
              result="softFeather"
            />
          </filter>

          {/* Color Palette Gradients */}
          {/* Primary: #F7CBD8, Secondary: #FAD6E2, Highlight: #FDECF2, Shadow: #EDB9C9 */}
          <radialGradient id={mainGradId} cx="48%" cy="48%" r="52%">
            <stop offset="0%" stopColor="#F7CBD8" stopOpacity="0.88" />
            <stop offset="45%" stopColor="#FAD6E2" stopOpacity="0.75" />
            <stop offset="80%" stopColor="#FDECF2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FDECF2" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={coreGradId} cx="42%" cy="46%" r="40%">
            <stop offset="0%" stopColor="#EDB9C9" stopOpacity="0.68" />
            <stop offset="60%" stopColor="#F7CBD8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#FAD6E2" stopOpacity="0" />
          </radialGradient>

          <radialGradient id={highlightGradId} cx="55%" cy="38%" r="35%">
            <stop offset="0%" stopColor="#FDECF2" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FAD6E2" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Procedural SVG Watercolor Brush Background */}
        {/* Leaves ~20% of 'C' loop on left and ending flourish of 's' on right exposed */}
        <g transform="translate(0, 150)" className={styles.watercolorGroup}>
          {/* Base Layer: Organic Curved Silhouette */}
          <path
            d="M 275,275 
               C 330,225 410,238 495,220 
               C 575,202 650,232 705,225 
               C 745,220 765,242 768,268 
               C 772,298 745,325 710,338 
               C 630,368 535,350 440,375 
               C 345,398 270,368 255,352 
               C 238,335 242,300 275,275 Z"
            fill={\`url(#\${mainGradId})\`}
            filter={\`url(#\${filterId})\`}
          />

          {/* Core Layer: Uneven Pigment Concentration */}
          <path
            d="M 300,270 
               C 360,235 440,245 520,232 
               C 590,220 645,242 680,238 
               C 710,235 725,258 700,282 
               C 625,318 535,308 450,330 
               C 365,350 305,328 290,312 
               C 278,298 285,282 300,270 Z"
            fill={\`url(#\${coreGradId})\`}
            filter={\`url(#\${filterId})\`}
          />

          {/* Highlight Layer: Wet-on-Dry Bloom Effect */}
          <path
            d="M 350,250 
               C 420,230 490,235 560,228 
               C 620,220 660,238 675,248 
               C 690,258 660,278 610,288 
               C 530,305 450,295 380,302 
               C 330,308 320,270 350,250 Z"
            fill={\`url(#\${highlightGradId})\`}
            filter={\`url(#\${filterId})\`}
          />

          {/* 4-6 Natural Watercolor Splatters */}
          <g opacity="0.7">
            <circle cx="330" cy="190" r="4" fill="#EDB9C9" opacity="0.45" />
            <circle cx="365" cy="212" r="6" fill="#F7CBD8" opacity="0.55" />
            <circle cx="595" cy="202" r="3.5" fill="#EDB9C9" opacity="0.4" />
            <circle cx="640" cy="195" r="7" fill="#FAD6E2" opacity="0.5" />
            <circle cx="685" cy="215" r="4" fill="#F7CBD8" opacity="0.35" />
            <circle cx="340" cy="380" r="5" fill="#EDB9C9" opacity="0.4" />
          </g>
        </g>

        {/* 2. Precision Vector Lettering & Tagline */}
        <g fill="#111111" className="dark:fill-white transition-colors duration-300">
          <path d={textVectorPath} />
        </g>
      </svg>
    </div>
  );
}

export default WatercolorLogo;
`;

// Save files to packages/ui/src/components/
fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/WatercolorLogo.module.css', moduleCss);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/WatercolorLogo.tsx', watercolorLogoTsx);

// Update packages/ui/src/components/logo.tsx to export & use WatercolorLogo
const logoTsx = `import React from "react";
import { WatercolorLogo, WatercolorLogoProps } from "./WatercolorLogo";

export interface LogoProps extends WatercolorLogoProps {}

export function Logo(props: LogoProps) {
  return <WatercolorLogo {...props} />;
}

export { WatercolorLogo };
export type { WatercolorLogoProps };
`;

fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/logo.tsx', logoTsx);

// Create standalone logo.html
const logoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curio Wrap - Premium Watercolor Logo</title>
  <link rel="stylesheet" href="logo.css">
</head>
<body>

  <!-- Pure Code-Based Watercolor Logo Component -->
  <div class="curio-logo-stage" id="curioLogo">
    <svg class="curio-logo-svg" viewBox="150 240 720 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Curio wraps - LOVE GIVER -">
      <defs>
        <!-- Procedural SVG Filter: Organic edge displacement + multi-octave paper texture -->
        <filter id="wc-edge-filter" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="5" result="paperNoise" />
          <feDisplacementMap in="SourceGraphic" in2="paperNoise" scale="32" xChannelSelector="R" yChannelSelector="G" result="displacedBrush" />
          <feGaussianBlur in="displacedBrush" stdDeviation="3.2" result="softFeather" />
        </filter>

        <!-- Color Palette: #F7CBD8, #FAD6E2, #FDECF2, #EDB9C9 -->
        <radialGradient id="wc-main-grad" cx="48%" cy="48%" r="52%">
          <stop offset="0%" stop-color="#F7CBD8" stop-opacity="0.88" />
          <stop offset="45%" stop-color="#FAD6E2" stop-opacity="0.75" />
          <stop offset="80%" stop-color="#FDECF2" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#FDECF2" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="wc-core-grad" cx="42%" cy="46%" r="40%">
          <stop offset="0%" stop-color="#EDB9C9" stop-opacity="0.68" />
          <stop offset="60%" stop-color="#F7CBD8" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#FAD6E2" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="wc-highlight-grad" cx="55%" cy="38%" r="35%">
          <stop offset="0%" stop-color="#FDECF2" stop-opacity="0.7" />
          <stop offset="100%" stop-color="#FAD6E2" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 1. Procedural SVG Watercolor Background Layer -->
      <g transform="translate(0, 150)" class="watercolor-group">
        <!-- Base Layer: Soft Feathered Silhouette -->
        <path d="M 275,275 
                 C 330,225 410,238 495,220 
                 C 575,202 650,232 705,225 
                 C 745,220 765,242 768,268 
                 C 772,298 745,325 710,338 
                 C 630,368 535,350 440,375 
                 C 345,398 270,368 255,352 
                 C 238,335 242,300 275,275 Z"
              fill="url(#wc-main-grad)" 
              filter="url(#wc-edge-filter)" />

        <!-- Core Layer: Uneven Pigment Concentration -->
        <path d="M 300,270 
                 C 360,235 440,245 520,232 
                 C 590,220 645,242 680,238 
                 C 710,235 725,258 700,282 
                 C 625,318 535,308 450,330 
                 C 365,350 305,328 290,312 
                 C 278,298 285,282 300,270 Z"
              fill="url(#wc-core-grad)" 
              filter="url(#wc-edge-filter)" />

        <!-- Highlight Layer: Wet-on-Dry Bloom Effect -->
        <path d="M 350,250 
                 C 420,230 490,235 560,228 
                 C 620,220 660,238 675,248 
                 C 690,258 660,278 610,288 
                 C 530,305 450,295 380,302 
                 C 330,308 320,270 350,250 Z"
              fill="url(#wc-highlight-grad)" 
              filter="url(#wc-edge-filter)" />

        <!-- 4-6 Natural Splatters -->
        <g opacity="0.7">
          <circle cx="330" cy="190" r="4" fill="#EDB9C9" opacity="0.45" />
          <circle cx="365" cy="212" r="6" fill="#F7CBD8" opacity="0.55" />
          <circle cx="595" cy="202" r="3.5" fill="#EDB9C9" opacity="0.4" />
          <circle cx="640" cy="195" r="7" fill="#FAD6E2" opacity="0.5" />
          <circle cx="685" cy="215" r="4" fill="#F7CBD8" opacity="0.35" />
          <circle cx="340" cy="380" r="5" fill="#EDB9C9" opacity="0.4" />
        </g>
      </g>

      <!-- 2. Precision Calligraphy Lettering & Tagline -->
      <g fill="#111111" class="lettering-group">
        <path d="${pathD}" />
      </g>
    </svg>
  </div>

  <script src="logo.js"></script>
</body>
</html>
`;

// Create standalone logo.css
const logoCss = `/* ==========================================
   CURIO WRAP LOGO COMPONENT
   100% Inline SVG Filters & CSS Design System
   ========================================== */

:root {
  --bg-color: #ffffff;
  --text-color: #111111;
  --logo-max-width: 850px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-color);
  font-family: system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.curio-logo-stage {
  position: relative;
  width: 100%;
  max-width: var(--logo-max-width);
  aspect-ratio: 720 / 380;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  user-select: none;
}

.curio-logo-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

@keyframes watercolorBreathe {
  0%, 100% {
    transform: translate(0, 150px) scale(1);
    opacity: 0.94;
  }
  50% {
    transform: translate(0, 150px) scale(1.012);
    opacity: 1;
  }
}

.watercolor-group {
  animation: watercolorBreathe 8s ease-in-out infinite alternate;
  transform-origin: center center;
}

@media (prefers-reduced-motion: reduce) {
  .watercolor-group {
    animation: none !important;
  }
}
`;

// Create standalone logo.js
const logoJs = `document.addEventListener("DOMContentLoaded", () => {
  const logo = document.getElementById("curioLogo");
  if (!logo) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReducedMotion) {
    logo.style.opacity = "0";
    logo.style.transform = "scale(0.985)";
    logo.style.transition = "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)";

    requestAnimationFrame(() => {
      logo.style.opacity = "1";
      logo.style.transform = "scale(1)";
    });
  }
});
`;

fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.html', logoHtml);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.css', logoCss);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.js', logoJs);

fs.writeFileSync('/Users/romit/Downloads/Dashboard/apps/storefront/public/logo.html', logoHtml);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/apps/storefront/public/logo.css', logoCss);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/apps/storefront/public/logo.js', logoJs);

// Render verification preview
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 700 });
  await page.goto('file:///Users/romit/Downloads/Dashboard/logo.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/Users/romit/Downloads/Dashboard/scratch/watercolor_logo_verification.png' });
  await browser.close();
  console.log('Successfully rendered watercolor_logo_verification.png');
})();
