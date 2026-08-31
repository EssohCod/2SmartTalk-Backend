import { Router, Request, Response } from "express";
import { checkDatabaseConnection } from "../config/db";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();

  res.status(200).json({
    status: "ok",
    service: "2SmartTalk Backend API",
    timestamp: new Date().toISOString(),
    database: {
      status: dbConnected ? "connected" : "disconnected",
    },
  });
});

export default router;
