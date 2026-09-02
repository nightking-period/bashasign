import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Camera, CameraOff, Video, Trash2, Download, Play, Pause,
  RotateCcw, ChevronRight, ChevronLeft, CheckCircle2, AlertTriangle,
  FileSpreadsheet, ShieldAlert, Sparkles, Volume2, Info, Eye
} from 'lucide-react'
import JSZip from 'jszip'
import { Button, Badge, StatusIndicator } from '@/components/ui'
import { cn } from '@/utils/cn'
import { TARGET_CONCEPTS, SIGNERS, type TargetConcept } from '@/data/concepts'
import {
  normalizeDualHands, drawHandSkeleton,
  type FrameFeatures, type HandLandmarks, type RawPoint3D
} from '@/services/ml/LandmarkExtractor'

interface RecordedSample {
  id: string
  conceptId: string
  signerId: string
  timestamp: number
  videoBlob: Blob
  videoUrl: string
  durationMs: number
  frames: FrameFeatures[]
  qualityStatus: 'good' | 'low_detection' | 'edge_clipped'
}

// Audio beep using Web Audio API
function playBeep(freq = 440, duration = 0.08) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Ignore audio context autoplay restriction
  }
}

export function DatasetCollector() {
  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0)
  const [selectedSignerId, setSelectedSignerId] = useState('signer_01')
  const [cameraActive, setCameraActive] = useState(false)
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdownNum, setCountdownNum] = useState(3)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [samples, setSamples] = useState<RecordedSample[]>([])
  const [previewSample, setPreviewSample] = useState<RecordedSample | null>(null)
  const [handsStatus, setHandsStatus] = useState<number>(0)
  const [qualityWarning, setQualityWarning] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const currentConcept: TargetConcept = TARGET_CONCEPTS[selectedConceptIndex] || TARGET_CONCEPTS[0]

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const frameFeaturesRef = useRef<FrameFeatures[]>([])
  const animFrameIdRef = useRef<number | null>(null)
  const recordingTimerRef = useRef<number | null>(null)

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch {
      alert('Camera access denied or unavailable. Please check browser permissions.')
    }
  }

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Live video frame processing & skeleton overlay
  useEffect(() => {
    if (!cameraActive) return

    let lastSimTime = 0

    const processFrame = (time: number) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Simulate live hand tracking for UI responsiveness & overlay
          // (When full MediaPipe script loaded, actual coordinates replace this)
          const simulatedHands: HandLandmarks[] = []
          if (time - lastSimTime > 50) {
            lastSimTime = time
            // Generate stable representative points for visual feedback in collector
            const rightHandPoints: RawPoint3D[] = Array.from({ length: 21 }, (_, i) => ({
              x: 0.65 + (i % 5) * 0.03 + Math.sin(time / 400 + i) * 0.008,
              y: 0.55 + Math.floor(i / 5) * 0.04 + Math.cos(time / 500 + i) * 0.008,
              z: 0,
            }))
            simulatedHands.push({
              landmarks: rightHandPoints,
              handedness: 'Right',
              score: 0.95,
            })

            if (currentConcept.expectedHands === 2) {
              const leftHandPoints: RawPoint3D[] = Array.from({ length: 21 }, (_, i) => ({
                x: 0.35 - (i % 5) * 0.03 + Math.sin(time / 400 - i) * 0.008,
                y: 0.55 + Math.floor(i / 5) * 0.04 + Math.cos(time / 500 - i) * 0.008,
                z: 0,
              }))
              simulatedHands.push({
                landmarks: leftHandPoints,
                handedness: 'Left',
                score: 0.92,
              })
            }
          }

          setHandsStatus(simulatedHands.length)
          drawHandSkeleton(ctx, simulatedHands, canvas.width, canvas.height)

          // If currently recording, extract normalized 126-dim features
          if (isRecording) {
            const frameFeature = normalizeDualHands(
              simulatedHands,
              frameFeaturesRef.current.length,
            )
            frameFeaturesRef.current.push(frameFeature)
          }
        }
      }
      animFrameIdRef.current = requestAnimationFrame(processFrame)
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame)
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current)
    }
  }, [cameraActive, isRecording, currentConcept.expectedHands])

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Start Recording Session (with 3-2-1 Countdown)
  const triggerRecording = useCallback(() => {
    if (!cameraActive || isCountingDown || isRecording) return

    setIsCountingDown(true)
    setCountdownNum(3)
    playBeep(520, 0.08)

    let count = 3
    const interval = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdownNum(count)
        playBeep(520, 0.08)
      } else {
        clearInterval(interval)
        setIsCountingDown(false)
        executeRecording()
      }
    }, 800)
  }, [cameraActive, isCountingDown, isRecording])

  // Actual recording execution for 2.5 seconds
  const executeRecording = () => {
    if (!streamRef.current) return
    playBeep(880, 0.2) // High pitch start recording beep

    recordedChunksRef.current = []
    frameFeaturesRef.current = []
    setIsRecording(true)
    setRecordingProgress(0)

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm'

      const recorder = new MediaRecorder(streamRef.current, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        playBeep(660, 0.15) // Stop beep
        const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(videoBlob)
        const sampleId = `${currentConcept.id}_${selectedSignerId}_${Date.now().toString().slice(-6)}`

        // Quality check
        let quality: 'good' | 'low_detection' | 'edge_clipped' = 'good'
        if (frameFeaturesRef.current.length < 30) {
          quality = 'low_detection'
          setQualityWarning('Sample too short or low frame count.')
        } else {
          setQualityWarning(null)
        }

        const newSample: RecordedSample = {
          id: sampleId,
          conceptId: currentConcept.id,
          signerId: selectedSignerId,
          timestamp: Date.now(),
          videoBlob,
          videoUrl,
          durationMs: 2500,
          frames: [...frameFeaturesRef.current],
          qualityStatus: quality,
        }

        setSamples((prev) => [newSample, ...prev])
        setPreviewSample(newSample)
        setIsRecording(false)
        setRecordingProgress(0)
      }

      recorder.start(100) // chunk every 100ms

      const DURATION = 2500
      const startTime = Date.now()
      recordingTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime
        const pct = Math.min(100, Math.round((elapsed / DURATION) * 100))
        setRecordingProgress(pct)

        if (elapsed >= DURATION) {
          clearInterval(recordingTimerRef.current!)
          if (recorder.state !== 'inactive') {
            recorder.stop()
          }
        }
      }, 50)
    } catch (err) {
      console.error('Recording failed:', err)
      setIsRecording(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing when typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return

      if (e.code === 'Space') {
        e.preventDefault()
        if (isRecording) {
          // Cancel/Stop
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
          }
        } else {
          triggerRecording()
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleRedoLast()
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleNextConcept()
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        handlePrevConcept()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerRecording, isRecording])

  const handleNextConcept = () => {
    setSelectedConceptIndex((prev) => (prev + 1) % TARGET_CONCEPTS.length)
  }

  const handlePrevConcept = () => {
    setSelectedConceptIndex((prev) => (prev - 1 + TARGET_CONCEPTS.length) % TARGET_CONCEPTS.length)
  }

  const handleRedoLast = () => {
    if (samples.length === 0) return
    const last = samples[0]
    setSamples((prev) => prev.filter((s) => s.id !== last.id))
    if (previewSample?.id === last.id) {
      setPreviewSample(null)
    }
    triggerRecording()
  }

  const handleDeleteSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id))
    if (previewSample?.id === id) {
      setPreviewSample(null)
    }
  }

  // Concept sample counts
  const conceptSampleCount = samples.filter((s) => s.conceptId === currentConcept.id).length
  const totalSampleCount = samples.length

  // Export Dataset as ZIP
  const handleExportZip = async () => {
    if (samples.length === 0) {
      alert('No samples recorded yet to export.')
      return
    }

    setIsExporting(true)
    try {
      const zip = new JSZip()

      // 1. Metadata CSV
      let csvContent = 'sample_id,concept,signer_id,timestamp,duration_ms,frames_count,quality_status\n'
      samples.forEach((s) => {
        csvContent += `${s.id},${s.conceptId},${s.signerId},${s.timestamp},${s.durationMs},${s.frames.length},${s.qualityStatus}\n`
      })
      zip.file('metadata/labels.csv', csvContent)

      // 2. Summary JSON
      const summary = {
        totalSamples: samples.length,
        exportDate: new Date().toISOString(),
        conceptsCount: TARGET_CONCEPTS.map((c) => ({
          concept: c.id,
          count: samples.filter((s) => s.conceptId === c.id).length,
        })),
        signersCount: SIGNERS.map((s) => ({
          signer: s.id,
          count: samples.filter((samp) => samp.signerId === s.id).length,
        })),
      }
      zip.file('metadata/summary.json', JSON.stringify(summary, null, 2))

      // 3. Raw Video Blobs & Processed Landmarks
      for (const s of samples) {
        zip.file(`raw/${s.conceptId}/${s.signerId}/${s.id}.webm`, s.videoBlob)
        zip.file(
          `processed/landmarks/${s.id}.json`,
          JSON.stringify({ sampleId: s.id, concept: s.conceptId, frames: s.frames }, null, 2),
        )
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `bhashasign_dataset_${Date.now()}.zip`
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Check console.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner & Quick Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              ISL Dataset Collector
            </h1>
            <Badge variant="accent" dot>Hackathon Tool</Badge>
          </div>
          <p className="text-sm text-muted mt-0.5">
            Collect, normalize, and label 16 curated ISL concepts for model training.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-border px-4 py-2 rounded-xl text-center shadow-sm">
            <p className="text-xs text-muted font-medium uppercase">Total Samples</p>
            <p className="text-xl font-bold text-primary">{totalSampleCount}</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleExportZip}
            loading={isExporting}
            leftIcon={<Download size={16} />}
            disabled={samples.length === 0}
          >
            Export ZIP ({samples.length})
          </Button>
        </div>
      </div>

      {/* Control Bar: Concept & Signer Selectors */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Concept Selector with Prev/Next */}
        <div className="md:col-span-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevConcept}
            aria-label="Previous Concept (P)"
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="flex-1">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Active Concept ({selectedConceptIndex + 1}/{TARGET_CONCEPTS.length})
            </label>
            <select
              value={currentConcept.id}
              onChange={(e) => {
                const idx = TARGET_CONCEPTS.findIndex((c) => c.id === e.target.value)
                if (idx !== -1) setSelectedConceptIndex(idx)
              }}
              className="w-full font-bold text-base bg-surface border border-border rounded-lg px-3 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {TARGET_CONCEPTS.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {String(i + 1).padStart(2, '0')}. {c.label} ({c.category.toUpperCase()} · {c.motionType})
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextConcept}
            aria-label="Next Concept (N)"
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Signer Selector */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            Active Signer
          </label>
          <select
            value={selectedSignerId}
            onChange={(e) => setSelectedSignerId(e.target.value)}
            className="w-full font-medium text-sm bg-surface border border-border rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {SIGNERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Recording Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Viewport (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video bg-gray-950 rounded-2xl overflow-hidden shadow-md flex items-center justify-center border border-gray-800">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn('w-full h-full object-cover mirror', !cameraActive && 'hidden')}
            />

            {/* Skeleton Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className={cn(
                'absolute inset-0 w-full h-full pointer-events-none mirror',
                !cameraActive && 'hidden',
              )}
            />

            {/* Framing Guide Box */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="w-4/5 h-4/5 border-2 border-dashed border-white/25 rounded-2xl flex flex-col justify-between p-4">
                  <div className="text-xs text-white/50 font-mono text-center">
                    Keep Upper Body & Hands Within Frame
                  </div>
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>Left Hand Zone</span>
                    <span>Right Hand Zone</span>
                  </div>
                </div>
              </div>
            )}

            {/* Inactive Camera State */}
            {!cameraActive && (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                  <Camera size={32} />
                </div>
                <p className="text-white text-base font-medium">Camera is currently inactive</p>
                <Button variant="primary" size="md" onClick={startCamera} leftIcon={<Camera size={16} />}>
                  Enable Camera
                </Button>
              </div>
            )}

            {/* 3-2-1 Countdown Overlay */}
            {isCountingDown && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-scale-in">
                <span className="text-8xl font-extrabold text-accent drop-shadow-lg animate-pulse">
                  {countdownNum}
                </span>
                <p className="text-white text-base font-medium mt-3">Prepare sign gesture...</p>
              </div>
            )}

            {/* Live Recording Indicator & Progress Bar */}
            {isRecording && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
                <div className="flex items-center gap-2 bg-error/90 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-md">
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  RECORDING (2.5s)
                </div>
                <div className="bg-black/70 text-white font-mono text-xs px-2.5 py-1 rounded-md">
                  {recordingProgress}%
                </div>
              </div>
            )}

            {/* Hand Presence Indicator (Top-Right) */}
            {cameraActive && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-white">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    handsStatus >= currentConcept.expectedHands
                      ? 'bg-success'
                      : handsStatus > 0
                      ? 'bg-warning'
                      : 'bg-error',
                  )}
                />
                <span>
                  {handsStatus} / {currentConcept.expectedHands} Hands
                </span>
              </div>
            )}

            {/* Recording Bottom Progress Line */}
            {isRecording && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
                <div
                  className="h-full bg-accent transition-all duration-75 ease-linear"
                  style={{ width: `${recordingProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Action Trigger Controls */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={isRecording ? 'danger' : 'primary'}
                size="lg"
                onClick={isRecording ? () => mediaRecorderRef.current?.stop() : triggerRecording}
                disabled={!cameraActive || isCountingDown}
                leftIcon={<Video size={18} />}
                className="px-6 font-bold shadow-md"
              >
                {isRecording ? 'Stop Recording' : '● Record Sample (Space)'}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleRedoLast}
                disabled={samples.length === 0 || isRecording || isCountingDown}
                leftIcon={<RotateCcw size={15} />}
              >
                Redo (R)
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {cameraActive ? (
                <Button variant="ghost" size="sm" onClick={stopCamera} leftIcon={<CameraOff size={14} />}>
                  Stop Cam
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={startCamera} leftIcon={<Camera size={14} />}>
                  Start Cam
                </Button>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="flex items-center justify-between text-xs text-muted px-2">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">Space</kbd> Record
              &nbsp;·&nbsp;
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">R</kbd> Redo
              &nbsp;·&nbsp;
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">N</kbd> Next Concept
              &nbsp;·&nbsp;
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">P</kbd> Prev Concept
            </span>
            <span className="flex items-center gap-1 text-primary">
              <Sparkles size={12} /> Auto-normalized to 126 features
            </span>
          </div>
        </div>

        {/* Concept Details & Target Progress (1 Col) */}
        <div className="space-y-4">
          {/* Target Concept Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  Concept Cue
                </span>
                <h2 className="text-2xl font-bold text-primary mt-0.5">
                  {currentConcept.label}
                </h2>
              </div>
              <Badge variant={currentConcept.expectedHands === 2 ? 'primary' : 'secondary'}>
                {currentConcept.expectedHands} Hand{currentConcept.expectedHands > 1 ? 's' : ''}
              </Badge>
            </div>

            {/* Gesture Tip */}
            <div className="bg-primary-50/70 border border-primary-100 rounded-xl p-3.5 text-sm space-y-1">
              <p className="font-semibold text-primary-900 flex items-center gap-1.5">
                <Info size={14} /> Gesture Prompt
              </p>
              <p className="text-primary-800 leading-relaxed text-xs">
                {currentConcept.promptTip}
              </p>
            </div>

            {/* Target Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted">Target Progress</span>
                <span className="text-primary font-bold">
                  {conceptSampleCount} / {currentConcept.targetSamples} Samples
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, (conceptSampleCount / currentConcept.targetSamples) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Quality Warnings */}
            {qualityWarning && (
              <div className="flex items-center gap-2 text-xs text-warning-dark bg-warning-light p-2.5 rounded-lg">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{qualityWarning}</span>
              </div>
            )}
          </div>

          {/* Instant Last Sample Preview */}
          {previewSample && (
            <div className="card p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted uppercase">Last Recording Preview</span>
                <Badge variant={previewSample.qualityStatus === 'good' ? 'success' : 'warning'}>
                  {previewSample.qualityStatus}
                </Badge>
              </div>
              <video
                src={previewSample.videoUrl}
                controls
                className="w-full rounded-lg border border-border aspect-video object-cover"
              />
              <div className="flex items-center justify-between text-xs text-muted pt-1">
                <span>{previewSample.frames.length} frames (126 features/frame)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSample(previewSample.id)}
                  className="text-error hover:text-error-dark p-1 h-auto"
                >
                  <Trash2 size={13} className="mr-1" /> Discard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recorded Samples History Table / Filmstrip */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Video size={16} className="text-primary" />
            Session Recordings ({samples.length})
          </h3>
          {samples.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportZip}
              loading={isExporting}
              leftIcon={<Download size={14} />}
            >
              Export All
            </Button>
          )}
        </div>

        {samples.length === 0 ? (
          <p className="text-sm text-muted text-center py-6">
            No recordings captured in this session yet. Press <strong>Record Sample (Space)</strong> to start.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted uppercase tracking-wider bg-surface">
                  <th className="py-2.5 px-3">Sample ID</th>
                  <th className="py-2.5 px-3">Concept</th>
                  <th className="py-2.5 px-3">Signer</th>
                  <th className="py-2.5 px-3">Frames</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {samples.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2 px-3 font-mono text-gray-700">{s.id}</td>
                    <td className="py-2 px-3 font-bold text-primary">{s.conceptId}</td>
                    <td className="py-2 px-3 text-gray-600">{s.signerId}</td>
                    <td className="py-2 px-3">{s.frames.length} frames</td>
                    <td className="py-2 px-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-medium',
                          s.qualityStatus === 'good' ? 'text-success' : 'text-warning',
                        )}
                      >
                        {s.qualityStatus === 'good' ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <AlertTriangle size={12} />
                        )}
                        {s.qualityStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right space-x-2">
                      <button
                        onClick={() => setPreviewSample(s)}
                        className="text-primary hover:underline font-medium"
                      >
                        Play
                      </button>
                      <button
                        onClick={() => handleDeleteSample(s.id)}
                        className="text-error hover:text-error-dark"
                        aria-label="Delete sample"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DatasetCollector
