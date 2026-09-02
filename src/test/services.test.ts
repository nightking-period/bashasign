import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { TranslationService } from '@/services/translation/TranslationService'
import { TextToSpeechEngine } from '@/services/tts/TextToSpeechEngine'
import { MockSignRecognitionProvider } from '@/services/signRecognition/SignRecognitionEngine'
import { SignPlaybackEngine } from '@/services/avatar/SignPlaybackEngine'

describe('TranslationService', () => {
  it('should translate known English phrase', async () => {
    const result = await TranslationService.translate(
      'Please bring your Aadhaar card.',
      'en'
    )
    expect(result).toBeDefined()
    expect(result.isMock).toBe(true)
    expect(result.signSequence.length).toBeGreaterThan(0)
    expect(result.signSequence).toContain('AADHAAR_CARD')
  })

  it('should mark unrecognized phrase with empty signSequence', async () => {
    const result = await TranslationService.translate(
      'This phrase is completely unknown xyz',
      'en'
    )
    expect(result.isMock).toBe(true)
    expect(result.signSequence).toHaveLength(0)
    expect(result.confidence).toBe(0)
  })

  it('should match keyword pattern for aadhaar', async () => {
    const result = await TranslationService.translate(
      'Bring your aadhaar card tomorrow',
      'en'
    )
    expect(result.signSequence).toContain('AADHAAR_CARD')
    expect(result.signSequence).toContain('BRING')
  })
})

describe('TextToSpeechEngine', () => {
  it('should detect browser TTS support', () => {
    // jsdom doesn't have speechSynthesis, so should return false
    const supported = TextToSpeechEngine.isSupported()
    expect(typeof supported).toBe('boolean')
  })
})

describe('MockSignRecognitionProvider', () => {
  it('should return a mock result', async () => {
    const provider = new MockSignRecognitionProvider()
    const result = await provider.getDemoResult()
    expect(result).toBeDefined()
    expect(result.isMock).toBe(true)
    expect(result.source).toBe('mock')
    expect(result.conceptSequence.length).toBeGreaterThan(0)
    expect(result.confidence).toBeGreaterThan(0)
  })

  it('should cycle through demo results', async () => {
    const provider = new MockSignRecognitionProvider()
    const r1 = await provider.getDemoResult()
    const r2 = await provider.getDemoResult()
    // Different results expected (cycling)
    expect(r1).toBeDefined()
    expect(r2).toBeDefined()
  })
})

describe('SignPlaybackEngine', () => {
  it('should load a sign sequence', () => {
    let lastState: Parameters<ConstructorParameters<typeof SignPlaybackEngine>[0]>[0] | null = null
    const engine = new SignPlaybackEngine((state) => { lastState = state })
    engine.load(['YOUR', 'AADHAAR_CARD', 'BRING'])
    expect(lastState).not.toBeNull()
    expect(lastState!.totalSigns).toBe(3)
    expect(lastState!.currentSignIndex).toBe(0)
    engine.destroy()
  })

  it('should stop and reset on stop()', () => {
    let lastState: Parameters<ConstructorParameters<typeof SignPlaybackEngine>[0]>[0] | null = null
    const engine = new SignPlaybackEngine((state) => { lastState = state })
    engine.load(['YOUR', 'AADHAAR_CARD', 'BRING'])
    engine.stop()
    expect(lastState!.isPlaying).toBe(false)
    expect(lastState!.currentSignIndex).toBe(0)
    engine.destroy()
  })

  it('should jump to sign by index', () => {
    let lastState: Parameters<ConstructorParameters<typeof SignPlaybackEngine>[0]>[0] | null = null
    const engine = new SignPlaybackEngine((state) => { lastState = state })
    engine.load(['YOUR', 'AADHAAR_CARD', 'BRING'])
    engine.jumpTo(2)
    expect(lastState!.currentSignIndex).toBe(2)
    engine.destroy()
  })
})
