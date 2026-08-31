import { query } from "../config/db";
import { emailService } from "./emailService";

export type OtpType = "email_verification" | "password_reset";

export interface OtpRecord {
  id: string;
  email: string;
  otp_code: string;
  type: OtpType;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

export const otpService = {
  /**
   * Generate a secure random 6-digit numerical code
   */
  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Create and persist OTP code in database with 15 minutes expiration
   */
  async createOtp(email: string, type: OtpType, expiryMinutes: number = 15): Promise<string> {
    const cleanEmail = email.toLowerCase().trim();
    const otpCode = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Invalidate any existing unused OTPs for this email and type
    await query(
      `UPDATE otps SET is_used = true WHERE email = $1 AND type = $2 AND is_used = false`,
      [cleanEmail, type]
    );

    // Insert fresh OTP
    await query(
      `INSERT INTO otps (email, otp_code, type, expires_at, is_used) VALUES ($1, $2, $3, $4, false)`,
      [cleanEmail, otpCode, type, expiresAt]
    );

    return otpCode;
  },

  /**
   * Verify an OTP code against database
   */
  async verifyOtp(email: string, otpCode: string, type: OtpType, markUsed: boolean = true): Promise<{ valid: boolean; message?: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = otpCode.trim();

    const result = await query<OtpRecord>(
      `SELECT * FROM otps 
       WHERE email = $1 AND type = $2 AND is_used = false 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, type]
    );

    if (result.rows.length === 0) {
      return { valid: false, message: "No active verification code found. Please request a new code." };
    }

    const record = result.rows[0];

    // Check expiration
    if (new Date(record.expires_at).getTime() < Date.now()) {
      return { valid: false, message: "Verification code has expired. Please request a new one." };
    }

    // Check code match
    if (record.otp_code !== cleanCode) {
      return { valid: false, message: "Invalid verification code. Please check and try again." };
    }

    if (markUsed) {
      await query(`UPDATE otps SET is_used = true WHERE id = $1`, [record.id]);
    }

    return { valid: true };
  },

  /**
   * Create and send email verification OTP
   */
  async sendEmailVerification(email: string, recipientName: string = "User"): Promise<{ success: boolean; otpCode: string }> {
    const otpCode = await this.createOtp(email, "email_verification");
    await emailService.sendVerificationOtpEmail(email, otpCode, recipientName);
    return { success: true, otpCode };
  },

  /**
   * Create and send password reset OTP
   */
  async sendPasswordReset(email: string, recipientName: string = "User"): Promise<{ success: boolean; otpCode: string }> {
    const otpCode = await this.createOtp(email, "password_reset");
    await emailService.sendPasswordResetOtpEmail(email, otpCode, recipientName);
    return { success: true, otpCode };
  },
};

export default otpService;
