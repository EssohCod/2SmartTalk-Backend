import { Router } from "express";
import { translationController } from "../controllers/translationController";

const router = Router();

// POST /api/translate - Translate single or batch text
router.post("/", translationController.translate);

// GET /api/translate/languages - List supported languages
router.get("/languages", translationController.getLanguages);

// GET /api/translate/status - Engine status & health
router.get("/status", translationController.getStatus);

export default router;
