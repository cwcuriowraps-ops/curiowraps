import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("\n=======================================================");
  console.log("  BREVO SMTP RUNTIME CONFIGURATION & VERIFICATION");
  console.log("=======================================================\n");

  const host = process.env.BREVO_SMTP_HOST;
  const port = process.env.BREVO_SMTP_PORT ? Number(process.env.BREVO_SMTP_PORT) : undefined;
  const user = process.env.BREVO_SMTP_USER;
  const pass = process.env.BREVO_SMTP_PASS;

  console.log("1. RUNTIME .ENV VALUES:");
  console.log(`   BREVO_SMTP_HOST: ${host}`);
  console.log(`   BREVO_SMTP_PORT: ${port}`);
  console.log(`   BREVO_SMTP_USER: ${user}`);
  console.log(`   BREVO_SMTP_PASS:`);
  console.log(`     - Exists: ${Boolean(pass)}`);
  console.log(`     - Length: ${pass ? pass.length : 0}`);
  console.log(`     - Starts with "xsmtpsib-": ${pass ? pass.startsWith("xsmtpsib-") : false}`);

  const secure = port === 465;

  const nodemailerConfig = {
    host,
    port,
    secure,
    auth: user && pass ? {
      user,
      passLength: pass.length,
    } : undefined,
  };

  console.log("\n2. NODEMAILER CONFIGURATION BEING USED:");
  console.log(`   host: ${nodemailerConfig.host}`);
  console.log(`   port: ${nodemailerConfig.port}`);
  console.log(`   secure: ${nodemailerConfig.secure}`);
  console.log(`   auth.user: ${nodemailerConfig.auth?.user}`);
  console.log(`   auth.pass length: ${nodemailerConfig.auth?.passLength}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  console.log("\n3. EXECUTING await transporter.verify()...");
  try {
    const verified = await transporter.verify();
    console.log(`\n✅ VERIFICATION SUCCESS: ${verified}`);
  } catch (error: any) {
    console.log(`\n❌ VERIFICATION FAILED:`);
    console.log(`   Error Message: ${error?.message || error}`);
    console.log(`   Error Code: ${error?.code}`);
    console.log(`   Error Command: ${error?.command}`);
    console.log(`   Error Response: ${error?.response}`);
    console.log(`\n   COMPLETE NODEMAILER CONFIGURATION (EXCEPT PASSWORD):`);
    console.dir({
      host: nodemailerConfig.host,
      port: nodemailerConfig.port,
      secure: nodemailerConfig.secure,
      auth: {
        user: nodemailerConfig.auth?.user,
        passLength: nodemailerConfig.auth?.passLength,
      },
    }, { depth: null });
  }

  console.log("\n=======================================================\n");
}

main().catch(console.error);
