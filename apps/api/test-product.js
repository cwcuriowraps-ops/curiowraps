const http = require('http');

const data = JSON.stringify({
  name: "Test Product " + Date.now(),
  images: {
    create: [
      { url: "https://example.com/test.jpg" }
    ]
  },
  variants: {
    create: [
      { sku: "TEST-" + Date.now(), title: "Default", price: 100 }
    ]
  }
});

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/admin/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(res.statusCode, body));
});

req.write(data);
req.end();
