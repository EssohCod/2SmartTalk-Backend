export interface CountryTimezoneInfo {
  country: string;
  timezone: string;
  offset: string;
  flag?: string;
  label: string;
}

// Map of Flag Emoji to Country & Primary IANA Timezone
export const FLAG_TO_TIMEZONE: Record<string, CountryTimezoneInfo> = {
  "🇳🇬": { country: "Nigeria", timezone: "Africa/Lagos", offset: "UTC+01:00", label: "Lagos (Africa) • UTC+01:00" },
  "🇺🇸": { country: "United States", timezone: "America/New_York", offset: "UTC-04:00", label: "New York (America) • UTC-04:00" },
  "🇬🇧": { country: "United Kingdom", timezone: "Europe/London", offset: "UTC+01:00", label: "London (Europe) • UTC+01:00" },
  "🇵🇭": { country: "Philippines", timezone: "Asia/Manila", offset: "UTC+08:00", label: "Manila (Asia) • UTC+08:00" },
  "🇪🇸": { country: "Spain", timezone: "Europe/Madrid", offset: "UTC+02:00", label: "Madrid (Europe) • UTC+02:00" },
  "🇫🇷": { country: "France", timezone: "Europe/Paris", offset: "UTC+02:00", label: "Paris (Europe) • UTC+02:00" },
  "🇩🇪": { country: "Germany", timezone: "Europe/Berlin", offset: "UTC+02:00", label: "Berlin (Europe) • UTC+02:00" },
  "🇮🇹": { country: "Italy", timezone: "Europe/Rome", offset: "UTC+02:00", label: "Rome (Europe) • UTC+02:00" },
  "🇷🇺": { country: "Russia", timezone: "Europe/Moscow", offset: "UTC+03:00", label: "Moscow (Europe) • UTC+03:00" },
  "🇨🇳": { country: "China", timezone: "Asia/Shanghai", offset: "UTC+08:00", label: "Shanghai (Asia) • UTC+08:00" },
  "🇹🇼": { country: "Taiwan", timezone: "Asia/Taipei", offset: "UTC+08:00", label: "Taipei (Asia) • UTC+08:00" },
  "🇯🇵": { country: "Japan", timezone: "Asia/Tokyo", offset: "UTC+09:00", label: "Tokyo (Asia) • UTC+09:00" },
  "🇰🇷": { country: "South Korea", timezone: "Asia/Seoul", offset: "UTC+09:00", label: "Seoul (Asia) • UTC+09:00" },
  "🇸🇦": { country: "Saudi Arabia", timezone: "Asia/Riyadh", offset: "UTC+03:00", label: "Riyadh (Asia) • UTC+03:00" },
  "🇦🇪": { country: "United Arab Emirates", timezone: "Asia/Dubai", offset: "UTC+04:00", label: "Dubai (Asia) • UTC+04:00" },
  "🇧🇷": { country: "Brazil", timezone: "America/Sao_Paulo", offset: "UTC-03:00", label: "São Paulo (America) • UTC-03:00" },
  "🇵🇹": { country: "Portugal", timezone: "Europe/Lisbon", offset: "UTC+01:00", label: "Lisbon (Europe) • UTC+01:00" },
  "🇮🇳": { country: "India", timezone: "Asia/Kolkata", offset: "UTC+05:30", label: "New Delhi / Kolkata (Asia) • UTC+05:30" },
  "🇨🇦": { country: "Canada", timezone: "America/Toronto", offset: "UTC-04:00", label: "Toronto (America) • UTC-04:00" },
  "🇦🇺": { country: "Australia", timezone: "Australia/Sydney", offset: "UTC+10:00", label: "Sydney (Australia) • UTC+10:00" },
  "🇿🇦": { country: "South Africa", timezone: "Africa/Johannesburg", offset: "UTC+02:00", label: "Johannesburg (Africa) • UTC+02:00" },
  "🇬🇭": { country: "Ghana", timezone: "Africa/Accra", offset: "UTC+00:00", label: "Accra (Africa) • UTC+00:00" },
  "🇰🇪": { country: "Kenya", timezone: "Africa/Nairobi", offset: "UTC+03:00", label: "Nairobi (Africa) • UTC+03:00" },
  "🇪🇬": { country: "Egypt", timezone: "Africa/Cairo", offset: "UTC+02:00", label: "Cairo (Africa) • UTC+02:00" },
  "🇲🇦": { country: "Morocco", timezone: "Africa/Casablanca", offset: "UTC+01:00", label: "Casablanca (Africa) • UTC+01:00" },
  "🇲🇽": { country: "Mexico", timezone: "America/Mexico_City", offset: "UTC-06:00", label: "Mexico City (America) • UTC-06:00" },
  "🇦🇷": { country: "Argentina", timezone: "America/Buenos_Aires", offset: "UTC-03:00", label: "Buenos Aires (America) • UTC-03:00" },
  "🇨🇴": { country: "Colombia", timezone: "America/Bogota", offset: "UTC-05:00", label: "Bogota (America) • UTC-05:00" },
  "🇮🇩": { country: "Indonesia", timezone: "Asia/Jakarta", offset: "UTC+07:00", label: "Jakarta (Asia) • UTC+07:00" },
  "🇲🇾": { country: "Malaysia", timezone: "Asia/Kuala_Lumpur", offset: "UTC+08:00", label: "Kuala Lumpur (Asia) • UTC+08:00" },
  "🇸🇬": { country: "Singapore", timezone: "Asia/Singapore", offset: "UTC+08:00", label: "Singapore (Asia) • UTC+08:00" },
  "🇹🇭": { country: "Thailand", timezone: "Asia/Bangkok", offset: "UTC+07:00", label: "Bangkok (Asia) • UTC+07:00" },
  "🇻🇳": { country: "Vietnam", timezone: "Asia/Ho_Chi_Minh", offset: "UTC+07:00", label: "Ho Chi Minh (Asia) • UTC+07:00" },
  "🇹🇷": { country: "Turkey", timezone: "Europe/Istanbul", offset: "UTC+03:00", label: "Istanbul (Europe) • UTC+03:00" },
  "🇵🇰": { country: "Pakistan", timezone: "Asia/Karachi", offset: "UTC+05:00", label: "Karachi (Asia) • UTC+05:00" },
  "🇧🇩": { country: "Bangladesh", timezone: "Asia/Dhaka", offset: "UTC+06:00", label: "Dhaka (Asia) • UTC+06:00" },
  "🇮🇱": { country: "Israel", timezone: "Asia/Jerusalem", offset: "UTC+03:00", label: "Jerusalem (Asia) • UTC+03:00" },
  "🇳🇱": { country: "Netherlands", timezone: "Europe/Amsterdam", offset: "UTC+02:00", label: "Amsterdam (Europe) • UTC+02:00" },
  "🇸🇪": { country: "Sweden", timezone: "Europe/Stockholm", offset: "UTC+02:00", label: "Stockholm (Europe) • UTC+02:00" },
  "🇳🇴": { country: "Norway", timezone: "Europe/Oslo", offset: "UTC+02:00", label: "Oslo (Europe) • UTC+02:00" },
  "🇩🇰": { country: "Denmark", timezone: "Europe/Copenhagen", offset: "UTC+02:00", label: "Copenhagen (Europe) • UTC+02:00" },
  "🇫🇮": { country: "Finland", timezone: "Europe/Helsinki", offset: "UTC+03:00", label: "Helsinki (Europe) • UTC+03:00" },
  "🇵🇱": { country: "Poland", timezone: "Europe/Warsaw", offset: "UTC+02:00", label: "Warsaw (Europe) • UTC+02:00" },
  "🇺🇦": { country: "Ukraine", timezone: "Europe/Kyiv", offset: "UTC+03:00", label: "Kyiv (Europe) • UTC+03:00" },
  "🇬🇷": { country: "Greece", timezone: "Europe/Athens", offset: "UTC+03:00", label: "Athens (Europe) • UTC+03:00" },
  "🇨🇿": { country: "Czech Republic", timezone: "Europe/Prague", offset: "UTC+02:00", label: "Prague (Europe) • UTC+02:00" },
  "🇷🇴": { country: "Romania", timezone: "Europe/Bucharest", offset: "UTC+03:00", label: "Bucharest (Europe) • UTC+03:00" },
  "🇭🇺": { country: "Hungary", timezone: "Europe/Budapest", offset: "UTC+02:00", label: "Budapest (Europe) • UTC+02:00" },
  "🇮🇪": { country: "Ireland", timezone: "Europe/Dublin", offset: "UTC+01:00", label: "Dublin (Europe) • UTC+01:00" },
  "🇳🇿": { country: "New Zealand", timezone: "Pacific/Auckland", offset: "UTC+12:00", label: "Auckland (Pacific) • UTC+12:00" },
  "🇨🇭": { country: "Switzerland", timezone: "Europe/Zurich", offset: "UTC+02:00", label: "Zurich (Europe) • UTC+02:00" },
  "🇦🇹": { country: "Austria", timezone: "Europe/Vienna", offset: "UTC+02:00", label: "Vienna (Europe) • UTC+02:00" },
  "🇧🇪": { country: "Belgium", timezone: "Europe/Brussels", offset: "UTC+02:00", label: "Brussels (Europe) • UTC+02:00" },
  "🇨🇱": { country: "Chile", timezone: "America/Santiago", offset: "UTC-04:00", label: "Santiago (America) • UTC-04:00" },
  "🇵🇪": { country: "Peru", timezone: "America/Lima", offset: "UTC-05:00", label: "Lima (America) • UTC-05:00" },
  "🇻🇪": { country: "Venezuela", timezone: "America/Caracas", offset: "UTC-04:00", label: "Caracas (America) • UTC-04:00" },
  "🇶🇦": { country: "Qatar", timezone: "Asia/Qatar", offset: "UTC+03:00", label: "Qatar (Asia) • UTC+03:00" },
  "🇰🇼": { country: "Kuwait", timezone: "Asia/Kuwait", offset: "UTC+03:00", label: "Kuwait (Asia) • UTC+03:00" },
  "🇧🇭": { country: "Bahrain", timezone: "Asia/Bahrain", offset: "UTC+03:00", label: "Bahrain (Asia) • UTC+03:00" },
  "🇴🇲": { country: "Oman", timezone: "Asia/Muscat", offset: "UTC+04:00", label: "Muscat (Asia) • UTC+04:00" },
  "🇯🇴": { country: "Jordan", timezone: "Asia/Amman", offset: "UTC+03:00", label: "Amman (Asia) • UTC+03:00" },
  "🇱🇧": { country: "Lebanon", timezone: "Asia/Beirut", offset: "UTC+03:00", label: "Beirut (Asia) • UTC+03:00" },
  "🇮🇶": { country: "Iraq", timezone: "Asia/Baghdad", offset: "UTC+03:00", label: "Baghdad (Asia) • UTC+03:00" },
  "🇮🇷": { country: "Iran", timezone: "Asia/Tehran", offset: "UTC+03:30", label: "Tehran (Asia) • UTC+03:30" },
  "🇦🇫": { country: "Afghanistan", timezone: "Asia/Kabul", offset: "UTC+04:30", label: "Kabul (Asia) • UTC+04:30" },
  "🇳🇵": { country: "Nepal", timezone: "Asia/Kathmandu", offset: "UTC+05:45", label: "Kathmandu (Asia) • UTC+05:45" },
  "🇱🇰": { country: "Sri Lanka", timezone: "Asia/Colombo", offset: "UTC+05:30", label: "Colombo (Asia) • UTC+05:30" },
  "🇲🇲": { country: "Myanmar", timezone: "Asia/Yangon", offset: "UTC+06:30", label: "Yangon (Asia) • UTC+06:30" },
  "🇰🇭": { country: "Cambodia", timezone: "Asia/Phnom_Penh", offset: "UTC+07:00", label: "Phnom Penh (Asia) • UTC+07:00" },
  "🇱🇦": { country: "Laos", timezone: "Asia/Vientiane", offset: "UTC+07:00", label: "Vientiane (Asia) • UTC+07:00" },
  "🇺🇬": { country: "Uganda", timezone: "Africa/Kampala", offset: "UTC+03:00", label: "Kampala (Africa) • UTC+03:00" },
  "🇹🇿": { country: "Tanzania", timezone: "Africa/Dar_es_Salaam", offset: "UTC+03:00", label: "Dar es Salaam (Africa) • UTC+03:00" },
  "🇷🇼": { country: "Rwanda", timezone: "Africa/Kigali", offset: "UTC+02:00", label: "Kigali (Africa) • UTC+02:00" },
  "🇪🇹": { country: "Ethiopia", timezone: "Africa/Addis_Ababa", offset: "UTC+03:00", label: "Addis Ababa (Africa) • UTC+03:00" },
  "🇸🇳": { country: "Senegal", timezone: "Africa/Dakar", offset: "UTC+00:00", label: "Dakar (Africa) • UTC+00:00" },
  "🇨🇮": { country: "Ivory Coast", timezone: "Africa/Abidjan", offset: "UTC+00:00", label: "Abidjan (Africa) • UTC+00:00" },
  "🇨🇲": { country: "Cameroon", timezone: "Africa/Douala", offset: "UTC+01:00", label: "Douala (Africa) • UTC+01:00" },
  "🇩🇿": { country: "Algeria", timezone: "Africa/Algiers", offset: "UTC+01:00", label: "Algiers (Africa) • UTC+01:00" },
  "🇹🇳": { country: "Tunisia", timezone: "Africa/Tunis", offset: "UTC+01:00", label: "Tunis (Africa) • UTC+01:00" },
  "🇿🇲": { country: "Zambia", timezone: "Africa/Lusaka", offset: "UTC+02:00", label: "Lusaka (Africa) • UTC+02:00" },
  "🇿🇼": { country: "Zimbabwe", timezone: "Africa/Harare", offset: "UTC+02:00", label: "Harare (Africa) • UTC+02:00" },
};

// Keyword and Language Name to Timezone
export const LANGUAGE_NAME_TO_TIMEZONE: Record<string, CountryTimezoneInfo> = {
  // English variants
  "english": FLAG_TO_TIMEZONE["🇺🇸"],
  "english (us)": FLAG_TO_TIMEZONE["🇺🇸"],
  "english (uk)": FLAG_TO_TIMEZONE["🇬🇧"],
  "english (australia)": FLAG_TO_TIMEZONE["🇦🇺"],
  "english (canada)": FLAG_TO_TIMEZONE["🇨🇦"],
  "english (india)": FLAG_TO_TIMEZONE["🇮🇳"],

  // Filipino / Tagalog
  "filipino": FLAG_TO_TIMEZONE["🇵🇭"],
  "tagalog": FLAG_TO_TIMEZONE["🇵🇭"],
  "filipino (tagalog)": FLAG_TO_TIMEZONE["🇵🇭"],
  "cebuano": FLAG_TO_TIMEZONE["🇵🇭"],
  "ilocano": FLAG_TO_TIMEZONE["🇵🇭"],

  // Spanish
  "spanish": FLAG_TO_TIMEZONE["🇪🇸"],
  "español": FLAG_TO_TIMEZONE["🇪🇸"],
  "catalan": FLAG_TO_TIMEZONE["🇪🇸"],
  "basque": FLAG_TO_TIMEZONE["🇪🇸"],
  "galician": FLAG_TO_TIMEZONE["🇪🇸"],

  // French
  "french": FLAG_TO_TIMEZONE["🇫🇷"],
  "français": FLAG_TO_TIMEZONE["🇫🇷"],
  "french (canada)": FLAG_TO_TIMEZONE["🇨🇦"],

  // German
  "german": FLAG_TO_TIMEZONE["🇩🇪"],
  "deutsch": FLAG_TO_TIMEZONE["🇩🇪"],

  // Italian
  "italian": FLAG_TO_TIMEZONE["🇮🇹"],
  "italiano": FLAG_TO_TIMEZONE["🇮🇹"],

  // Portuguese
  "portuguese": FLAG_TO_TIMEZONE["🇧🇷"],
  "português": FLAG_TO_TIMEZONE["🇧🇷"],

  // Russian
  "russian": FLAG_TO_TIMEZONE["🇷🇺"],
  "русский": FLAG_TO_TIMEZONE["🇷🇺"],

  // Chinese
  "chinese": FLAG_TO_TIMEZONE["🇨🇳"],
  "chinese (simplified)": FLAG_TO_TIMEZONE["🇨🇳"],
  "chinese (traditional)": FLAG_TO_TIMEZONE["🇹🇼"],
  "mandarin": FLAG_TO_TIMEZONE["🇨🇳"],
  "cantonese": FLAG_TO_TIMEZONE["🇨🇳"],

  // Japanese
  "japanese": FLAG_TO_TIMEZONE["🇯🇵"],
  "日本語": FLAG_TO_TIMEZONE["🇯🇵"],

  // Korean
  "korean": FLAG_TO_TIMEZONE["🇰🇷"],
  "한국어": FLAG_TO_TIMEZONE["🇰🇷"],

  // Arabic
  "arabic": FLAG_TO_TIMEZONE["🇸🇦"],
  "العربية": FLAG_TO_TIMEZONE["🇸🇦"],

  // Nigerian languages
  "hausa": FLAG_TO_TIMEZONE["🇳🇬"],
  "igbo": FLAG_TO_TIMEZONE["🇳🇬"],
  "yoruba": FLAG_TO_TIMEZONE["🇳🇬"],
  "nigeria": FLAG_TO_TIMEZONE["🇳🇬"],

  // Indian languages
  "hindi": FLAG_TO_TIMEZONE["🇮🇳"],
  "bengali": FLAG_TO_TIMEZONE["🇮🇳"],
  "punjabi": FLAG_TO_TIMEZONE["🇮🇳"],
  "marathi": FLAG_TO_TIMEZONE["🇮🇳"],
  "gujarati": FLAG_TO_TIMEZONE["🇮🇳"],
  "tamil": FLAG_TO_TIMEZONE["🇮🇳"],
  "telugu": FLAG_TO_TIMEZONE["🇮🇳"],
  "kannada": FLAG_TO_TIMEZONE["🇮🇳"],
  "malayalam": FLAG_TO_TIMEZONE["🇮🇳"],
  "urdu": FLAG_TO_TIMEZONE["🇵🇰"],

  // Other languages
  "swahili": FLAG_TO_TIMEZONE["🇰🇪"],
  "afrikaans": FLAG_TO_TIMEZONE["🇿🇦"],
  "zulu": FLAG_TO_TIMEZONE["🇿🇦"],
  "xhosa": FLAG_TO_TIMEZONE["🇿🇦"],
  "amharic": FLAG_TO_TIMEZONE["🇪🇹"],
  "turkish": FLAG_TO_TIMEZONE["🇹🇷"],
  "dutch": FLAG_TO_TIMEZONE["🇳🇱"],
  "greek": FLAG_TO_TIMEZONE["🇬🇷"],
  "hebrew": FLAG_TO_TIMEZONE["🇮🇱"],
  "swedish": FLAG_TO_TIMEZONE["🇸🇪"],
  "norwegian": FLAG_TO_TIMEZONE["🇳🇴"],
  "danish": FLAG_TO_TIMEZONE["🇩🇰"],
  "finnish": FLAG_TO_TIMEZONE["🇫🇮"],
  "polish": FLAG_TO_TIMEZONE["🇵🇱"],
  "ukrainian": FLAG_TO_TIMEZONE["🇺🇦"],
  "czech": FLAG_TO_TIMEZONE["🇨🇿"],
  "hungarian": FLAG_TO_TIMEZONE["🇭🇺"],
  "romanian": FLAG_TO_TIMEZONE["🇷🇴"],
  "thai": FLAG_TO_TIMEZONE["🇹🇭"],
  "vietnamese": FLAG_TO_TIMEZONE["🇻🇳"],
  "indonesian": FLAG_TO_TIMEZONE["🇮🇩"],
  "malay": FLAG_TO_TIMEZONE["🇲🇾"],
  "persian": FLAG_TO_TIMEZONE["🇮🇷"],
  "farsi": FLAG_TO_TIMEZONE["🇮🇷"],
};

/**
 * Resolves country and timezone from any combination of:
 * - Country name / Location (e.g. "Nigeria", "London, UK", "Manila")
 * - Language name (e.g. "Filipino (Tagalog)", "Spanish", "Hausa")
 * - Flag emoji (e.g. "🇳🇬", "🇵🇭", "🇺🇸", "🇪🇸")
 * - Language code (e.g. "fil", "tl", "en-US", "es")
 */
export function resolveCountryAndTimezone(params: {
  country?: string | null;
  location?: string | null;
  language?: string | null;
  flag?: string | null;
  code?: string | null;
}): CountryTimezoneInfo {
  const { country, location, language, flag, code } = params;

  // 1. Direct Flag match
  if (flag && FLAG_TO_TIMEZONE[flag]) {
    return { ...FLAG_TO_TIMEZONE[flag], flag };
  }

  // 2. Language Code match
  if (code) {
    const cleanCode = code.toLowerCase().trim();
    if (cleanCode.startsWith("en-gb")) return FLAG_TO_TIMEZONE["🇬🇧"];
    if (cleanCode.startsWith("en-au")) return FLAG_TO_TIMEZONE["🇦🇺"];
    if (cleanCode.startsWith("en-ca")) return FLAG_TO_TIMEZONE["🇨🇦"];
    if (cleanCode.startsWith("en-in")) return FLAG_TO_TIMEZONE["🇮🇳"];
    if (cleanCode.startsWith("en")) return FLAG_TO_TIMEZONE["🇺🇸"];
    if (cleanCode.startsWith("fil") || cleanCode.startsWith("tl")) return FLAG_TO_TIMEZONE["🇵🇭"];
    if (cleanCode.startsWith("es")) return FLAG_TO_TIMEZONE["🇪🇸"];
    if (cleanCode.startsWith("fr")) return FLAG_TO_TIMEZONE["🇫🇷"];
    if (cleanCode.startsWith("de")) return FLAG_TO_TIMEZONE["🇩🇪"];
    if (cleanCode.startsWith("it")) return FLAG_TO_TIMEZONE["🇮🇹"];
    if (cleanCode.startsWith("ja")) return FLAG_TO_TIMEZONE["🇯🇵"];
    if (cleanCode.startsWith("ko")) return FLAG_TO_TIMEZONE["🇰🇷"];
    if (cleanCode.startsWith("zh")) return FLAG_TO_TIMEZONE["🇨🇳"];
    if (cleanCode.startsWith("pt")) return FLAG_TO_TIMEZONE["🇧🇷"];
    if (cleanCode.startsWith("ru")) return FLAG_TO_TIMEZONE["🇷🇺"];
    if (cleanCode.startsWith("ar")) return FLAG_TO_TIMEZONE["🇸🇦"];
    if (cleanCode.startsWith("hi")) return FLAG_TO_TIMEZONE["🇮🇳"];
    if (cleanCode.startsWith("ha") || cleanCode.startsWith("ig") || cleanCode.startsWith("yo")) return FLAG_TO_TIMEZONE["🇳🇬"];
  }

  // 3. Language Name match
  if (language) {
    const cleanLang = language.toLowerCase().trim();
    if (LANGUAGE_NAME_TO_TIMEZONE[cleanLang]) {
      return LANGUAGE_NAME_TO_TIMEZONE[cleanLang];
    }
    for (const [key, info] of Object.entries(LANGUAGE_NAME_TO_TIMEZONE)) {
      if (cleanLang.includes(key) || key.includes(cleanLang)) {
        return info;
      }
    }
  }

  // 4. Country / Location Name match
  const searchStr = `${country || ""} ${location || ""}`.toLowerCase().trim();
  if (searchStr) {
    for (const info of Object.values(FLAG_TO_TIMEZONE)) {
      if (searchStr.includes(info.country.toLowerCase())) {
        return info;
      }
      const city = info.timezone.split("/")[1]?.replace(/_/g, " ").toLowerCase();
      if (city && searchStr.includes(city)) {
        return info;
      }
    }
  }

  // Default fallback: Lagos or UTC
  return FLAG_TO_TIMEZONE["🇳🇬"] || {
    country: "Global",
    timezone: "UTC",
    offset: "UTC+00:00",
    label: "UTC (Universal Coordinated Time) • UTC+00:00",
  };
}
