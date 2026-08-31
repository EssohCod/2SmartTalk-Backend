import express, { Application, Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { checkDatabaseConnection } from "./config/db";

const app: Application = express();

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to 2SmartTalk Backend API",
    version: "1.0.0",
    healthCheck: "/api/health",
  });
});

// API Routes
app.use("/api", apiRoutes);

// Global Error Handler
app.use(errorHandler);

// Start server
const PORT = env.port;
const server = app.listen(PORT, async () => {
  console.log(`🚀 2SmartTalk Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${env.nodeEnv}`);

  // Test database connection at startup
  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    console.log("✅ PostgreSQL connected successfully");
  } else {
    console.log("⚠️  PostgreSQL connection unavailable (check your DB credentials in .env)");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default app;
