import { prisma } from "@dashboard/database";
import { UserRepository } from "../apps/api/src/repositories/user.repository";
import { verifyPassword, hashPassword } from "../apps/api/src/lib/password";
import { durationToMs, hashToken, signJwt, createTokenId } from "../apps/api/src/lib/jwt";

async function measureAdminLoginStages() {
  console.log("=== ADMIN LOGIN END-TO-END TIMING AUDIT ===");

  const adminEmail = "admin@curiowrap.com";
  const userRepo = new UserRepository(prisma);

  // 1. DB Connection Acquisition
  const t0 = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const tDbConn = performance.now() - t0;
  console.log(`[1] DB Connection Ping: ${tDbConn.toFixed(1)}ms`);

  // 2. User query with role & permissions
  const t1 = performance.now();
  const user = await userRepo.findByEmail(adminEmail);
  const tUserQuery = performance.now() - t1;
  console.log(`[2] User Query (findByEmail with role+permissions): ${tUserQuery.toFixed(1)}ms (Found: ${!!user}, Role: ${user?.role?.name})`);

  // 3. bcrypt verification
  const t2 = performance.now();
  const testPassword = "Password123!";
  const passwordMatches = user?.passwordHash ? await verifyPassword(testPassword, user.passwordHash) : false;
  const tBcrypt = performance.now() - t2;
  console.log(`[3] bcrypt verification (rounds 12): ${tBcrypt.toFixed(1)}ms (Match: ${passwordMatches})`);

  // 4. Token generation (Access JWT + Refresh JWT)
  const t3 = performance.now();
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
  const tTokenGen = performance.now() - t3;
  console.log(`[4] Token Generation (JWT Access + Refresh): ${tTokenGen.toFixed(2)}ms`);

  // 5. Parallel writes (storeRefreshToken + updateLastLoginAt)
  const t4 = performance.now();
  const tokenHash = hashToken(refreshToken, "d7357d704eab4c79c5d29b0fff9b08bc882ef99d3d47aa40efc2cd12e44ea91e");
  await Promise.all([
    prisma.refreshToken.create({
      data: {
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        user: { connect: { id: user!.id } },
        userAgent: "Admin Benchmark",
        ipAddress: "127.0.0.1",
      },
    }),
    userRepo.updateLastLoginAt(user!.id, new Date()),
  ]);
  const tParallelWrites = performance.now() - t4;
  console.log(`[5] Parallel Session Writes (storeRefreshToken + updateLastLoginAt): ${tParallelWrites.toFixed(1)}ms`);

  // 6. Live HTTP POST /api/v1/auth/login
  console.log("\n--- Live HTTP /api/v1/auth/login Request ---");
  const tHttp0 = performance.now();
  const res = await fetch("http://localhost:4000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password: testPassword }),
  });
  const tHttpTotal = performance.now() - tHttp0;
  const json = await res.json();
  console.log(`[6] Live HTTP POST /auth/login: Status ${res.status}, Latency: ${tHttpTotal.toFixed(1)}ms, Success: ${json.success}`);

  // 7. Cleanup benchmark refresh token
  await prisma.refreshToken.deleteMany({ where: { user: { email: adminEmail }, userAgent: "Admin Benchmark" } });

  await prisma.$disconnect();
}

measureAdminLoginStages().catch(console.error);
