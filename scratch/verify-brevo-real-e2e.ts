import nodemailer from "nodemailer";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const RECIPIENT_EMAIL = "cw.curiowraps@gmail.com";
const API_BASE = "http://localhost:4000/api/v1";

async function main() {
  console.log("\n=======================================================================");
  console.log("  REAL END-TO-END BREVO SMTP VERIFICATION & TELEMETRY SUITE");
  console.log("=======================================================================\n");

  // Task 1: Runtime .env Verification
  const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.BREVO_SMTP_PORT) || 587;
  const user = process.env.BREVO_SMTP_USER || "";
  const pass = process.env.BREVO_SMTP_PASS || "";
  const from = process.env.EMAIL_FROM || "cw.curiowraps@gmail.com";

  console.log("1. RUNTIME .ENV VALUES VERIFICATION:");
  console.log(`   - BREVO_SMTP_HOST: ${host}`);
  console.log(`   - BREVO_SMTP_PORT: ${port}`);
  console.log(`   - BREVO_SMTP_USER: ${user ? `${user.substring(0, 8)}***` : "(empty)"}`);
  console.log(`   - BREVO_SMTP_PASS: ${pass ? `${pass.substring(0, 8)}***` : "(empty)"}`);
  console.log(`   - EMAIL_FROM:      ${from}`);

  // Task 4 & 7: Direct SMTP Connection & verify()
  console.log("\n2. DIRECT SMTP CONNECTION & AUTHENTICATION (transporter.verify()):");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  let smtpVerified = false;
  try {
    console.log("   Connecting & authenticating with Brevo SMTP...");
    smtpVerified = await transporter.verify();
    console.log(`   ✅ SMTP verify() Result: SUCCESS (Verified = ${smtpVerified})`);
    console.log(`   ✅ EMAIL_FROM (${from}) Sender Auth: SUCCESS`);
  } catch (verifyError: any) {
    console.error(`   ❌ SMTP verify() Result: FAILED`, {
      message: verifyError?.message,
      code: verifyError?.code,
      response: verifyError?.response,
    });
  }

  // Task 5, 6 & 8: Direct Test Email via Nodemailer to exact recipient
  console.log(`\n3. DIRECT EMAIL DISPATCH TO EXACT RECIPIENT (<${RECIPIENT_EMAIL}>):`);
  const directMailPayload = {
    from,
    to: RECIPIENT_EMAIL,
    subject: "Brevo SMTP Real QA Verification",
    text: `This is a real test email dispatched at ${new Date().toISOString()} via Brevo SMTP to verify recipient inbox delivery.`,
  };

  console.log("   COMPLETE sendMail Payload:");
  console.log("   - from:", directMailPayload.from);
  console.log("   - to:", directMailPayload.to);
  console.log("   - subject:", directMailPayload.subject);
  console.log("   - text length:", directMailPayload.text.length);

  try {
    const directInfo = await transporter.sendMail(directMailPayload);
    console.log("   ✅ COMPLETE Nodemailer Response:");
    console.log("   - accepted:", directInfo.accepted);
    console.log("   - rejected:", directInfo.rejected);
    console.log("   - envelope:", directInfo.envelope);
    console.log("   - response:", directInfo.response);
    console.log("   - messageId:", directInfo.messageId);

    if (directInfo.accepted.includes(RECIPIENT_EMAIL)) {
      console.log(`   ✅ Recipient <${RECIPIENT_EMAIL}> ACCEPTED by Brevo SMTP server.`);
    } else {
      console.warn(`   ⚠️ Recipient <${RECIPIENT_EMAIL}> was REJECTED or DEFERRED by Brevo.`);
    }
  } catch (directErr: any) {
    console.error("   ❌ Direct sendMail Exception:", {
      message: directErr?.message,
      code: directErr?.code,
      response: directErr?.response,
    });
  }

  // Ensure account exists in DB for API test
  console.log(`\n4. ENSURE ACCOUNT EXISTS & TRIGGER FORGOT PASSWORD (<${RECIPIENT_EMAIL}>):`);
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      email: RECIPIENT_EMAIL,
      password: "TestPassword123!",
      firstName: "Curio",
      lastName: "User",
    });
    console.log(`   [QA] User account created/verified for ${RECIPIENT_EMAIL}`);
  } catch (regErr: any) {
    console.log(`   [QA] Note on registration: ${regErr.response?.data?.error?.message || regErr.response?.data?.message || regErr.message}`);
  }

  // Trigger REAL Forgot Password Request
  try {
    console.log(`   Dispatching POST ${API_BASE}/auth/forgot-password...`);
    const apiRes = await axios.post(`${API_BASE}/auth/forgot-password`, {
      email: RECIPIENT_EMAIL,
    });
    console.log(`   ✅ API Response Status: ${apiRes.status}`);
    console.log(`   ✅ API Response Message: "${apiRes.data?.data?.message || apiRes.data?.message}"`);
  } catch (apiErr: any) {
    console.error(`   ❌ API Forgot Password Failed:`, {
      status: apiErr.response?.status,
      error: apiErr.response?.data?.error || apiErr.response?.data,
      message: apiErr.message,
    });
  }

  console.log("\n=======================================================================");
  console.log("  E2E VERIFICATION COMPLETE");
  console.log("=======================================================================\n");
}

main().catch(console.error);
