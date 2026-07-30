import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env FIRST
const envPath = fs.existsSync('/Users/romit/Downloads/Dashboard/apps/api/.env') 
  ? '/Users/romit/Downloads/Dashboard/apps/api/.env'
  : path.resolve(process.cwd(), '.env');

const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

import supertest from 'supertest';
import jwt from 'jsonwebtoken';

async function main() {
  console.log('1. Importing app and database...');
  const { createApp } = await import('../apps/api/src/app');
  const { createApiConfig } = await import('../apps/api/src/config');
  const { createLogger } = await import('../apps/api/src/lib/logger');
  const { prisma } = await import('@dashboard/database');

  const config = createApiConfig();
  const logger = createLogger(config);

  // Instantiate dependencies needed by createApp
  const { AuthService } = await import('../apps/api/src/services/auth.service');
  const { UserService } = await import('../apps/api/src/services/user.service');
  const { MediaService } = await import('../apps/api/src/services/media.service');
  const { MediaRepository } = await import('../apps/api/src/repositories/media.repository');

  const mediaRepo = new MediaRepository(prisma);
  const mediaService = new MediaService(prisma, mediaRepo);

  const expressApp = createApp({
    config,
    logger,
    mediaService,
    prisma,
  });

  console.log('2. Finding admin user...');
  const user = await prisma.user.findFirst({
    where: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'] } } },
  }) || await prisma.user.findFirst();

  if (!user) {
    console.error('No user found in DB');
    return;
  }
  console.log(`User found: ${user.email} (${user.id})`);

  const token = jwt.sign(
    { sub: user.id, userId: user.id, email: user.email, role: 'ADMIN', type: 'access' },
    process.env.JWT_ACCESS_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  const imagePath = '/Users/romit/.gemini/antigravity-ide/brain/679ef72c-ad20-4803-80ed-2899a15851f2/media__1785309602824.jpg';
  console.log(`3. Sending supertest request to /api/v1/admin/media/upload with file: ${imagePath}`);

  const res = await supertest(expressApp)
    .post('/api/v1/admin/media/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', imagePath);

  console.log('\n================ RESPONSE ================');
  console.log('Status:', res.status);
  console.log('Headers:', res.headers);
  console.log('Body:', JSON.stringify(res.body, null, 2));
  console.log('Text:', res.text);
  console.log('==========================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Supertest execution error:', err);
});
