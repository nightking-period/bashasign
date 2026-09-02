import { create } from 'zustand'
import type {
  CommunicationMode, ConversationMessage,
  LanguageCode, RecognitionResult, TranslationResult,
} from '@/types'

interface CommunicationStore {
  mode: CommunicationMode
  setMode: (mode: CommunicationMode) => void

  selectedLanguage: LanguageCode
  setSelectedLanguage: (lang: LanguageCode) => void

  inputText: string
  setInputText: (text: string) => void

  translationResult: TranslationResult | null
  setTranslationResult: (result: TranslationResult | null) => void

  isTranslating: boolean
  setIsTranslating: (v: boolean) => void

  activeSignIndex: number
  setActiveSignIndex: (i: number) => void
  nextSign: () => void
  prevSign: () => void

  isPlaying: boolean
  setIsPlaying: (v: boolean) => void

  playbackSpeed: number
  setPlaybackSpeed: (v: number) => void

  recognitionResult: RecognitionResult | null
  setRecognitionResult: (result: RecognitionResult | null) => void

  conversation: ConversationMessage[]
  addMessage: (msg: ConversationMessage) => void
  clearConversation: () => void

  // Session metadata
  sessionId: string
  officeName: string
  serviceType: string
  turnState: 'officer' | 'citizen' | 'idle'
  startNewSession: () => void
  setTurnState: (turn: 'officer' | 'citizen' | 'idle') => void
  setSessionMetadata: (meta: { officeName?: string; serviceType?: string }) => void

  error: string | null
  setError: (msg: string | null) => void
}


export const useCommunicationStore = create<CommunicationStore>()((set, get) => ({
  mode: 'employee_to_citizen',
  setMode: (mode) => set({ mode }),

  selectedLanguage: 'te',
  setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

  inputText: '',
  setInputText: (text) => set({ inputText: text }),

  translationResult: null,
  setTranslationResult: (result) => set({ translationResult: result }),

  isTranslating: false,
  setIsTranslating: (v) => set({ isTranslating: v }),

  activeSignIndex: 0,
  setActiveSignIndex: (i) => set({ activeSignIndex: i }),
  nextSign: () => {
    const { translationResult, activeSignIndex } = get()
    const max = (translationResult?.signSequence.length ?? 1) - 1
    set({ activeSignIndex: Math.min(activeSignIndex + 1, max) })
  },
  prevSign: () => {
    const { activeSignIndex } = get()
    set({ activeSignIndex: Math.max(activeSignIndex - 1, 0) })
  },

  isPlaying: false,
  setIsPlaying: (v) => set({ isPlaying: v }),

  playbackSpeed: 1.0,
  setPlaybackSpeed: (v) => set({ playbackSpeed: v }),

  recognitionResult: null,
  setRecognitionResult: (result) => set({ recognitionResult: result }),

  conversation: [],
  addMessage: (msg) => set((state) => ({ conversation: [...state.conversation, msg] })),
  clearConversation: () => set({ conversation: [] }),

  // Session state
  sessionId: `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
  officeName: 'Mandal Revenue Office (MRO) — Ward 4, Guntur',
  serviceType: 'Identity Verification & Aadhaar Card Services',
  turnState: 'idle',
  startNewSession: () => set({
    conversation: [],
    sessionId: `SES-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
    turnState: 'idle',
    translationResult: null,
    recognitionResult: null,
    inputText: '',
  }),
  setTurnState: (turn) => set({ turnState: turn }),
  setSessionMetadata: (meta) => set((state) => ({
    officeName: meta.officeName ?? state.officeName,
    serviceType: meta.serviceType ?? state.serviceType,
  })),

  error: null,
  setError: (msg) => set({ error: msg }),
}))

