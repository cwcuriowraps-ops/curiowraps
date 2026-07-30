import axios from "axios";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000/api/v1";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:Sillycore123%40@db.tggufvedwtpcxamkqihy.supabase.co:5432/postgres",
    },
  },
});

async function main() {
  console.log("\n=======================================================================");
  console.log("  TESTING ADMIN EMAIL MANAGEMENT & DYNAMIC SENDER RELOAD");
  console.log("=======================================================================\n");

  const adminEmail = "admin@curiowrap.com";
  const adminPassword = "Password123!";

  // 1. Login as Admin
  let adminToken = "";
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    adminToken = loginRes.data?.data?.tokens?.accessToken || loginRes.data?.data?.accessToken;
    console.log(`✅ Admin Login Succeeded for ${adminEmail}. Token acquired.`);
  } catch (loginErr: any) {
    console.error(`❌ Admin Login Failed: ${loginErr.response?.data?.error?.message || loginErr.message}`);
    return;
  }

  const authHeaders = { Authorization: `Bearer ${adminToken}` };

  // 2. GET Email Settings
  try {
    const getRes = await axios.get(`${API_BASE}/admin/settings/email`, { headers: authHeaders });
    console.log(`✅ GET /admin/settings/email Status ${getRes.status}:`, getRes.data.data);
  } catch (getErr: any) {
    console.error(`❌ GET /admin/settings/email Failed:`, getErr.response?.data || getErr.message);
  }

  // 3. PUT Email Settings (Update Sender Name & Reply-To)
  const updatedPayload = {
    senderName: "Curio Wraps Official Store",
    senderEmail: "cw.curiowraps@gmail.com",
    replyToEmail: "support@curiowraps.com",
  };

  try {
    const putRes = await axios.put(`${API_BASE}/admin/settings/email`, updatedPayload, { headers: authHeaders });
    console.log(`✅ PUT /admin/settings/email Status ${putRes.status}:`, putRes.data);
  } catch (putErr: any) {
    console.error(`❌ PUT /admin/settings/email Failed:`, putErr.response?.data || putErr.message);
  }

  // 4. Verify DB Storage
  const dbSetting = await prisma.setting.findUnique({ where: { key: "email_settings" } });
  console.log("\n✅ Database Record for 'email_settings':", dbSetting?.value);

  // 5. POST Send Test Email
  try {
    const testRes = await axios.post(`${API_BASE}/admin/settings/email/test`, {}, { headers: authHeaders });
    console.log(`\n✅ POST /admin/settings/email/test Status ${testRes.status}:`, testRes.data);
  } catch (testErr: any) {
    console.error(`❌ POST /admin/settings/email/test Failed:`, testErr.response?.data || testErr.message);
  }

  // 6. Trigger Forgot Password to confirm dynamic sender reload
  try {
    const forgotRes = await axios.post(`${API_BASE}/auth/forgot-password`, { email: "cw.curiowraps@gmail.com" });
    console.log(`\n✅ Forgot Password Trigger Status ${forgotRes.status}: "${forgotRes.data?.data?.message || forgotRes.data?.message}"`);
  } catch (forgotErr: any) {
    console.error(`❌ Forgot Password Failed:`, forgotErr.response?.data || forgotErr.message);
  }

  await prisma.$disconnect();
  console.log("\n=======================================================================");
  console.log("  ADMIN EMAIL MANAGEMENT TEST COMPLETE");
  console.log("=======================================================================\n");
}

main().catch(console.error);
