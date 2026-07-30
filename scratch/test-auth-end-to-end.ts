import axios from "axios";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000/api/v1";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres.tggufvedwtpcxamkqihy:Sillycore123%40@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require&connect_timeout=15",
    },
  },
});

async function runAuthSuite() {
  console.log("\n=======================================================");
  console.log("  STARTING END-TO-END AUTH & FORGOT PASSWORD SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail ? JSON.stringify(detail, null, 2) : "");
      failed++;
    }
  }

  // Ensure test user exists in DB
  const testEmail = "admin@curiowrap.com";
  const correctPassword = "Password123!";
  const wrongPassword = "WrongPassword999";
  const nonExistentEmail = `nonexistent_${Date.now()}@example.com`;

  // 1. Existing user + correct password
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: correctPassword
    });
    assert(res.data.success && Boolean(res.data.data.accessToken), "1. Existing user + correct password login", res.data);
  } catch (err: any) {
    assert(false, "1. Existing user + correct password login", err.response?.data || err.message);
  }

  // 2. Existing user + incorrect password
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: wrongPassword
    });
    assert(false, "2. Existing user + incorrect password should fail");
  } catch (err: any) {
    const errData = err.response?.data?.error;
    assert(
      err.response?.status === 401 && errData?.code === "INCORRECT_PASSWORD" && errData?.message === "Incorrect password. Please try again.",
      "2. Existing user + incorrect password returns proper UX error",
      errData
    );
  }

  // 3. Non-existing email on login
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: nonExistentEmail,
      password: correctPassword
    });
    assert(false, "3. Non-existing email login should fail");
  } catch (err: any) {
    const errData = err.response?.data?.error;
    assert(
      err.response?.status === 404 && errData?.code === "ACCOUNT_NOT_FOUND" && errData?.message === "No account found with this email.",
      "3. Non-existing email login returns ACCOUNT_NOT_FOUND",
      errData
    );
  }

  // 4. Forgot Password for non-existent account
  try {
    await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: nonExistentEmail
    });
    assert(false, "4. Forgot password for non-existent email should fail");
  } catch (err: any) {
    const errData = err.response?.data?.error;
    assert(
      err.response?.status === 404 && errData?.code === "ACCOUNT_NOT_FOUND" && errData?.message === "No account found with this email.",
      "4. Forgot password for non-existent email returns ACCOUNT_NOT_FOUND",
      errData
    );
  }

  // 5. Forgot Password for existing user
  let resetToken = "";
  try {
    const res = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: testEmail
    });
    assert(
      res.data.success && res.data.data.message === "Password reset link sent successfully. Please check your inbox.",
      "5. Forgot password for existing account returns success message",
      res.data
    );

    // Verify token persisted in database
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      const dbToken = await prisma.passwordResetToken.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      });
      assert(Boolean(dbToken && !dbToken.consumedAt), "5b. Token correctly generated & persisted in database");
    }
  } catch (err: any) {
    assert(false, "5. Forgot password for existing account", err.response?.data || err.message);
  }

  // 6. Reset Password with invalid token
  try {
    await axios.post(`${API_BASE}/auth/reset-password`, {
      token: "invalid_token_12345",
      newPassword: "NewAdminPassword123!"
    });
    assert(false, "6. Reset password with invalid token should fail");
  } catch (err: any) {
    const errData = err.response?.data?.error;
    assert(
      err.response?.status === 400 && errData?.code === "INVALID_TOKEN" && errData?.message === "Reset token is invalid or expired",
      "6. Reset password with invalid token returns INVALID_TOKEN",
      errData
    );
  }

  console.log("\n=======================================================");
  console.log(`  E2E AUTH SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

runAuthSuite().catch(console.error);
