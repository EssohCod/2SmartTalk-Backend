import { Request, Response } from "express";
import { resolvePreferredLanguage, translationService } from "../services/translationService";

export const translationController = {
  /**
   * 1. Translate Single Text or Batch of Texts
   */
  async translate(req: Request, res: Response): Promise<void> {
    try {
      const preferredLanguage = await resolvePreferredLanguage(req);
      const { text, texts, targetLanguage = preferredLanguage.language, sourceLanguage } = req.body;

      if (!targetLanguage) {
        res.status(400).json({ error: "targetLanguage parameter is required (e.g., 'es', 'fr', 'tl', 'ru', 'en')." });
        return;
      }

      // Batch translation mode
      if (Array.isArray(texts)) {
        const batchResults = await translationService.translateBatch(
          texts,
          targetLanguage,
          sourceLanguage
        );
        res.status(200).json({
          success: true,
          count: batchResults.length,
          translations: batchResults,
          targetLanguage,
        });
        return;
      }

      // Single text translation mode
      if (typeof text !== "string") {
        res.status(400).json({ error: "A valid 'text' string or 'texts' array is required." });
        return;
      }

      const result = await translationService.translateText(
        text,
        targetLanguage,
        sourceLanguage
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error("TranslationController.translate error:", error);
      res.status(500).json({ error: "Translation request failed. Please try again." });
    }
  },

  /**
   * 2. Get Supported Languages List
   */
  async getLanguages(req: Request, res: Response): Promise<void> {
    try {
      const languages = translationService.getSupportedLanguages();
      res.status(200).json({
        success: true,
        count: languages.length,
        languages,
      });
    } catch (error: any) {
      console.error("TranslationController.getLanguages error:", error);
      res.status(500).json({ error: "Failed to retrieve supported languages." });
    }
  },

  /**
   * 3. Get Active Translation Engines Status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = translationService.getEngineStatus();
      res.status(200).json({
        success: true,
        engines: status,
      });
    } catch (error: any) {
      console.error("TranslationController.getStatus error:", error);
      res.status(500).json({ error: "Failed to retrieve engine status." });
    }
  },
};

export default translationController;
