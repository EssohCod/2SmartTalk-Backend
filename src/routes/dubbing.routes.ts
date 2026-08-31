import { Router } from "express";
import { dubbingController } from "../controllers/dubbingController";

const router = Router();

// POST /api/dubbing/text-to-speech - Synthesize speech audio from text
router.post("/text-to-speech", dubbingController.textToSpeech);

// POST /api/dubbing/translate-audio - Translate & dub audio
router.post("/translate-audio", dubbingController.dubAudio);

// GET /api/dubbing/voices - Get available voices
router.get("/voices", dubbingController.getVoices);

export default router;
