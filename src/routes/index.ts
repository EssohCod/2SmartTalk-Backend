import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import meetingRoutes from "./meeting.routes";

const router = Router();

// Mount health routes
router.use("/", healthRoutes);

// Mount authentication routes
router.use("/auth", authRoutes);

// Mount meeting routes
router.use("/meetings", meetingRoutes);

export default router;
