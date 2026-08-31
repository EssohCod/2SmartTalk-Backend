import { Router } from "express";
import { callController } from "../controllers/callController";

const router = Router();

// GET /api/calls - Get calls history (supports ?direction=all|missed|incoming|outgoing&search=...)
router.get("/", callController.getCalls);

// POST /api/calls - Log a call
router.post("/", callController.logCall);

// DELETE /api/calls/:id - Delete single call
router.delete("/:id", callController.deleteCall);

// DELETE /api/calls - Clear all call history
router.delete("/", callController.clearCallHistory);

export default router;
