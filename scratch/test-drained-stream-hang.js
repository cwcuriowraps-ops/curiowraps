import multer from 'multer';
import fs from 'fs';
import { Readable } from 'stream';

// Simulate a consumed stream
const stream = new Readable();
stream.push('hello world');
stream.push(null);

// Read stream to end
stream.on('data', () => {});
stream.on('end', () => {
  console.log('Stream ended.');
  
  // Now try diskStorage on consumed stream
  const diskStorage = multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => cb(null, 'test.txt'),
  });

  console.log('Calling diskStorage._handleFile on drained stream...');
  let cbCalled = false;
  
  const timer = setTimeout(() => {
    if (!cbCalled) {
      console.log('❌ CONFIRMED BUG: diskStorage._handleFile HUNG FOREVER on drained stream!');
      process.exit(1);
    }
  }, 3000);

  diskStorage._handleFile({}, { stream, originalname: 'test.txt' }, (err, info) => {
    cbCalled = true;
    clearTimeout(timer);
    console.log('Callback called:', err, info);
  });
});
