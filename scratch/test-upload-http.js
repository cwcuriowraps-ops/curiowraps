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

import jwt from 'jsonwebtoken';

async function main() {
  const { prisma } = await import('@dashboard/database');

  console.log('Finding admin user...');
  const user = await prisma.user.findFirst({
    where: { role: { name: 'ADMIN' } },
  });

  const token = jwt.sign(
    { sub: user.id, userId: user.id, email: user.email, role: 'ADMIN', type: 'access' },
    process.env.JWT_ACCESS_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  const imagePath = '/Users/romit/.gemini/antigravity-ide/brain/679ef72c-ad20-4803-80ed-2899a15851f2/media__1785309602824.jpg';
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', blob, 'sunflower.jpg');

  console.log('Sending fetch request to http://localhost:4000/api/v1/admin/media/upload ...');
  const controller = new AbortController();
  const timer = setTimeout(() => {
    console.log('TIMEOUT 10s HIT!');
    controller.abort();
  }, 10000);

  try {
    const res = await fetch('http://localhost:4000/api/v1/admin/media/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);
    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Response Data:', data);
  } catch (err) {
    console.error('Fetch error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
