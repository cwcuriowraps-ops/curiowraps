import { prisma } from "@dashboard/database";
import { UserRepository } from "../apps/api/src/repositories/user.repository";
import { RoleRepository } from "../apps/api/src/repositories/role.repository";

async function testOptimizedOAuth() {
  console.log("=== TESTING OPTIMIZED OAUTH FLOW TIMING ===");

  const userRepo = new UserRepository(prisma);
  const roleRepo = new RoleRepository(prisma);
  const testEmail = "oauth.speed.test@curiowrap.com";

  // Cleanup test user first
  await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  // 1. New User OAuth Registration Flow
  console.log("\n--- TEST 1: New User OAuth Registration ---");
  const t0 = performance.now();
  
  // Step A: findByEmail
  const tFind0 = performance.now();
  const existing0 = await userRepo.findByEmail(testEmail);
  const tFindVal0 = performance.now() - tFind0;
  console.log(`Step 1 (findByEmail): ${tFindVal0.toFixed(1)}ms (exists: ${!!existing0})`);

  // Step B: ensureCustomerRole (cached in-memory)
  const tRole0 = performance.now();
  const role0 = await roleRepo.ensureCustomerRole();
  const tRoleVal0 = performance.now() - tRole0;
  console.log(`Step 2 (ensureCustomerRole): ${tRoleVal0.toFixed(1)}ms`);

  // Step C: user.create (with emailVerifiedAt and lastLoginAt set immediately)
  const tCreate0 = performance.now();
  const newUser = await userRepo.create({
    email: testEmail,
    firstName: "Speed",
    lastName: "Tester",
    avatarUrl: "https://example.com/avatar.jpg",
    provider: "GOOGLE",
    providerId: "google-speed-123",
    emailVerifiedAt: new Date(),
    lastLoginAt: new Date(),
    role: { connect: { id: role0.id } },
  });
  const tCreateVal0 = performance.now() - tCreate0;
  console.log(`Step 3 (user.create atomic): ${tCreateVal0.toFixed(1)}ms`);

  // Step D: storeRefreshToken
  const tToken0 = performance.now();
  await prisma.refreshToken.create({
    data: {
      tokenHash: "test_hash_12345",
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      user: { connect: { id: newUser.id } },
      userAgent: "Mozilla/5.0",
      ipAddress: "127.0.0.1",
    },
  });
  const tTokenVal0 = performance.now() - tToken0;
  console.log(`Step 4 (storeRefreshToken): ${tTokenVal0.toFixed(1)}ms`);

  const tTotalNew = performance.now() - t0;
  console.log(`>> TOTAL NEW USER OAUTH LATENCY: ${tTotalNew.toFixed(1)}ms`);

  // 2. Existing User OAuth Login Flow
  console.log("\n--- TEST 2: Existing User OAuth Login ---");
  const t1 = performance.now();

  // Step A: findByEmail
  const tFind1 = performance.now();
  const existing1 = await userRepo.findByEmail(testEmail);
  const tFindVal1 = performance.now() - tFind1;
  console.log(`Step 1 (findByEmail): ${tFindVal1.toFixed(1)}ms (found: ${!!existing1})`);

  // Step B: direct user.update (lastLoginAt & provider)
  const tUpdate1 = performance.now();
  await prisma.user.update({
    where: { id: existing1!.id },
    data: { lastLoginAt: new Date() },
    select: { id: true },
  });
  const tUpdateVal1 = performance.now() - tUpdate1;
  console.log(`Step 2 (user.update lastLoginAt): ${tUpdateVal1.toFixed(1)}ms`);

  // Step C: storeRefreshToken
  const tToken1 = performance.now();
  await prisma.refreshToken.create({
    data: {
      tokenHash: "test_hash_67890",
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      user: { connect: { id: existing1!.id } },
      userAgent: "Mozilla/5.0",
      ipAddress: "127.0.0.1",
    },
  });
  const tTokenVal1 = performance.now() - tToken1;
  console.log(`Step 3 (storeRefreshToken): ${tTokenVal1.toFixed(1)}ms`);

  const tTotalExisting = performance.now() - t1;
  console.log(`>> TOTAL EXISTING USER OAUTH LATENCY: ${tTotalExisting.toFixed(1)}ms`);

  // Cleanup
  await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  await prisma.$disconnect();
}

testOptimizedOAuth().catch(console.error);
