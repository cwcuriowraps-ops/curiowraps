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
          
          // Separate into:
          // 1. Text canvas (black pixels: luminance < 80)
          // 2. Watercolor canvas (pink/mauve pixels: r > g + 10 && b > g)
          // 3. Subtext bounds (bottom text around y = 620-640)
          
          const textCanvas = document.createElement('canvas');
          textCanvas.width = 1024;
          textCanvas.height = 1024;
          const textCtx = textCanvas.getContext('2d');
          const textData = textCtx.createImageData(1024, 1024);
          
          const wcCanvas = document.createElement('canvas');
          wcCanvas.width = 1024;
          wcCanvas.height = 1024;
          const wcCtx = wcCanvas.getContext('2d');
          const wcData = wcCtx.createImageData(1024, 1024);
          
          let textPixelCount = 0;
          let wcPixelCount = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
            const y = Math.floor((i / 4) / 1024);
            const x = (i / 4) % 1024;
            
            // Background is around r=244, g=243, b=243 (or rgb(240+, 240+, 240+))
            const isBg = r > 235 && g > 235 && b > 235;
            
            if (!isBg) {
              // Luminance
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              
              // If dark text (Curio wraps or - LOVE GIVER -)
              if (lum < 110 && !(r > g + 25 && r > 150)) {
                textData.data[i] = 12;
                textData.data[i+1] = 12;
                textData.data[i+2] = 12;
                textData.data[i+3] = 255;
                textPixelCount++;
              } else if (r > g + 5 && b > g) {
                // Watercolor pink/mauve tone
                wcData.data[i] = r;
                wcData.data[i+1] = g;
                wcData.data[i+2] = b;
                // Calculate opacity relative to bg (244)
                const alpha = Math.min(255, Math.max(0, (244 - g) * 2.2));
                wcData.data[i+3] = alpha;
                wcPixelCount++;
              }
            }
          }
          
          textCtx.putImageData(textData, 0, 0);
          wcCtx.putImageData(wcData, 0, 0);
          
          window.extractedData = {
            textUrl: textCanvas.toDataURL(),
            wcUrl: wcCanvas.toDataURL(),
            textPixelCount,
            wcPixelCount
          };
        };
      </script>
    </body>
    </html>
  `;
  
  await page.setContent(html);
  await page.waitForFunction('window.extractedData !== undefined');
  const extracted = await page.evaluate(() => window.extractedData);
  
  // Save extracted PNG layers
  fs.writeFileSync(__dirname + '/extracted_text.png', Buffer.from(extracted.textUrl.split(',')[1], 'base64'));
  fs.writeFileSync(__dirname + '/extracted_wc.png', Buffer.from(extracted.wcUrl.split(',')[1], 'base64'));
  
  console.log('Extracted text and watercolor layers');
  await browser.close();
})();
