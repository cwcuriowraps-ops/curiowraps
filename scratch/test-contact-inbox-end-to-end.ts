import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = "http://localhost:4000/api/v1";

async function main() {
  console.log("\n=======================================================================");
  console.log("  TESTING CONTACT INBOX & STOREFRONT FORM END-TO-END");
  console.log("=======================================================================\n");

  // 1. Submit Public Contact Form
  const submissionData = {
    name: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91 9988776655",
    subject: "Bulk Wedding Gift Inquiry",
    message: "Hello Curio Wrap team, I need 50 customized gift boxes for a wedding event next month. Could you share pricing details?",
  };

  let createdMessageId = "";
  try {
    const submitRes = await axios.post(`${API_BASE}/contact`, submissionData);
    createdMessageId = submitRes.data?.data?.id;
    console.log(`✅ Public Contact Form Submission Successful (HTTP ${submitRes.status}): "${submitRes.data?.message}"`);
    console.log(`   Created Message ID: "${createdMessageId}"`);
  } catch (submitErr: any) {
    console.error(`❌ Public Contact Form Submission Failed:`, submitErr.response?.data || submitErr.message);
    return;
  }

  // 2. Admin Login
  let adminToken = "";
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@curiowrap.com",
      password: "Password123!",
    });
    adminToken = loginRes.data?.data?.tokens?.accessToken || loginRes.data?.data?.accessToken;
    console.log(`\n✅ Admin Login Successful.`);
  } catch (loginErr: any) {
    console.error(`❌ Admin Login Failed:`, loginErr.response?.data || loginErr.message);
    return;
  }

  const authHeaders = { Authorization: `Bearer ${adminToken}` };

  // 3. Admin GET /admin/contact-messages
  try {
    const listRes = await axios.get(`${API_BASE}/admin/contact-messages`, { headers: authHeaders });
    const items = listRes.data?.data?.items || [];
    const unreadCount = listRes.data?.data?.unreadCount;

    console.log(`\n✅ Admin List Contact Messages Status ${listRes.status}:`);
    console.log(`   Total Items Found: ${items.length}`);
    console.log(`   Unread Count: ${unreadCount}`);

    const foundMsg = items.find((m: any) => m.id === createdMessageId);
    if (foundMsg) {
      console.log(`   Found Created Message in Inbox: "${foundMsg.subject}" by ${foundMsg.name} (${foundMsg.email}) [Status: ${foundMsg.status}]`);
    } else {
      console.warn(`   Warning: Created message not found in list.`);
    }
  } catch (listErr: any) {
    console.error(`❌ Admin List Contact Messages Failed:`, listErr.response?.data || listErr.message);
  }

  // 4. Admin GET /admin/contact-messages/:id (Auto-mark as READ)
  if (createdMessageId) {
    try {
      const getRes = await axios.get(`${API_BASE}/admin/contact-messages/${createdMessageId}`, { headers: authHeaders });
      console.log(`\n✅ Admin Get Single Message Status ${getRes.status}:`);
      console.log(`   Updated Status: ${getRes.data?.data?.message?.status} (Auto-marked as READ)`);
    } catch (getErr: any) {
      console.error(`❌ Admin Get Message Failed:`, getErr.response?.data || getErr.message);
    }
  }

  // 5. Admin PATCH /admin/contact-messages/:id/status (Mark as REPLIED)
  if (createdMessageId) {
    try {
      const patchRes = await axios.patch(
        `${API_BASE}/admin/contact-messages/${createdMessageId}/status`,
        { status: "REPLIED" },
        { headers: authHeaders }
      );
      console.log(`\n✅ Admin Update Status to REPLIED Status ${patchRes.status}: "${patchRes.data?.message}"`);
    } catch (patchErr: any) {
      console.error(`❌ Admin Update Status Failed:`, patchErr.response?.data || patchErr.message);
    }
  }

  // 6. Admin DELETE /admin/contact-messages/:id
  if (createdMessageId) {
    try {
      const deleteRes = await axios.delete(`${API_BASE}/admin/contact-messages/${createdMessageId}`, { headers: authHeaders });
      console.log(`\n✅ Admin Delete Message Status ${deleteRes.status}: "${deleteRes.data?.message}"`);
    } catch (delErr: any) {
      console.error(`❌ Admin Delete Message Failed:`, delErr.response?.data || delErr.message);
    }
  }

  console.log("\n=======================================================================");
  console.log("  CONTACT INBOX END-TO-END VERIFICATION COMPLETE");
  console.log("=======================================================================\n");
}

main().catch(console.error);
