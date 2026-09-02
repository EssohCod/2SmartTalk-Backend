import { Request, Response, NextFunction } from "express";
import { tokenService, TokenPayload } from "../services/tokenService";
import { pool } from "../config/db";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication token missing or invalid. Please sign in.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = tokenService.verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      error: "Session expired or invalid token. Please sign in again.",
    });
    return;
  }

  req.user = decoded;
  next();
};

export const optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = tokenService.verifyToken(token);
      if (decoded) {
        req.user = decoded;
        return next();
      }
    }

    // Fallback to custom headers or query params
    let headerUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    const headerEmail = (req.headers["x-user-email"] as string) || (req.query.userEmail as string);

    if (!headerUserId && headerEmail) {
      const uRes = await pool.query(
        "SELECT id, native_language, native_language_code, native_language_flag, live_translation_enabled FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
        [headerEmail.trim()]
      );
      if (uRes.rows.length > 0) {
        headerUserId = uRes.rows[0].id;
        req.user = {
          userId: headerUserId,
          email: headerEmail,
          nativeLanguage: uRes.rows[0].native_language,
          nativeLanguageCode: uRes.rows[0].native_language_code || "en-US",
          nativeLanguageFlag: uRes.rows[0].native_language_flag,
          liveTranslationEnabled: uRes.rows[0].live_translation_enabled !== false,
        } as any;
        return next();
      }
    }

    if (headerUserId || headerEmail) {
      const uRes = await pool.query(
        "SELECT id, email, native_language, native_language_code, native_language_flag, live_translation_enabled FROM users WHERE ($1::uuid IS NOT NULL AND id = $1) OR LOWER(email) = LOWER($2) LIMIT 1",
        [headerUserId || null, headerEmail || ""]
      );

      if (uRes.rows.length > 0) {
        const row = uRes.rows[0];
        req.user = {
          userId: row.id,
          email: row.email,
          nativeLanguage: row.native_language,
          nativeLanguageCode: row.native_language_code || "en-US",
          nativeLanguageFlag: row.native_language_flag,
          liveTranslationEnabled: row.live_translation_enabled !== false,
        } as any;
      } else {
        req.user = {
          userId: headerUserId,
          email: headerEmail,
        } as any;
      }
    }

    next();
  } catch (err) {
    next();
  }
};
