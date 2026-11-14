export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  speechLocale: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'auto', label: 'Auto-detect', nativeLabel: 'Match my message', speechLocale: 'en-US' },
  { code: 'en', label: 'English', nativeLabel: 'English', speechLocale: 'en-US' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', speechLocale: 'es-ES' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', speechLocale: 'fr-FR' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', speechLocale: 'ar-SA' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', speechLocale: 'zh-CN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', speechLocale: 'hi-IN' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', speechLocale: 'pt-BR' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', speechLocale: 'sw-KE' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', speechLocale: 'de-DE' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', speechLocale: 'ja-JP' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', speechLocale: 'ko-KR' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', speechLocale: 'id-ID' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', speechLocale: 'tr-TR' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', speechLocale: 'ru-RU' },
];

export function getLanguageByCode(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
