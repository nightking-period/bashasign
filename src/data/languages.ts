import type { Language, LanguageCode } from '@/types'

export const LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    rtl: false,
    ttsSupported: true,
    sttSupported: true,
    enabled: true,
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    rtl: false,
    ttsSupported: true,
    sttSupported: false,
    enabled: true,
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    script: 'Devanagari',
    rtl: false,
    ttsSupported: true,
    sttSupported: false,
    enabled: true,
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    rtl: false,
    ttsSupported: false,
    sttSupported: false,
    enabled: false,
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    rtl: false,
    ttsSupported: false,
    sttSupported: false,
    enabled: false,
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    rtl: false,
    ttsSupported: false,
    sttSupported: false,
    enabled: false,
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    rtl: false,
    ttsSupported: false,
    sttSupported: false,
    enabled: false,
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    rtl: false,
    ttsSupported: false,
    sttSupported: false,
    enabled: false,
  },
]

export const ENABLED_LANGUAGES = LANGUAGES.filter(l => l.enabled)

export function getLanguage(code: LanguageCode): Language | undefined {
  return LANGUAGES.find(l => l.code === code)
}

export function getLanguageName(code: LanguageCode): string {
  return getLanguage(code)?.name ?? code.toUpperCase()
}

export function getLanguageNativeName(code: LanguageCode): string {
  return getLanguage(code)?.nativeName ?? code.toUpperCase()
}