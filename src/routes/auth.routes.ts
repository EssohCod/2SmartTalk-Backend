import { Router } from "express";
import { authController } from "../controllers/authController";
import {
  validateSignUp,
  validateSignIn,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
} from "../middlewares/validationMiddleware";

const router = Router();

// Sign up new user
router.post("/signup", validateSignUp, authController.signUp);

// Verify email with 6-digit OTP
router.post("/verify-email", validateVerifyEmail, authController.verifyEmail);

// Resend OTP code
router.post("/resend-otp", authController.resendOtp);

// Sign in
router.post("/signin", validateSignIn, authController.signIn);

// Forgot password (request recovery OTP)
router.post("/forgot-password", validateForgotPassword, authController.forgotPassword);

// Verify reset OTP
router.post("/verify-reset-otp", authController.verifyResetOtp);

// Reset password
router.post("/reset-password", validateResetPassword, authController.resetPassword);

// Check username availability
router.get("/check-username", authController.checkUsername);

export default router;
