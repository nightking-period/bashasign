import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { PHRASES, searchPhrases, getPhrasesByCategory, getCommonPhrases } from '@/data/phrases'
import { SIGN_DICTIONARY, getSign, getSignSequenceLabels } from '@/data/signs'
import { ENABLED_LANGUAGES, getLanguage, getLanguageName } from '@/data/languages'
import { PHRASE_CATEGORIES } from '@/data/categories'

describe('Data Layer', () => {
  describe('Phrases', () => {
    it('should have phrases with required fields', () => {
      expect(PHRASES.length).toBeGreaterThan(0)
      for (const phrase of PHRASES) {
        expect(phrase.id).toBeTruthy()
        expect(phrase.english).toBeTruthy()
        expect(phrase.categoryId).toBeTruthy()
        expect(Array.isArray(phrase.signSequence)).toBe(true)
        expect(phrase.signSequence.length).toBeGreaterThan(0)
      }
    })

    it('should search phrases by English text', () => {
      const results = searchPhrases('aadhaar')
      expect(results.length).toBeGreaterThan(0)
      results.forEach(r => {
        expect(r.english.toLowerCase()).toContain('aadhaar')
      })
    })

    it('should return empty array for no match', () => {
      const results = searchPhrases('xyznotfound123')
      expect(results).toHaveLength(0)
    })

    it('should filter by category', () => {
      const pension = getPhrasesByCategory('pension')
      expect(pension.length).toBeGreaterThan(0)
      pension.forEach(p => expect(p.categoryId).toBe('pension'))
    })

    it('should return commonly used phrases', () => {
      const common = getCommonPhrases()
      expect(common.length).toBeGreaterThan(0)
      common.forEach(p => expect(p.commonlyUsed).toBe(true))
    })

    it('should have Telugu translations', () => {
      const phraseWithTelugu = PHRASES.find(p =>
        p.translations.some(t => t.languageCode === 'te')
      )
      expect(phraseWithTelugu).toBeDefined()
    })

    it('should have Hindi translations', () => {
      const phraseWithHindi = PHRASES.find(p =>
        p.translations.some(t => t.languageCode === 'hi')
      )
      expect(phraseWithHindi).toBeDefined()
    })
  })

  describe('Signs', () => {
    it('should have sign dictionary entries', () => {
      expect(Object.keys(SIGN_DICTIONARY).length).toBeGreaterThan(0)
    })

    it('should mark all signs as unvalidated', () => {
      for (const entry of Object.values(SIGN_DICTIONARY)) {
        for (const sign of entry.signs) {
          expect(sign.validated).toBe(false)
        }
      }
    })

    it('should get sign by concept ID', () => {
      const sign = getSign('AADHAAR_CARD')
      expect(sign).toBeDefined()
      expect(sign?.conceptId).toBe('AADHAAR_CARD')
    })

    it('should return undefined for unknown sign', () => {
      const sign = getSign('NONEXISTENT_SIGN')
      expect(sign).toBeUndefined()
    })

    it('should get sign sequence labels', () => {
      const labels = getSignSequenceLabels(['YOUR', 'AADHAAR_CARD', 'BRING'])
      expect(labels).toHaveLength(3)
      expect(labels[0]).toBe('Your')
      expect(labels[1]).toBe('Aadhaar Card')
      expect(labels[2]).toBe('Bring')
    })
  })

  describe('Languages', () => {
    it('should have enabled languages', () => {
      expect(ENABLED_LANGUAGES.length).toBeGreaterThanOrEqual(3)
    })

    it('should have English, Telugu, Hindi as enabled', () => {
      const codes = ENABLED_LANGUAGES.map(l => l.code)
      expect(codes).toContain('en')
      expect(codes).toContain('te')
      expect(codes).toContain('hi')
    })

    it('should get language by code', () => {
      const lang = getLanguage('te')
      expect(lang).toBeDefined()
      expect(lang?.nativeName).toBe('తెలుగు')
    })

    it('should get language name', () => {
      expect(getLanguageName('en')).toBe('English')
      expect(getLanguageName('hi')).toBe('Hindi')
    })

    it('should not have RTL languages as enabled in MVP', () => {
      ENABLED_LANGUAGES.forEach(lang => {
        expect(lang.rtl).toBe(false)
      })
    })
  })

  describe('Categories', () => {
    it('should have all 7 categories', () => {
      expect(PHRASE_CATEGORIES.length).toBe(7)
    })


    it('should have all category IDs referenced in phrases', () => {
      const categoryIds = new Set(PHRASE_CATEGORIES.map(c => c.id))
      PHRASES.forEach(p => {
        expect(categoryIds.has(p.categoryId)).toBe(true)
      })
    })
  })
})
