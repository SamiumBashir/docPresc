import nodemailer, { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { ENV } from '../config/env';

let resendClient: Resend | null = null;
if (ENV.RESEND_API_KEY) {
  resendClient = new Resend(ENV.RESEND_API_KEY);
}

let smtpTransporter: Transporter | null = null;
if (ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS) {
  const isGmail =
    ENV.SMTP_HOST.toLowerCase().includes('gmail') ||
    ENV.SMTP_USER.toLowerCase().includes('gmail') ||
    ENV.SMTP_USER.toLowerCase().includes('gamil'); // Handles common typo
  const cleanUser = ENV.SMTP_USER.replace(/['"]/g, '').trim().replace(/@gamil\.com$/i, '@gmail.com');
  const cleanPass = ENV.SMTP_PASS.replace(/\s+/g, '').replace(/['"]/g, '').trim(); // Strip spaces & quotes from app passwords

  smtpTransporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: {
            user: cleanUser,
            pass: cleanPass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
      : {
          host: ENV.SMTP_HOST,
          port: ENV.SMTP_PORT,
          secure: ENV.SMTP_PORT === 465,
          auth: {
            user: cleanUser,
            pass: cleanPass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
        }
  );
}

export interface ISendOtpEmailOptions {
  to: string;
  name?: string;
  otp: string;
  expiresInMinutes?: number;
}

const escapeHtml = (str: string): string =>
  str.replace(/[&<>'"]/g, (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));

export const sendPasswordResetOtpEmail = async ({
  to,
  name,
  otp,
  expiresInMinutes = 10,
}: ISendOtpEmailOptions): Promise<{ success: boolean; messageId?: string; devPreview?: boolean }> => {
  const recipientName = escapeHtml(name || 'Doctor');
  const subject = `Your DocPresc Password Reset OTP: ${otp}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px 0; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #008ba3 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .body { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .otp-box { background: #f0fdfa; border: 2px dashed #008ba3; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #008ba3; font-family: 'Courier New', Courier, monospace; margin: 8px 0; }
    .otp-expiry { font-size: 12px; color: #64748b; font-weight: 600; }
    .warning-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; margin: 24px 0; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DocPresc</h1>
      <p>Doctor Digital Prescription Management Platform</p>
    </div>
    <div class="body">
      <div class="greeting">Hello ${recipientName},</div>
      <p class="message">
        We received a request to reset the password for your DocPresc account. Use the 6-digit One-Time Password (OTP) below to complete your password reset:
      </p>

      <div class="otp-box">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #0f766e; font-weight: 700;">Password Reset OTP</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expiry">⏱ Valid for ${expiresInMinutes} minutes only</div>
      </div>

      <div class="warning-box">
        <strong>Security Notice:</strong> Never share this OTP with anyone. DocPresc support staff will never ask you for your verification code.
      </div>

      <p class="message" style="font-size: 12px; color: #64748b; margin-bottom: 0;">
        If you did not initiate this request, you can safely disregard this email. Your password will remain unchanged.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} DocPresc &bull; High-Performance Clinical Management System
    </div>
  </div>
</body>
</html>
`;

  const textContent = `
DocPresc Password Reset OTP
----------------------------------------
Hello ${recipientName},

Your 6-digit password reset OTP is: ${otp}

This OTP will expire in ${expiresInMinutes} minutes.

Security Notice: Never share this OTP with anyone.
If you did not request a password reset, you can safely ignore this email.
`;

  // 1. If Resend API Key is configured, prioritize Resend (uses HTTPS Port 443 - zero firewall/port blocks on cloud hosts like Render)
  if (resendClient && ENV.RESEND_API_KEY) {
    try {
      const data = await resendClient.emails.send({
        from: ENV.EMAIL_FROM,
        to,
        subject,
        html: htmlContent,
        text: textContent,
      });

      console.log(`[Email Service] Sent OTP email via Resend to ${to} (Message ID: ${data.data?.id})`);
      return { success: true, messageId: data.data?.id };
    } catch (error: any) {
      console.error(`[Email Service] Failed to send email via Resend:`, error.message);
      // Fall through to SMTP if configured
    }
  }

  // 2. If SMTP (Nodemailer) is configured, try SMTP
  if (smtpTransporter) {
    try {
      const cleanSender = ENV.SMTP_USER.replace(/['"]/g, '').trim().replace(/@gamil\.com$/i, '@gmail.com');
      const fromAddress = cleanSender ? `DocPresc <${cleanSender}>` : ENV.EMAIL_FROM;
      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: htmlContent,
        text: textContent,
      });

      console.log(`[Email Service] Sent OTP email via SMTP to ${to} (Message ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`[Email Service] Failed to send email via SMTP:`, error.message);
    }
  }

  // Development/Local Fallback when email dispatch is unavailable
  if (ENV.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`[DEV OTP EMAIL] Recipient: ${to}`);
    console.log(`[DEV OTP CODE]  --> ${otp} <-- (Valid for ${expiresInMinutes} mins)`);
    console.log(`======================================================\n`);
    return { success: true, devPreview: true };
  }

  return { success: false };
};
