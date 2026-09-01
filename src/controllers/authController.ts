import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/db";
import { otpService } from "../services/otpService";
import { tokenService } from "../services/tokenService";
import { emailService } from "../services/emailService";

export interface UserDbRow {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  username: string;
  email: string;
  password_hash: string;
  gender: string;
  native_language: string;
  native_language_flag: string;
  is_email_verified: boolean;
  avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export const authController = {
  /**
   * 1. User Sign Up
   */
  async signUp(req: Request, res: Response): Promise<void> {
    try {
      const {
        firstName,
        lastName,
        username,
        email,
        password,
        gender = "Other",
        nativeLanguage = "English (US)",
        nativeLanguageFlag = "🇺🇸",
      } = req.body;

      const cleanEmail = email.toLowerCase().trim();
      const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_.]/g, "");
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // Check if email already exists
      const existingEmail = await query<UserDbRow>(
        `SELECT id, is_email_verified FROM users WHERE LOWER(email) = $1`,
        [cleanEmail]
      );

      if (existingEmail.rows.length > 0) {
        const user = existingEmail.rows[0];
        if (!user.is_email_verified) {
          // Resend OTP for unverified account
          await otpService.sendEmailVerification(cleanEmail, firstName);
          res.status(200).json({
            success: true,
            isExistingUnverified: true,
            message: "Account already exists but is unverified. A new verification code has been sent to your email.",
            user: {
              email: cleanEmail,
              name: fullName,
              username: cleanUsername,
            },
          });
          return;
        }

        res.status(409).json({
          error: "An account with this email already exists. Please sign in instead.",
        });
        return;
      }

      // Check if username is already taken
      const existingUsername = await query<UserDbRow>(
        `SELECT id FROM users WHERE LOWER(username) = $1`,
        [cleanUsername]
      );

      if (existingUsername.rows.length > 0) {
        res.status(409).json({
          error: "This username is already taken. Please choose another one.",
        });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Insert new user into DB
      const insertResult = await query<UserDbRow>(
        `INSERT INTO users (
          first_name, last_name, name, username, email, password_hash, 
          gender, native_language, native_language_flag, is_email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
        RETURNING id, first_name, last_name, name, username, email, gender, native_language, native_language_flag, is_email_verified, created_at`,
        [
          firstName.trim(),
          lastName.trim(),
          fullName,
          cleanUsername,
          cleanEmail,
          passwordHash,
          gender,
          nativeLanguage,
          nativeLanguageFlag,
        ]
      );

      const createdUser = insertResult.rows[0];

      // Dispatch 6-digit OTP verification email
      await otpService.sendEmailVerification(cleanEmail, firstName.trim());

      res.status(201).json({
        success: true,
        message: "Account created successfully! We sent a 6-digit verification code to your email.",
        user: {
          id: createdUser.id,
          name: createdUser.name,
          firstName: createdUser.first_name,
          lastName: createdUser.last_name,
          username: createdUser.username,
          email: createdUser.email,
          gender: createdUser.gender,
          nativeLanguage: createdUser.native_language,
          nativeLanguageFlag: createdUser.native_language_flag,
          isEmailVerified: createdUser.is_email_verified,
        },
      });
    } catch (error: any) {
      console.error("SignUp error:", error);
      res.status(500).json({ error: "Internal server error during registration. Please try again." });
    }
  },

  /**
   * 2. Verify Email OTP
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      // Verify OTP code
      const otpCheck = await otpService.verifyOtp(cleanEmail, otp, "email_verification", true);
      if (!otpCheck.valid) {
        res.status(400).json({ error: otpCheck.message || "Invalid or expired verification code." });
        return;
      }

      // Update user verified status in DB
      const updateResult = await query<UserDbRow>(
        `UPDATE users 
         SET is_email_verified = true, updated_at = NOW() 
         WHERE LOWER(email) = $1 
         RETURNING id, first_name, last_name, name, username, email, gender, native_language, native_language_flag, avatar_url, is_email_verified`,
        [cleanEmail]
      );

      if (updateResult.rows.length === 0) {
        res.status(404).json({ error: "User account not found." });
        return;
      }

      const user = updateResult.rows[0];

      // 1. Send Welcome Email to the user asynchronously
      emailService.sendWelcomeEmail(
        user.email,
        user.name || user.first_name || "User"
      ).catch((e) => console.warn("Failed to send welcome email:", e));

      // 2. Create Welcome Notification in the database
      query(
        `INSERT INTO notifications (
          user_id, user_email, category, title, description,
          is_unread, icon_name, icon_bg_color, icon_color,
          action_type, action_label, created_at, updated_at
        ) VALUES (
          $1, $2, 'system', 'Welcome to 2SmartTalk! 🎉',
          'Your account has been successfully verified. You can now make real-time translated voice and video calls across 150+ languages.',
          true, 'sparkles', '#EFF6FF', '#3B82F6',
          'view_info', 'Get Started', NOW(), NOW()
        )`,
        [user.id, user.email]
      ).catch((e) => console.warn("Failed to create welcome notification:", e));

      // Generate JWT auth tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        gender: user.gender,
        nativeLanguage: user.native_language,
        nativeLanguageFlag: user.native_language_flag,
      };

      const token = tokenService.generateAccessToken(tokenPayload);
      const refreshToken = tokenService.generateRefreshToken(tokenPayload);

      res.status(200).json({
        success: true,
        message: "Email verified successfully! Welcome to 2SmartTalk.",
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          email: user.email,
          gender: user.gender,
          nativeLanguage: user.native_language,
          nativeLanguageFlag: user.native_language_flag,
          avatarUrl: user.avatar_url,
          isEmailVerified: true,
        },
      });
    } catch (error: any) {
      console.error("VerifyEmail error:", error);
      res.status(500).json({ error: "Failed to verify email. Please try again." });
    }
  },

  /**
   * 3. Resend Email OTP
   */
  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, type = "email_verification" } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email is required." });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();

      // Check if user exists
      const userResult = await query<UserDbRow>(
        `SELECT first_name, name FROM users WHERE LOWER(email) = $1`,
        [cleanEmail]
      );

      const recipientName = userResult.rows[0]?.first_name || userResult.rows[0]?.name || "User";

      if (type === "password_reset") {
        await otpService.sendPasswordReset(cleanEmail, recipientName);
      } else {
        await otpService.sendEmailVerification(cleanEmail, recipientName);
      }

      res.status(200).json({
        success: true,
        message: "A new 6-digit verification code has been sent to your email.",
      });
    } catch (error: any) {
      console.error("ResendOtp error:", error);
      res.status(500).json({ error: "Failed to resend code. Please try again." });
    }
  },

  /**
   * 4. User Sign In
   */
  async signIn(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const cleanIdentifier = email.toLowerCase().trim();

      // Find user by email OR username
      const userResult = await query<UserDbRow>(
        `SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $1`,
        [cleanIdentifier]
      );

      if (userResult.rows.length === 0) {
        res.status(401).json({
          error: "Invalid email/username or password. Please try again.",
        });
        return;
      }

      const user = userResult.rows[0];

      // Compare password hash
      const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordMatch) {
        res.status(401).json({
          error: "Invalid email/username or password. Please try again.",
        });
        return;
      }

      // If email is not verified yet, notify client to prompt verification
      if (!user.is_email_verified) {
        // Send a fresh OTP automatically
        await otpService.sendEmailVerification(user.email, user.first_name);
        res.status(403).json({
          error: "Please verify your email before signing in.",
          requiresEmailVerification: true,
          email: user.email,
          name: user.name,
        });
        return;
      }

      // Generate JWT tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        gender: user.gender,
        nativeLanguage: user.native_language,
        nativeLanguageFlag: user.native_language_flag,
      };

      const token = tokenService.generateAccessToken(tokenPayload);
      const refreshToken = tokenService.generateRefreshToken(tokenPayload);

      res.status(200).json({
        success: true,
        message: "Signed in successfully!",
        token,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          email: user.email,
          gender: user.gender,
          nativeLanguage: user.native_language,
          nativeLanguageFlag: user.native_language_flag,
          avatarUrl: user.avatar_url,
          isEmailVerified: user.is_email_verified,
        },
      });
    } catch (error: any) {
      console.error("SignIn error:", error);
      res.status(500).json({ error: "Sign in failed. Please try again." });
    }
  },

  /**
   * 5. Forgot Password (Send Recovery OTP)
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      const userResult = await query<UserDbRow>(
        `SELECT first_name, name FROM users WHERE LOWER(email) = $1`,
        [cleanEmail]
      );

      if (userResult.rows.length === 0) {
        // For security reasons, don't leak user existence directly, but inform code sent
        res.status(200).json({
          success: true,
          message: "If an account exists with this email, a 6-digit recovery code has been sent.",
        });
        return;
      }

      const recipientName = userResult.rows[0]?.first_name || userResult.rows[0]?.name || "User";
      await otpService.sendPasswordReset(cleanEmail, recipientName);

      res.status(200).json({
        success: true,
        message: "Password recovery code sent to your email.",
      });
    } catch (error: any) {
      console.error("ForgotPassword error:", error);
      res.status(500).json({ error: "Failed to send recovery code. Please try again." });
    }
  },

  /**
   * 6. Verify Reset OTP
   */
  async verifyResetOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      // Check OTP without consuming it yet (will consume when password actually resets)
      const otpCheck = await otpService.verifyOtp(cleanEmail, otp, "password_reset", false);
      if (!otpCheck.valid) {
        res.status(400).json({ error: otpCheck.message || "Invalid or expired recovery code." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Code verified successfully.",
      });
    } catch (error: any) {
      console.error("VerifyResetOtp error:", error);
      res.status(500).json({ error: "Failed to verify reset code." });
    }
  },

  /**
   * 7. Reset Password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      // Verify and mark OTP as used
      const otpCheck = await otpService.verifyOtp(cleanEmail, otp, "password_reset", true);
      if (!otpCheck.valid) {
        res.status(400).json({ error: otpCheck.message || "Invalid or expired recovery code." });
        return;
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update password in database
      const updateResult = await query(
        `UPDATE users 
         SET password_hash = $1, updated_at = NOW() 
         WHERE LOWER(email) = $2`,
        [passwordHash, cleanEmail]
      );

      if ((updateResult.rowCount ?? 0) === 0) {
        res.status(404).json({ error: "User account not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Your password has been reset successfully! Please sign in with your new password.",
      });
    } catch (error: any) {
      console.error("ResetPassword error:", error);
      res.status(500).json({ error: "Failed to reset password. Please try again." });
    }
  },

  /**
   * 8. Check Username Availability
   */
  async checkUsername(req: Request, res: Response): Promise<void> {
    try {
      const usernameQuery = req.query.username as string;
      if (!usernameQuery) {
        res.status(400).json({ error: "Username parameter is required." });
        return;
      }

      const clean = usernameQuery.toLowerCase().trim().replace(/[^a-z0-9_.]/g, "");
      if (clean.length < 3) {
        res.status(200).json({ available: false, reason: "Too short (minimum 3 characters)." });
        return;
      }

      const check = await query(
        `SELECT id FROM users WHERE LOWER(username) = $1`,
        [clean]
      );

      const isTaken = check.rows.length > 0;
      let suggestions: string[] = [];

      if (isTaken) {
        suggestions = [
          `${clean}_${Math.floor(10 + Math.random() * 89)}`,
          `${clean}.${Math.floor(100 + Math.random() * 899)}`,
          `the_${clean}`,
          `${clean}_official`,
        ];
      }

      res.status(200).json({
        available: !isTaken,
        username: clean,
        suggestions,
      });
    } catch (error: any) {
      console.error("CheckUsername error:", error);
      res.status(500).json({ error: "Failed to check username." });
    }
  },
};

export default authController;
