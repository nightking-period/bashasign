import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  MessageSquare, Camera, Mic, MicOff, Play, Pause,
  RotateCcw, ChevronLeft, ChevronRight,
  Volume2, AlertCircle, Info, Hand, Sparkles,
} from 'lucide-react'
import {
  Button, Badge, StatusIndicator, ConfidenceBar,
  Spinner, EmptyState, useToast,
} from '@/components/ui'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'
import { useCommunicationStore } from '@/store/useCommunicationStore'
import { ENABLED_LANGUAGES } from '@/data/languages'
import { PHRASES, getCommonPhrases } from '@/data/phrases'
import { getSignSequenceLabels } from '@/data/signs'
import { TranslationService } from '@/services/translation/TranslationService'
import { SignPlaybackEngine, type PlaybackState } from '@/services/avatar/SignPlaybackEngine'
import { SpeechRecognitionEngine } from '@/services/speech/SpeechRecognitionEngine'
import { ISLAvatar3D } from '@/components/communication/ISLAvatar3D'
import type { LanguageCode } from '@/types'

// ─── Mode Selector ─────────────────────────────────────────────────────────

function ModeSelector() {
  const { mode, setMode } = useCommunicationStore()

  return (
    <div className="flex rounded-xl border border-border overflow-hidden shadow-sm" role="tablist" aria-label="Communication mode">
      <button
        role="tab"
        aria-selected={mode === 'employee_to_citizen'}
        onClick={() => setMode('employee_to_citizen')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold transition-colors',
          mode === 'employee_to_citizen'
            ? 'bg-primary text-white'
            : 'bg-white text-muted hover:bg-primary-50 hover:text-primary',
        )}
      >
        <MessageSquare size={16} aria-hidden="true" />
        Employee → Citizen
      </button>
      <Link
        to="/sign-recognition"
        role="tab"
        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold bg-white text-muted hover:bg-secondary-50 hover:text-secondary transition-colors"
      >
        <Camera size={16} aria-hidden="true" />
        Citizen → Employee
      </Link>
      <Link
        to="/session"
        role="tab"
        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors"
      >
        <Sparkles size={16} aria-hidden="true" />
        Live 2-Way Workstation
      </Link>
    </div>

  )
}

// ─── Avatar Panel ───────────────────────────────────────────────────────────

interface AvatarPanelProps {
  playbackState: PlaybackState | null
  isTranslating: boolean
  signLabels: string[]
  onSignClick: (i: number) => void
  onPlay: () => void
  onPause: () => void
  onRestart: () => void
  onPrev: () => void
  onNext: () => void
  onSpeedChange: (s: number) => void
  speed: number
  hasResult: boolean
  originalText: string
  confidence: number
  language: string
}

function AvatarPanel({
  playbackState, isTranslating, signLabels, onSignClick,
  onPlay, onPause, onRestart, onPrev, onNext, onSpeedChange, speed,
  hasResult, originalText, confidence, language,
}: AvatarPanelProps) {
  const currentIdx = playbackState?.currentSignIndex ?? 0
  const isPlaying = playbackState?.isPlaying ?? false
  const currentSign = playbackState?.currentSign

  const activeSignLabel = currentSign?.label ?? signLabels[currentIdx] ?? null

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Avatar Container */}
      <div className="flex-1 min-h-[360px] flex items-center justify-center">
        {isTranslating ? (
          <div className="card p-12 w-full flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" color="primary" label="Translating..." />
            <p className="text-sm font-medium text-primary">Converting speech to ISL concepts...</p>
          </div>
        ) : !hasResult ? (
          <div className="card p-8 w-full flex flex-col items-center justify-center">
            <EmptyState
              icon={<Hand size={36} className="text-primary" />}
              title="Ready to Communicate"
              description="Speak or type a message on the left, then click 'Translate to ISL'"
              size="md"
            />
          </div>
        ) : (
          <div className="w-full">
            <ISLAvatar3D
              activeSign={activeSignLabel}
              isPlaying={isPlaying}
              playbackSpeed={speed}
              onTogglePlay={isPlaying ? onPause : onPlay}
              onReplay={onRestart}
              className="w-full"
            />
          </div>

        )}
      </div>

      {/* Sign sequence timeline */}
      {hasResult && signLabels.length > 0 && (
        <div className="card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted uppercase tracking-widest font-semibold">
              ISL Sign Sequence Timeline ({currentIdx + 1}/{signLabels.length})
            </p>
            <span className="text-xs text-primary font-medium">Click any sign to jump</span>
          </div>
          <div
            className="flex flex-wrap gap-2 pt-1"
            role="list"
            aria-label="ISL sign sequence"
          >
            {signLabels.map((label, i) => (
              <button
                key={i}
                role="listitem"
                onClick={() => onSignClick(i)}
                aria-current={i === currentIdx ? 'step' : undefined}
                className={cn(
                  'sign-chip cursor-pointer transition-all text-xs font-bold px-3 py-1.5 rounded-lg border',
                  i === currentIdx
                    ? 'bg-primary text-white border-primary shadow-sm scale-105'
                    : 'bg-surface text-gray-700 border-border hover:border-primary hover:text-primary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls Bar */}
      {hasResult && (
        <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Playback navigation */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onRestart} title="Restart (Home)">
              <RotateCcw size={14} />
            </Button>
            <Button variant="outline" size="sm" onClick={onPrev} disabled={currentIdx === 0} title="Previous sign">
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={isPlaying ? onPause : onPlay}
              leftIcon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" size="sm" onClick={onNext} disabled={currentIdx >= signLabels.length - 1} title="Next sign">
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted font-medium mr-1">Speed:</span>
            {[0.5, 1.0, 1.5, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={cn(
                  'px-2 py-1 text-xs rounded font-medium transition-colors',
                  speed === s ? 'bg-primary text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Meaning & Metadata */}
      {hasResult && (
        <div className="card p-4 space-y-2 text-xs text-muted">
          <div className="flex justify-between items-center">
            <span>Input: <strong className="text-gray-800 font-medium">"{originalText}"</strong></span>
            <span className="uppercase text-[10px] bg-primary-50 text-primary px-2 py-0.5 rounded font-bold">
              {language}
            </span>
          </div>
          <ConfidenceBar value={confidence} label="Semantic Mapping Confidence" size="sm" />
        </div>
      )}
    </div>
  )
}

// ─── Main Communicate Page ─────────────────────────────────────────────────

export function Communicate() {
  const { settings } = useAppStore()
  const {
    selectedLanguage, inputText, translationResult, isTranslating,
    setSelectedLanguage, setInputText, setTranslationResult, setIsTranslating,
    activeSignIndex, setActiveSignIndex, isPlaying, setIsPlaying,
    playbackSpeed, setPlaybackSpeed, error, setError,
  } = useCommunicationStore()

  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [speechInterim, setSpeechInterim] = useState('')
  const engineRef = useRef<SignPlaybackEngine | null>(null)
  const toast = useToast()
  const location = useLocation()

  // Init/cleanup playback engine
  useEffect(() => {
    const engine = new SignPlaybackEngine((state) => {
      setPlaybackState(state)
      setActiveSignIndex(state.currentSignIndex)
      setIsPlaying(state.isPlaying)
    })
    engineRef.current = engine
    return () => {
      engine.destroy()
      SpeechRecognitionEngine.stop()
    }
  }, [setActiveSignIndex, setIsPlaying])

  // Auto-load phrase from phrasebook navigation state
  useEffect(() => {
    const state = location.state as { phraseId?: string } | null
    if (state?.phraseId) {
      const phrase = PHRASES.find((p) => p.id === state.phraseId)
      if (phrase) {
        setInputText(phrase.english)
      }
    }
  }, [location.state, setInputText])

  // When translation result changes, load into engine
  useEffect(() => {
    if (translationResult && engineRef.current) {
      engineRef.current.load(translationResult.signSequence)
      engineRef.current.setSpeed(playbackSpeed)
    }
  }, [translationResult, playbackSpeed])

  const signLabels = translationResult
    ? getSignSequenceLabels(translationResult.signSequence)
    : []

  const handleTranslate = async (textToTranslate?: string) => {
    const text = (textToTranslate || inputText).trim()
    if (!text) {
      toast.warning('Please enter or speak a message to translate.')
      return
    }
    setError(null)
    setIsTranslating(true)
    setTranslationResult(null)
    try {
      const result = await TranslationService.translate(text, selectedLanguage)
      setTranslationResult(result)
      if (result.signSequence.length === 0) {
        toast.info('Phrase not recognized. Sign sequence unavailable.')
      } else {
        toast.success(`Translated to ${result.signSequence.length} ISL signs.`)
      }
    } catch {
      setError('Translation failed. Please try again.')
      toast.error('Translation failed.')
    } finally {
      setIsTranslating(false)
    }
  }

  // Toggle Live Speech Recognition
  const toggleSpeechInput = () => {
    if (isListening) {
      SpeechRecognitionEngine.stop()
      setIsListening(false)
      setSpeechInterim('')
    } else {
      if (!SpeechRecognitionEngine.isSupported()) {
        toast.error('Web Speech Recognition not supported in this browser. Please use Chrome/Edge.')
        return
      }

      const started = SpeechRecognitionEngine.start(selectedLanguage, {
        onStart: () => {
          setIsListening(true)
          toast.info('Microphone active. Speak your message...')
        },
        onInterimResult: (interim) => {
          setSpeechInterim(interim)
        },
        onFinalResult: (final) => {
          setInputText(final)
          setSpeechInterim('')
          setIsListening(false)
          SpeechRecognitionEngine.stop()
          handleTranslate(final)
        },
        onError: (err) => {
          setIsListening(false)
          setSpeechInterim('')
          toast.error(`Speech recognition error: ${err}`)
        },
        onEnd: () => {
          setIsListening(false)
          setSpeechInterim('')
        },
      })

      if (!started) {
        setIsListening(false)
      }
    }
  }

  const handleQuickPhrase = (phraseText: string) => {
    setInputText(phraseText)
    handleTranslate(phraseText)
  }

  const commonPhrases = getCommonPhrases().slice(0, 6)

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Mode selector */}
      <ModeSelector />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT: Employee Input Zone (2 Cols) ────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                Staff Input
              </h2>
              <Badge variant="accent" dot>Two-Way Active</Badge>
            </div>

            {/* Language selector */}
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
                Staff Spoken/Typed Language
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Select language">
                {ENABLED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code as LanguageCode)}
                    aria-pressed={selectedLanguage === lang.code}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      selectedLanguage === lang.code
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-700 border-border hover:border-primary hover:text-primary',
                    )}
                  >
                    {lang.nativeName}
                    <span className="ml-1 opacity-70 text-xs">({lang.name})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Speech vs Type Input Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant={isListening ? 'danger' : 'secondary'}
                size="sm"
                onClick={toggleSpeechInput}
                leftIcon={isListening ? <MicOff size={15} /> : <Mic size={15} />}
                className={cn(isListening && 'animate-pulse')}
              >
                {isListening ? 'Listening (Click to Stop)' : 'Speak (Microphone)'}
              </Button>
              {isListening && (
                <span className="text-xs text-error font-medium animate-pulse">
                  Listening in {selectedLanguage.toUpperCase()}...
                </span>
              )}
            </div>

            {/* Text area */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="message-input" className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Government Message
                </label>
                <span className="text-[11px] text-muted">Ctrl+Enter to translate</span>
              </div>
              <div className="relative">
                <textarea
                  id="message-input"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) handleTranslate()
                  }}
                  placeholder={
                    selectedLanguage === 'te'
                      ? 'మీ సందేశాన్ని ఇక్కడ టైప్ చేయండి లేదా మాట్లాడండి...'
                      : selectedLanguage === 'hi'
                      ? 'यहाँ अपना संदेश टाइप करें या बोलें...'
                      : 'Type or speak your message here... (e.g. "Hello, please bring Aadhaar card")'
                  }
                  rows={4}
                  className={cn(
                    'w-full rounded-xl border border-border bg-white p-3 text-base',
                    'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent',
                    'resize-none shadow-sm',
                  )}
                  aria-describedby="translate-hint"
                />
                {speechInterim && (
                  <div className="absolute bottom-2 left-3 right-3 text-xs text-primary bg-primary-50/90 p-1.5 rounded border border-primary-100 italic truncate">
                    Heard: {speechInterim}...
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="flex items-center gap-2 text-sm text-error bg-error-light rounded-lg p-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={isTranslating}
              onClick={() => handleTranslate()}
              leftIcon={<Hand size={18} />}
              className="font-bold shadow-md"
            >
              Translate to ISL Signs
            </Button>
          </div>

          {/* Quick Common Greetings & Phrases */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Quick Etiquette & Greetings
              </span>
              <span className="text-[11px] text-accent font-medium">1-Click</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '👋 Hello', text: 'Hello, welcome.' },
                { label: '🙏 Thank You', text: 'Thank you very much.' },
                { label: '🤝 Sorry', text: 'Sorry for the delay.' },
                { label: '🙋 Goodbye', text: 'Goodbye, have a good day.' },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => handleQuickPhrase(q.text)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-primary-50 hover:text-primary text-gray-800 border border-gray-200 transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-border">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-2">
                Common Service Phrases
              </span>
              <div className="space-y-1.5">
                {commonPhrases.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleQuickPhrase(p.english)}
                    className="w-full text-left text-xs p-2 rounded-lg bg-gray-50 hover:bg-primary-50 text-gray-800 hover:text-primary border border-border transition-colors truncate block"
                  >
                    {p.english}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Animated ISL Avatar Panel (3 Cols) ────────────────────────── */}
        <div className="lg:col-span-3">
          <AvatarPanel
            playbackState={playbackState}
            isTranslating={isTranslating}
            signLabels={signLabels}
            onSignClick={(i) => engineRef.current?.jumpTo(i)}
            onPlay={() => engineRef.current?.play()}
            onPause={() => engineRef.current?.pause()}
            onRestart={() => engineRef.current?.replay()}
            onPrev={() => engineRef.current?.jumpTo((playbackState?.currentSignIndex ?? 1) - 1)}
            onNext={() => engineRef.current?.jumpTo((playbackState?.currentSignIndex ?? 0) + 1)}
            onSpeedChange={(s) => {
              setPlaybackSpeed(s)
              engineRef.current?.setSpeed(s)
            }}
            speed={playbackSpeed}
            hasResult={!!translationResult}
            originalText={translationResult?.original ?? ''}
            confidence={translationResult?.confidence ?? 0}
            language={translationResult?.language ?? selectedLanguage}
          />
        </div>
      </div>
    </div>
  )
}

export default Communicate
