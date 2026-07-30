const fs = require('fs');
const puppeteer = require('puppeteer');

// 1. Update logo.html (translate y from 160 to 195)
let htmlContent = fs.readFileSync('/Users/romit/Downloads/Dashboard/logo.html', 'utf8');
htmlContent = htmlContent.replace('<g transform="translate(0, 160)" class="watercolor-group">', '<g transform="translate(0, 195)" class="watercolor-group">');
fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.html', htmlContent);
fs.writeFileSync('/Users/romit/Downloads/Dashboard/apps/storefront/public/logo.html', htmlContent);

// 2. Update WatercolorLogo.tsx (translate y from 160 to 195 & animation translate y from 160 to 195)
let tsxContent = fs.readFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/WatercolorLogo.tsx', 'utf8');
tsxContent = tsxContent.replace('transform: translate(0, 160px) scale(1);', 'transform: translate(0, 195px) scale(1);');
tsxContent = tsxContent.replace('transform: translate(0, 160px) scale(1.012);', 'transform: translate(0, 195px) scale(1.012);');
tsxContent = tsxContent.replace('<g transform="translate(0, 160)" className="animate-watercolor-breathe">', '<g transform="translate(0, 195)" className="animate-watercolor-breathe">');
fs.writeFileSync('/Users/romit/Downloads/Dashboard/packages/ui/src/components/WatercolorLogo.tsx', tsxContent);

// 3. Render verification screenshot
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 750 });

  await page.goto('file:///Users/romit/Downloads/Dashboard/logo.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: '/Users/romit/Downloads/Dashboard/scratch/adjusted_watercolor_position.png' });

  await browser.close();
  console.log('Successfully rendered adjusted_watercolor_position.png');
})();
