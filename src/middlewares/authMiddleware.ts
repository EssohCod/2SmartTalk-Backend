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
