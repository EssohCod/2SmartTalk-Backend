import { Router } from "express";
import { callController } from "../controllers/callController";
import { optionalAuthenticate } from "../middlewares/authMiddleware";

const router = Router();

router.use(optionalAuthenticate);

// 1. Call Signaling & Real-time Session Endpoints
router.post("/initiate", callController.initiateCall);
router.get("/incoming", callController.getIncomingCall);
router.post("/:sessionId/accept", callController.acceptCall);
router.post("/:sessionId/decline", callController.declineCall);
router.post("/:sessionId/end", callController.endCall);
router.get("/:sessionId/status", callController.getSessionStatus);
router.post("/:sessionId/translate-speech", callController.translateCallSpeech);

// 2. Call History Logs Endpoints
router.get("/", callController.getCalls);
router.post("/", callController.logCall);
router.delete("/:id", callController.deleteCall);
router.delete("/", callController.clearCallHistory);

export default router;
