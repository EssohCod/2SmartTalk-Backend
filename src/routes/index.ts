import { Router } from "express";
import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import meetingRoutes from "./meeting.routes";
import translationRoutes from "./translation.routes";
import dubbingRoutes from "./dubbing.routes";
import contactRoutes from "./contact.routes";
import groupRoutes from "./group.routes";
import chatRoutes from "./chat.routes";
import callRoutes from "./call.routes";

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

// Mount contacts routes
router.use("/contacts", contactRoutes);

// Mount multilingual groups routes
router.use("/groups", groupRoutes);

// Mount chats & messaging routes
router.use("/chats", chatRoutes);

// Mount calls history & logs routes
router.use("/calls", callRoutes);

export default router;
