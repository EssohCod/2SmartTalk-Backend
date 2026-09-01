import { Request, Response, NextFunction } from "express";
import { tokenService, TokenPayload } from "../services/tokenService";

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

export const optionalAuthenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const decoded = tokenService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  // Fallback to custom headers if present
  const headerUserId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
  const headerEmail = (req.headers["x-user-email"] as string) || (req.query.userEmail as string);

  if (headerUserId || headerEmail) {
    req.user = {
      userId: headerUserId,
      email: headerEmail,
    } as any;
  }

  next();
};
