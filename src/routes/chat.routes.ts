import { Router } from "express";
import { chatController } from "../controllers/chatController";
import { optionalAuthenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(optionalAuthenticate);

// GET /api/chats - Get all conversations (supports ?type=direct|group|all)
router.get("/", chatController.getConversations);

// POST /api/chats - Create new conversation
router.post("/", chatController.createConversation);

// GET /api/chats/:id/messages - Get message thread
router.get("/:id/messages", chatController.getMessages);

// POST /api/chats/:id/messages - Send message with real-time translation
router.post("/:id/messages", chatController.sendMessage);

// PATCH /api/chats/:id/read - Mark conversation as read (clear unread count)
router.patch("/:id/read", chatController.markAsRead);

// DELETE /api/chats/:id - Delete conversation
router.delete("/:id", chatController.deleteConversation);

export default router;
