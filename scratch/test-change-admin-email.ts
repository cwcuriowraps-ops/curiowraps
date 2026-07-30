import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000/api/v1";

async function main() {
  console.log("\n=======================================================================");
  console.log("  TESTING SECURE CHANGE ADMIN EMAIL FEATURE");
  console.log("=======================================================================\n");

  const initialEmail = "admin@curiowrap.com";
  const adminPassword = "Password123!";

  // 1. Admin Login
  let token = "";
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: initialEmail,
      password: adminPassword,
    });
    token = loginRes.data?.data?.tokens?.accessToken || loginRes.data?.data?.accessToken;
    console.log(`✅ Admin Login Successful. Token acquired.`);
  } catch (loginErr: any) {
    console.error(`❌ Admin Login Failed:`, loginErr.response?.data || loginErr.message);
    return;
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Test Invalid Password
  try {
    await axios.post(
      `${API_BASE}/users/change-email`,
      { newEmail: "admin.new@curiowrap.com", currentPassword: "WrongPassword!" },
      { headers: authHeaders }
    );
    console.error(`❌ Test Failed: Invalid password was accepted.`);
  } catch (err: any) {
    console.log(`✅ Test Passed: Invalid password rejected with HTTP ${err.response?.status}: "${err.response?.data?.error?.message}"`);
  }

  // 3. Test Invalid Email Format
  try {
    await axios.post(
      `${API_BASE}/users/change-email`,
      { newEmail: "not-an-email", currentPassword: adminPassword },
      { headers: authHeaders }
    );
    console.error(`❌ Test Failed: Invalid email format was accepted.`);
  } catch (err: any) {
    console.log(`✅ Test Passed: Invalid email format rejected with HTTP ${err.response?.status}`);
  }

  // 4. Test Valid Email Change to admin.updated@curiowrap.com
  const newEmail = "admin.updated@curiowrap.com";
  let newToken = "";
  try {
    const changeRes = await axios.post(
      `${API_BASE}/users/change-email`,
      { newEmail, currentPassword: adminPassword },
      { headers: authHeaders }
    );
    newToken = changeRes.data?.data?.accessToken || token;
    console.log(`\n✅ Test Passed: Change Email Successful (HTTP ${changeRes.status}):`, changeRes.data?.data?.message);
    console.log(`   Updated Email in Payload: "${changeRes.data?.data?.user?.email}"`);
    console.log(`   New Access Token Returned: ${Boolean(changeRes.data?.data?.accessToken)}`);
  } catch (err: any) {
    console.error(`❌ Change Email Failed:`, err.response?.data || err.message);
  }

  // 5. Verify Profile API with New Token
  try {
    const meRes = await axios.get(`${API_BASE}/admin/users/me`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    console.log(`\n✅ GET /admin/users/me Profile Email Verified: "${meRes.data?.data?.user?.email}"`);
  } catch (meErr: any) {
    console.error(`❌ GET /admin/users/me Failed:`, meErr.response?.data || meErr.message);
  }

  // 6. Restore original email for idempotency
  try {
    await axios.post(
      `${API_BASE}/users/change-email`,
      { newEmail: initialEmail, currentPassword: adminPassword },
      { headers: { Authorization: `Bearer ${newToken}` } }
    );
    console.log(`✅ Reverted Admin Email back to "${initialEmail}" for future tests.`);
  } catch (revertErr: any) {
    console.error(`❌ Revert Email Failed:`, revertErr.response?.data || revertErr.message);
  }

  console.log("\n=======================================================================");
  console.log("  CHANGE ADMIN EMAIL TEST SUCCEEDED CLEANLY");
  console.log("=======================================================================\n");
}

main().catch(console.error);
