const fs = require('fs');
const puppeteer = require('puppeteer');

// 1. Update packages/ui/src/components/WatercolorLogo.tsx
let tsxContent = fs.readFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/WatercolorLogo.tsx', 'utf8');

// Replace fill="#111111" with fill="currentColor" and add text-color classes to container & group
tsxContent = tsxContent.replace(
  'className={`relative flex items-center justify-center shrink-0 select-none ${className}`}',
  'className={`relative flex items-center justify-center shrink-0 select-none text-[#111111] dark:text-white transition-colors duration-300 ${className}`}'
);

tsxContent = tsxContent.replace(
  '<g fill="#111111" className="dark:fill-white transition-colors duration-300">',
  '<g fill="currentColor" className="transition-colors duration-300">'
);

fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/WatercolorLogo.tsx', tsxContent);

// 2. Update logo.css for light/dark theme CSS variables
let cssContent = fs.readFileSync('/Users/romit/Downloads/Dashboard/logo.css', 'utf8');

cssContent = `/* ==========================================
   CURIO WRAP LOGO COMPONENT
   100% Theme-Aware Dark / Light Mode Supported
   ========================================== */

:root {
  --bg-color: #ffffff;
  --text-color: #111111;
  --logo-max-width: 850px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #0f172a;
    --text-color: #ffffff;
  }
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
  transition: background-color 0.3s ease, color 0.3s ease;
}

.curio-logo-stage {
  position: relative;
  width: 100%;
  max-width: var(--logo-max-width);
  aspect-ratio: 720 / 460;
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

.lettering-group {
  fill: var(--text-color, #111111);
  transition: fill 0.3s ease;
}

@keyframes watercolorBreathe {
  0%, 100% {
    transform: translate(0, 160px) scale(1);
    opacity: 0.94;
  }
  50% {
    transform: translate(0, 160px) scale(1.012);
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

fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.css', cssContent);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/apps/storefront/public/logo.css', cssContent);

// 3. Test light & dark mode screenshots with Puppeteer
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 700 });

  // Light Mode
  await page.goto('file:///Users/romit/Downloads/Dashboard/logo.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/Users/romit/Downloads/Dashboard/scratch/theme_light_mode.png' });

  // Dark Mode
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await page.goto('file:///Users/romit/Downloads/Dashboard/logo.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/Users/romit/Downloads/Dashboard/scratch/theme_dark_mode.png' });

  await browser.close();
  console.log('Successfully rendered theme_light_mode.png and theme_dark_mode.png');
})();
