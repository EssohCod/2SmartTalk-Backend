import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  name: string;
  gender: string;
  nativeLanguage?: string;
  nativeLanguageFlag?: string;
}

export const tokenService = {
  /**
   * Generate JWT Access Token
   */
  generateAccessToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: env.jwt.expiresIn as any,
    };
    return jwt.sign(payload, env.jwt.secret, options);
  },

  /**
   * Generate JWT Refresh Token
   */
  generateRefreshToken(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: env.jwt.refreshExpiresIn as any,
    };
    return jwt.sign(payload, env.jwt.secret, options);
  },

  /**
   * Verify and decode JWT Token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.jwt.secret) as TokenPayload;
    } catch {
      return null;
    }
  },
};

export default tokenService;
