import nodemailer from "nodemailer";
import { env } from "../config/env";

// Create reusable Nodemailer transporter
export const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure, // true for 465, false for 587
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

export const emailService = {
  /**
   * Send 6-digit OTP code for Email Verification
   */
  async sendVerificationOtpEmail(toEmail: string, otpCode: string, recipientName: string = "User"): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your 2SmartTalk Account</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .logo-text { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
            .logo-highlight { color: #38D39F; }
            .content { padding: 32px 28px; color: #334155; line-height: 1.6; }
            .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
            .otp-container { margin: 28px 0; text-align: center; }
            .otp-box { display: inline-block; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px 32px; letter-spacing: 10px; font-size: 34px; font-weight: 800; color: #0F172A; font-family: monospace; }
            .badge-expiry { display: inline-block; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 10px; }
            .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .security-note { font-size: 13px; color: #64748b; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo-text">2Smart<span class="logo-highlight">Talk</span></h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; letter-spacing: 0.5px;">AI Real-Time Multilingual Communication</p>
            </div>
            <div class="content">
              <p class="greeting">Hello ${recipientName},</p>
              <p>Welcome to <strong>2SmartTalk</strong>! Please enter the 6-digit verification code below to verify your email address and activate your account:</p>
              
              <div class="otp-container">
                <div class="otp-box">${otpCode}</div>
                <br>
                <div class="badge-expiry">⏱️ Expires in 15 minutes</div>
              </div>

              <p class="security-note">If you did not create a 2SmartTalk account, you can safely ignore this email. Someone may have typed your email address by mistake.</p>
            </div>
            <div class="footer">
              <p>© 2026 2SmartTalk Inc. All rights reserved.<br>End-to-End Encrypted & AI Powered.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const info = await transporter.sendMail({
        from: env.smtp.from,
        to: toEmail,
        subject: `${otpCode} is your 2SmartTalk email verification code`,
        text: `Hello ${recipientName},\n\nYour 2SmartTalk verification code is: ${otpCode}\n\nThis code will expire in 15 minutes. If you did not create an account, please ignore this message.`,
        html: htmlContent,
      });
      console.log(`✉️  Verification OTP sent to ${toEmail} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send verification OTP email to ${toEmail}:`, error);
      return false;
    }
  },

  /**
   * Send 6-digit OTP code for Password Reset
   */
  async sendPasswordResetOtpEmail(toEmail: string, otpCode: string, recipientName: string = "User"): Promise<boolean> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your 2SmartTalk Password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }
            .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .logo-text { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
            .logo-highlight { color: #FF6584; }
            .content { padding: 32px 28px; color: #334155; line-height: 1.6; }
            .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; }
            .otp-container { margin: 28px 0; text-align: center; }
            .otp-box { display: inline-block; background: #fff1f2; border: 2px dashed #fecdd3; border-radius: 12px; padding: 16px 32px; letter-spacing: 10px; font-size: 34px; font-weight: 800; color: #e11d48; font-family: monospace; }
            .badge-expiry { display: inline-block; background: #fef2f2; color: #b91c1c; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-top: 10px; }
            .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .security-note { font-size: 13px; color: #64748b; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo-text">2Smart<span class="logo-highlight">Talk</span></h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; letter-spacing: 0.5px;">Password Recovery</p>
            </div>
            <div class="content">
              <p class="greeting">Hello ${recipientName},</p>
              <p>We received a request to reset the password for your <strong>2SmartTalk</strong> account. Use the 6-digit recovery code below to proceed:</p>
              
              <div class="otp-container">
                <div class="otp-box">${otpCode}</div>
                <br>
                <div class="badge-expiry">⏱️ Expires in 15 minutes</div>
              </div>

              <p class="security-note"><strong>Security Alert:</strong> If you did not request a password reset, please change your password immediately or contact support. Never share this code with anyone.</p>
            </div>
            <div class="footer">
              <p>© 2026 2SmartTalk Inc. All rights reserved.<br>End-to-End Encrypted & AI Powered.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const info = await transporter.sendMail({
        from: env.smtp.from,
        to: toEmail,
        subject: `${otpCode} is your 2SmartTalk password reset code`,
        text: `Hello ${recipientName},\n\nYour 2SmartTalk password reset code is: ${otpCode}\n\nThis code will expire in 15 minutes. If you did not request a password reset, please ignore this email.`,
        html: htmlContent,
      });
      console.log(`✉️  Password Reset OTP sent to ${toEmail} (Message ID: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send password reset OTP email to ${toEmail}:`, error);
      return false;
    }
  },
};

export default emailService;
