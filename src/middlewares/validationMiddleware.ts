import { Request, Response, NextFunction } from "express";

export const validateSignUp = (req: Request, res: Response, next: NextFunction): void => {
  const { firstName, lastName, username, email, password } = req.body;

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    res.status(400).json({ error: "First name is required." });
    return;
  }

  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    res.status(400).json({ error: "Last name is required." });
    return;
  }

  if (!username || typeof username !== "string" || username.trim().length < 3) {
    res.status(400).json({ error: "Username must be at least 3 characters long." });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    res.status(400).json({ error: "Please provide a valid email address." });
    return;
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters long." });
    return;
  }

  next();
};

export const validateSignIn = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "Email or username is required." });
    return;
  }

  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password is required." });
    return;
  }

  next();
};

export const validateVerifyEmail = (req: Request, res: Response, next: NextFunction): void => {
  const { email, otp } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
    res.status(400).json({ error: "A valid 6-digit OTP code is required." });
    return;
  }

  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  next();
};

export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const { email, otp, newPassword } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
    res.status(400).json({ error: "A valid 6-digit OTP code is required." });
    return;
  }

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters long." });
    return;
  }

  next();
};
