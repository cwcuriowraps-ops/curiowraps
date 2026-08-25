import { prisma } from "@dashboard/database";
import { UserRepository } from "../apps/api/src/repositories/user.repository";
import { RoleRepository } from "../apps/api/src/repositories/role.repository";

async function runOAuthBenchmark() {
  console.log("=== OAUTH LOGIN TIMING & BOTTLENECK AUDIT ===");

  const testEmail = "oauth.test.user@curiowrap.com";

  // 1. Warm connection
  const t0 = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const tWarm = performance.now() - t0;
  console.log(`[0] DB Connection Ping: ${tWarm.toFixed(1)}ms`);

  // 2. Measure findByEmail
  const t1 = performance.now();
  const userRepo = new UserRepository(prisma);
  const existingUser = await userRepo.findByEmail(testEmail);
  const tFindByEmail = performance.now() - t1;
  console.log(`[1] findByEmail (with 3-level role+permissions include): ${tFindByEmail.toFixed(1)}ms (found: ${!!existingUser})`);

  // 3. Measure ensureCustomerRole
  const t2 = performance.now();
  const roleRepo = new RoleRepository(prisma);
  const role = await roleRepo.ensureCustomerRole();
  const tEnsureRole = performance.now() - t2;
  console.log(`[2] ensureCustomerRole: ${tEnsureRole.toFixed(1)}ms (roleId: ${role.id})`);

  // 4. Measure interactive transaction overhead with sequential queries
  const t3 = performance.now();
  await prisma.$transaction(async (tx) => {
    const tTxStart = performance.now();
    
    // Query 1 inside Tx: find role
    const r1 = await tx.role.findUnique({ where: { name: "CUSTOMER" } });
    const tTxQ1 = performance.now() - tTxStart;
    console.log(`    [Tx Q1] role.findUnique: ${tTxQ1.toFixed(1)}ms`);

    // Query 2 inside Tx: upsert user
    const tTx2 = performance.now();
    const u = await tx.user.upsert({
      where: { email: testEmail },
      create: {
        email: testEmail,
        firstName: "OAuth",
        lastName: "Tester",
        roleId: r1!.id,
        provider: "GOOGLE",
        providerId: "google-12345",
        emailVerifiedAt: new Date(),
      },
      update: {
        provider: "GOOGLE",
        providerId: "google-12345",
        lastLoginAt: new Date(),
      },
    });
    const tTxQ2 = performance.now() - tTx2;
    console.log(`    [Tx Q2] user.upsert: ${tTxQ2.toFixed(1)}ms`);

    // Query 3 inside Tx: updateLastLoginAt with full 3-level include (current code)
    const tTx3 = performance.now();
    await tx.user.update({
      where: { id: u.id },
      data: { lastLoginAt: new Date() },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    const tTxQ3 = performance.now() - tTx3;
    console.log(`    [Tx Q3] updateLastLoginAt (with 3-level include): ${tTxQ3.toFixed(1)}ms`);
  }, { maxWait: 15000, timeout: 20000 });

  const tTotalTx = performance.now() - t3;
  console.log(`[3] Total Interactive $transaction Duration: ${tTotalTx.toFixed(1)}ms`);

  // 5. Measure single direct atomic query alternative
  const t4 = performance.now();
  const directUpsert = await prisma.user.upsert({
    where: { email: testEmail },
    create: {
      email: testEmail,
      firstName: "OAuth",
      lastName: "Tester",
      role: { connect: { name: "CUSTOMER" } },
      provider: "GOOGLE",
      providerId: "google-12345",
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
    update: {
      provider: "GOOGLE",
      providerId: "google-12345",
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      status: true,
      deletedAt: true,
      emailVerifiedAt: true,
      dateOfBirth: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: {
            select: {
              permission: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  });
  const tDirect = performance.now() - t4;
  console.log(`[4] Direct Atomic Upsert with Project (No interactive Tx): ${tDirect.toFixed(1)}ms`);

  await prisma.$disconnect();
}

runOAuthBenchmark().catch(console.error);
