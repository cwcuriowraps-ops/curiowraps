const fs = require('fs');
const puppeteer = require('puppeteer');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=WindSong:wght@400;500&family=Herr+Von+Muellerhoff&family=Monsieur+La+Doulaise&family=Alex+Brush&family=Pinyon+Script&family=Ruthie&family=Mr+De+Havilland&family=Kristi&family=La+Belle+Aurore&family=Great+Vibes&family=Pathway+Extreme:wght@300&family=Cinzel:wght@400&family=Cormorant+Garamond:wght@300&family=Montserrat:wght@200;300&display=swap');
    
    body {
      background: #f4f3f3;
      font-family: sans-serif;
      padding: 40px;
    }
    
    .font-box {
      margin-bottom: 40px;
      padding: 20px;
      background: white;
      border-radius: 8px;
    }

    .title { font-size: 14px; color: #666; margin-bottom: 10px; }
    .text-ws { font-family: 'WindSong', cursive; font-size: 110px; }
    .text-hvm { font-family: 'Herr Von Muellerhoff', cursive; font-size: 120px; }
    .text-mld { font-family: 'Monsieur La Doulaise', cursive; font-size: 120px; }
    .text-ab { font-family: 'Alex Brush', cursive; font-size: 110px; }
    .text-ps { font-family: 'Pinyon Script', cursive; font-size: 110px; }
    .text-mdh { font-family: 'Mr De Havilland', cursive; font-size: 120px; }
    .text-kr { font-family: 'Kristi', cursive; font-size: 130px; }
    .text-lba { font-family: 'La Belle Aurore', cursive; font-size: 100px; }
  </style>
</head>
<body>
  <div class="font-box"><div class="title">WindSong</div><div class="text-ws">Curio wraps</div></div>
  <div class="font-box"><div class="title">Herr Von Muellerhoff</div><div class="text-hvm">Curio wraps</div></div>
  <div class="font-box"><div class="title">Monsieur La Doulaise</div><div class="text-mld">Curio wraps</div></div>
  <div class="font-box"><div class="title">Alex Brush</div><div class="text-ab">Curio wraps</div></div>
  <div class="font-box"><div class="title">Pinyon Script</div><div class="text-ps">Curio wraps</div></div>
  <div class="font-box"><div class="title">Mr De Havilland</div><div class="text-mdh">Curio wraps</div></div>
  <div class="font-box"><div class="title">Kristi</div><div class="text-kr">Curio wraps</div></div>
  <div class="font-box"><div class="title">La Belle Aurore</div><div class="text-lba">Curio wraps</div></div>
</body>
</html>
`;

fs.writeFileSync(__dirname + '/test_fonts.html', htmlContent);

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1600 });
  await page.goto('file://' + __dirname + '/test_fonts.html', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: __dirname + '/font_comparison.png', fullPage: true });
  await browser.close();
  console.log('Font comparison rendered');
})();
