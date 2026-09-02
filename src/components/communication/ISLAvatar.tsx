import { useState, useEffect, useRef } from 'react'
import { Volume2, Sparkles, Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ISLAvatarProps {
  activeSign: string | null
  isPlaying: boolean
  playbackSpeed?: number
  onReplay?: () => void
  onTogglePlay?: () => void
  className?: string
}

interface ArmJoints {
  elbowX: number
  elbowY: number
  wristX: number
  wristY: number
  handShape: 'open' | 'fist' | 'pointing' | 'flat' | 'pinch'
  rotation?: number
}

interface Pose {
  headTilt: number // degrees
  headNod: number  // vertical offset
  torsoY: number
  rightArm: ArmJoints
  leftArm: ArmJoints
}

// Neutral default resting pose
const IDLE_POSE: Pose = {
  headTilt: 0,
  headNod: 0,
  torsoY: 0,
  rightArm: { elbowX: 240, elbowY: 230, wristX: 230, wristY: 290, handShape: 'open' },
  leftArm:  { elbowX: 120, elbowY: 230, wristX: 130, wristY: 290, handShape: 'open' },
}

export function ISLAvatar({
  activeSign,
  isPlaying,
  playbackSpeed = 1.0,
  onReplay,
  onTogglePlay,
  className,
}: ISLAvatarProps) {
  const [frameTime, setFrameTime] = useState(0)
  const [blink, setBlink] = useState(false)
  const animRef = useRef<number | null>(null)

  // Animation frame loop
  useEffect(() => {
    let startTime = performance.now()

    const loop = (now: number) => {
      const delta = (now - startTime) * 0.001 * playbackSpeed
      if (isPlaying) {
        setFrameTime(prev => prev + delta)
      }
      startTime = now
      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isPlaying, playbackSpeed])

  // Natural eye blink interval
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }, 3800)
    return () => clearInterval(interval)
  }, [])

  // Procedural pose calculation based on active sign
  const calculatePose = (sign: string | null, t: number): Pose => {
    const s = sign ? sign.toUpperCase() : 'IDLE'
    const breath = Math.sin(t * 2) * 2

    switch (s) {
      case 'HELLO': {
        const wave = Math.sin(t * 8) * 16
        return {
          headTilt: 4,
          headNod: 0,
          torsoY: breath,
          rightArm: {
            elbowX: 245,
            elbowY: 180,
            wristX: 235 + wave,
            wristY: 125,
            handShape: 'open',
            rotation: wave * 1.5,
          },
          leftArm: IDLE_POSE.leftArm,
        }
      }

      case 'BYE': {
        const wave = Math.sin(t * 6) * 20
        return {
          headTilt: -2,
          headNod: 0,
          torsoY: breath,
          rightArm: {
            elbowX: 240,
            elbowY: 190,
            wristX: 225 + wave,
            wristY: 140,
            handShape: 'open',
            rotation: wave * 1.2,
          },
          leftArm: IDLE_POSE.leftArm,
        }
      }

      case 'THANK_YOU': {
        // Hand starts at chin (phase 0) then extends forward & down (phase 1)
        const cycle = (Math.sin(t * 3) + 1) / 2 // 0 to 1
        return {
          headTilt: 0,
          headNod: cycle * 5, // respectful nod
          torsoY: breath,
          rightArm: {
            elbowX: 215 + cycle * 10,
            elbowY: 195 + cycle * 15,
            wristX: 185 + cycle * 10,
            wristY: 155 + cycle * 70,
            handShape: 'flat',
            rotation: cycle * 15,
          },
          leftArm: IDLE_POSE.leftArm,
        }
      }

      case 'SORRY': {
        // Circular rubbing motion over heart
        const circleX = Math.cos(t * 5) * 12
        const circleY = Math.sin(t * 5) * 12
        return {
          headTilt: 6, // apologetic tilt
          headNod: 2,
          torsoY: breath,
          rightArm: {
            elbowX: 220,
            elbowY: 200,
            wristX: 180 + circleX,
            wristY: 195 + circleY,
            handShape: 'fist',
          },
          leftArm: IDLE_POSE.leftArm,
        }
      }

      case 'AADHAAR':
      case 'AADHAAR_CARD':
      case 'CARD': {
        // Both hands trace a rectangular ID card
        const trace = Math.sin(t * 4) * 12
        return {
          headTilt: 0,
          headNod: 0,
          torsoY: breath,
          rightArm: {
            elbowX: 235,
            elbowY: 210,
            wristX: 210 + trace,
            wristY: 200,
            handShape: 'pinch',
          },
          leftArm: {
            elbowX: 125,
            elbowY: 210,
            wristX: 150 - trace,
            wristY: 200,
            handShape: 'pinch',
          },
        }
      }

      case 'BRING': {
        // Both arms pull from forward to chest
        const pull = (Math.sin(t * 3.5) + 1) / 2
        return {
          headTilt: 0,
          headNod: 0,
          torsoY: breath,
          rightArm: {
            elbowX: 230 + pull * 10,
            elbowY: 220,
            wristX: 205 - pull * 25,
            wristY: 240 - pull * 35,
            handShape: 'open',
          },
          leftArm: {
            elbowX: 130 - pull * 10,
            elbowY: 220,
            wristX: 155 + pull * 25,
            wristY: 240 - pull * 35,
            handShape: 'open',
          },
        }
      }

      case 'SHOW': {
        // Left hand flat palm, right index pointing to it
        const tap = Math.sin(t * 5) * 6
        return {
          headTilt: -3,
          headNod: 0,
          torsoY: breath,
          leftArm: {
            elbowX: 125,
            elbowY: 210,
            wristX: 155,
            wristY: 195,
            handShape: 'flat',
          },
          rightArm: {
            elbowX: 230,
            elbowY: 205,
            wristX: 165 + tap,
            wristY: 195,
            handShape: 'pointing',
          },
        }
      }

      case 'PENSION': {
        // Money rubbing motion (thumb & index) near chest
        const rub = Math.sin(t * 7) * 4
        return {
          headTilt: 2,
          headNod: 0,
          torsoY: breath,
          rightArm: {
            elbowX: 225,
            elbowY: 205,
            wristX: 185 + rub,
            wristY: 190,
            handShape: 'pinch',
          },
          leftArm: IDLE_POSE.leftArm,
        }
      }

      case 'WAIT':
      case 'PLEASE_WAIT': {
        return {
          headTilt: 0,
          headNod: 0,
          torsoY: breath,
          rightArm: {
            elbowX: 235,
            elbowY: 200,
            wristX: 215,
            wristY: 165,
            handShape: 'flat',
          },
          leftArm: IDLE_POSE.leftArm,
        }
      }

      default:
        // Natural subtle breathing idle
        return {
          ...IDLE_POSE,
          torsoY: breath,
          headNod: Math.sin(t * 1.5) * 1.5,
        }
    }
  }

  const pose = calculatePose(activeSign, frameTime)

  // Render hand shape representation
  const renderHand = (wristX: number, wristY: number, shape: ArmJoints['handShape'], isRight: boolean, rot = 0) => {
    return (
      <g transform={`translate(${wristX}, ${wristY}) rotate(${rot})`}>
        {/* Palm base */}
        <circle cx="0" cy="0" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
        
        {/* Fingers based on shape */}
        {shape === 'open' && (
          <g stroke="#D97706" strokeWidth="2.5" strokeLinecap="round">
            <line x1="-6" y1="-8" x2="-8" y2="-17" />
            <line x1="-2" y1="-9" x2="-3" y2="-19" />
            <line x1="2"  y1="-9" x2="3"  y2="-19" />
            <line x1="6"  y1="-8" x2="8"  y2="-16" />
            {/* Thumb */}
            <line x1={isRight ? "-7" : "7"} y1="-1" x2={isRight ? "-14" : "14"} y2="-6" />
          </g>
        )}

        {shape === 'flat' && (
          <g fill="#FBBF24" stroke="#D97706" strokeWidth="1.5">
            <rect x="-8" y="-18" width="16" height="12" rx="4" />
          </g>
        )}

        {shape === 'fist' && (
          <g fill="#F59E0B" stroke="#D97706" strokeWidth="1.5">
            <circle cx="0" cy="-3" r="8" />
            {/* Thumb wrapped */}
            <path d="M-6,0 Q0,-8 6,-1" fill="none" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {shape === 'pointing' && (
          <g stroke="#D97706" strokeWidth="3" strokeLinecap="round">
            {/* Extended index */}
            <line x1={isRight ? "-2" : "2"} y1="-6" x2={isRight ? "-18" : "18"} y2="-8" />
            {/* Curled other fingers */}
            <circle cx="2" cy="0" r="6" fill="#FBBF24" strokeWidth="1.5" />
          </g>
        )}

        {shape === 'pinch' && (
          <g stroke="#D97706" strokeWidth="2" strokeLinecap="round">
            <ellipse cx="0" cy="-8" rx="5" ry="7" fill="#FBBF24" />
            <line x1="-3" y1="-12" x2="3" y2="-12" strokeWidth="3" />
          </g>
        )}
      </g>
    )
  }

  return (
    <div className={cn('relative flex flex-col items-center justify-between rounded-2xl bg-gradient-to-b from-primary-900 via-primary-800 to-primary-950 p-4 overflow-hidden border border-primary-700 shadow-xl', className)}>
      {/* Background Ambience / Subtle Indian Arch Motifs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-center items-start pt-4">
        <svg width="320" height="240" viewBox="0 0 320 240" fill="none">
          <path d="M40 240 V120 C40 60 160 30 160 30 C160 30 280 60 280 120 V240" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Top Banner: Sign Status & Speed */}
      <div className="w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-ping" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            ISL Avatar · {activeSign ? activeSign : 'Neutral Idle'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
            {playbackSpeed}× Speed
          </span>
        </div>
      </div>

      {/* Articulated SVG Avatar */}
      <div className="relative w-full max-w-[340px] aspect-[4/5] flex items-center justify-center my-1 z-10">
        <svg
          viewBox="0 0 360 400"
          className="w-full h-full drop-shadow-2xl"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs for gradients & shadows */}
          <defs>
            <linearGradient id="avatarTorsoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            <linearGradient id="saffronSash" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* ── BASE TORSO & SHOULDERS ────────────────────────────── */}
          <g transform={`translate(0, ${pose.torsoY})`} filter="url(#softGlow)">
            {/* Shoulders / Upper Body */}
            <path
              d="M100 240 C100 185, 140 180, 180 180 C220 180, 260 185, 260 240 L275 360 L85 360 Z"
              fill="url(#avatarTorsoGrad)"
              stroke="#2563EB"
              strokeWidth="2"
            />

            {/* Official Saffron Sash / Badge Accent */}
            <path
              d="M135 182 L150 182 L245 360 L230 360 Z"
              fill="url(#saffronSash)"
              opacity="0.85"
            />

            {/* Collar */}
            <path
              d="M150 180 L180 220 L210 180 Z"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            {/* Tie / ID lanyard */}
            <polygon points="175,220 185,220 188,270 180,285 172,270" fill="#E8761A" />
          </g>

          {/* ── LEFT ARM ──────────────────────────────────────────── */}
          <g stroke="#172554" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
            <polyline
              points={`120,200 ${pose.leftArm.elbowX},${pose.leftArm.elbowY} ${pose.leftArm.wristX},${pose.leftArm.wristY}`}
            />
          </g>
          <g stroke="#FBBF24" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
            <polyline
              points={`120,200 ${pose.leftArm.elbowX},${pose.leftArm.elbowY} ${pose.leftArm.wristX},${pose.leftArm.wristY}`}
            />
          </g>
          {renderHand(pose.leftArm.wristX, pose.leftArm.wristY, pose.leftArm.handShape, false, pose.leftArm.rotation)}

          {/* ── RIGHT ARM ─────────────────────────────────────────── */}
          <g stroke="#172554" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
            <polyline
              points={`240,200 ${pose.rightArm.elbowX},${pose.rightArm.elbowY} ${pose.rightArm.wristX},${pose.rightArm.wristY}`}
            />
          </g>
          <g stroke="#FBBF24" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
            <polyline
              points={`240,200 ${pose.rightArm.elbowX},${pose.rightArm.elbowY} ${pose.rightArm.wristX},${pose.rightArm.wristY}`}
            />
          </g>
          {renderHand(pose.rightArm.wristX, pose.rightArm.wristY, pose.rightArm.handShape, true, pose.rightArm.rotation)}

          {/* ── NECK & HEAD ───────────────────────────────────────── */}
          <g transform={`translate(180, ${120 + pose.headNod}) rotate(${pose.headTilt})`}>
            {/* Neck */}
            <rect x="-14" y="25" width="28" height="35" rx="6" fill="#F59E0B" />

            {/* Head Silhouette */}
            <ellipse cx="0" cy="0" rx="36" ry="44" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />

            {/* Neat Hair */}
            <path
              d="M-38 -15 C-38 -55, 38 -55, 38 -15 C30 -25, -20 -30, -38 -15 Z"
              fill="#1E293B"
            />
            {/* Hair parting side cut */}
            <path d="M-38 -15 C-42 10, -32 20, -34 0 Z" fill="#1E293B" />
            <path d="M38 -15 C42 10, 32 20, 34 0 Z" fill="#1E293B" />

            {/* Eyebrows */}
            <line x1="-24" y1="-12" x2="-8" y2="-13" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="-13" x2="24" y2="-12" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Eyes (Blinking support) */}
            {blink ? (
              <g stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round">
                <line x1="-22" y1="-2" x2="-10" y2="-2" />
                <line x1="10" y1="-2" x2="22" y2="-2" />
              </g>
            ) : (
              <g fill="#1E293B">
                <ellipse cx="-16" cy="-2" rx="4.5" ry="5.5" />
                <ellipse cx="16" cy="-2" rx="4.5" ry="5.5" />
                {/* Catchlight */}
                <circle cx="-14.5" cy="-4" r="1.5" fill="#FFFFFF" />
                <circle cx="17.5" cy="-4" r="1.5" fill="#FFFFFF" />
              </g>
            )}

            {/* Nose */}
            <path d="M-2 6 L1 12 L-4 14" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />

            {/* Pleasant Mouth */}
            <path
              d="M-12 24 Q0 32 12 24"
              fill="none"
              stroke="#B45309"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Indian Tilak / Bindi Accent */}
            <ellipse cx="0" cy="-14" rx="2" ry="3.5" fill="#DC2626" />
          </g>
        </svg>
      </div>

      {/* Bottom Floating Control Ribbon */}
      <div className="w-full flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-2 z-10 border border-white/10 text-white">
        <div className="flex items-center gap-2">
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
              aria-label={isPlaying ? 'Pause Avatar' : 'Play Avatar'}
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>
          )}

          {onReplay && (
            <button
              onClick={onReplay}
              className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white"
              aria-label="Replay Signs"
            >
              <RotateCcw size={15} />
            </button>
          )}

          <div className="text-xs pl-1">
            <span className="text-white/60 block text-[10px] uppercase">Current Sign</span>
            <span className="font-bold text-accent tracking-wide">{activeSign || 'Waiting'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-white/80">
          <Sparkles size={13} className="text-accent" />
          <span className="font-medium text-[11px]">Procedural Vector ISL</span>
        </div>
      </div>
    </div>
  )
}

export default ISLAvatar
