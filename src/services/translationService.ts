export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "tl", name: "Filipino (Tagalog)", nativeName: "Tagalog", flag: "🇵🇭" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "zh", name: "Mandarin Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
];

/**
 * Normalizes language input to a standard 2-letter ISO code
 */
export function normalizeLanguageCode(lang: string): string {
  if (!lang) return "en";
  const clean = lang.trim().toLowerCase();
  if (clean.length === 2) return clean;

  const found = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.code.toLowerCase() === clean ||
      l.name.toLowerCase() === clean ||
      l.name.toLowerCase().includes(clean) ||
      clean.includes(l.name.toLowerCase()) ||
      l.nativeName.toLowerCase() === clean
  );

  if (found) return found.code;

  if (clean.includes("tagalog") || clean.includes("filipino")) return "tl";
  if (clean.includes("spanish")) return "es";
  if (clean.includes("french")) return "fr";
  if (clean.includes("russian")) return "ru";
  if (clean.includes("chinese") || clean.includes("mandarin")) return "zh";
  if (clean.includes("japanese")) return "ja";
  if (clean.includes("korean")) return "ko";
  if (clean.includes("german")) return "de";
  if (clean.includes("arabic")) return "ar";
  if (clean.includes("portuguese")) return "pt";
  if (clean.includes("italian")) return "it";
  if (clean.includes("hindi")) return "hi";

  return "en";
}

/**
 * Built-in contextual conversational dictionary for reliable fallback
 */
const COMMON_PHRASES: Record<string, Record<string, string>> = {
  "hello": {
    es: "Hola",
    fr: "Bonjour",
    de: "Hallo",
    ru: "Здравствуйте",
    tl: "Kumusta",
    zh: "你好",
    ja: "こんにちは",
    ko: "안녕하세요",
    pt: "Olá",
    it: "Ciao",
    ar: "مرحبا",
    hi: "नमस्ते",
  },
  "how are you": {
    es: "¿Cómo estás?",
    fr: "Comment allez-vous ?",
    de: "Wie geht es Ihnen?",
    ru: "Как ваши дела?",
    tl: "Kumusta ka?",
    zh: "你好吗？",
    ja: "お元気ですか？",
    ko: "어떻게 지내세요?",
    pt: "Como você está?",
    it: "Come stai?",
    ar: "كيف حالك؟",
    hi: "आप कैसे हैं?",
  },
  "thank you": {
    es: "Gracias",
    fr: "Merci beaucoup",
    de: "Vielen Dank",
    ru: "Спасибо большое",
    tl: "Maraming salamat",
    zh: "谢谢",
    ja: "ありがとうございます",
    ko: "감사합니다",
    pt: "Muito obrigado",
    it: "Grazie mille",
    ar: "شكرا جزيلا",
    hi: "बहुत धन्यवाद",
  },
  "yes": {
    es: "Sí",
    fr: "Oui",
    de: "Ja",
    ru: "Да",
    tl: "Oo",
    zh: "是的",
    ja: "はい",
    ko: "네",
    pt: "Sim",
    it: "Sì",
    ar: "نعم",
    hi: "हाँ",
  },
  "no": {
    es: "No",
    fr: "Non",
    de: "Nein",
    ru: "Нет",
    tl: "Hindi",
    zh: "不",
    ja: "いいえ",
    ko: "아니요",
    pt: "Não",
    it: "No",
    ar: "لا",
    hi: "नहीं",
  },
};

/**
 * Core Translation Service
 */
export const translationService = {
  /**
   * Get supported languages list
   */
  getSupportedLanguages(): LanguageInfo[] {
    return SUPPORTED_LANGUAGES;
  },

  /**
   * Translate single text string from source to target language
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<{
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
    sourceLanguageFlag: string;
    targetLanguageFlag: string;
    engine: string;
  }> {
    const cleanText = (text || "").trim();
    if (!cleanText) {
      return {
        originalText: "",
        translatedText: "",
        sourceLanguage: sourceLanguage || "en",
        targetLanguage: targetLanguage || "en",
        sourceLanguageFlag: "🇺🇸",
        targetLanguageFlag: "🇺🇸",
        engine: "empty",
      };
    }

    const targetCode = normalizeLanguageCode(targetLanguage);
    const sourceCode = sourceLanguage ? normalizeLanguageCode(sourceLanguage) : "auto";

    const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetCode) || SUPPORTED_LANGUAGES[0];
    const sourceLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === sourceCode) || SUPPORTED_LANGUAGES[0];

    // If source and target are identical
    if (sourceCode === targetCode && sourceCode !== "auto") {
      return {
        originalText: cleanText,
        translatedText: cleanText,
        sourceLanguage: sourceCode,
        targetLanguage: targetCode,
        sourceLanguageFlag: sourceLangObj.flag,
        targetLanguageFlag: targetLangObj.flag,
        engine: "identical",
      };
    }

    // 1. Try Neural Google Translation API
    try {
      const srcParam = sourceCode === "auto" ? "auto" : sourceCode;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcParam}&tl=${targetCode}&dt=t&q=${encodeURIComponent(
        cleanText
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (2SmartTalk-NeuralEngine/1.0)",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const rawJson: any = await response.json();
        if (Array.isArray(rawJson) && Array.isArray(rawJson[0])) {
          const translatedChunks = rawJson[0]
            .map((chunk: any) => chunk[0])
            .filter(Boolean)
            .join("");

          if (translatedChunks && translatedChunks.trim()) {
            const detectedSource = rawJson[2] || sourceCode;
            const detectedLangObj =
              SUPPORTED_LANGUAGES.find((l) => l.code === detectedSource) || sourceLangObj;

            return {
              originalText: cleanText,
              translatedText: translatedChunks.trim(),
              sourceLanguage: detectedSource,
              targetLanguage: targetCode,
              sourceLanguageFlag: detectedLangObj.flag,
              targetLanguageFlag: targetLangObj.flag,
              engine: "google-neural",
            };
          }
        }
      }
    } catch (networkError) {
      console.warn("Neural translate request failed, attempting fallback:", networkError);
    }

    // 2. Try MyMemory Translation API Fallback
    try {
      const srcLang = sourceCode === "auto" ? "en" : sourceCode;
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        cleanText
      )}&langpair=${srcLang}|${targetCode}`;

      const mmRes = await fetch(myMemoryUrl);
      if (mmRes.ok) {
        const mmData: any = await mmRes.json();
        const translated = mmData?.responseData?.translatedText;
        if (translated && !translated.startsWith("MYMEMORY WARNING")) {
          return {
            originalText: cleanText,
            translatedText: translated,
            sourceLanguage: srcLang,
            targetLanguage: targetCode,
            sourceLanguageFlag: sourceLangObj.flag,
            targetLanguageFlag: targetLangObj.flag,
            engine: "mymemory-api",
          };
        }
      }
    } catch (mmError) {
      console.warn("MyMemory fallback error:", mmError);
    }

    // 3. Smart Dictionary Fallback
    const lowerKey = cleanText.toLowerCase().replace(/[?!.,]/g, "").trim();
    if (COMMON_PHRASES[lowerKey] && COMMON_PHRASES[lowerKey][targetCode]) {
      return {
        originalText: cleanText,
        translatedText: COMMON_PHRASES[lowerKey][targetCode],
        sourceLanguage: sourceCode === "auto" ? "en" : sourceCode,
        targetLanguage: targetCode,
        sourceLanguageFlag: sourceLangObj.flag,
        targetLanguageFlag: targetLangObj.flag,
        engine: "smart-dictionary",
      };
    }

    // Default graceful echo if all external engines unreachable
    return {
      originalText: cleanText,
      translatedText: cleanText,
      sourceLanguage: sourceCode === "auto" ? "en" : sourceCode,
      targetLanguage: targetCode,
      sourceLanguageFlag: sourceLangObj.flag,
      targetLanguageFlag: targetLangObj.flag,
      engine: "echo-fallback",
    };
  },

  /**
   * Batch translate multiple texts
   */
  async translateBatch(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<
    Array<{
      originalText: string;
      translatedText: string;
      sourceLanguage: string;
      targetLanguage: string;
    }>
  > {
    const promises = texts.map((t) =>
      this.translateText(t, targetLanguage, sourceLanguage)
    );
    const results = await Promise.all(promises);
    return results.map((r) => ({
      originalText: r.originalText,
      translatedText: r.translatedText,
      sourceLanguage: r.sourceLanguage,
      targetLanguage: r.targetLanguage,
    }));
  },
};

export default translationService;
