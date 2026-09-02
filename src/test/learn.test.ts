import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { TARGET_CONCEPTS } from '@/data/concepts'

describe('Learn & Practice Studio', () => {
  it('should have practice concepts available across core categories', () => {
    const practiceConcepts = TARGET_CONCEPTS.filter((c) => c.category !== 'system')
    expect(practiceConcepts.length).toBeGreaterThanOrEqual(16)

    const categories = new Set(practiceConcepts.map((c) => c.category))
    expect(categories.has('documents')).toBe(true)
    expect(categories.has('actions')).toBe(true)
    expect(categories.has('conversational')).toBe(true)
  })

  it('should have prompt tips and descriptions for all practice concepts', () => {
    const practiceConcepts = TARGET_CONCEPTS.filter((c) => c.category !== 'system')
    practiceConcepts.forEach((concept) => {
      expect(concept.description.length).toBeGreaterThan(10)
      expect(concept.promptTip.length).toBeGreaterThan(10)
    })
  })
})
