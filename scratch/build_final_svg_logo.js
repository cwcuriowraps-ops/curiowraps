const fs = require('fs');
const puppeteer = require('puppeteer');

const pathD = fs.readFileSync(__dirname + '/text_path.txt', 'utf8');

// Build 100% pure code-based inline DOM SVG logo.html
const logoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curio Wraps Logo Component</title>
  <link rel="stylesheet" href="logo.css">
</head>
<body>

  <!-- Pure Code-Based Curio Logo Component (Inline SVG Vector Paths + CSS) -->
  <div class="curio-logo-stage" id="curioLogo">
    <svg class="curio-logo-svg" viewBox="150 240 720 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Curio wraps - LOVE GIVER -">
      <defs>
        <!-- Organic Edge Displacement Filter -->
        <filter id="wc-edge-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="2.2" result="blurred" />
        </filter>

        <!-- Watercolor Soft Gradient -->
        <radialGradient id="wc-main-grad" cx="46%" cy="48%" r="54%">
          <stop offset="0%" stop-color="#df9ec3" stop-opacity="0.82" />
          <stop offset="40%" stop-color="#e6aed0" stop-opacity="0.7" />
          <stop offset="75%" stop-color="#f0cbe1" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#f8e6f1" stop-opacity="0" />
        </radialGradient>

        <radialGradient id="wc-core-grad" cx="40%" cy="45%" r="42%">
          <stop offset="0%" stop-color="#d48eb9" stop-opacity="0.65" />
          <stop offset="65%" stop-color="#dfa5ca" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#eccae0" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 1. Organic Watercolor Background Layer (SVG Filters & Gradients) -->
      <g transform="translate(0, 165)" class="watercolor-group">
        <!-- Layer 1: Main Soft Dusty Pink Watercolor Brush Stroke -->
        <path d="M 200,290 
                 C 240,215 330,235 420,215 
                 C 510,195 600,230 690,220 
                 C 740,215 770,235 778,265 
                 C 785,300 755,335 715,348 
                 C 630,378 530,360 435,385 
                 C 330,410 235,375 190,360 
                 C 160,348 165,315 200,290 Z" 
              fill="url(#wc-main-grad)" 
              filter="url(#wc-edge-filter)" />

        <!-- Layer 2: Inner Darker Pigment Core -->
        <path d="M 230,285 
                 C 290,240 375,248 460,235 
                 C 530,222 610,245 660,240 
                 C 690,235 715,260 680,290 
                 C 595,325 500,312 405,338 
                 C 310,358 230,330 205,318 
                 C 190,305 205,290 230,285 Z" 
              fill="url(#wc-core-grad)" 
              filter="url(#wc-edge-filter)" />

        <!-- Paint Splatters matching reference image -->
        <g fill="#d993bb" opacity="0.82" class="splatters">
          <circle cx="312" cy="180" r="5" />
          <circle cx="335" cy="208" r="7.5" />
          <circle cx="370" cy="192" r="4" />
          <circle cx="585" cy="214" r="5" />
          <circle cx="625" cy="196" r="8" />
          <circle cx="678" cy="210" r="4.5" />
          <circle cx="320" cy="385" r="5.5" />
        </g>
      </g>

      <!-- 2. Pure Inline Vector SVG Path for Calligraphy Signature & Tagline -->
      <g class="lettering-group" fill="#080808">
        <path d="${pathD}" />
      </g>
    </svg>
  </div>

  <script src="logo.js"></script>
</body>
</html>
`;

// Build logo.css
const logoCss = `/* ==========================================
   CURIO WRAP LOGO COMPONENT
   100% Inline Vector SVG & CSS (No Images/Base64)
   ========================================== */

:root {
  --bg-color: #f4f3f3;
  --text-color: #080808;
  --logo-max-width: 900px;
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
  aspect-ratio: 720 / 440;
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

/* Animations */
@keyframes curio-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.006); }
}

@keyframes watercolor-pulse {
  0%, 100% { opacity: 0.95; transform: translate(0, 165px) scale(1); }
  50% { opacity: 1; transform: translate(0, 165px) scale(1.015); }
}

.curio-logo-stage {
  animation: curio-float 7s ease-in-out infinite;
}

.watercolor-group {
  animation: watercolor-pulse 8s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .curio-logo-stage,
  .watercolor-group {
    animation: none !important;
  }
}
`;

// Build logo.js
const logoJs = `/**
 * Curio Wrap Logo Component - Minimal JavaScript
 */
document.addEventListener("DOMContentLoaded", () => {
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

// React component
const reactLogo = `import React from "react";

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const pathD = "${pathD}";

export function Logo({ size = 60, className = "", style, ...props }: LogoProps) {
  const height = size;
  const width = size * 2.33;

  return (
    <div
      className={\`relative flex items-center justify-center shrink-0 select-none \${className}\`}
      style={{ width, height, ...style }}
      {...props}
    >
      <svg
        className="w-full h-full block overflow-visible"
        viewBox="150 240 720 440"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="wc-edge-filter-react" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="2.2" result="blurred" />
          </filter>

          <radialGradient id="wc-main-grad-react" cx="46%" cy="48%" r="54%">
            <stop offset="0%" stopColor="#df9ec3" stopOpacity="0.82" />
            <stop offset="40%" stopColor="#e6aed0" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#f0cbe1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f8e6f1" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="wc-core-grad-react" cx="40%" cy="45%" r="42%">
            <stop offset="0%" stopColor="#d48eb9" stopOpacity="0.65" />
            <stop offset="65%" stopColor="#dfa5ca" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#eccae0" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform="translate(0, 165)">
          <path d="M 200,290 C 240,215 330,235 420,215 C 510,195 600,230 690,220 C 740,215 770,235 778,265 C 785,300 755,335 715,348 C 630,378 530,360 435,385 C 330,410 235,375 190,360 C 160,348 165,315 200,290 Z" fill="url(#wc-main-grad-react)" filter="url(#wc-edge-filter-react)" />
          <path d="M 230,285 C 290,240 375,248 460,235 C 530,222 610,245 660,240 C 690,235 715,260 680,290 C 595,325 500,312 405,338 C 310,358 230,330 205,318 C 190,305 205,290 230,285 Z" fill="url(#wc-core-grad-react)" filter="url(#wc-edge-filter-react)" />

          <g fill="#d993bb" opacity="0.82">
            <circle cx="312" cy="180" r="5" />
            <circle cx="335" cy="208" r="7.5" />
            <circle cx="370" cy="192" r="4" />
            <circle cx="585" cy="214" r="5" />
            <circle cx="625" cy="196" r="8" />
            <circle cx="678" cy="210" r="4.5" />
            <circle cx="320" cy="385" r="5.5" />
          </g>
        </g>

        <g fill="#080808" className="dark:fill-white transition-colors duration-300">
          <path d={pathD} />
        </g>
      </svg>
    </div>
  );
}
`;

fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/logo.tsx', reactLogo);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 700 });
  await page.goto('file:///Users/romit/Downloads/Dashboard/logo.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/Users/romit/Downloads/Dashboard/scratch/perfect_svg_logo_render.png' });
  await browser.close();
  console.log('Successfully rendered perfect_svg_logo_render.png');
})();
