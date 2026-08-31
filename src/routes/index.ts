import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";

const router = Router();

// Mount health routes
router.use("/", healthRoutes);

// Mount authentication routes
router.use("/auth", authRoutes);

export default router;
