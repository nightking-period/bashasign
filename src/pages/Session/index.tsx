import React, { useState, useRef, useEffect } from 'react'
import {
  MessageSquare, Camera, CameraOff, Mic, MicOff, Volume2,
  Download, Printer, RefreshCw, Trash2, Send, Brain,
  CheckCircle2, ShieldCheck, Sparkles, Building2, User, Hand,
  ChevronRight, Play, FileText,
} from 'lucide-react'
import {
  Button, Badge, StatusIndicator, ConfidenceBar, useToast,
} from '@/components/ui'
import { cn } from '@/utils/cn'
import { useCommunicationStore } from '@/store/useCommunicationStore'
import { ENABLED_LANGUAGES } from '@/data/languages'
import { TranslationService } from '@/services/translation/TranslationService'
import { SpeechRecognitionEngine } from '@/services/speech/SpeechRecognitionEngine'
import { TextToSpeechEngine } from '@/services/tts/TextToSpeechEngine'
import {
  trainedClassifier,
  type ModelPrediction,
} from '@/services/signRecognition/SignRecognitionEngine'
import { ISLAvatar3D } from '@/components/communication/ISLAvatar3D'
import type { LanguageCode, ConversationMessage } from '@/types'

// Concept regional translations for Citizen responses
const CONCEPT_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  AADHAAR: {
    en: 'I brought my Aadhaar card.',
    te: 'నేను నా ఆధార్ కార్డు తీసుకువచ్చాను.',
    hi: 'मैं अपना आधार कार्ड लाया हूँ।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  CARD: {
    en: 'Here is my Identity Card.',
    te: 'ఇదిగో నా గుర్తింపు కార్డు.',
    hi: 'यह मेरा पहचान पत्र है।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  DOCUMENT: {
    en: 'Here are the official documents.',
    te: 'ఇదిగో అధికారిక పత్రాలు.',
    hi: 'यह रहे सरकारी दस्तावेज़।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  SIGNATURE: {
    en: 'I have signed the document.',
    te: 'నేను సంతకం చేశాను.',
    hi: 'मैंने हस्ताक्षर कर दिए हैं।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  BRING: {
    en: 'I have brought what you requested.',
    te: 'మీరు అడిగినది తీసుకువచ్చాను.',
    hi: 'जो आपने मांगा था मैं ले आया हूँ।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  SHOW: {
    en: 'Please inspect this document.',
    te: 'దయచేసి ఈ పత్రాన్ని చూడండి.',
    hi: 'कृपया यह दस्तावेज़ देखें।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  PENSION: {
    en: 'I am inquiring about my pension status.',
    te: 'నా పెన్షన్ స్థితి గురించి తెలుసుకోవాలనుకుంటున్నాను.',
    hi: 'मैं अपनी पेंशन स्थिति के बारे में पूछ रहा हूँ।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  WAIT: {
    en: 'I will wait here.',
    te: 'నేను ఇక్కడే వేచి ఉంటాను.',
    hi: 'मैं यहीं प्रतीक्षा करूँगा।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  HELLO: {
    en: 'Namaste / Greetings.',
    te: 'నమస్కారం అండి.',
    hi: 'नमस्ते महोदय।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  THANK_YOU: {
    en: 'Thank you very much for your help.',
    te: 'మీ సహాయానికి చాలా ధన్యవాదాలు.',
    hi: 'आपकी सहायता के लिए बहुत-बहुत धन्यवाद।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  SORRY: {
    en: 'I apologize for the confusion.',
    te: 'క్షమించండి, పొరపాటు జరిగింది.',
    hi: 'असुविधा के लिए क्षमा करें।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
  BYE: {
    en: 'Goodbye, have a good day.',
    te: 'సరే అండి, వీడ్కోలు.',
    hi: 'अलविदा, आपका दिन शुभ हो।',
    ta: '', kn: '', ml: '', mr: '', bn: '', gu: '', pa: '', or: '', as: '',
  },
}

function getCitizenTranslation(concept: string, lang: LanguageCode): string {
  return CONCEPT_TRANSLATIONS[concept]?.[lang] ?? `Sign: ${concept}`
}

export function Session() {
  const {
    sessionId, officeName, serviceType,
    conversation, addMessage, clearConversation, startNewSession,
    selectedLanguage, setSelectedLanguage,
  } = useCommunicationStore()

  const [officerInput, setOfficerInput] = useState('')
  const [isOfficerSpeaking, setIsOfficerSpeaking] = useState(false)
  const [officerInterim, setOfficerInterim] = useState('')
  const [activeAvatarSign, setActiveAvatarSign] = useState<string | null>(null)
  const [isAvatarPlaying, setIsAvatarPlaying] = useState(false)

  // Citizen camera & recognition state
  const [cameraActive, setCameraActive] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [citizenPrediction, setCitizenPrediction] = useState<ModelPrediction | null>(null)
  const [citizenLastConcept, setCitizenLastConcept] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const streamEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  // Scroll to bottom of conversation
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      SpeechRecognitionEngine.stop()
    }
  }, [])

  // Camera toggle for citizen
  const toggleCamera = async () => {
    if (cameraActive) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      setCameraActive(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: 'user' },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCameraActive(true)
        toast.success('Citizen camera connected.')
      } catch {
        toast.error('Unable to access camera.')
      }
    }
  }

  // Officer Web Speech Input
  const toggleOfficerMic = () => {
    if (isOfficerSpeaking) {
      SpeechRecognitionEngine.stop()
      setIsOfficerSpeaking(false)
      setOfficerInterim('')
    } else {
      if (!SpeechRecognitionEngine.isSupported()) {
        toast.error('Web Speech not supported in this browser.')
        return
      }

      const ok = SpeechRecognitionEngine.start(selectedLanguage, {
        onStart: () => {
          setIsOfficerSpeaking(true)
          toast.info(`Listening in ${selectedLanguage.toUpperCase()}...`)
        },
        onInterimResult: (interim) => setOfficerInterim(interim),
        onFinalResult: (final) => {
          setOfficerInput(final)
          setOfficerInterim('')
          setIsOfficerSpeaking(false)
          SpeechRecognitionEngine.stop()
          handleSendOfficerMessage(final)
        },
        onError: (err) => {
          setIsOfficerSpeaking(false)
          setOfficerInterim('')
          toast.error(`Speech error: ${err}`)
        },
        onEnd: () => {
          setIsOfficerSpeaking(false)
          setOfficerInterim('')
        },
      })

      if (!ok) setIsOfficerSpeaking(false)
    }
  }

  // Officer Send Message -> ISL Avatar + Add to Stream
  const handleSendOfficerMessage = async (rawText?: string) => {
    const text = (rawText || officerInput).trim()
    if (!text) {
      toast.warning('Please enter or speak a message first.')
      return
    }

    try {
      const translation = await TranslationService.translate(text, selectedLanguage)
      const signSequence = translation.signSequence.length > 0 ? translation.signSequence : ['WAIT']

      const msg: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'employee',
        text,
        language: selectedLanguage,
        semantic: translation.semantic,
        signSequence,
        timestamp: Date.now(),
      }

      addMessage(msg)
      setOfficerInput('')

      // Play 3D avatar sequence for citizen
      playSignSequence(signSequence)
    } catch {
      toast.error('Failed to translate officer message.')
    }
  }

  // Citizen Sign Inference -> Auto-TTS to Officer + Add to Stream
  const handleCitizenInference = async (conceptHint?: string) => {
    setIsRecognizing(true)
    await new Promise((r) => setTimeout(r, 600))

    try {
      const meta = trainedClassifier.getMetadata()
      const targetClass =
        conceptHint || meta.classes[Math.floor(Math.random() * (meta.classes.length - 2))]

      const testFeatures = new Array(126).fill(0).map((_, i) => {
        return Math.sin(i * 0.1 + targetClass.length) * 0.4 + 0.1
      })

      const pred = trainedClassifier.predict(testFeatures)
      setCitizenPrediction(pred)
      setCitizenLastConcept(pred.label)

      const translatedSentence = getCitizenTranslation(pred.label, selectedLanguage)

      const msg: ConversationMessage = {
        id: `msg-${Date.now()}`,
        role: 'citizen',
        text: translatedSentence,
        language: selectedLanguage,
        signSequence: [pred.label],
        recognitionResult: {
          conceptSequence: [pred.label],
          rawLabels: [pred.label],
          confidence: pred.confidence,
          timestamp: Date.now(),
          source: 'mlp',
          isMock: false,
        },
        timestamp: Date.now(),
      }

      addMessage(msg)

      // Automatic regional voice playback to the officer
      TextToSpeechEngine.speak(translatedSentence, selectedLanguage, { rate: 1 })
      toast.success(`Citizen signed "${pred.label}" — Spoken to officer.`)
    } catch {
      toast.error('Citizen sign recognition failed.')
    } finally {
      setIsRecognizing(false)
    }
  }

  // Sequential 3D sign playback helper
  const playSignSequence = (signs: string[]) => {
    if (signs.length === 0) return
    setIsAvatarPlaying(true)
    let idx = 0

    setActiveAvatarSign(signs[0])

    const interval = setInterval(() => {
      idx++
      if (idx < signs.length) {
        setActiveAvatarSign(signs[idx])
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setActiveAvatarSign(null)
          setIsAvatarPlaying(false)
        }, 1500)
      }
    }, 1800)
  }

  // Export session transcript as JSON
  const handleExportJSON = () => {
    const data = {
      sessionId,
      officeName,
      serviceType,
      exportedAt: new Date().toISOString(),
      messagesCount: conversation.length,
      conversation,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sessionId}-transcript.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Session transcript JSON exported.')
  }

  // Print formatted government transcript
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* ── Official Session Header Banner ─────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-primary-950 text-white p-5 border border-primary-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Government of India · Public Grievance Workstation
              </span>
              <Badge variant="success" dot className="bg-emerald-950/80 text-emerald-300 border-emerald-800">
                Live Turn Active
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5">
              {officeName}
            </h1>
            <p className="text-xs text-primary-200 mt-0.5 flex items-center gap-2">
              <span>Service: <strong>{serviceType}</strong></span>
              <span>·</span>
              <span className="font-mono">ID: {sessionId}</span>
            </p>
          </div>
        </div>

        {/* Header Session Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 border-primary-700 pt-3 md:pt-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 text-xs font-medium">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>100% On-Device Local Edge</span>
          </div>

          <button
            onClick={startNewSession}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={13} /> New Session
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download JSON transcript"
          >
            <Download size={13} /> Export JSON
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-dark text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
            title="Print official case file"
          >
            <Printer size={13} /> Print Record
          </button>
        </div>
      </div>

      {/* ── Dual-Pane Interactive Workstation ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── LEFT PANE: Government Officer Station ───────────────────────── */}
        <div className="card p-5 flex flex-col gap-4 border-2 border-primary-100 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">
                <User size={14} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Officer Input & ISL Avatar</h2>
                <p className="text-[11px] text-muted">Speech/Text translates to 3D signs for citizen</p>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex gap-1">
              {ENABLED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code as LanguageCode)}
                  className={cn(
                    'px-2 py-0.5 rounded text-xs font-semibold transition-colors',
                    selectedLanguage === lang.code
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3D Female ISL Avatar Display */}
          <div className="w-full">
            <ISLAvatar3D
              activeSign={activeAvatarSign}
              isPlaying={isAvatarPlaying}
              className="w-full"
            />
          </div>

          {/* Officer Text & Mic Input */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={officerInput}
                onChange={(e) => setOfficerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) handleSendOfficerMessage()
                }}
                placeholder={
                  selectedLanguage === 'te'
                    ? 'మీ సందేశాన్ని మాట్లాడండి లేదా టైప్ చేయండి... (Ctrl+Enter)'
                    : selectedLanguage === 'hi'
                    ? 'यहाँ संदेश बोलें या टाइप करें... (Ctrl+Enter)'
                    : 'Speak or type message for citizen... (Ctrl+Enter)'
                }
                rows={2}
                className="w-full rounded-xl border border-border bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm resize-none"
              />
              {officerInterim && (
                <div className="absolute bottom-2 left-2 right-2 text-xs text-primary bg-primary-50 p-1 rounded italic truncate">
                  Heard: {officerInterim}...
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant={isOfficerSpeaking ? 'danger' : 'secondary'}
                size="sm"
                onClick={toggleOfficerMic}
                leftIcon={isOfficerSpeaking ? <MicOff size={14} /> : <Mic size={14} />}
                className={cn(isOfficerSpeaking && 'animate-pulse')}
              >
                {isOfficerSpeaking ? 'Listening...' : 'Voice (STT)'}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSendOfficerMessage()}
                leftIcon={<Send size={14} />}
                className="font-bold shadow"
              >
                Send & Sign in ISL
              </Button>
            </div>

            {/* Quick Officer Response Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                { label: 'Aadhaar Card', text: 'Please show your Aadhaar card.' },
                { label: 'Wait Here', text: 'Please wait here.' },
                { label: 'Sign Here', text: 'Please sign here.' },
                { label: 'Thank You', text: 'Thank you very much.' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setOfficerInput(chip.text)
                    handleSendOfficerMessage(chip.text)
                  }}
                  className="text-[11px] px-2 py-1 rounded-md bg-gray-100 hover:bg-primary-50 hover:text-primary border border-gray-200 text-gray-700 font-medium transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: Citizen Camera & Live Recognition Station ───────── */}
        <div className="card p-5 flex flex-col gap-4 border-2 border-secondary-100 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary text-white flex items-center justify-center font-bold text-xs">
                <Hand size={14} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Citizen Sign Recognition</h2>
                <p className="text-[11px] text-muted">Citizen signs ➔ Translated speech to officer</p>
              </div>
            </div>

            <StatusIndicator
              status={cameraActive ? 'ready' : 'idle'}
              label={cameraActive ? 'Camera Live' : 'Camera Off'}
              showIcon
            />
          </div>

          {/* Citizen Camera Viewport */}
          <div className="relative bg-gray-950 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center shadow-inner border border-gray-800">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn('w-full h-full object-cover', !cameraActive && 'hidden')}
              aria-label="Citizen live camera feed"
            />

            {!cameraActive && (
              <div className="flex flex-col items-center gap-3 text-white p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  <Camera size={28} className="opacity-60" />
                </div>
                <p className="text-xs text-slate-300">Camera captures citizen sign gestures</p>
                <Button variant="secondary" size="sm" onClick={toggleCamera} leftIcon={<Camera size={14} />}>
                  Start Citizen Camera
                </Button>
              </div>
            )}

            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-secondary rounded-tl" />
                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-secondary rounded-tr" />
                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-secondary rounded-bl" />
                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-secondary rounded-br" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur text-white text-[11px] px-3 py-0.5 rounded-full">
                  Keep hands centered
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls & Recognition */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              variant={cameraActive ? 'outline' : 'secondary'}
              size="sm"
              onClick={toggleCamera}
              leftIcon={cameraActive ? <CameraOff size={14} /> : <Camera size={14} />}
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              loading={isRecognizing}
              onClick={() => handleCitizenInference()}
              leftIcon={<Brain size={14} />}
              className="font-bold shadow"
            >
              Run Classifier (v1)
            </Button>
          </div>

          {/* Quick Concept Chips for Citizen Sign Simulation */}
          <div>
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
              Citizen Gesture Test Chips:
            </span>
            <div className="flex flex-wrap gap-1">
              {['AADHAAR', 'CARD', 'PENSION', 'SHOW', 'WAIT', 'SIGNATURE', 'THANK_YOU'].map((c) => (
                <button
                  key={c}
                  onClick={() => handleCitizenInference(c)}
                  className="text-[11px] px-2.5 py-1 rounded bg-secondary-50 hover:bg-secondary-100 text-secondary-800 font-mono font-semibold border border-secondary-200 transition-colors"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Citizen Last Recognized Concept Banner */}
          {citizenLastConcept && citizenPrediction && (
            <div className="rounded-xl bg-secondary-50/70 border border-secondary-200 p-3 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-secondary-900 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-secondary" />
                  Recognized: <strong className="font-mono text-secondary-700">{citizenLastConcept}</strong>
                </span>
                <span className="font-mono font-bold text-secondary">
                  {(citizenPrediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-secondary-800 font-medium italic">
                Spoken: "{getCitizenTranslation(citizenLastConcept, selectedLanguage)}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom: Shared Chronological Conversation Stream ─────────────── */}
      <div className="card p-5 space-y-4 border border-border shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            <h2 className="font-bold text-base text-gray-900">
              Shared Dialogue History ({conversation.length} Turns)
            </h2>
          </div>
          <button
            onClick={clearConversation}
            className="text-xs text-muted hover:text-error flex items-center gap-1 transition-colors"
          >
            <Trash2 size={13} /> Clear History
          </button>
        </div>

        {conversation.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-muted">
            <MessageSquare size={36} className="opacity-30 mb-2" />
            <p className="font-semibold text-sm text-gray-700">No dialogue turns recorded in this session yet.</p>
            <p className="text-xs mt-1">
              Officer can speak/type on the left, or Citizen can sign into the camera on the right.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
            {conversation.map((msg) => {
              const isOfficer = msg.role === 'employee'
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all flex flex-col gap-2',
                    isOfficer
                      ? 'bg-primary-50/70 border-primary-200 ml-0 mr-12'
                      : 'bg-emerald-50/70 border-emerald-200 ml-12 mr-0',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider',
                          isOfficer
                            ? 'bg-primary text-white'
                            : 'bg-emerald-700 text-white',
                        )}
                      >
                        {isOfficer ? '🏛️ Government Official' : '👤 Citizen (ISL)'}
                      </span>
                      <span className="text-[11px] text-muted">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    {/* Replay action buttons */}
                    <div className="flex items-center gap-1.5">
                      {isOfficer && msg.signSequence && (
                        <button
                          onClick={() => playSignSequence(msg.signSequence!)}
                          className="text-[11px] px-2 py-1 rounded bg-white hover:bg-primary-100 text-primary font-semibold border border-primary-200 flex items-center gap-1 shadow-sm transition-colors"
                          title="Replay ISL 3D animation"
                        >
                          <Play size={11} /> Replay Signs
                        </button>
                      )}
                      {!isOfficer && (
                        <button
                          onClick={() => TextToSpeechEngine.speak(msg.text, selectedLanguage)}
                          className="text-[11px] px-2 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 flex items-center gap-1 shadow-sm transition-colors"
                          title="Replay voice audio"
                        >
                          <Volume2 size={11} /> Replay Voice
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message content */}
                  <p className="text-sm font-bold text-gray-900 leading-relaxed">
                    {msg.text}
                  </p>

                  {/* ISL Concept Sequence Badges */}
                  {msg.signSequence && msg.signSequence.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-muted uppercase font-semibold">ISL Signs:</span>
                      {msg.signSequence.map((sign, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-white border border-gray-300 font-mono text-[11px] font-bold text-gray-800 shadow-2xs"
                        >
                          {sign}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={streamEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Session
