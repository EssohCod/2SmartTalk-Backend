import { Router } from "express";
import { userController } from "../controllers/userController";

const router = Router();

// 1. Get current user profile & settings
router.get("/profile", userController.getProfile);

// Get real-time dashboard statistics
router.get("/stats", userController.getDashboardStats);

// 2. Update personal information
router.put("/profile", userController.updateProfile);
router.patch("/profile", userController.updateProfile);

// 3. Update language preferences
router.patch("/language", userController.updateLanguage);

// 4. Update settings (notifications, privacy, call & translation)
router.patch("/settings", userController.updateSettings);
router.put("/settings", userController.updateSettings);

// 5. Update avatar
router.post("/avatar", userController.updateAvatar);
router.patch("/avatar", userController.updateAvatar);

// 6. Change password
router.post("/change-password", userController.changePassword);

// 7. Submit feedback & support
router.post("/feedback", userController.submitFeedback);

export default router;
