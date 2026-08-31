import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import meetingRoutes from "./meeting.routes";
import translationRoutes from "./translation.routes";
import dubbingRoutes from "./dubbing.routes";

const router = Router();

// Mount health routes
router.use("/", healthRoutes);

// Mount authentication routes
router.use("/auth", authRoutes);

// Mount meeting routes
router.use("/meetings", meetingRoutes);

// Mount translation routes
router.use("/translate", translationRoutes);

// Mount AI audio dubbing routes
router.use("/dubbing", dubbingRoutes);

export default router;
