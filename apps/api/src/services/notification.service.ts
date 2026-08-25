import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export interface IEmailProvider {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  updateSenderDetails?(senderName: string, senderEmail: string, replyToEmail?: string): void;
}

export class ConsoleEmailProvider implements IEmailProvider {
  private senderName = "Curio Wraps";
  private from = "cw.curiowraps@gmail.com";
  private replyToEmail?: string;

  updateSenderDetails(senderName: string, senderEmail: string, replyToEmail?: string) {
    if (senderName && senderName.trim()) this.senderName = senderName.trim();
    if (senderEmail && senderEmail.trim()) this.from = senderEmail.trim();
    this.replyToEmail = replyToEmail && replyToEmail.trim() ? replyToEmail.trim() : undefined;
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log("=========================================");
    console.log(`[EMAIL DISPATCHED - CONSOLE]`);
    console.log(`From: "${this.senderName}" <${this.from}>`);
    if (this.replyToEmail) console.log(`Reply-To: ${this.replyToEmail}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log("=========================================");
  }
}

export class BrevoEmailProvider implements IEmailProvider {
  private transporter: nodemailer.Transporter;
  private from: string;
  private senderName: string;
  private replyToEmail?: string;

  constructor() {
    const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
    const port = Number(process.env.BREVO_SMTP_PORT) || 587;
    const user = process.env.BREVO_SMTP_USER || "";
    const pass = process.env.BREVO_SMTP_PASS || "";
    this.from = process.env.EMAIL_FROM || "cw.curiowraps@gmail.com";
    this.senderName = process.env.EMAIL_SENDER_NAME || "Curio Wraps";

    console.info("[BrevoEmailProvider][Init] Runtime Environment Configuration:", {
      BREVO_SMTP_HOST: host,
      BREVO_SMTP_PORT: port,
      BREVO_SMTP_USER: user ? `${user.substring(0, 4)}***` : "(empty)",
      BREVO_SMTP_PASS: pass ? `${pass.substring(0, 4)}***` : "(empty)",
      EMAIL_FROM: this.from,
      SENDER_NAME: this.senderName,
    });

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      idleTimeout: 30000,
      auth: user && pass ? { user, pass } : undefined,
    } as SMTPTransport.Options);
  }

  updateSenderDetails(senderName: string, senderEmail: string, replyToEmail?: string) {
    if (senderName && senderName.trim()) {
      this.senderName = senderName.trim();
    }
    if (senderEmail && senderEmail.trim()) {
      this.from = senderEmail.trim();
    }
    this.replyToEmail = replyToEmail && replyToEmail.trim() ? replyToEmail.trim() : undefined;

    console.info("[BrevoEmailProvider][SenderUpdated] Dynamic Sender Details Reloaded:", {
      senderName: this.senderName,
      senderEmail: this.from,
      replyToEmail: this.replyToEmail,
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    const startTime = Date.now();
    const fromHeader = this.senderName
      ? `"${this.senderName}" <${this.from}>`
      : this.from;

    console.info("[BrevoEmailProvider][Step:Entered]", {
      recipient: to,
      senderHeader: fromHeader,
      replyTo: this.replyToEmail,
      subject,
      timestamp: new Date().toISOString(),
    });

    // 2. Prepare & Log Complete sendMail Payload
    const mailOptions: any = {
      from: fromHeader,
      to,
      subject,
      text: body,
    };

    if (this.replyToEmail && this.replyToEmail.trim()) {
      mailOptions.replyTo = this.replyToEmail.trim();
    }

    console.info("[BrevoEmailProvider][Step:SendingPayload]", {
      from: mailOptions.from,
      to: mailOptions.to,
      replyTo: mailOptions.replyTo,
      subject: mailOptions.subject,
      textLength: mailOptions.text.length,
    });

    try {
      // 3. Execute Nodemailer sendMail
      const info = await this.transporter.sendMail(mailOptions);
      const executionTimeMs = Date.now() - startTime;

      // 4. Log Complete Nodemailer Response
      console.info("[BrevoEmailProvider][Step:NodemailerResponseSuccess]", {
        accepted: info.accepted,
        rejected: info.rejected,
        envelope: info.envelope,
        response: info.response,
        messageId: info.messageId,
        executionTimeMs,
      });
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      console.error("[BrevoEmailProvider][Step:NodemailerException]", {
        errorMessage: err?.message,
        code: err?.code,
        command: err?.command,
        response: err?.response,
        responseCode: err?.responseCode,
        stackTrace: err?.stack,
        recipient: to,
        sender: fromHeader,
        executionTimeMs,
      });
      throw err;
    }
  }
}

export class NotificationService {
  constructor(private readonly provider: IEmailProvider) {}

  updateEmailSettings(senderName: string, senderEmail: string, replyToEmail?: string) {
    if (this.provider && typeof this.provider.updateSenderDetails === "function") {
      this.provider.updateSenderDetails(senderName, senderEmail, replyToEmail);
    }
  }

  async sendTestEmail(targetEmail: string, adminName: string = "Admin"): Promise<void> {
    await this.provider.sendEmail(
      targetEmail,
      "Test Email - Admin Configuration Verification",
      `Hi ${adminName},\n\nThis is a test email sent from the Admin Panel to verify that your email sender configuration is working properly with Brevo SMTP.\n\nTimestamp: ${new Date().toISOString()}`
    );
  }

  async processEmailJob(type: string, data: any) {
    switch (type) {
      case "WELCOME_EMAIL":
        await this.provider.sendEmail(
          data.email,
          "Welcome to Curio Wrap!",
          `Hi ${data.firstName},\n\nWelcome to Curio Wrap. We are glad to have you here.`
        );
        break;
      case "ORDER_CONFIRMATION":
        await this.provider.sendEmail(
          data.email,
          `Order Confirmation - ${data.orderId}`,
          `Hi ${data.firstName},\n\nYour order ${data.orderId} has been confirmed. Total: ${data.total}`
        );
        break;
      case "PAYMENT_SUCCESS":
        await this.provider.sendEmail(
          data.email,
          `Payment Received - ${data.orderId}`,
          `Hi ${data.firstName},\n\nWe have received your payment for order ${data.orderId}.`
        );
        break;
      case "FORGOT_PASSWORD": {
        const startTime = Date.now();
        console.info("[ForgotPassword][NotificationService][Step:Entered]", {
          type,
          recipient: data.email,
          firstName: data.firstName,
          resetLink: data.resetLink,
        });
        try {
          await this.provider.sendEmail(
            data.email,
            "Password Reset Request",
            `Hi ${data.firstName},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${data.resetLink}\n\nIf you did not request this, please ignore this email.`
          );
          const executionTimeMs = Date.now() - startTime;
          console.info("[ForgotPassword][NotificationService][Step:Success]", {
            recipient: data.email,
            executionTimeMs,
          });
        } catch (error: any) {
          const executionTimeMs = Date.now() - startTime;
          console.error("[ForgotPassword][NotificationService][Step:Error]", {
            recipient: data.email,
            errorMessage: error?.message,
            stackTrace: error?.stack,
            executionTimeMs,
          });
          throw error;
        }
        break;
      }
      default:
        console.warn(`Unknown email job type: ${type}`);
    }
  }
}
