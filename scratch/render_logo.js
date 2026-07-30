const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const code = fs.readFileSync(__dirname + '/build_logo.js', 'utf8');
    const startIdx = code.indexOf('<!DOCTYPE html>');
    const endIdx = code.indexOf('</html>') + 7;
    const htmlContent = code.slice(startIdx, endIdx);
    
    fs.writeFileSync('/Users/romit/Downloads/Dashboard/logo.html', htmlContent);

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 900 });
    await page.goto('file:///Users/romit/Downloads/Dashboard/logo.html', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: '/Users/romit/Downloads/Dashboard/scratch/logo_built.png' });
    await browser.close();
    console.log('Successfully saved logo_built.png');
  } catch (e) {
    console.error(e);
  }
})();
