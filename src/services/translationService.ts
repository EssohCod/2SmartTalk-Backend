import { pool } from "../config/db";
import { env } from "../config/env";

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

export interface ResolvedLanguagePreference {
  language: string;
  code: string;
  flag: string;
  enabled: boolean;
}

export async function resolvePreferredLanguage(context?: any): Promise<ResolvedLanguagePreference> {
  const user = context?.user || context || {};
  const headers = context?.headers || {};
  const query = context?.query || {};
  const body = context?.body || {};

  const explicitLanguage =
    (query.userLanguage as string) ||
    (headers["x-user-language"] as string) ||
    user?.nativeLanguage ||
    user?.native_language ||
    user?.preferredLanguage;

  const explicitCode =
    (query.userLanguageCode as string) ||
    (headers["x-user-language-code"] as string) ||
    user?.nativeLanguageCode ||
    user?.native_language_code;

  const explicitFlag =
    (query.userLanguageFlag as string) ||
    (headers["x-user-language-flag"] as string) ||
    user?.nativeLanguageFlag ||
    user?.native_language_flag;

  let language = explicitLanguage || "English (US)";
  let code = explicitCode || "en-US";
  let flag = explicitFlag || "🇺🇸";
  let enabled = user?.liveTranslationEnabled ?? user?.live_translation_enabled ?? true;

  const userId = user?.userId || user?.id || (headers["x-user-id"] as string) || (query.userId as string) || (body.userId as string);
  const email = user?.email || (headers["x-user-email"] as string) || (query.userEmail as string) || (query.email as string) || (body.email as string);

  if (userId || email) {
    const result = await pool.query(
      `SELECT native_language, native_language_code, native_language_flag, live_translation_enabled
       FROM users
       WHERE id = $1 OR LOWER(email) = LOWER($2)
       LIMIT 1`,
      [userId || "00000000-0000-0000-0000-000000000000", email || ""]
    );

    const row = result.rows[0];
    if (row) {
      language = explicitLanguage || row.native_language || language;
      code = explicitCode || row.native_language_code || code;
      flag = explicitFlag || row.native_language_flag || flag;
      enabled = user?.liveTranslationEnabled ?? user?.live_translation_enabled ?? (row.live_translation_enabled !== false);
    }
  }

  return {
    language,
    code,
    flag,
    enabled: enabled !== false,
  };
}

/**
 * Normalizes language input to a standard ISO code
 */
export function normalizeLanguageCode(lang?: string): string {
  if (!lang) return "en";
  const clean = lang.trim().toLowerCase();
  if (clean === "auto") return "auto";

  // Direct code match
  const exactCode = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === clean);
  if (exactCode) {
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

  // Common aliases
  if (clean.includes("french") || clean.includes("français")) return "fr";
  if (clean.includes("english") || clean.includes("anglais")) return "en";
  if (clean.includes("spanish") || clean.includes("español")) return "es";
  if (clean.includes("german") || clean.includes("deutsch")) return "de";
  if (clean.includes("italian") || clean.includes("italiano")) return "it";
  if (clean.includes("portuguese") || clean.includes("português")) return "pt";
  if (clean.includes("russian") || clean.includes("русский")) return "ru";
  if (clean.includes("chinese") || clean.includes("mandarin") || clean.includes("中文")) return "zh-CN";
  if (clean.includes("japanese") || clean.includes("日本語")) return "ja";
  if (clean.includes("korean") || clean.includes("한국어")) return "ko";
  if (clean.includes("arabic") || clean.includes("عربي")) return "ar";
  if (clean.includes("hindi") || clean.includes("हिन्दी")) return "hi";
  if (clean.includes("tagalog") || clean.includes("filipino")) return "tl";
  if (clean.includes("yoruba")) return "yo";
  if (clean.includes("igbo")) return "ig";
  if (clean.includes("hausa")) return "ha";
  if (clean.includes("swahili") || clean.includes("kiswahili")) return "sw";

  return clean.slice(0, 5);
}

/**
 * Resolve display LanguageInfo object
 */
export function getLanguageInfo(lang?: string): LanguageInfo {
  const code = normalizeLanguageCode(lang);
  const found =
    SUPPORTED_LANGUAGES.find((l) => l.code === code || l.code.startsWith(code)) ||
    SUPPORTED_LANGUAGES.find(
      (l) => l.name.toLowerCase() === (lang || "").toLowerCase()
    );

  if (found) return found;

  return {
    code: code || "en",
    name: lang || "English",
    nativeName: lang || "English",
    flag: "🌐",
  };
}

// In-Memory Translation Cache (LRU-style capped map)
const translationCache = new Map<string, { translatedText: string; engine: string }>();
const MAX_CACHE_SIZE = 5000;

function getCacheKey(text: string, source: string, target: string): string {
  return `${source}:${target}:${text.trim()}`;
}

function setInCache(key: string, translatedText: string, engine: string): void {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(key, { translatedText, engine });
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceLanguageFlag: string;
  targetLanguageFlag: string;
  engine: string;
}

/**
 * Maps ISO codes to Genesia's 3-letter code expectations (ISO 639-3 compatible)
 */
export function toGenesiaLanguageCode(isoCode: string): string {
  if (!isoCode || isoCode === "auto") return "eng";

  const code = isoCode.split("-")[0].toLowerCase();

  const map: { [key: string]: string } = {
    af: "afr",
    sq: "sqi",
    am: "amh",
    ar: "ara",
    hy: "hye",
    as: "asm",
    ay: "aym",
    az: "aze",
    bm: "bam",
    eu: "eus",
    be: "bel",
    bn: "ben",
    bho: "bho",
    bs: "bos",
    bg: "bul",
    ca: "cat",
    ceb: "ceb",
    ny: "nya",
    zh: "zho",
    co: "cos",
    hr: "hrv",
    cs: "ces",
    da: "dan",
    dv: "div",
    doi: "doi",
    nl: "nld",
    en: "eng",
    eo: "epo",
    et: "est",
    ee: "ewe",
    fil: "fil",
    tl: "tgl",
    fi: "fin",
    fr: "fra",
    fy: "fry",
    gl: "glg",
    ka: "kat",
    de: "deu",
    el: "ell",
    gn: "grn",
    gu: "guj",
    ht: "hat",
    ha: "hau",
    haw: "haw",
    he: "heb",
    hi: "hin",
    hmn: "hmn",
    hu: "hun",
    is: "isl",
    ig: "ibo",
    ilo: "ilo",
    id: "ind",
    ga: "gle",
    it: "ita",
    ja: "jpn",
    jv: "jav",
    kn: "kan",
    kk: "kaz",
    km: "khm",
    rw: "kin",
    gom: "gom",
    ko: "kor",
    kri: "kri",
    ku: "kur",
    ckb: "ckb",
    ky: "kir",
    lo: "lao",
    la: "lat",
    lv: "lav",
    ln: "lin",
    lt: "lit",
    lg: "lug",
    lb: "ltz",
    mk: "mkd",
    mai: "mai",
    mg: "mlg",
    ms: "msa",
    ml: "mal",
    mt: "mlt",
    mi: "mri",
    mr: "mar",
    mni: "mni",
    lus: "lus",
    mn: "mon",
    my: "mya",
    ne: "nep",
    nso: "nso",
    no: "nor",
    or: "ory",
    om: "orm",
    ps: "pus",
    fa: "fas",
    pl: "pol",
    pt: "por",
    pa: "pan",
    qu: "que",
    ro: "ron",
    ru: "rus",
    sm: "smo",
    sa: "san",
    gd: "gla",
    sr: "srp",
    st: "sot",
    sn: "sna",
    sd: "snd",
    si: "sin",
    sk: "slk",
    sl: "slv",
    so: "som",
    es: "spa",
    su: "sun",
    sw: "swa",
    sv: "swe",
    tg: "tgk",
    ta: "tam",
    tt: "tat",
    te: "tel",
    th: "tha",
    ti: "tir",
    ts: "tso",
    tr: "tur",
    tk: "tuk",
    ak: "aka",
    uk: "ukr",
    ur: "urd",
    ug: "uig",
    uz: "uzb",
    vi: "vie",
    cy: "cym",
    xh: "xho",
    yi: "yid",
    yo: "yor",
    zu: "zul",
  };

  return map[code] || "eng";
}

/**
 * 1. Genesia Custom Translation API
 * Primary translation engine hosted on Vercel.
 */
async function translateWithGenesia(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string | null> {
  try {
    const target = toGenesiaLanguageCode(targetLang);
    const source = sourceLang ? toGenesiaLanguageCode(sourceLang) : "eng";

    const response = await fetch("https://genesia-translation-api-five.vercel.app/api/v1/translation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        target_language: target,
        source_language: source,
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      return data.translated_text || data.translation || null;
    }
    return null;
  } catch (error) {
    console.warn("[Genesia Translation] API error:", error);
    return null;
  }
}

/**
 * Genesia ASR: Speech-to-Text
 */
export async function transcribeAudioWithGenesia(
  audioBuffer: Buffer,
  languageCode: string = "en"
): Promise<string | null> {
  try {
    const genesiaLang = toGenesiaLanguageCode(languageCode);
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("audio", blob, "audio.wav");
    formData.append("language", genesiaLang);

    const response = await fetch("https://genesia-translation-api-five.vercel.app/api/v1/speech/transcribe", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data: any = await response.json();
      return data.transcription || data.text || null;
    }
    return null;
  } catch (error) {
    console.warn("[Genesia ASR] API error:", error);
    return null;
  }
}

/**
 * Genesia TTS: Text-to-Speech
 */
export async function synthesizeSpeechWithGenesia(
  text: string,
  languageCode: string = "en"
): Promise<string | null> {
  try {
    const genesiaLang = toGenesiaLanguageCode(languageCode);
    const formData = new FormData();
    formData.append("text", text);
    formData.append("language", genesiaLang);

    const response = await fetch("https://genesia-translation-api-five.vercel.app/api/v1/speech/synthesize", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data: any = await response.json();
      return data.audio_url || null;
    }
    return null;
  } catch (error) {
    console.warn("[Genesia TTS] API error:", error);
    return null;
  }
}

/**
 * Genesia S2S: Speech-to-Speech Translation
 */
export async function translateSpeechWithGenesia(
  audioBuffer: Buffer,
  sourceLang: string = "en",
  targetLang: string = "es",
  preserveVoice: boolean = true
): Promise<{ audio_url: string; transcription: string; translation: string } | null> {
  try {
    const genesiaSource = toGenesiaLanguageCode(sourceLang);
    const genesiaTarget = toGenesiaLanguageCode(targetLang);

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    formData.append("audio", blob, "audio.wav");
    formData.append("source_language", genesiaSource);
    formData.append("target_language", genesiaTarget);
    formData.append("preserve_voice", String(preserveVoice));

    const response = await fetch("https://genesia-translation-api-five.vercel.app/api/v1/speech/translate", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const data: any = await response.json();
      return {
        audio_url: data.audio_url,
        transcription: data.transcription,
        translation: data.translation,
      };
    }
    return null;
  } catch (error) {
    console.warn("[Genesia S2S] API error:", error);
    return null;
  }
}

/**
 * 2. OpenAI Translation Engine (GPT-4o-mini / GPT-4o)
 * Highest accuracy, contextual conversational understanding, handles slang/typos.
 */
async function translateWithOpenAI(
  text: string,
  targetLangName: string,
  sourceLangName?: string
): Promise<string | null> {
  const apiKey = env.translation.openaiApiKey;
  if (!apiKey) return null;

  const model = env.translation.openaiModel || "gpt-4o-mini";
  const sourceContext = sourceLangName && sourceLangName !== "auto"
    ? `from ${sourceLangName}`
    : "from the detected source language";

  const systemPrompt = `You are a real-time conversational chat translator for 2SmartTalk.
Translate the user message ${sourceContext} accurately and naturally into ${targetLangName}.
Requirements:
1. Preserve conversational tone, emotion, emojis, punctuation, and intent.
2. If there are minor slang words or colloquial spelling (e.g. "jo mapel" -> "je m'appelle"), intelligently understand the intended meaning and provide the natural translation in ${targetLangName}.
3. Return ONLY the translated text string. Do NOT add quotation marks, explanations, notes, or prefixes.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.warn(`[OpenAI Translation] API error ${response.status}:`, errBody);
    return null;
  }

  const data: any = await response.json();
  const output = data.choices?.[0]?.message?.content?.trim();
  return output || null;
}

/**
 * 2. Google Gemini Translation Engine (Gemini 1.5 Flash / Gemini 2.0 Flash)
 * Ultra-fast, highly accurate neural translation.
 */
async function translateWithGemini(
  text: string,
  targetLangName: string,
  targetCode: string,
  sourceLangName?: string
): Promise<string | null> {
  const apiKey = env.translation.geminiApiKey;
  if (!apiKey) return null;

  const model = env.translation.geminiModel || "gemini-1.5-flash";
  const sourceText = sourceLangName && sourceLangName !== "auto"
    ? `from ${sourceLangName}`
    : "from its detected source language";

  const prompt = `You are a precision translator. Translate the following chat message ${sourceText} into ${targetLangName} (code: ${targetCode}). Preserve conversational nuance and return ONLY the translated string without quotes or markdown:\n\n${text}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.warn(`[Gemini Translation] API error ${response.status}:`, errBody);
    return null;
  }

  const data: any = await response.json();
  const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return output || null;
}

/**
 * 3. DeepL Translation Engine
 * Gold standard translation for European and major global languages.
 */
async function translateWithDeepL(
  text: string,
  targetCode: string,
  sourceCode?: string
): Promise<string | null> {
  const apiKey = env.translation.deeplApiKey;
  if (!apiKey) return null;

  const isFreeKey = apiKey.endsWith(":fx");
  const host = isFreeKey ? "https://api-free.deepl.com" : "https://api.deepl.com";

  // Map 2-letter codes to DeepL supported target uppercase codes
  let deepLTarget = targetCode.toUpperCase();
  if (deepLTarget === "EN") deepLTarget = "EN-US";
  if (deepLTarget === "PT") deepLTarget = "PT-PT";

  const params = new URLSearchParams();
  params.append("text", text);
  params.append("target_lang", deepLTarget);
  if (sourceCode && sourceCode !== "auto" && sourceCode !== "en") {
    params.append("source_lang", sourceCode.toUpperCase());
  }

  const response = await fetch(`${host}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.warn(`[DeepL Translation] API error ${response.status}:`, errBody);
    return null;
  }

  const data: any = await response.json();
  return data.translations?.[0]?.text?.trim() || null;
}

/**
 * 4. Google Cloud Translation Official API (v2)
 */
async function translateWithGoogleCloud(
  text: string,
  targetCode: string,
  sourceCode?: string
): Promise<string | null> {
  const apiKey = env.translation.googleTranslateApiKey;
  if (!apiKey) return null;

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const bodyPayload: any = {
    q: text,
    target: targetCode,
    format: "text",
  };
  if (sourceCode && sourceCode !== "auto") {
    bodyPayload.source = sourceCode;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    console.warn(`[Google Cloud Translation] API error ${response.status}:`, errBody);
    return null;
  }

  const data: any = await response.json();
  return data.data?.translations?.[0]?.translatedText?.trim() || null;
}

/**
 * 5. Free Neural Fallback (Google GTX)
 */
async function translateWithGoogleGTX(
  text: string,
  targetCode: string,
  sourceCode?: string
): Promise<string | null> {
  try {
    const srcParam = sourceCode === "auto" || !sourceCode ? "auto" : sourceCode;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${srcParam}&tl=${targetCode}&dt=t&q=${encodeURIComponent(
      text
    )}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const rawJson: any = await response.json();
      if (Array.isArray(rawJson) && Array.isArray(rawJson[0])) {
        const translatedChunks = rawJson[0]
          .map((chunk: any) => chunk[0])
          .filter(Boolean)
          .join("");

        if (translatedChunks && translatedChunks.trim()) {
          return translatedChunks.trim();
        }
      }
    }
  } catch {}
  return null;
}

/**
 * 6. Free Neural Fallback (MyMemory)
 */
async function translateWithMyMemory(
  text: string,
  targetCode: string,
  sourceCode?: string
): Promise<string | null> {
  try {
    const srcLang = sourceCode === "auto" || !sourceCode ? "en" : sourceCode;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${srcLang}|${targetCode}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const mmRes = await fetch(myMemoryUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (mmRes.ok) {
      const mmData: any = await mmRes.json();
      const translated = mmData?.responseData?.translatedText;
      if (
        translated &&
        !translated.startsWith("MYMEMORY WARNING") &&
        translated.trim().toLowerCase() !== text.trim().toLowerCase()
      ) {
        return translated.trim();
      }
    }
  } catch {}
  return null;
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
   * Get status of configured translation engines
   */
  getEngineStatus() {
    return {
      genesia: true, // Custom API is always considered available as primary
      openai: Boolean(env.translation.openaiApiKey),
      openaiModel: env.translation.openaiModel,
      gemini: Boolean(env.translation.geminiApiKey),
      geminiModel: env.translation.geminiModel,
      deepl: Boolean(env.translation.deeplApiKey),
      googleCloud: Boolean(env.translation.googleTranslateApiKey),
      preferredEngine: env.translation.preferredEngine,
      cacheEntries: translationCache.size,
    };
  },

  /**
   * Translate single text string from source to target language
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<TranslationResult> {
    const cleanText = (text || "").trim();
    if (!cleanText) {
      const targetObj = getLanguageInfo(targetLanguage);
      const sourceObj = getLanguageInfo(sourceLanguage);
      return {
        originalText: "",
        translatedText: "",
        sourceLanguage: sourceObj.name,
        targetLanguage: targetObj.name,
        sourceLanguageFlag: sourceObj.flag,
        targetLanguageFlag: targetObj.flag,
        engine: "empty",
      };
    }

    const targetCode = normalizeLanguageCode(targetLanguage);
    const sourceCode = sourceLanguage ? normalizeLanguageCode(sourceLanguage) : "auto";

    const targetObj = getLanguageInfo(targetLanguage);
    const sourceObj = getLanguageInfo(sourceLanguage);

    // If source and target are identical and specified
    if (sourceCode === targetCode && sourceCode !== "auto") {
      return {
        originalText: cleanText,
        translatedText: cleanText,
        sourceLanguage: sourceObj.name,
        targetLanguage: targetObj.name,
        sourceLanguageFlag: sourceObj.flag,
        targetLanguageFlag: targetObj.flag,
        engine: "identical",
      };
    }

    // Check cache
    const cacheKey = getCacheKey(cleanText, sourceCode, targetCode);
    const cached = translationCache.get(cacheKey);
    if (cached) {
      return {
        originalText: cleanText,
        translatedText: cached.translatedText,
        sourceLanguage: sourceObj.name,
        targetLanguage: targetObj.name,
        sourceLanguageFlag: sourceObj.flag,
        targetLanguageFlag: targetObj.flag,
        engine: `${cached.engine} (cached)`,
      };
    }

    let translated: string | null = null;
    let engineUsed = "none";

    const preferred = env.translation.preferredEngine.toLowerCase();

    // Strategy 1: Explicit preference if configured
    if (preferred === "genesia") {
      translated = await translateWithGenesia(cleanText, targetObj.name, sourceObj.name);
      if (translated) engineUsed = "genesia-custom-api";
    } else if (preferred === "openai" && env.translation.openaiApiKey) {
      translated = await translateWithOpenAI(cleanText, targetObj.name, sourceObj.name);
      if (translated) engineUsed = `openai (${env.translation.openaiModel})`;
    } else if (preferred === "gemini" && env.translation.geminiApiKey) {
      translated = await translateWithGemini(cleanText, targetObj.name, targetCode, sourceObj.name);
      if (translated) engineUsed = `gemini (${env.translation.geminiModel})`;
    } else if (preferred === "deepl" && env.translation.deeplApiKey) {
      translated = await translateWithDeepL(cleanText, targetCode, sourceCode);
      if (translated) engineUsed = "deepl";
    } else if (preferred === "google" && env.translation.googleTranslateApiKey) {
      translated = await translateWithGoogleCloud(cleanText, targetCode, sourceCode);
      if (translated) engineUsed = "google-cloud";
    }

    // Strategy 2: Automatic Cascade (Genesia -> OpenAI -> Gemini -> DeepL -> Google Cloud -> Free Neural)
    if (!translated) {
      translated = await translateWithGenesia(cleanText, targetObj.name, sourceObj.name);
      if (translated) engineUsed = "genesia-custom-api";
    }

    if (!translated && env.translation.openaiApiKey) {
      translated = await translateWithOpenAI(cleanText, targetObj.name, sourceObj.name);
      if (translated) engineUsed = `openai (${env.translation.openaiModel})`;
    }

    if (!translated && env.translation.geminiApiKey) {
      translated = await translateWithGemini(cleanText, targetObj.name, targetCode, sourceObj.name);
      if (translated) engineUsed = `gemini (${env.translation.geminiModel})`;
    }

    if (!translated && env.translation.deeplApiKey) {
      translated = await translateWithDeepL(cleanText, targetCode, sourceCode);
      if (translated) engineUsed = "deepl";
    }

    if (!translated && env.translation.googleTranslateApiKey) {
      translated = await translateWithGoogleCloud(cleanText, targetCode, sourceCode);
      if (translated) engineUsed = "google-cloud";
    }

    // Strategy 3: Free Neural API Fallbacks
    if (!translated) {
      translated = await translateWithGoogleGTX(cleanText, targetCode, sourceCode);
      if (translated) engineUsed = "google-gtx-neural";
    }

    if (!translated) {
      translated = await translateWithMyMemory(cleanText, targetCode, sourceCode);
      if (translated) engineUsed = "mymemory-nmt";
    }

    // Fallback: If all remote translators fail, return original
    const finalTranslation = translated && translated.trim() ? translated.trim() : cleanText;
    const finalEngine = translated ? engineUsed : "echo-fallback";

    // Cache successful translation
    if (translated) {
      setInCache(cacheKey, finalTranslation, finalEngine);
    }

    return {
      originalText: cleanText,
      translatedText: finalTranslation,
      sourceLanguage: sourceObj.name,
      targetLanguage: targetObj.name,
      sourceLanguageFlag: sourceObj.flag,
      targetLanguageFlag: targetObj.flag,
      engine: finalEngine,
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
      engine: string;
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
      engine: r.engine,
    }));
  },

  /**
   * Genesia ASR: Speech-to-Text
   */
  async transcribeAudio(audioBuffer: Buffer, languageCode: string = "eng"): Promise<string | null> {
    return transcribeAudioWithGenesia(audioBuffer, languageCode);
  },

  /**
   * Genesia TTS: Text-to-Speech
   */
  async synthesizeSpeech(text: string, languageCode: string = "fra"): Promise<string | null> {
    return synthesizeSpeechWithGenesia(text, languageCode);
  },

  /**
   * Genesia S2S: Speech-to-Speech Translation
   */
  async translateSpeech(
    audioBuffer: Buffer,
    sourceLang: string = "eng",
    targetLang: string = "spa",
    preserveVoice: boolean = true
  ) {
    return translateSpeechWithGenesia(audioBuffer, sourceLang, targetLang, preserveVoice);
  },
};

export default translationService;
