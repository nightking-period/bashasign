import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Play, Pause, RotateCcw, Sparkles, ZoomIn, ZoomOut, Compass, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ISLAvatar3DProps {
  activeSign: string | null
  isPlaying: boolean
  playbackSpeed?: number
  onTogglePlay?: () => void
  onReplay?: () => void
  className?: string
}

export function ISLAvatar3D({
  activeSign,
  isPlaying,
  playbackSpeed = 1.0,
  onTogglePlay,
  onReplay,
  className,
}: ISLAvatar3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1.0)

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const isPlayingRef = useRef(isPlaying)
  const speedRef = useRef(playbackSpeed)
  const signRef = useRef(activeSign)

  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { speedRef.current = playbackSpeed }, [playbackSpeed])
  useEffect(() => { signRef.current = activeSign }, [activeSign])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 360
    const height = container.clientHeight || 440

    // ── 1. Scene, Camera, Renderer ───────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0f1d) // Studio dark blue background

    // Upper body portrait camera framing (ensures head, shoulders, and both hands are fully in frame)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 20)
    camera.position.set(0, 1.22, 1.62)
    camera.lookAt(0, 1.20, 0)
    cameraRef.current = camera


    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // ── 2. Studio Lighting Setup ─────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    // Key Light (warm studio soft light)
    const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.8)
    keyLight.position.set(1.2, 2.4, 1.8)
    keyLight.castShadow = true
    scene.add(keyLight)

    // Fill Light (cool soft fill)
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.8)
    fillLight.position.set(-1.4, 1.8, 1.2)
    scene.add(fillLight)

    // Rim/Back Light (gives soft hair & shoulder rim highlight)
    const rimLight = new THREE.DirectionalLight(0xffb070, 1.5)
    rimLight.position.set(0, 2.0, -1.5)
    scene.add(rimLight)

    // ── 3. Load Realistic Human Female Avatar GLB ───────────────────────────
    const loader = new GLTFLoader()
    const boneMap: Record<string, THREE.Bone> = {}
    const restRotations: Record<string, THREE.Euler> = {}
    let headMesh: THREE.SkinnedMesh | null = null
    let eyeBlinkTargetIdx = -1
    let smileTargetIdx = -1

    let animFrameId: number | null = null
    let time = 0
    let lastNow = performance.now()
    let blinkTimer = 0
    let isBlinking = false

    setLoading(true)
    setLoadError(null)

    loader.load(
      '/models/female_avatar.glb',
      (gltf) => {
        const model = gltf.scene
        model.position.set(0, 0, 0)
        scene.add(model)

        // Traverse model to collect bones & morph targets
        model.traverse((child) => {
          if ((child as THREE.Bone).isBone) {
            const bone = child as THREE.Bone
            boneMap[bone.name] = bone
            restRotations[bone.name] = bone.rotation.clone()
          }

          if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
            child.castShadow = true
            child.receiveShadow = true

            const mesh = child as THREE.SkinnedMesh
            if (mesh.name.toLowerCase().includes('head') && mesh.morphTargetDictionary) {
              headMesh = mesh
              eyeBlinkTargetIdx = mesh.morphTargetDictionary['eyeBlinkLeft'] ?? -1
              smileTargetIdx = mesh.morphTargetDictionary['mouthSmileLeft'] ?? -1
            }
          }
        })

        setLoading(false)

        // Helper to smoothly apply bone offsets relative to rest pose
        const setBoneOffset = (
          boneName: string,
          x = 0,
          y = 0,
          z = 0,
          lerpFactor = 0.15,
        ) => {
          const bone = boneMap[boneName]
          const rest = restRotations[boneName]
          if (!bone || !rest) return

          bone.rotation.x = THREE.MathUtils.lerp(bone.rotation.x, rest.x + x, lerpFactor)
          bone.rotation.y = THREE.MathUtils.lerp(bone.rotation.y, rest.y + y, lerpFactor)
          bone.rotation.z = THREE.MathUtils.lerp(bone.rotation.z, rest.z + z, lerpFactor)
        }

        // Helper to curl/extend all 3 phalanges of a finger
        const setFingerCurl = (
          prefix: string, // e.g. 'RightHandIndex'
          curl: number,   // curl angle in radians (0 = straight, 1.2 = tight curl)
          spread = 0,
          lerpFactor = 0.18,
        ) => {
          // Bone 1 (proximal)
          setBoneOffset(`${prefix}1`, curl * 0.45, 0, spread, lerpFactor)
          // Bone 2 (intermediate)
          setBoneOffset(`${prefix}2`, curl * 0.35, 0, 0, lerpFactor)
          // Bone 3 (distal)
          setBoneOffset(`${prefix}3`, curl * 0.25, 0, 0, lerpFactor)
        }

        // Helper to set all 5 fingers of a hand
        const setHandFingers = (
          isRight: boolean,
          thumb: number,
          index: number,
          middle: number,
          ring: number,
          pinky: number,
          lerpFactor = 0.18,
        ) => {
          const side = isRight ? 'Right' : 'Left'
          const mult = isRight ? 1 : -1

          setFingerCurl(`${side}HandThumb`, thumb, mult * 0.2, lerpFactor)
          setFingerCurl(`${side}HandIndex`, index, mult * 0.05, lerpFactor)
          setFingerCurl(`${side}HandMiddle`, middle, 0, lerpFactor)
          setFingerCurl(`${side}HandRing`, ring, mult * -0.05, lerpFactor)
          setFingerCurl(`${side}HandPinky`, pinky, mult * -0.12, lerpFactor)
        }

        // ── Main 60 FPS Render & Kinematics Loop ─────────────────────────────
        const animate = (now: number) => {
          const dt = (now - lastNow) * 0.001
          lastNow = now

          if (isPlayingRef.current) {
            time += dt * speedRef.current
          }

          // Natural female breathing & spine idle
          const breath = Math.sin(time * 2.2) * 0.015
          setBoneOffset('Spine1', breath * 0.5, 0, 0, 0.1)
          setBoneOffset('Spine2', breath, 0, 0, 0.1)

          // Eye blinking logic
          blinkTimer += dt
          if (blinkTimer > 3.8) {
            isBlinking = true
            if (blinkTimer > 4.0) {
              isBlinking = false
              blinkTimer = 0
            }
          }

          if (headMesh && headMesh.morphTargetInfluences) {
            if (eyeBlinkTargetIdx >= 0) {
              headMesh.morphTargetInfluences[eyeBlinkTargetIdx] = isBlinking ? 1.0 : 0
            }
            if (smileTargetIdx >= 0) {
              headMesh.morphTargetInfluences[smileTargetIdx] = 0.35 // Pleasant resting smile
            }
          }

          const sign = (signRef.current || 'IDLE').toUpperCase()
          const lerp = Math.min(1.0, dt * 10)

          switch (sign) {
            case 'HELLO': {

              const wave = Math.sin(time * 7) * 0.35
              // Right arm raised forward near cheek in friendly greeting wave
              setBoneOffset('Head', 0.05, 0.08, -0.04, lerp)
              setBoneOffset('RightArm', 0.38, 0.75, 0.38, lerp)
              setBoneOffset('RightForeArm', 0, 0.20, 1.25, lerp) // True Z hinge bends elbow forward & up
              setBoneOffset('RightHand', 0, wave, wave * 0.3, lerp)
              // All 5 fingers open in greeting
              setHandFingers(true, 0.1, 0.05, 0.05, 0.05, 0.05, lerp)

              // Left arm at natural rest
              setBoneOffset('LeftArm', 0, 0, 0, lerp)
              setBoneOffset('LeftForeArm', 0, 0, -0.15, lerp)
              setHandFingers(false, 0.3, 0.3, 0.3, 0.3, 0.3, lerp)
              break
            }

            case 'BYE': {
              const wave = Math.sin(time * 6) * 0.4
              setBoneOffset('Head', 0, -0.06, 0.03, lerp)
              setBoneOffset('RightArm', 0.35, 0.70, 0.30, lerp)
              setBoneOffset('RightForeArm', 0, 0.15, 1.20, lerp)
              setBoneOffset('RightHand', 0, wave, wave * 0.35, lerp)
              setHandFingers(true, 0.1, 0.05, 0.05, 0.05, 0.05, lerp)

              setBoneOffset('LeftArm', 0, 0, 0, lerp)
              setBoneOffset('LeftForeArm', 0, 0, -0.15, lerp)
              setHandFingers(false, 0.3, 0.3, 0.3, 0.3, 0.3, lerp)
              break
            }

            case 'SHOW': {
              // Left hand open flat palm forward in front of chest
              setBoneOffset('LeftArm', 0.0, -0.50, 0.0, lerp)
              setBoneOffset('LeftForeArm', 0, -0.20, -1.15, lerp) // Left elbow bends forward
              setBoneOffset('LeftHand', 0.3, 0, -0.2, lerp)
              setHandFingers(false, 0.05, 0.05, 0.05, 0.05, 0.05, lerp)

              // Right hand: ISOLATED EXTENDED INDEX FINGER pointing into open left palm
              const tap = Math.sin(time * 6) * 0.08
              setBoneOffset('RightArm', 0.0, 0.50, 0.0, lerp)
              setBoneOffset('RightForeArm', 0, 0.20, 1.15 + tap, lerp) // Right elbow bends forward
              setBoneOffset('RightHand', 0, 0, 0, lerp)
              // thumb: 1.0, index: 0 (isolated extended!), middle/ring/pinky tight curled
              setHandFingers(true, 1.0, 0.0, 1.35, 1.35, 1.35, lerp)
              break
            }

            case 'PENSION': {
              // Precision pinch rubbing thumb & index together in front of chest
              const rub = Math.sin(time * 8) * 0.15
              setBoneOffset('Head', 0.08, 0, 0, lerp)
              setBoneOffset('RightArm', 0.0, 0.50, 0.0, lerp)
              setBoneOffset('RightForeArm', 0, 0.20, 1.20, lerp)
              setBoneOffset('RightHand', 0.1, 0, 0, lerp)

              // Isolated thumb & index pinch rub, middle/ring/pinky curled
              setFingerCurl('RightHandThumb', 0.7 + rub, 0.3, lerp)
              setFingerCurl('RightHandIndex', 0.8 - rub, 0, lerp)
              setFingerCurl('RightHandMiddle', 1.2, 0, lerp)
              setFingerCurl('RightHandRing', 1.3, 0, lerp)
              setFingerCurl('RightHandPinky', 1.3, 0, lerp)

              setBoneOffset('LeftArm', 0, 0, 0, lerp)
              setBoneOffset('LeftForeArm', 0, 0, -0.15, lerp)
              setHandFingers(false, 0.3, 0.3, 0.3, 0.3, 0.3, lerp)
              break
            }

            case 'AADHAAR':
            case 'CARD': {
              // Both hands forward forming L-shape rectangle card frame in front of chest
              const trace = Math.sin(time * 4) * 0.06
              setBoneOffset('Head', 0.06, 0, 0, lerp)

              // Right hand L-frame
              setBoneOffset('RightArm', 0.0, 0.50, 0.10 + trace, lerp)
              setBoneOffset('RightForeArm', 0, 0.15, 1.15, lerp)
              setBoneOffset('RightHand', 0.1, 0, 0, lerp)
              setFingerCurl('RightHandThumb', 0.1, 0.5, lerp) // Spread thumb
              setFingerCurl('RightHandIndex', 0.05, 0, lerp)  // Straight index
              setFingerCurl('RightHandMiddle', 1.3, 0, lerp)  // Curled
              setFingerCurl('RightHandRing', 1.3, 0, lerp)    // Curled
              setFingerCurl('RightHandPinky', 1.3, 0, lerp)   // Curled

              // Left hand L-frame
              setBoneOffset('LeftArm', 0.0, -0.50, -0.10 - trace, lerp)
              setBoneOffset('LeftForeArm', 0, -0.15, -1.15, lerp)
              setBoneOffset('LeftHand', 0.1, 0, 0, lerp)
              setFingerCurl('LeftHandThumb', 0.1, -0.5, lerp) // Spread thumb
              setFingerCurl('LeftHandIndex', 0.05, 0, lerp)   // Straight index
              setFingerCurl('LeftHandMiddle', 1.3, 0, lerp)   // Curled
              setFingerCurl('LeftHandRing', 1.3, 0, lerp)     // Curled
              setFingerCurl('LeftHandPinky', 1.3, 0, lerp)    // Curled
              break
            }

            case 'THANK_YOU': {
              // Flat hand moves from chin forward toward viewer with respectful nod
              const cycle = (Math.sin(time * 3) + 1) / 2
              setBoneOffset('Head', 0.08 + cycle * 0.14, 0, 0, lerp)
              setBoneOffset('RightArm', 0.20 + cycle * 0.15, 0.60, 0.10, lerp)
              setBoneOffset('RightForeArm', 0, 0.15, 1.35 - cycle * 0.4, lerp)
              setBoneOffset('RightHand', 0.1, 0, 0, lerp)
              setHandFingers(true, 0.1, 0.05, 0.05, 0.05, 0.05, lerp)

              setBoneOffset('LeftArm', 0, 0, 0, lerp)
              setBoneOffset('LeftForeArm', 0, 0, -0.15, lerp)
              setHandFingers(false, 0.3, 0.3, 0.3, 0.3, 0.3, lerp)
              break
            }

            case 'SORRY': {
              // Closed fist rubbing circular motion over chest
              const cx = Math.cos(time * 5) * 0.08
              const cy = Math.sin(time * 5) * 0.08
              setBoneOffset('Head', 0.05, 0.12, 0.1, lerp)
              setBoneOffset('RightArm', 0.10 + cx, 0.55, 0.05, lerp)
              setBoneOffset('RightForeArm', 0, 0.20, 1.25 + cy, lerp)
              setBoneOffset('RightHand', 0.1, 0, 0, lerp)
              setHandFingers(true, 1.2, 1.3, 1.3, 1.3, 1.3, lerp)

              setBoneOffset('LeftArm', 0, 0, 0, lerp)
              setBoneOffset('LeftForeArm', 0, 0, -0.15, lerp)
              setHandFingers(false, 0.3, 0.3, 0.3, 0.3, 0.3, lerp)
              break
            }

            case 'WAIT':
            case 'PLEASE_WAIT': {
              // Open palm facing forward toward citizen, steady
              setBoneOffset('Head', 0, 0, 0, lerp)
              setBoneOffset('RightArm', 0.15, 0.55, 0.20, lerp)
              setBoneOffset('RightForeArm', 0, 0.15, 1.15, lerp)
              setBoneOffset('RightHand', -0.5, 0, 0, lerp) // Palm pushed outward
              setHandFingers(true, 0.1, 0.05, 0.05, 0.05, 0.05, lerp)

              setBoneOffset('LeftArm', 0, 0, 0, lerp)
              setBoneOffset('LeftForeArm', 0, 0, -0.15, lerp)
              setHandFingers(false, 0.3, 0.3, 0.3, 0.3, 0.3, lerp)
              break
            }

            case 'BRING': {
              // Both arms pulling inward toward body
              const pull = (Math.sin(time * 3.5) + 1) / 2
              setBoneOffset('Head', 0.05, 0, 0, lerp)
              setBoneOffset('RightArm', 0.10 - pull * 0.15, 0.50, 0.10, lerp)
              setBoneOffset('RightForeArm', 0, 0.15, 0.95 + pull * 0.35, lerp)
              setBoneOffset('RightHand', -0.1 + pull * 0.2, 0, 0, lerp)
              setHandFingers(true, 0.2 + pull * 0.4, 0.2 + pull * 0.4, 0.2 + pull * 0.4, 0.2 + pull * 0.4, 0.2 + pull * 0.4, lerp)

              setBoneOffset('LeftArm', 0.10 - pull * 0.15, -0.50, -0.10, lerp)
              setBoneOffset('LeftForeArm', 0, -0.15, -0.95 - pull * 0.35, lerp)
              setBoneOffset('LeftHand', -0.1 + pull * 0.2, 0, 0, lerp)
              setHandFingers(false, 0.2 + pull * 0.4, 0.2 + pull * 0.4, 0.2 + pull * 0.4, 0.2 + pull * 0.4, 0.2 + pull * 0.4, lerp)
              break
            }

            default:
              // Relaxed natural female resting pose with subtle natural forward elbow curvature
              setBoneOffset('Head', Math.sin(time * 1.5) * 0.015, 0, 0, lerp)
              setBoneOffset('RightArm', 0, 0, 0, lerp)
              setBoneOffset('RightForeArm', 0, 0, 0.15, lerp)
              setBoneOffset('RightHand', 0, 0, 0, lerp)
              setHandFingers(true, 0.25, 0.3, 0.3, 0.3, 0.3, lerp)

              setBoneOffset('LeftArm', 0, 0, 0, lerp)
              setBoneOffset('LeftForeArm', 0, 0, -0.15, lerp)
              setBoneOffset('LeftHand', 0, 0, 0, lerp)
              setHandFingers(false, 0.25, 0.3, 0.3, 0.3, 0.3, lerp)
              break
          }


          renderer.render(scene, camera)
          animFrameId = requestAnimationFrame(animate)
        }

        animFrameId = requestAnimationFrame(animate)
      },
      undefined,
      (err) => {
        console.error('Failed to load 3D female avatar:', err)
        setLoading(false)
        setLoadError('Could not load 3D female avatar model.')
      },
    )

    // Interactive mouse rotation for inspecting 3D model
    let isDragging = false
    let prevMouseX = 0
    let rotY = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      prevMouseX = e.clientX
      rotY += deltaX * 0.008
      rotY = Math.max(-0.8, Math.min(0.8, rotY))
      scene.rotation.y = rotY
    }
    const onMouseUp = () => { isDragging = false }

    const domEl = renderer.domElement
    domEl.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId)
      domEl.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      container.innerHTML = ''
    }
  }, [])

  // Camera zoom controls
  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return
    const newZ = Math.max(1.0, Math.min(2.2, cameraRef.current.position.z + delta))
    cameraRef.current.position.z = newZ
    setZoomLevel(parseFloat((1.62 / newZ).toFixed(1)))
  }

  const handleResetCamera = () => {
    if (!cameraRef.current) return
    cameraRef.current.position.set(0, 1.22, 1.62)
    cameraRef.current.lookAt(0, 1.20, 0)
    setZoomLevel(1.0)
  }


  return (
    <div className={cn('relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col', className)}>
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className="w-full aspect-[4/4.8] min-h-[380px] cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 text-white">
          <Loader2 size={36} className="animate-spin text-accent" />
          <p className="text-sm font-medium">Loading Realistic 3D Female Avatar...</p>
        </div>
      )}

      {/* Load Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 z-20 text-white p-6 text-center">
          <p className="text-sm text-error font-semibold">{loadError}</p>
          <p className="text-xs text-slate-400">Please refresh the page to reload the 3D model.</p>
        </div>
      )}

      {/* Top Floating Controls Ribbon */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 pointer-events-auto shadow-md">
          <span className="flex h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            3D Human Female · {activeSign ? activeSign : 'Idle'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/60 pointer-events-auto text-white text-xs">
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <span className="font-mono text-[11px] px-1">{zoomLevel}×</span>
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1 hover:bg-white/10 rounded transition-colors text-accent"
            title="Reset View"
            aria-label="Reset Camera"
          >
            <Compass size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Floating Sign & Playback Ribbon */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 text-white z-10">
        <div className="flex items-center gap-2">
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-lg bg-accent text-white hover:bg-accent-dark flex items-center justify-center shadow transition-colors"
              aria-label={isPlaying ? 'Pause 3D Avatar' : 'Play 3D Avatar'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
          {onReplay && (
            <button
              onClick={onReplay}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Replay 3D Gesture"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <div className="text-xs pl-1">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Sign</span>
            <span className="font-bold text-accent tracking-wide">{activeSign || 'Resting'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <Sparkles size={13} className="text-accent" />
          <span className="font-medium text-[11px]">Mixamo 5-Finger Humanoid Rig</span>
        </div>
      </div>
    </div>
  )
}

export default ISLAvatar3D
