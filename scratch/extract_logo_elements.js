const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const refImgPath = '/Users/romit/.gemini/antigravity-ide/brain/0cdb1e10-c5bf-4c5a-b317-fa809f498ed8/media__1784555623743.png';

(async () => {
  const imgBase64 = fs.readFileSync(refImgPath).toString('base64');
  
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #fff; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <img id="ref" src="data:image/png;base64,${imgBase64}" />
      <canvas id="c"></canvas>
      <script>
        const img = document.getElementById('ref');
        img.onload = () => {
          const canvas = document.getElementById('c');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          
          // Let's sample colors:
          // Background sample at (10, 10)
          const bgR = data[0], bgG = data[1], bgB = data[2];
          
          // Find black text bounding box and pixels
          let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
          let blackPixelCount = 0;
          let pinkPixelCount = 0;
          
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              const r = data[idx], g = data[idx+1], b = data[idx+2];
              
              // Dark text threshold
              if (r < 60 && g < 60 && b < 60) {
                blackPixelCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          
          window.analysisResult = {
            width: canvas.width,
            height: canvas.height,
            bg: 'rgb(' + bgR + ',' + bgG + ',' + bgB + ')',
            textBounds: { minX, maxX, minY, maxY },
            blackPixelCount
          };
        };
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.waitForFunction('window.analysisResult !== undefined');
  const result = await page.evaluate(() => window.analysisResult);
  console.log('Analysis result:', JSON.stringify(result, null, 2));
  
  await browser.close();
})();
