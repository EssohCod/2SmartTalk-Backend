import { Request, Response } from "express";
import { dubbingService } from "../services/dubbingService";

export const dubbingController = {
  /**
   * 1. Text-to-Speech (TTS) Synthesis
   */
  async textToSpeech(req: Request, res: Response): Promise<void> {
    try {
      const { text, targetLanguage = "en", voiceGender = "female", speakingRate = 1.0 } = req.body;

      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "'text' parameter is required for voice synthesis." });
        return;
      }

      const result = await dubbingService.synthesizeSpeech(text, targetLanguage, {
        voiceGender: voiceGender === "male" ? "male" : "female",
        speakingRate: Number(speakingRate) || 1.0,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("DubbingController.textToSpeech error:", error);
      res.status(500).json({ error: "Text-to-speech synthesis failed. Please try again." });
    }
  },

  /**
   * 2. Speech-to-Speech / Audio Translation and AI Voice Dubbing
   */
  async dubAudio(req: Request, res: Response): Promise<void> {
    try {
      const {
        transcript,
        targetLanguage = "en",
        sourceLanguage,
        voiceGender = "female",
      } = req.body;

      if (!transcript || typeof transcript !== "string") {
        res.status(400).json({ error: "'transcript' text is required for audio dubbing." });
        return;
      }

      const result = await dubbingService.dubAudio(
        transcript,
        targetLanguage,
        sourceLanguage,
        voiceGender === "male" ? "male" : "female"
      );

      res.status(200).json({
        success: true,
        message: "Audio dubbed successfully!",
        ...result,
      });
    } catch (error: any) {
      console.error("DubbingController.dubAudio error:", error);
      res.status(500).json({ error: "Audio dubbing process failed. Please try again." });
    }
  },

  /**
   * 3. Get Available Voice Profiles
   */
  async getVoices(req: Request, res: Response): Promise<void> {
    try {
      const languageCode = req.query.language as string;
      const voices = dubbingService.getVoices(languageCode);

      res.status(200).json({
        success: true,
        count: voices.length,
        voices,
      });
    } catch (error: any) {
      console.error("DubbingController.getVoices error:", error);
      res.status(500).json({ error: "Failed to retrieve available voices." });
    }
  },
};

export default dubbingController;
