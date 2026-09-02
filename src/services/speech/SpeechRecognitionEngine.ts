// SpeechRecognitionEngine — Browser Web Speech API Wrapper for Indian Languages
// Supports Telugu (te-IN), Hindi (hi-IN), and English (en-IN)

import type { LanguageCode } from '@/types'

// Browser Web Speech Recognition type stubs
interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
      isFinal: boolean
    }
    length: number
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface ISpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => ISpeechRecognition
    webkitSpeechRecognition?: new () => ISpeechRecognition
  }
}

const LOCALE_MAP: Record<LanguageCode, string> = {
  te: 'te-IN',
  hi: 'hi-IN',
  en: 'en-IN',
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

export interface SpeechCallbacks {
  onStart?: () => void
  onInterimResult?: (transcript: string) => void
  onFinalResult?: (transcript: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

export class SpeechRecognitionEngine {
  private static instance: ISpeechRecognition | null = null
  private static isListening = false

  static isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  static start(language: LanguageCode, callbacks: SpeechCallbacks): boolean {
    if (!this.isSupported()) {
      callbacks.onError?.('Speech recognition is not supported in this browser.')
      return false
    }

    // If already listening, stop first
    this.stop()

    const SpeechRecClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecClass) return false

    try {
      const recognition = new SpeechRecClass()
      this.instance = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = LOCALE_MAP[language] || 'en-IN'

      recognition.onstart = () => {
        this.isListening = true
        callbacks.onStart?.()
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = ''
        let finalText = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i]
          if (res.isFinal) {
            finalText += res[0].transcript
          } else {
            interimText += res[0].transcript
          }
        }

        if (interimText) {
          callbacks.onInterimResult?.(interimText)
        }
        if (finalText) {
          callbacks.onFinalResult?.(finalText)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech') return
        callbacks.onError?.(event.error)
      }

      recognition.onend = () => {
        this.isListening = false
        callbacks.onEnd?.()
      }

      recognition.start()
      return true
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      callbacks.onError?.('Failed to start microphone.')
      return false
    }
  }

  static stop(): void {
    if (this.instance) {
      try {
        this.instance.stop()
      } catch {
        // Ignore stop error if already inactive
      }
      this.instance = null
      this.isListening = false
    }
  }

  static getListeningState(): boolean {
    return this.isListening
  }
}
