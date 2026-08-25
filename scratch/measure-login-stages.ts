import { prisma } from "@dashboard/database";
import { UserRepository } from "../apps/api/src/repositories/user.repository";
import { RoleRepository } from "../apps/api/src/repositories/role.repository";
import { verifyPassword, hashPassword } from "../apps/api/src/lib/password";
import { durationToMs, hashToken, signJwt, createTokenId } from "../apps/api/src/lib/jwt";

async function measureLoginDataPath() {
  console.log("=== FULL ADMIN LOGIN FLOW STAGE-BY-STAGE AUDIT ===");

  const testEmail = "admin.perf.test@curiowrap.com";
  const testPassword = "AdminSecurePass123!";
  const userRepo = new UserRepository(prisma);
  const roleRepo = new RoleRepository(prisma);

  // Setup test user
  await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  const adminRole = await prisma.role.findFirst({ where: { name: "ADMIN" } });
  const passwordHash = await hashPassword(testPassword, 12);

  const createdUser = await userRepo.create({
    email: testEmail,
    passwordHash,
    firstName: "Admin",
    lastName: "Tester",
    role: { connect: { id: adminRole!.id } },
    status: "ACTIVE",
    emailVerifiedAt: new Date(),
  });

  console.log(`Created test admin user: ${createdUser.email} (ID: ${createdUser.id})`);

  // --- STAGE MEASUREMENTS ---

  // Stage 1: DB Connection Ping
  const t0 = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const tDbConn = performance.now() - t0;
  console.log(`1. DB Connection Acquisition: ${tDbConn.toFixed(1)}ms`);

  // Stage 2: User Query (findByEmail)
  const t1 = performance.now();
  const user = await userRepo.findByEmail(testEmail);
  const tUserQuery = performance.now() - t1;
  console.log(`2. User Query (findByEmail + role + permissions): ${tUserQuery.toFixed(1)}ms`);

  // Stage 3: bcrypt verification
  const t2 = performance.now();
  const isValidPassword = await verifyPassword(testPassword, user!.passwordHash!);
  const tBcrypt = performance.now() - t2;
  console.log(`3. bcrypt verification (cost 12): ${tBcrypt.toFixed(1)}ms (valid: ${isValidPassword})`);

  // Stage 4: Role/permission evaluation
  const t3 = performance.now();
  const roleName = user!.role.name;
  const permissions = user!.role.permissions?.map((p: any) => p.permission.code) || [];
  const tRole = performance.now() - t3;
  console.log(`4. Role/Permission Loading: ${tRole.toFixed(3)}ms (role: ${roleName}, permissions: ${permissions.length})`);

  // Stage 5: Token Generation (JWT Access + Refresh)
  const t4 = performance.now();
  const accessToken = signJwt(
    {
      sub: user!.id,
      userId: user!.id,
      email: user!.email,
      role: user!.role.name,
      jti: createTokenId(),
      tokenType: "access",
    },
    "d7357d704eab4c79c5d29b0fff9b08bc882ef99d3d47aa40efc2cd12e44ea91e",
    "15m"
  );
  const refreshToken = signJwt(
    {
      sub: user!.id,
      userId: user!.id,
      jti: createTokenId(),
      tokenType: "refresh",
    },
    "d7357d704eab4c79c5d29b0fff9b08bc882ef99d3d47aa40efc2cd12e44ea91e",
    "30d"
  );
  const tTokenGen = performance.now() - t4;
  console.log(`5. Token Generation: ${tTokenGen.toFixed(2)}ms`);

  // Stage 6: Parallel Session Writes (storeRefreshToken + updateLastLoginAt)
  const t5 = performance.now();
  const tokenHash = hashToken(refreshToken, "d7357d704eab4c79c5d29b0fff9b08bc882ef99d3d47aa40efc2cd12e44ea91e");
  await Promise.all([
    prisma.refreshToken.create({
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        user: { connect: { id: user!.id } },
        userAgent: "Admin Perf Test",
        ipAddress: "127.0.0.1",
      },
    }),
    userRepo.updateLastLoginAt(user!.id, new Date()),
  ]);
  const tSessionWrites = performance.now() - t5;
  console.log(`6. Session / DB Writes: ${tSessionWrites.toFixed(1)}ms`);

  // Stage 7: Live API HTTP Request POST /api/v1/auth/login
  console.log("\n--- Live HTTP Request via Express API ---");
  const tHttp0 = performance.now();
  const httpRes = await fetch("http://localhost:4000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  const tHttp = performance.now() - tHttp0;
  const httpData = await httpRes.json();
  console.log(`7. HTTP POST /api/v1/auth/login: Status ${httpRes.status}, Latency: ${tHttp.toFixed(1)}ms, Success: ${httpData.success}`);

  // Stage 8: Initial Dashboard Requests
  console.log("\n--- Dashboard Initial Requests (Triggered on Login) ---");
  const tDash0 = performance.now();
  const dashRes = await fetch("http://localhost:4000/api/v1/admin/system/dashboard", {
    headers: { Authorization: `Bearer ${httpData.data.accessToken}` },
  });
  const tDash = performance.now() - tDash0;
  console.log(`8. Dashboard Stats Request: Status ${dashRes.status}, Latency: ${tDash.toFixed(1)}ms`);

  // Cleanup
  await prisma.refreshToken.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  await prisma.$disconnect();
}

measureLoginDataPath().catch(console.error);
