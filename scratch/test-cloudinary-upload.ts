import dotenv from 'dotenv';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

console.log('--- Cloudinary Credentials Check ---');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? '*****' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'MISSING');
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '*****' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'MISSING');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  const imagePath = '/Users/romit/.gemini/antigravity-ide/brain/30613b49-6c0e-4865-aa98-70ab93e94596/media__1785309065017.jpg';
  console.log('\nUploading image to Cloudinary:', imagePath);

  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'curio-wraps/uploads',
      resource_type: 'image',
    });

    console.log('\n=== UPLOAD SUCCESSFUL ===');
    console.log('Public ID:', result.public_id);
    console.log('Secure URL:', result.secure_url);
    console.log('Format:', result.format);
    console.log('Width x Height:', `${result.width}x${result.height}`);
    console.log('Bytes:', result.bytes);
    console.log('Created At:', result.created_at);
    console.log('Full Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n=== UPLOAD FAILED ===');
    console.error(error);
  }
}

main();
