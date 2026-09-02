import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, BookOpen, MessageSquare, Camera, Users,
  Shield, Accessibility, Globe2, Hand, ChevronRight,
  Sparkles, Brain, CheckCircle2, Play, Pause, RotateCcw,
  Volume2, VolumeX, ShieldCheck, Award, Building2, Terminal,
  ExternalLink, Layers, Zap, Radio,
} from 'lucide-react'
import { Button, Badge, ConfidenceBar, useToast } from '@/components/ui'
import { cn } from '@/utils/cn'
import { ISLAvatar3D } from '@/components/communication/ISLAvatar3D'
import { TextToSpeechEngine } from '@/services/tts/TextToSpeechEngine'
import { trainedClassifier } from '@/services/signRecognition/SignRecognitionEngine'

// The 5 sequential story videos
const SEQUENTIAL_HERO_VIDEOS = [
  '/videos/1.mp4',
  '/videos/2.mp4',
  '/videos/3.mp4',
  '/videos/4.mp4',
  '/videos/5.mp4',
]

// Pipeline Stages for Interactive Simulator
const PIPELINE_STAGES = [
  {
    id: 'voice',
    title: '1. Voice / Text Input',
    badge: 'Direction A',
    icon: '🎙️',
    summary: 'Web Speech STT captures officer speech in Telugu (te-IN), Hindi (hi-IN), or English (en-IN).',
    livePayload: 'Input: "దయచేసి మీ ఆధార్ కార్డు తీసుకురండి" / "Please bring your Aadhaar card"',
  },
  {
    id: 'nlp',
    title: '2. Indic Semantic Parser',
    badge: 'NLP Engine',
    icon: '🧠',
    summary: 'Rule-based Indic grammar normalizer maps colloquial phrases into structured semantic representations.',
    livePayload: '{ action: "BRING", object: "AADHAAR_CARD", possessive: "YOUR" } ➔ [YOUR, AADHAAR_CARD, BRING]',
  },
  {
    id: 'avatar',
    title: '3. 3D Female ISL Avatar',
    badge: 'Visual Output',
    icon: '🤖',
    summary: 'Three.js humanoid character animates isolated 5-finger kinematics (14 joint bones per hand).',
    livePayload: 'Active Kinematics: Mixamo 5-Finger Rig · Isolated finger flexions · 60 FPS Studio PBR',
  },
  {
    id: 'camera',
    title: '4. Camera & MediaPipe',
    badge: 'Direction B',
    icon: '📷',
    summary: 'Client-side MediaPipe Tasks extracts 21 3D hand landmarks per frame with wrist normalization.',
    livePayload: '126 Floats (21 points × 3 coords × 2 hands) · Palm-width scale invariance',
  },
  {
    id: 'mlp',
    title: '5. Trained MLP Classifier',
    badge: 'Custom Model v1',
    icon: '⚡',
    summary: 'Lightweight Multi-Layer Perceptron (126 ➔ 128 ➔ 64 ➔ 14) predicts sign concept in <1ms.',
    livePayload: 'Trained on 36 video clips · 99.1% Train Acc · 46.3% Unseen Holdout Test Acc',
  },
  {
    id: 'tts',
    title: '6. Regional Voice Output',
    badge: 'Voice Output',
    icon: '🔊',
    summary: 'Web Speech API speaks translated sentence aloud to the government officer in their native language.',
    livePayload: 'TTS Speech: "నేను నా ఆధార్ కార్డు తీసుకువచ్చాను." (I brought my Aadhaar card)',
  },
]

export function Home() {
  // Continuous 5-Video Sequence State
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0)
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(true)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [isHeroHovered, setIsHeroHovered] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)


  // Interactive 3D Avatar & Pipeline Simulator State
  const [activeStageId, setActiveStageId] = useState<string>('avatar')
  const [interactiveSign, setInteractiveSign] = useState<string>('HELLO')
  const [isPlayingAvatar, setIsPlayingAvatar] = useState<boolean>(true)
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false)
  const [demoStep, setDemoStep] = useState<number>(1)

  const toast = useToast()

  // Handle seamless sequential transition from video 1 -> 2 -> 3 -> 4 -> 5 -> 1
  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % SEQUENTIAL_HERO_VIDEOS.length)
  }

  // Ensure video plays when index changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback
        setIsPlayingVideo(false)
      })
    }
  }, [currentVideoIndex])

  const togglePlayPauseVideo = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlayingVideo(true)
    } else {
      videoRef.current.pause()
      setIsPlayingVideo(false)
    }
  }

  const toggleMuteVideo = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  const handlePlayVoice = (text: string, lang: 'te' | 'hi' | 'en' = 'te') => {
    TextToSpeechEngine.speak(text, lang)
    toast.success(`Voice spoken in ${lang.toUpperCase()}`)
  }

  const activeStage = PIPELINE_STAGES.find((s) => s.id === activeStageId) || PIPELINE_STAGES[0]

  return (
    <div className="space-y-12 pb-16">
      {/* ── TOP SEGMENT: FULL-BLEED SEAMLESS HERO VIDEO (MERGED WITH BACKGROUND, NO BOUNDARY LINE) ── */}
      <section
        onMouseEnter={() => setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
        className={cn(
          '-mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)]',
          'relative overflow-hidden bg-slate-950 text-white flex items-center transition-all duration-700 ease-out border-0 outline-none select-none',
          isHeroHovered
            ? 'min-h-[82vh] md:min-h-[90vh]'
            : 'min-h-[580px] sm:min-h-[650px] md:min-h-[720px]',
        )}
      >
        {/* Continuous Background Video Loop filling entire segment */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            src={SEQUENTIAL_HERO_VIDEOS[currentVideoIndex]}
            autoPlay
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnded}
            className={cn(
              'w-full h-full object-cover transition-all duration-700 ease-out',
              isHeroHovered
                ? 'opacity-100 filter-none brightness-110 scale-100'
                : 'opacity-65 scale-105 filter brightness-90',
            )}
          />

          {/* Cinematic Dark Gradient Overlays (fade away when hovered to highlight video) */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/25 transition-opacity duration-700 pointer-events-none',
              isHeroHovered ? 'opacity-0' : 'opacity-100',
            )}
          />
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 transition-opacity duration-700 pointer-events-none',
              isHeroHovered ? 'opacity-0' : 'opacity-100',
            )}
          />

          {/* Seamless Bottom Dissolve Gradient (merges video into page background with NO boundary line) */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-surface via-surface/80 to-transparent transition-opacity duration-700 pointer-events-none z-10',
              isHeroHovered ? 'opacity-20' : 'opacity-100',
            )}
          />
        </div>


        {/* Video Sequential Progress Indicators & Player Controls (Bottom Right) */}
        <div
          className={cn(
            'absolute bottom-5 right-5 z-20 flex items-center gap-3 bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-xs transition-opacity duration-500',
            isHeroHovered ? 'opacity-50 hover:opacity-100' : 'opacity-90',
          )}
        >
          {/* 5 Step Progress Bars */}
          <div className="flex items-center gap-1.5 mr-1">
            {SEQUENTIAL_HERO_VIDEOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentVideoIndex(idx)}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  currentVideoIndex === idx
                    ? 'w-6 bg-accent'
                    : 'w-2 bg-white/30 hover:bg-white/60',
                )}
                title={`Jump to video part ${idx + 1}`}
              />
            ))}
          </div>

          <span className="font-mono text-[11px] text-slate-300 font-bold">
            {currentVideoIndex + 1} / 5
          </span>

          <button
            onClick={togglePlayPauseVideo}
            className="p-1 rounded-md hover:bg-white/10 text-white transition-colors"
            title={isPlayingVideo ? 'Pause background video' : 'Play background video'}
          >
            {isPlayingVideo ? <Pause size={13} /> : <Play size={13} className="fill-white" />}
          </button>

          <button
            onClick={toggleMuteVideo}
            className="p-1 rounded-md hover:bg-white/10 text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>

        {/* Hover Cue when highlighting video */}
        {isHeroHovered && (
          <div className="absolute top-5 left-5 z-20 pointer-events-none animate-in fade-in duration-500">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white/80 text-[11px] font-mono border border-white/10">
              Hovering Video View · Move mouse away to restore menu
            </span>
          </div>
        )}

        {/* Hero Content Overlay (Fades out when mouse enters the video frame) */}
        <div
          className={cn(
            'relative z-10 p-6 md:p-12 max-w-3xl space-y-6 transition-all duration-700 ease-in-out',
            isHeroHovered
              ? 'opacity-0 pointer-events-none -translate-y-3'
              : 'opacity-100 translate-y-0',
          )}
        >
          {/* Top Emblem Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-xs">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono font-bold uppercase tracking-wider text-accent">
              Government of India · Public Access AI
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-medium">
              100% On-Device Edge Processing
            </span>
          </div>

          {/* Master Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15]">
            Bridging the Silence in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-amber-300 to-orange-400">
              Public Administration
            </span>
            .
          </h1>

          {/* Body Description */}
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl font-normal">
            BhashaSign connects government officials and Deaf citizens in real time — translating spoken regional languages (Telugu, Hindi, English) into a <strong>photorealistic 3D female avatar with isolated finger kinematics</strong>, and recognizing citizen signs via webcam in under 1 millisecond.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">

            <Link
              to="/session"
              className="px-6 py-3.5 rounded-2xl bg-accent hover:bg-accent-dark text-white font-bold text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Building2 size={18} /> Open 2-Way Workstation
            </Link>

            <button
              onClick={() => setShowDemoModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all"
            >
              <Play size={16} className="text-accent fill-accent" /> 1-Click Demonstration
            </button>

            <Link
              to="/learn"
              className="px-5 py-3.5 rounded-2xl bg-black/40 hover:bg-black/60 text-slate-300 hover:text-white font-semibold text-sm border border-white/10 backdrop-blur-md flex items-center gap-1.5 transition-colors"
            >
              <Hand size={16} /> Sign Practice Studio
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 max-w-lg">
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Vocabulary</span>
              <span className="text-lg font-extrabold text-white">14 Classes</span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Model v1 Acc</span>
              <span className="text-lg font-extrabold text-emerald-400">99.1% Train</span>
            </div>
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Latency</span>
              <span className="text-lg font-extrabold text-accent">&lt; 1ms Edge</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: INTERACTIVE 3D AVATAR LAB & ARCHITECTURE SIMULATOR ────── */}
      <section className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-primary-50 text-primary font-mono text-xs font-bold uppercase tracking-wider">
              Interactive System Simulator
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
              Test Real-Time Kinematics & Data Flow
            </h2>
          </div>
          <p className="text-xs text-muted">Click sign chips and pipeline stages to inspect on-device execution</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive 3D Humanoid Female Avatar (5 Cols) */}
          <div className="lg:col-span-5 card p-4 border-2 border-primary-100 shadow-xl space-y-3 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-accent" />
                <h3 className="font-bold text-sm text-gray-900">3D Female ISL Avatar</h3>
              </div>
              <Badge variant="success">Isolated 5-Finger Rig</Badge>
            </div>

            {/* 3D Viewport */}
            <div className="rounded-2xl overflow-hidden aspect-[4/4.2] border border-gray-200">
              <ISLAvatar3D
                activeSign={interactiveSign}
                isPlaying={isPlayingAvatar}
                className="w-full h-full"
              />
            </div>

            {/* Interactive Concept Chips */}
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                Click to Test Isolated Finger Kinematics:
              </span>
              <div className="flex flex-wrap gap-1">
                {['HELLO', 'SHOW', 'AADHAAR', 'PENSION', 'THANK_YOU', 'SORRY'].map((sign) => (
                  <button
                    key={sign}
                    onClick={() => setInteractiveSign(sign)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all',
                      interactiveSign === sign
                        ? 'bg-primary text-white border-primary shadow-sm scale-105'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200',
                    )}
                  >
                    {sign}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Interactive Pipeline Inspector (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Stepper Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PIPELINE_STAGES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActiveStageId(st.id)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5',
                    activeStageId === st.id
                      ? 'bg-primary text-white border-primary shadow-md scale-102'
                      : 'bg-white hover:bg-gray-50 border-border text-gray-800',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{st.icon}</span>
                    <span
                      className={cn(
                        'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase',
                        activeStageId === st.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {st.badge}
                    </span>
                  </div>
                  <p className="font-bold text-xs leading-tight">{st.title}</p>
                </button>
              ))}
            </div>

            {/* Inspector Payload Display */}
            <div className="card p-5 border-2 border-primary-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeStage.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{activeStage.title}</h4>
                    <p className="text-xs text-slate-400">{activeStage.summary}</p>
                  </div>
                </div>
                <Badge variant="accent">{activeStage.badge}</Badge>
              </div>

              <div className="bg-black/60 text-emerald-400 font-mono text-xs p-3.5 rounded-xl border border-slate-800 flex items-center justify-between overflow-x-auto">
                <code>{activeStage.livePayload}</code>
                {activeStage.id === 'tts' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePlayVoice('నేను నా ఆధార్ కార్డు తీసుకువచ్చాను.', 'te')}
                    leftIcon={<Volume2 size={13} />}
                    className="ml-2 shrink-0"
                  >
                    Test Voice
                  </Button>
                )}
              </div>
            </div>

            {/* Technical Specifications Bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 border border-border text-center">
                <span className="text-[10px] uppercase font-bold text-muted block">Neural Network</span>
                <span className="text-base font-extrabold text-primary">MLP (126➔128➔64➔14)</span>
              </div>
              <div className="card p-3 border border-border text-center">
                <span className="text-[10px] uppercase font-bold text-muted block">Training Accuracy</span>
                <span className="text-base font-extrabold text-emerald-600">99.1% (36 Clips)</span>
              </div>
              <div className="card p-3 border border-border text-center">
                <span className="text-[10px] uppercase font-bold text-muted block">Edge Execution</span>
                <span className="text-base font-extrabold text-accent">100% On-Device</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: SYSTEM MODULE NAVIGATION ────────────────────────────── */}
      <section className="space-y-4 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900">Administrative Workstations & Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/session"
            className="card p-5 border-2 border-primary-200 hover:border-primary hover:shadow-xl transition-all group flex flex-col justify-between gap-4"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg mb-3 shadow">
                <Building2 size={24} />
              </div>
              <Badge variant="accent" className="mb-1.5">Government Workstation</Badge>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">
                Live 2-Way Counter Session
              </h3>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Synchronized turn-taking with officer STT, citizen camera recognition, and physical case transcript export.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-primary gap-1 group-hover:translate-x-1 transition-transform">
              Launch Session <ArrowRight size={14} />
            </div>
          </Link>

          <Link
            to="/learn"
            className="card p-5 border-2 border-secondary-200 hover:border-secondary hover:shadow-xl transition-all group flex flex-col justify-between gap-4"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-lg mb-3 shadow">
                <Hand size={24} />
              </div>
              <Badge variant="success" className="mb-1.5">Interactive Trainer</Badge>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-secondary transition-colors">
                Sign Practice Studio
              </h3>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Learn government ISL with the 3D female avatar demonstrator (0.5× slow-mo) and webcam mirror with live similarity scores.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-secondary gap-1 group-hover:translate-x-1 transition-transform">
              Start Practice <ArrowRight size={14} />
            </div>
          </Link>

          <Link
            to="/collector"
            className="card p-5 border-2 border-accent/40 hover:border-accent hover:shadow-xl transition-all group flex flex-col justify-between gap-4"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-lg mb-3 shadow">
                <Brain size={24} />
              </div>
              <Badge variant="muted" className="mb-1.5">Model v2 Training</Badge>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-accent transition-colors">
                Dataset Collector & ML
              </h3>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Record new video clips across 4 signers with 3-2-1 countdown, extract 126-dim landmarks, and retrain custom neural models.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-accent gap-1 group-hover:translate-x-1 transition-transform">
              Open Collector <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      </section>

      {/* ── 1-CLICK DEMO SIMULATION MODAL ───────────────────────────────────── */}
      {showDemoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-border shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Mandal Revenue Office Simulation</h3>
                  <p className="text-xs text-muted">Two-Way ISL Public Grievance Counter Walkthrough</p>
                </div>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { step: 1, label: '1. Officer Speaks' },
                { step: 2, label: '2. Citizen Signs' },
                { step: 3, label: '3. Official Audit' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={cn(
                    'p-2 rounded-xl text-center text-xs font-bold border transition-all',
                    demoStep === s.step
                      ? 'bg-primary text-white border-primary shadow'
                      : 'bg-gray-50 text-gray-500 border-border',
                  )}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {demoStep === 1 && (
              <div className="rounded-2xl bg-primary-50/70 border border-primary-200 p-4 space-y-3">
                <Badge variant="primary">Step 1: Government Officer ➔ Citizen</Badge>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted uppercase">Spoken Voice (Telugu / Hindi / English):</p>
                  <p className="text-lg font-bold text-primary">"దయచేసి మీ ఆధార్ కార్డు చూపించండి."</p>
                  <p className="text-xs text-gray-600 italic">("Please show your Aadhaar card.")</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-primary-100 space-y-1.5 text-xs">
                  <p className="font-bold text-gray-800">Generated ISL Gesture Sequence:</p>
                  <div className="flex gap-2">
                    {['YOUR', 'AADHAAR_CARD', 'SHOW'].map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded bg-primary-50 text-primary font-mono font-bold border border-primary-200">
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="text-muted text-[11px] pt-1">
                    ➔ 3D Female avatar animates pointing index finger into flat left palm & card framing.
                  </p>
                </div>
              </div>
            )}

            {demoStep === 2 && (
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-3">
                <Badge variant="success">Step 2: Deaf Citizen ➔ Government Officer</Badge>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted uppercase">Citizen Signs via Webcam:</p>
                  <div className="flex gap-2">
                    {['AADHAAR', 'BRING'].map((c) => (
                      <span key={c} className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono font-bold border border-emerald-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 border border-emerald-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">ML Classifier Output:</span>
                    <span className="font-mono text-emerald-700 font-bold">92.4% Confidence</span>
                  </div>
                  <p className="text-base font-bold text-emerald-900">
                    Spoken to Officer: "నేను నా ఆధార్ కార్డు తీసుకువచ్చాను."
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePlayVoice('నేను నా ఆధార్ కార్డు తీసుకువచ్చాను.', 'te')}
                    leftIcon={<Volume2 size={13} />}
                  >
                    Play Audio (TTS)
                  </Button>
                </div>
              </div>
            )}

            {demoStep === 3 && (
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-3">
                <Badge variant="warning">Step 3: Official Case Record & Transcript Export</Badge>
                <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-muted text-[11px]">
                    <span>Office: MRO Ward 4, Guntur</span>
                    <span>Session: SES-20260902-841</span>
                  </div>
                  <div className="border-t border-border pt-1 text-gray-800 space-y-1">
                    <p><strong className="text-primary">[Officer]:</strong> "Please show your Aadhaar card."</p>
                    <p><strong className="text-emerald-700">[Citizen]:</strong> "Here is my Aadhaar card."</p>
                  </div>
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  ✓ Ready for 1-click JSON export & physical case printing in government files.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={demoStep === 1}
                onClick={() => setDemoStep((s) => Math.max(1, s - 1))}
              >
                Previous Step
              </Button>

              {demoStep < 3 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setDemoStep((s) => Math.min(3, s + 1))}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setShowDemoModal(false)
                    window.location.href = '/session'
                  }}
                  rightIcon={<ArrowRight size={14} />}
                >
                  Go to Live Workstation
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
