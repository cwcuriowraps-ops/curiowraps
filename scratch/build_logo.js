const fs = require('fs');

const logoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curio Wraps Logo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=WindSong:wght@400;500&family=Pathway+Extreme:wght@200;300;400&display=swap');

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
      background-color: #f6f5f5;
      font-family: sans-serif;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .logo-container {
      position: relative;
      width: 900px;
      height: 600px;
      background-color: #f6f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .watercolor-layer {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: 1;
      pointer-events: none;
    }

    .brand-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      margin-top: 5px;
    }

    .brand-title {
      font-family: 'WindSong', cursive;
      font-size: 148px;
      font-weight: 400;
      color: #080808;
      white-space: nowrap;
      line-height: 0.9;
      letter-spacing: -2px;
      word-spacing: 16px;
      transform: rotate(-1deg);
    }

    .tagline-container {
      margin-top: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tagline {
      font-family: 'Pathway Extreme', sans-serif;
      font-size: 21px;
      font-weight: 300;
      color: #222222;
      letter-spacing: 0.65em;
      text-transform: uppercase;
      word-spacing: 0.1em;
    }
  </style>
</head>
<body>

  <div class="logo-container" id="logoContainer">
    <!-- SVG Watercolor Canvas -->
    <svg class="watercolor-layer" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Organic Edge Displacement Filter -->
        <filter id="watercolor-edge" x="-20%" y="-20%" width="140%" height="140%">
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

      <g transform="translate(0, -22)">
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
              filter="url(#watercolor-edge)" />

        <!-- Layer 2: Inner Darker Pigment Core -->
        <path d="M 230,285 
                 C 290,240 375,248 460,235 
                 C 530,222 610,245 660,240 
                 C 690,235 715,260 680,290 
                 C 595,325 500,312 405,338 
                 C 310,358 230,330 205,318 
                 C 190,305 205,290 230,285 Z" 
              fill="url(#wc-core-grad)" 
              filter="url(#watercolor-edge)" />

        <!-- Paint Splatters matching reference image -->
        <g fill="#d993bb" opacity="0.82">
          <!-- Top Left Splatters (above 'u' & 'r' in Curio) -->
          <circle cx="312" cy="180" r="5" />
          <circle cx="335" cy="208" r="7.5" />
          <circle cx="370" cy="192" r="4" />

          <!-- Top Right Splatters (above 'w', 'r', 'a' in wraps) -->
          <circle cx="585" cy="214" r="5" />
          <circle cx="625" cy="196" r="8" />
          <circle cx="678" cy="210" r="4.5" />

          <!-- Bottom Left Droplet (under main watercolor stroke) -->
          <circle cx="320" cy="385" r="5.5" />
        </g>
      </g>
    </svg>

    <!-- Brand Text -->
    <div class="brand-content">
      <h1 class="brand-title">Curio wraps</h1>
      <div class="tagline-container">
        <p class="tagline">- LOVE GIVER -</p>
      </div>
    </div>
  </div>

  <script>
    // Smooth fade-in and subtle scale interaction on load
    document.addEventListener("DOMContentLoaded", () => {
      const container = document.getElementById("logoContainer");
      container.style.opacity = "0";
      container.style.transform = "scale(0.985)";
      container.style.transition = "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
      
      requestAnimationFrame(() => {
        container.style.opacity = "1";
        container.style.transform = "scale(1)";
      });
    });
  </script>
</body>
</html>
