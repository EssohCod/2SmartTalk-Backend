import { Router } from "express";
import { notificationController } from "../controllers/notificationController";

const router = Router();

// 1. Get notifications (with optional category filter)
router.get("/", notificationController.getNotifications);

// 2. Create notification
router.post("/", notificationController.createNotification);

// 3. Mark single notification as read
router.patch("/:id/read", notificationController.markAsRead);
router.post("/:id/read", notificationController.markAsRead);

// 4. Mark all notifications as read
router.patch("/read-all", notificationController.markAllAsRead);
router.post("/read-all", notificationController.markAllAsRead);

// 5. Delete single notification
router.delete("/:id", notificationController.deleteNotification);

// 6. Clear all notifications
router.delete("/", notificationController.clearAll);

export default router;
