import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env FIRST before importing database package
const envPath = fs.existsSync('/Users/romit/Downloads/Dashboard/apps/api/.env') 
  ? '/Users/romit/Downloads/Dashboard/apps/api/.env'
  : path.resolve(process.cwd(), '.env');

const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

import jwt from 'jsonwebtoken';

async function testUpload() {
  const { prisma } = await import('@dashboard/database');
  try {
    console.log('1. Finding admin user in DB...');
    const user = await prisma.user.findFirst({
      where: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'] } } },
    }) || await prisma.user.findFirst();

    if (!user) {
      console.error('No admin user found in database!');
      return;
    }
    console.log(`Found admin user: ${user.email} (${user.id})`);

    const token = jwt.sign(
      { sub: user.id, userId: user.id, email: user.email, role: user.role, type: 'access' },
      process.env.JWT_ACCESS_SECRET || 'secret',
      { expiresIn: '1h' }
    );
    console.log('Generated test JWT token.');

    const imagePath = '/Users/romit/.gemini/antigravity-ide/brain/679ef72c-ad20-4803-80ed-2899a15851f2/media__1785309602824.jpg';
    console.log(`2. Preparing file upload: ${imagePath}`);

    const fileBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, 'sunflower.jpg');

    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    console.log(`3. Sending POST request to ${apiUrl}/api/v1/admin/media/upload...`);

    const res = await fetch(`${apiUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Response body:', text);

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testUpload();
