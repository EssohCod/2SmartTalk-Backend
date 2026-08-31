export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦" },
  { code: "sq", name: "Albanian", nativeName: "Shqip", flag: "🇦🇱" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hy", name: "Armenian", nativeName: "Հայերեն", flag: "🇦🇲" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", flag: "🇮🇳" },
  { code: "ay", name: "Aymara", nativeName: "Aymar aru", flag: "🇧🇴" },
  { code: "az", name: "Azerbaijani", nativeName: "Azərbaycan", flag: "🇦🇿" },
  { code: "bm", name: "Bambara", nativeName: "Bamanankan", flag: "🇲🇱" },
  { code: "eu", name: "Basque", nativeName: "Euskara", flag: "🇪🇸" },
  { code: "be", name: "Belarusian", nativeName: "Беларуская", flag: "🇧🇾" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩" },
  { code: "bho", name: "Bhojpuri", nativeName: "भोजपुरी", flag: "🇮🇳" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski", flag: "🇧🇦" },
  { code: "bg", name: "Bulgarian", nativeName: "Български", flag: "🇧🇬" },
  { code: "ca", name: "Catalan", nativeName: "Català", flag: "🇪🇸" },
  { code: "ceb", name: "Cebuano", nativeName: "Cebuano", flag: "🇵🇭" },
  { code: "ny", name: "Chichewa", nativeName: "ChiCheŵa", flag: "🇲🇼" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼" },
  { code: "co", name: "Corsican", nativeName: "Corsu", flag: "🇫🇷" },
  { code: "hr", name: "Croatian", nativeName: "Hrvatski", flag: "🇭🇷" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰" },
  { code: "dv", name: "Dhivehi", nativeName: "ދިވެހި", flag: "🇲🇻" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱" },
  { code: "en-US", name: "English (US)", nativeName: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", nativeName: "English (UK)", flag: "🇬🇧" },
  { code: "en-AU", name: "English (Australia)", nativeName: "English (AU)", flag: "🇦🇺" },
  { code: "en-CA", name: "English (Canada)", nativeName: "English (CA)", flag: "🇨🇦" },
  { code: "en-IN", name: "English (India)", nativeName: "English (IN)", flag: "🇮🇳" },
  { code: "eo", name: "Esperanto", nativeName: "Esperanto", flag: "🌐" },
  { code: "et", name: "Estonian", nativeName: "Eesti", flag: "🇪🇪" },
  { code: "ee", name: "Ewe", nativeName: "Eʋegbe", flag: "🇬🇭" },
  { code: "fil", name: "Filipino (Tagalog)", nativeName: "Wikang Filipino", flag: "🇵🇭" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "fr-CA", name: "French (Canada)", nativeName: "Français (CA)", flag: "🇨🇦" },
  { code: "fy", name: "Frisian", nativeName: "Frysk", flag: "🇳🇱" },
  { code: "gl", name: "Galician", nativeName: "Galego", flag: "🇪🇸" },
  { code: "ka", name: "Georgian", nativeName: "ქართული", flag: "🇬🇪" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷" },
  { code: "gn", name: "Guarani", nativeName: "Avañe'ẽ", flag: "🇵🇾" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ht", name: "Haitian Creole", nativeName: "Kreyòl Ayisyen", flag: "🇭🇹" },
  { code: "ha", name: "Hausa", nativeName: "Harshen Hausa", flag: "🇳🇬" },
  { code: "haw", name: "Hawaiian", nativeName: "ʻŌlelo Hawaiʻi", flag: "🇺🇸" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "hmn", name: "Hmong", nativeName: "Hmoob", flag: "🌐" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "is", name: "Icelandic", nativeName: "Íslenska", flag: "🇮🇸" },
  { code: "ig", name: "Igbo", nativeName: "Asụsụ Igbo", flag: "🇳🇬" },
  { code: "ilo", name: "Ilocano", nativeName: "Ilokano", flag: "🇵🇭" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ga", name: "Irish", nativeName: "Gaeilge", flag: "🇮🇪" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "jv", name: "Javanese", nativeName: "Basa Jawa", flag: "🇮🇩" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "kk", name: "Kazakh", nativeName: "Қазақ тілі", flag: "🇰🇿" },
  { code: "km", name: "Khmer", nativeName: "ភាសាខ្មែរ", flag: "🇰🇭" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda", flag: "🇷🇼" },
  { code: "gom", name: "Konkani", nativeName: "कोंकणी", flag: "🇮🇳" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "kri", name: "Krio", nativeName: "Krio", flag: "🇸🇱" },
  { code: "ku", name: "Kurdish (Kurmanji)", nativeName: "Kurdî (Kurmancî)", flag: "🌐" },
  { code: "ckb", name: "Kurdish (Sorani)", nativeName: "کوردی (سۆرانی)", flag: "🌐" },
  { code: "ky", name: "Kyrgyz", nativeName: "Кыргызча", flag: "🇰🇬" },
  { code: "lo", name: "Lao", nativeName: "ພາສາລາວ", flag: "🇱🇦" },
  { code: "la", name: "Latin", nativeName: "Latina", flag: "🇻🇦" },
  { code: "lv", name: "Latvian", nativeName: "Latviešu", flag: "🇱🇻" },
  { code: "ln", name: "Lingala", nativeName: "Lingála", flag: "🇨🇩" },
  { code: "lt", name: "Lithuanian", nativeName: "Lietuvių", flag: "🇱🇹" },
  { code: "lg", name: "Luganda", nativeName: "Oluganda", flag: "🇺🇬" },
  { code: "lb", name: "Luxembourgish", nativeName: "Lëtzebuergesch", flag: "🇱🇺" },
  { code: "mk", name: "Macedonian", nativeName: "Македонски", flag: "🇲🇰" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", flag: "🇮🇳" },
  { code: "mg", name: "Malagasy", nativeName: "Malagasy", flag: "🇲🇬" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "mt", name: "Maltese", nativeName: "Malti", flag: "🇲🇹" },
  { code: "mi", name: "Maori", nativeName: "Te Reo Māori", flag: "🇳🇿" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "mni-Mtei", name: "Meiteilon (Manipuri)", nativeName: "মৈতৈলোন্", flag: "🇮🇳" },
  { code: "lus", name: "Mizo", nativeName: "Mizo ṭawng", flag: "🇮🇳" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол хэл", flag: "🇲🇳" },
  { code: "my", name: "Myanmar (Burmese)", nativeName: "မြန်မာစာ", flag: "🇲🇲" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", flag: "🇳🇵" },
  { code: "nso", name: "Northern Sotho (Sepedi)", nativeName: "Sesotho sa Leboa", flag: "🇿🇦" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴" },
  { code: "or", name: "Odia (Oriya)", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "om", name: "Oromo", nativeName: "Afaan Oromoo", flag: "🇪🇹" },
  { code: "ps", name: "Pashto", nativeName: "پښتو", flag: "🇦🇫" },
  { code: "fa", name: "Persian (Farsi)", nativeName: "فارسی", flag: "🇮🇷" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (BR)", flag: "🇧🇷" },
  { code: "pt-PT", name: "Portuguese (Portugal)", nativeName: "Português (PT)", flag: "🇵🇹" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "qu", name: "Quechua", nativeName: "Runa Simi", flag: "🇵🇪" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "sm", name: "Samoan", nativeName: "Gagana Sāmoa", flag: "🇼🇸" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", flag: "🇮🇳" },
  { code: "gd", name: "Scots Gaelic", nativeName: "Gàidhlig", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { code: "sr", name: "Serbian", nativeName: "Српски", flag: "🇷🇸" },
  { code: "st", name: "Sesotho", nativeName: "Sesotho", flag: "🇱🇸" },
  { code: "sn", name: "Shona", nativeName: "ChiShona", flag: "🇿🇼" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", flag: "🇵🇰" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", flag: "🇱🇰" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  { code: "sl", name: "Slovenian", nativeName: "Slovenščina", flag: "🇸🇮" },
  { code: "so", name: "Somali", nativeName: "Soomaali", flag: "🇸🇴" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "es-419", name: "Spanish (Latin America)", nativeName: "Español (Latinoamérica)", flag: "🇲🇽" },
  { code: "su", name: "Sundanese", nativeName: "Basa Sunda", flag: "🇮🇩" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "tt", name: "Tatar", nativeName: "Татар теле", flag: "🇷🇺" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ", flag: "🇪🇹" },
  { code: "ts", name: "Tsonga", nativeName: "Xitsonga", flag: "🇿🇦" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "tk", name: "Turkmen", nativeName: "Türkmen dili", flag: "🇹🇲" },
  { code: "ak", name: "Twi (Akan)", nativeName: "Twi", flag: "🇬🇭" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰" },
  { code: "ug", name: "Uyghur", nativeName: "ئۇيغۇرچە", flag: "🇨🇳" },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbekcha", flag: "🇺🇿" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "cy", name: "Welsh", nativeName: "Cymraeg", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { code: "xh", name: "Xhosa", nativeName: "isiXhosa", flag: "🇿🇦" },
  { code: "yi", name: "Yiddish", nativeName: "ייִדיש", flag: "🇮🇱" },
  { code: "yo", name: "Yoruba", nativeName: "Èdè Yorùbá", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", nativeName: "isiZulu", flag: "🇿🇦" },
];

/**
 * Normalizes language input to a standard ISO code compatible with Google Neural MT
 */
export function normalizeLanguageCode(lang: string): string {
  if (!lang) return "en";
  const clean = lang.trim().toLowerCase();

  // Direct code match
  const exactCode = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === clean);
  if (exactCode) {
    // Map dialect codes to primary 2-letter Google Translate code if needed
    if (exactCode.code === "fil" || exactCode.code === "tl") return "tl";
    if (exactCode.code.startsWith("en-")) return "en";
    if (exactCode.code === "es-419") return "es";
    if (exactCode.code.startsWith("fr-")) return "fr";
    if (exactCode.code.startsWith("pt-")) return "pt";
    return exactCode.code;
  }

  // Name match
  const foundByName = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.name.toLowerCase() === clean ||
      l.name.toLowerCase().includes(clean) ||
      clean.includes(l.name.toLowerCase()) ||
      l.nativeName.toLowerCase() === clean
  );

  if (foundByName) {
    if (foundByName.code === "fil" || foundByName.code === "tl") return "tl";
    if (foundByName.code.startsWith("en-")) return "en";
    if (foundByName.code === "es-419") return "es";
    if (foundByName.code.startsWith("fr-")) return "fr";
    if (foundByName.code.startsWith("pt-")) return "pt";
    return foundByName.code;
  }

  // Quick fallback aliases
  if (clean.includes("tagalog") || clean.includes("filipino")) return "tl";
  if (clean.includes("spanish") || clean.includes("español")) return "es";
  if (clean.includes("french") || clean.includes("français")) return "fr";
  if (clean.includes("russian") || clean.includes("русский")) return "ru";
  if (clean.includes("chinese") || clean.includes("mandarin") || clean.includes("中文")) return "zh-CN";
  if (clean.includes("japanese") || clean.includes("日本語")) return "ja";
  if (clean.includes("korean") || clean.includes("한국어")) return "ko";
  if (clean.includes("german") || clean.includes("deutsch")) return "de";
  if (clean.includes("arabic") || clean.includes("عربي")) return "ar";
  if (clean.includes("portuguese") || clean.includes("português")) return "pt";
  if (clean.includes("italian") || clean.includes("italiano")) return "it";
  if (clean.includes("hindi") || clean.includes("हिन्दी")) return "hi";
  if (clean.includes("yoruba")) return "yo";
  if (clean.includes("igbo")) return "ig";
  if (clean.includes("hausa")) return "ha";
  if (clean.includes("vietnamese")) return "vi";
  if (clean.includes("indonesian")) return "id";
  if (clean.includes("turkish")) return "tr";
  if (clean.includes("ukrainian")) return "uk";

  return clean.slice(0, 5);
}

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

    const targetLangObj =
      SUPPORTED_LANGUAGES.find((l) => l.code === targetCode || l.code.startsWith(targetCode)) ||
      SUPPORTED_LANGUAGES.find((l) => l.code === "en-US") ||
      SUPPORTED_LANGUAGES[0];

    const sourceLangObj =
      SUPPORTED_LANGUAGES.find((l) => l.code === sourceCode || l.code.startsWith(sourceCode)) ||
      SUPPORTED_LANGUAGES.find((l) => l.code === "en-US") ||
      SUPPORTED_LANGUAGES[0];

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

    // 1. Primary: Google Neural Translation API
    try {
      const srcParam = sourceCode === "auto" ? "auto" : sourceCode;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcParam}&tl=${targetCode}&dt=t&q=${encodeURIComponent(
        cleanText
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (2SmartTalk-NeuralTranslate/2.0)",
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
              SUPPORTED_LANGUAGES.find((l) => l.code === detectedSource || l.code.startsWith(detectedSource)) || sourceLangObj;

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
      console.warn("Google neural translation error, falling back to MyMemory:", networkError);
    }

    // 2. Secondary: MyMemory Multi-Engine Translation
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
            engine: "mymemory-nmt",
          };
        }
      }
    } catch (mmError) {
      console.warn("MyMemory fallback error:", mmError);
    }

    // Default graceful echo if offline
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
