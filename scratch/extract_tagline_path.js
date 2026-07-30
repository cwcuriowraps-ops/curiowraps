const fs = require('fs');
const puppeteer = require('puppeteer');

const refImgPath = '/Users/romit/.gemini/antigravity-ide/brain/0cdb1e10-c5bf-4c5a-b317-fa809f498ed8/media__1784555623743.png';
const imgBase64 = fs.readFileSync(refImgPath).toString('base64');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <img id="ref" src="data:image/png;base64,${imgBase64}" />
      <canvas id="c" width="1024" height="1024"></canvas>
      <script>
        const img = document.getElementById('ref');
        img.onload = () => {
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const imgData = ctx.getImageData(0, 0, 1024, 1024);
          const data = imgData.data;

          function getPixel(x, y) {
            if (x < 0 || x >= 1024 || y < 0 || y >= 1024) return 0;
            const idx = (y * 1024 + x) * 4;
            const r = data[idx], g = data[idx+1], b = data[idx+2];
            const lum = 0.299*r + 0.587*g + 0.114*b;
            if (r > g + 25 && b > g) return 0; // exclude pink
            return lum < 140 ? 1 : 0;
          }

          let pathDataArr = [];
          
          // Vectorize full area y=370 to y=685
          for (let y = 370; y < 685; y++) {
            let inRun = false;
            let startX = 0;
            for (let x = 180; x < 860; x++) {
              const val = getPixel(x, y);
              if (val === 1 && !inRun) {
                inRun = true;
                startX = x;
              } else if (val === 0 && inRun) {
                inRun = false;
                const width = x - startX;
                pathDataArr.push(\`M\${startX},\${y}h\${width}v1h-\${width}z\`);
              }
            }
            if (inRun) {
              const width = 860 - startX;
              pathDataArr.push(\`M\${startX},\${y}h\${width}v1h-\${width}z\`);
            }
          }
          
          window.svgPathResult = pathDataArr.join('');
        };
      </script>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForFunction('window.svgPathResult !== undefined');
  const pathD = await page.evaluate(() => window.svgPathResult);

  fs.writeFileSync(__dirname + '/full_text_path.txt', pathD);
  console.log('Successfully extracted full text path including tagline! Length:', pathD.length);

  await browser.close();
})();
