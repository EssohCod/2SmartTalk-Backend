import { translationService, normalizeLanguageCode, SUPPORTED_LANGUAGES } from "./translationService";

export interface VoiceProfile {
  id: string;
  name: string;
  gender: "male" | "female";
  languageCode: string;
  languageName: string;
  accent: string;
  sampleText: string;
}

export interface SpeechSynthesisResult {
  audioBase64: string;
  audioDataUri: string;
  audioFormat: string;
  durationSeconds: number;
  voiceGender: "male" | "female";
  languageCode: string;
}

export interface DubbingResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceLanguageFlag: string;
  targetLanguageFlag: string;
  dubbedAudioBase64: string;
  dubbedAudioDataUri: string;
  audioFormat: string;
  durationSeconds: number;
  voiceGender: "male" | "female";
}

/**
 * Standard TTS Voice catalog by language
 */
export const VOICE_CATALOG: VoiceProfile[] = [
  // English
  { id: "en-US-Neural-F", name: "Emma (Natural American)", gender: "female", languageCode: "en", languageName: "English (US)", accent: "American", sampleText: "Hello! Welcome to 2SmartTalk." },
  { id: "en-US-Neural-M", name: "David (Dynamic American)", gender: "male", languageCode: "en", languageName: "English (US)", accent: "American", sampleText: "Welcome aboard. Let's start the meeting." },
  { id: "en-GB-Neural-F", name: "Olivia (British)", gender: "female", languageCode: "en", languageName: "English (UK)", accent: "British", sampleText: "Good day, everyone." },

  // Spanish
  { id: "es-ES-Neural-F", name: "Sofia (Castilian Spanish)", gender: "female", languageCode: "es", languageName: "Spanish (Spain)", accent: "Castilian", sampleText: "Hola a todos, bienvenidos." },
  { id: "es-MX-Neural-M", name: "Mateo (Mexican Spanish)", gender: "male", languageCode: "es", languageName: "Spanish (LatAm)", accent: "Mexican", sampleText: "Hola, ¿cómo están?" },

  // French
  { id: "fr-FR-Neural-F", name: "Chloe (Parisian French)", gender: "female", languageCode: "fr", languageName: "French (France)", accent: "Parisian", sampleText: "Bonjour et bienvenue à tous." },

  // Russian
  { id: "ru-RU-Neural-F", name: "Elena (Russian)", gender: "female", languageCode: "ru", languageName: "Russian", accent: "Standard", sampleText: "Здравствуйте, рада вас слышать." },
  { id: "ru-RU-Neural-M", name: "Dmitry (Russian)", gender: "male", languageCode: "ru", languageName: "Russian", accent: "Standard", sampleText: "Приветствую всех участников." },

  // Filipino / Tagalog
  { id: "tl-PH-Neural-F", name: "Maria (Filipino)", gender: "female", languageCode: "tl", languageName: "Filipino (Tagalog)", accent: "Manila", sampleText: "Magandang araw sa inyong lahat." },

  // Mandarin Chinese
  { id: "zh-CN-Neural-F", name: "Xiaoxiao (Mandarin)", gender: "female", languageCode: "zh", languageName: "Mandarin Chinese", accent: "Standard", sampleText: "大家好，欢迎参加会议。" },

  // Japanese
  { id: "ja-JP-Neural-F", name: "Nanami (Japanese)", gender: "female", languageCode: "ja", languageName: "Japanese", accent: "Tokyo", sampleText: "皆さん、こんにちは。" },

  // German
  { id: "de-DE-Neural-F", name: "Katja (German)", gender: "female", languageCode: "de", languageName: "German", accent: "Standard", sampleText: "Guten Tag, herzlich willkommen." },

  // Arabic
  { id: "ar-SA-Neural-M", name: "Hamdan (Arabic)", gender: "male", languageCode: "ar", languageName: "Arabic", accent: "Gulf", sampleText: "مرحبا بكم جميعا في هذا الاجتماع." },

  // Portuguese
  { id: "pt-BR-Neural-F", name: "Francisca (Brazilian Portuguese)", gender: "female", languageCode: "pt", languageName: "Portuguese (Brazil)", accent: "Brazilian", sampleText: "Olá a todos, sejam bem-vindos." },
];

export const dubbingService = {
  /**
   * Get available voice profiles
   */
  getVoices(languageCode?: string): VoiceProfile[] {
    if (!languageCode) return VOICE_CATALOG;
    const norm = normalizeLanguageCode(languageCode);
    const filtered = VOICE_CATALOG.filter((v) => v.languageCode === norm);
    return filtered.length > 0 ? filtered : VOICE_CATALOG;
  },

  /**
   * Text-to-Speech (TTS) Voice Synthesis
   * Fetches neural voice audio stream and converts to base64 mp3
   */
  async synthesizeSpeech(
    text: string,
    targetLanguage: string,
    options?: {
      voiceGender?: "male" | "female";
      speakingRate?: number;
    }
  ): Promise<SpeechSynthesisResult> {
    const cleanText = (text || "").trim();
    const langCode = normalizeLanguageCode(targetLanguage);
    const gender = options?.voiceGender || "female";

    if (!cleanText) {
      return {
        audioBase64: "",
        audioDataUri: "",
        audioFormat: "mp3",
        durationSeconds: 0,
        voiceGender: gender,
        languageCode: langCode,
      };
    }

    try {
      // 1. Try Genesia Custom TTS Primary
      const genesiaAudioUrl = await translationService.synthesizeSpeech(cleanText, langCode);
      if (genesiaAudioUrl) {
        const audioRes = await fetch(genesiaAudioUrl);
        if (audioRes.ok) {
          const arrayBuffer = await audioRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64 = buffer.toString("base64");
          const dataUri = `data:audio/wav;base64,${base64}`;

          const wordCount = cleanText.split(/\s+/).length;
          const estimatedSeconds = Math.max(1, Math.round((wordCount / 150) * 60 * 10) / 10);

          return {
            audioBase64: base64,
            audioDataUri: dataUri,
            audioFormat: "wav",
            durationSeconds: estimatedSeconds,
            voiceGender: gender,
            languageCode: langCode,
          };
        }
      }

      // 2. Fallback: High-speed neural Google TTS audio synthesis
      const encodedText = encodeURIComponent(cleanText.slice(0, 500));
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&client=tw-ob`;

      const response = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (2SmartTalk-DubbingEngine/1.0)",
          Accept: "audio/mpeg, audio/*",
        },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const dataUri = `data:audio/mp3;base64,${base64}`;

        // Estimate duration based on word count (~150 words per minute)
        const wordCount = cleanText.split(/\s+/).length;
        const estimatedSeconds = Math.max(1, Math.round((wordCount / 150) * 60 * 10) / 10);

        return {
          audioBase64: base64,
          audioDataUri: dataUri,
          audioFormat: "mp3",
          durationSeconds: estimatedSeconds,
          voiceGender: gender,
          languageCode: langCode,
        };
      }
    } catch (ttsErr) {
      console.warn("TTS synthesis network warning, building fallback placeholder:", ttsErr);
    }

    // Fallback audio response
    const wordCount = cleanText.split(/\s+/).length;
    const estimatedSeconds = Math.max(1, Math.round((wordCount / 150) * 60 * 10) / 10);

    return {
      audioBase64: "",
      audioDataUri: "",
      audioFormat: "mp3",
      durationSeconds: estimatedSeconds,
      voiceGender: gender,
      languageCode: langCode,
    };
  },

  /**
   * Unified Audio Speech Translation & AI Dubbing Pipeline
   * Translates incoming speech transcript -> synthesizes target language voice audio
   */
  async dubAudio(
    transcript: string,
    targetLanguage: string,
    sourceLanguage?: string,
    voiceGender: "male" | "female" = "female"
  ): Promise<DubbingResult> {
    const cleanTranscript = (transcript || "").trim();

    // 1. Translate the transcript into target language
    const translation = await translationService.translateText(
      cleanTranscript,
      targetLanguage,
      sourceLanguage
    );

    // 2. Synthesize voice audio in target language
    const speech = await this.synthesizeSpeech(
      translation.translatedText,
      targetLanguage,
      { voiceGender }
    );

    return {
      originalText: cleanTranscript,
      translatedText: translation.translatedText,
      sourceLanguage: translation.sourceLanguage,
      targetLanguage: translation.targetLanguage,
      sourceLanguageFlag: translation.sourceLanguageFlag,
      targetLanguageFlag: translation.targetLanguageFlag,
      dubbedAudioBase64: speech.audioBase64,
      dubbedAudioDataUri: speech.audioDataUri,
      audioFormat: speech.audioFormat,
      durationSeconds: speech.durationSeconds,
      voiceGender,
    };
  },
};

export default dubbingService;
