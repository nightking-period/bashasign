// Translation Service — Semantic Meaning Extractor
// MVP: Rule-based keyword matching for demo mode.
// Future: Replace with Whisper/Indic NLP backend.

import type { LanguageCode, SemanticRepresentation, TranslationResult } from '@/types'
import { PHRASES } from '@/data/phrases'

// Simple keyword map for demo semantic extraction (English)
const ENGLISH_KEYWORD_MAP: Array<{
  pattern: RegExp
  semantic: Partial<SemanticRepresentation>
  signSequence: string[]
}> = [
  {
    pattern: /bring.*(aadhaar|aadhar)/i,
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'AADHAAR_CARD' },
    signSequence: ['YOUR', 'AADHAAR_CARD', 'BRING'],
  },
  {
    pattern: /bring.*(pan)/i,
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'PAN_CARD' },
    signSequence: ['YOUR', 'PAN_CARD', 'BRING'],
  },
  {
    pattern: /bring.*(passbook)/i,
    semantic: { action: 'BRING', possessive: 'YOUR', object: 'PASSBOOK' },
    signSequence: ['YOUR', 'PASSBOOK', 'BRING'],
  },
  {
    pattern: /bring.*(photo|photograph)/i,
    semantic: { action: 'BRING', object: 'PHOTO' },
    signSequence: ['PHOTO', 'BRING'],
  },
  {
    pattern: /show.*(id|identity)/i,
    semantic: { action: 'SHOW', possessive: 'YOUR', object: 'AADHAAR_CARD' },
    signSequence: ['YOUR', 'AADHAAR_CARD', 'SHOW'],
  },
  {
    pattern: /sign here/i,
    semantic: { action: 'SIGN', location: 'HERE' },
    signSequence: ['SIGN_HERE'],
  },
  {
    pattern: /wait/i,
    semantic: { action: 'WAIT', location: 'HERE' },
    signSequence: ['PLEASE_WAIT'],
  },
  {
    pattern: /tomorrow/i,
    semantic: { action: 'COME', time: 'TOMORROW' },
    signSequence: ['TOMORROW', 'COME'],
  },
  {
    pattern: /counter.*three|counter.*3/i,
    semantic: { action: 'GO', location: 'COUNTER_3' },
    signSequence: ['COUNTER_3', 'GO'],
  },
  {
    pattern: /(pension).*(receive|credit|come)/i,
    semantic: { action: 'RECEIVE', possessive: 'YOUR', object: 'PENSION' },
    signSequence: ['YOUR', 'PENSION', 'RECEIVED'],
  },
  {
    pattern: /pension.*(pending)/i,
    semantic: { action: 'PENDING', possessive: 'YOUR', object: 'PENSION' },
    signSequence: ['YOUR', 'PENSION', 'PENDING'],
  },
  {
    pattern: /application.*(received|receive)/i,
    semantic: { action: 'RECEIVE', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'RECEIVED'],
  },
  {
    pattern: /application.*(approved)/i,
    semantic: { action: 'APPROVE', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'APPROVED'],
  },
  {
    pattern: /application.*(rejected)/i,
    semantic: { action: 'REJECT', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'REJECTED'],
  },
  {
    pattern: /application.*(pending)/i,
    semantic: { action: 'PENDING', possessive: 'YOUR', object: 'APPLICATION' },
    signSequence: ['YOUR', 'APPLICATION', 'PENDING'],
  },
  {
    pattern: /fingerprint/i,
    semantic: { action: 'GIVE', possessive: 'YOUR', object: 'FINGERPRINT' },
    signSequence: ['YOUR', 'FINGERPRINT', 'GIVE'],
  },
  {
    pattern: /document/i,
    semantic: { action: 'GIVE', object: 'DOCUMENT' },
    signSequence: ['DOCUMENT', 'GIVE'],
  },
  // Conversational Courtesies
  {
    pattern: /\b(hello|hi|namaste|namaskaram|నమస్కారం|नमस्ते)\b/i,
    semantic: { action: 'SHOW' },
    signSequence: ['HELLO'],
  },
  {
    pattern: /\b(thank|thanks|dhanyavad|dhanyavadalu|ధన్యవాదాలు|धन्यवाद)\b/i,
    semantic: { action: 'GIVE' },
    signSequence: ['THANK_YOU'],
  },
  {
    pattern: /\b(sorry|apologize|excuse|kshaminchandi|క్షమించండి|माफ़|क्षमा)\b/i,
    semantic: { action: 'WAIT' },
    signSequence: ['SORRY'],
  },
  {
    pattern: /\b(bye|goodbye|see you|veedkolu|వీడ్కోలు|अलविदा)\b/i,
    semantic: { action: 'GO' },
    signSequence: ['BYE'],
  },
  {
    pattern: /\b(help|assist|sahayam|సహాయం|मदद)\b/i,
    semantic: { action: 'SHOW' },
    signSequence: ['HELP'],
  },
]


function matchPhraseLibrary(text: string, lang: LanguageCode): TranslationResult | null {
  const match = PHRASES.find(p => {
    if (lang === 'en' && p.english.toLowerCase() === text.toLowerCase()) return true
    return p.translations.some(
      t => t.languageCode === lang && t.text === text
    )
  })
  if (!match) return null
  return {
    original: text,
    language: lang,
    semantic: match.semantic,
    signSequence: match.signSequence,
    isMock: true,
    confidence: 0.98,
  }
}

function matchEnglishKeywords(text: string): TranslationResult | null {
  for (const { pattern, semantic, signSequence } of ENGLISH_KEYWORD_MAP) {
    if (pattern.test(text)) {
      return {
        original: text,
        language: 'en',
        semantic: { ...semantic, raw: text },
        signSequence,
        isMock: true,
        confidence: 0.75,
      }
    }
  }
  return null
}

export class TranslationService {
  /**
   * Translate text to ISL sign sequence.
   * MVP: Uses rule-based matching and phrasebook lookup.
   * NOT suitable for production. Simulated output clearly marked isMock: true.
   */
  static async translate(text: string, language: LanguageCode): Promise<TranslationResult> {
    await new Promise(r => setTimeout(r, 600)) // simulate async

    // 1. Exact phrasebook match
    const phraseMatch = matchPhraseLibrary(text, language)
    if (phraseMatch) return phraseMatch

    // 2. Keyword & semantic pattern matching
    const keywordMatch = matchEnglishKeywords(text)
    if (keywordMatch) {
      return {
        ...keywordMatch,
        language,
      }
    }

    // 3. Fallback — unknown phrase
    return {
      original: text,
      language,
      semantic: { raw: text },
      signSequence: [],
      isMock: true,
      confidence: 0,
    }
  }
}