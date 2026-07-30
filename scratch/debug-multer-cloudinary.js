import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env
const envPath = fs.existsSync('/Users/romit/Downloads/Dashboard/apps/api/.env') 
  ? '/Users/romit/Downloads/Dashboard/apps/api/.env'
  : path.resolve(process.cwd(), '.env');

const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'curio-wrap',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
  },
});

console.log('Testing CloudinaryStorage._handleFile directly...');

const imagePath = '/Users/romit/.gemini/antigravity-ide/brain/679ef72c-ad20-4803-80ed-2899a15851f2/media__1785309602824.jpg';
const fileStream = fs.createReadStream(imagePath);

const fakeReq = {};
const fakeFile = {
  fieldname: 'file',
  originalname: 'sunflower.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  stream: fileStream,
};

storage._handleFile(fakeReq, fakeFile, (err, info) => {
  if (err) {
    console.error('Error from CloudinaryStorage._handleFile:', err);
  } else {
    console.log('Success info from CloudinaryStorage._handleFile:', info);
  }
});
