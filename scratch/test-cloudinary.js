import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env directly
const envPath = fs.existsSync('/Users/romit/Downloads/Dashboard/apps/api/.env') 
  ? '/Users/romit/Downloads/Dashboard/apps/api/.env'
  : path.resolve(process.cwd(), '.env');

const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

console.log('--- Cloudinary Config Check ---');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? '****' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'MISSING');
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '****' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'MISSING');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const imagePath = '/Users/romit/.gemini/antigravity-ide/brain/679ef72c-ad20-4803-80ed-2899a15851f2/media__1785309602824.jpg';

async function main() {
  try {
    console.log('\nChecking Cloudinary connection via API ping...');
    const pingResult = await cloudinary.api.ping();
    console.log('Ping result:', pingResult);

    console.log(`\nUploading image: ${imagePath}`);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found at ${imagePath}`);
    }

    const uploadResult = await cloudinary.uploader.upload(imagePath, {
      folder: 'dashboard_test_uploads',
      resource_type: 'image',
    });

    console.log('\n================ UPLOAD SUCCESS ================');
    console.log(JSON.stringify(uploadResult, null, 2));
    console.log('================================================\n');

  } catch (error) {
    console.error('\n❌ Cloudinary Error:', error);
  }
}

main();
