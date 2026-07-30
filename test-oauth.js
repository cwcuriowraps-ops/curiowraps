const http = require('http');

const data = JSON.stringify({
  provider: 'GOOGLE',
  idToken: 'dummy-token'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/auth/oauth',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
