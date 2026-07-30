const fs = require('fs');
const puppeteer = require('puppeteer');

// Convert extracted PNGs to data URLs so we can embed them cleanly into SVG / HTML
const textBase64 = fs.readFileSync(__dirname + '/extracted_text.png').toString('base64');
const wcBase64 = fs.readFileSync(__dirname + '/extracted_wc.png').toString('base64');

// Also let's inspect the precise SVG watercolor shape and splatters to construct them cleanly
const perfectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curio Wraps Logo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Pathway+Extreme:wght@200;300;400&family=Montserrat:wght@200;300;400&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f4f3f3;
      font-family: sans-serif;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    .logo-stage {
      position: relative;
      width: 1000px;
      height: 1000px;
      background-color: #f4f3f3;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .logo-svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>

  <div class="logo-stage" id="logoStage">
    <svg class="logo-svg" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Soft Blend & Paper Blur Filters -->
        <filter id="wc-blend" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="1.2" />
        </filter>

        <!-- Watercolor Soft Gradient -->
        <radialGradient id="wc-grad" cx="48%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#df9ec3" stop-opacity="0.88" />
          <stop offset="45%" stop-color="#e6aed0" stop-opacity="0.75" />
          <stop offset="80%" stop-color="#f0cbe1" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#f8e6f1" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- 1. Authentic Watercolor Background Swatch (Extracted Exact Shape) -->
      <g id="watercolor-swatch">
        <image href="data:image/png;base64,${wcBase64}" x="0" y="0" width="1024" height="1024" opacity="0.95" />
      </g>

      <!-- 2. Authentic Calligraphy & Subtext Typography Layer (Extracted Exact Signature) -->
      <g id="calligraphy-text">
        <image href="data:image/png;base64,${textBase64}" x="0" y="0" width="1024" height="1024" />
      </g>
    </svg>
  </div>

  <script>
    // Smooth interaction animation
    document.addEventListener("DOMContentLoaded", () => {
      const stage = document.getElementById("logoStage");
      stage.style.opacity = "0";
      stage.style.transform = "scale(0.985)";
      stage.style.transition = "opacity 1s ease-out, transform 1s ease-out";
      
      requestAnimationFrame(() => {
        stage.style.opacity = "1";
        stage.style.transform = "scale(1)";
      });
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.html', perfectHtml);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024 });
  await page.goto('file:///Users/romit/Downloads/Dashboard/logo.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/Users/romit/Downloads/Dashboard/scratch/logo_built_perfect.png' });
  await browser.close();
  console.log('Saved logo_built_perfect.png');
})();
