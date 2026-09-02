// TextToSpeechEngine — Browser Web Speech API wrapper
// Falls back gracefully when TTS unavailable.

import type { LanguageCode } from '@/types'

const LANG_BCP47: Record<LanguageCode, string> = {
  en: 'en-IN',
  te: 'te-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN',
}

export type TTSStatus = 'idle' | 'playing' | 'paused' | 'unavailable' | 'error'

export class TextToSpeechEngine {
  private static utterance: SpeechSynthesisUtterance | null = null

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  static speak(
    text: string,
    lang: LanguageCode,
    options: { rate?: number; volume?: number } = {},
    callbacks: { onStart?: () => void; onEnd?: () => void; onError?: (e: string) => void } = {}
  ): void {
    if (!this.isSupported()) {
      callbacks.onError?.('TTS not supported in this browser.')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANG_BCP47[lang] ?? 'en-IN'
    utterance.rate = options.rate ?? 1.0
    utterance.volume = options.volume ?? 1.0
    utterance.onstart = callbacks.onStart ?? null
    utterance.onend = callbacks.onEnd ?? null
    utterance.onerror = (e) => callbacks.onError?.(e.error)
    this.utterance = utterance
    window.speechSynthesis.speak(utterance)
  }

  static pause(): void {
    if (this.isSupported()) window.speechSynthesis.pause()
  }

  static resume(): void {
    if (this.isSupported()) window.speechSynthesis.resume()
  }

  static stop(): void {
    if (this.isSupported()) window.speechSynthesis.cancel()
  }

  static isSpeaking(): boolean {
    return window.speechSynthesis?.speaking ?? false
  }
}