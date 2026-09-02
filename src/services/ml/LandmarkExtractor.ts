// LandmarkExtractor — Normalization & Preprocessing for MediaPipe Hand Keypoints
// 21 3D landmarks × 2 hands = 126 features per frame.
// Applied identically during dataset preprocessing and real-time live inference.

export interface RawPoint3D {
  x: number
  y: number
  z: number
}

export interface HandLandmarks {
  landmarks: RawPoint3D[] // 21 landmarks
  handedness: 'Left' | 'Right'
  score?: number
}

export interface FrameFeatures {
  frameIndex: number
  timestamp: number
  features: number[] // 126 normalized floats
  handsDetected: number
  qualityWarnings: string[]
}

// Landmark connectivity pairs for 21-point hand skeleton
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17],
]

/**
 * Normalizes a single hand's 21 keypoints:
 * 1. Center at wrist (idx 0 -> 0,0,0)
 * 2. Scale by Euclidean distance from wrist (0) to middle finger MCP (9)
 */
export function normalizeSingleHand(points: RawPoint3D[]): number[] {
  if (!points || points.length < 21) {
    return new Array(63).fill(0)
  }

  const wrist = points[0]
  const mcpMiddle = points[9]

  // Euclidean scale distance
  const dx = mcpMiddle.x - wrist.x
  const dy = mcpMiddle.y - wrist.y
  const dz = mcpMiddle.z - wrist.z
  const rawScale = Math.sqrt(dx * dx + dy * dy + dz * dz)
  const scale = rawScale > 1e-5 ? rawScale : 1.0

  const normalized: number[] = []
  for (let i = 0; i < 21; i++) {
    const pt = points[i]
    normalized.push(
      (pt.x - wrist.x) / scale,
      (pt.y - wrist.y) / scale,
      (pt.z - wrist.z) / scale,
    )
  }
  return normalized
}

/**
 * Normalizes up to two hands into a 126-dimensional feature vector.
 * Hand 0: Right / Dominant (features 0..62)
 * Hand 1: Left / Non-Dominant (features 63..125)
 * If a hand is missing, it is filled with 63 zeros.
 */
export function normalizeDualHands(
  hands: HandLandmarks[],
  frameIndex = 0,
): FrameFeatures {
  const warnings: string[] = []

  let rightHand: HandLandmarks | undefined
  let leftHand: HandLandmarks | undefined

  for (const h of hands) {
    if (h.handedness === 'Right' && !rightHand) {
      rightHand = h
    } else if (h.handedness === 'Left' && !leftHand) {
      leftHand = h
    }
  }

  // If handedness is unspecified or ambiguous, assign by order
  if (!rightHand && hands[0]) rightHand = hands[0]
  if (!leftHand && hands[1]) leftHand = hands[1]

  const rightFeatures = rightHand ? normalizeSingleHand(rightHand.landmarks) : new Array(63).fill(0)
  const leftFeatures = leftHand ? normalizeSingleHand(leftHand.landmarks) : new Array(63).fill(0)

  // Quality checks
  if (hands.length === 0) {
    warnings.push('no_hands_detected')
  }

  for (const h of hands) {
    for (const pt of h.landmarks) {
      if (pt.x < 0.05 || pt.x > 0.95 || pt.y < 0.05 || pt.y > 0.95) {
        if (!warnings.includes('hand_clipped_at_edge')) {
          warnings.push('hand_clipped_at_edge')
        }
        break
      }
    }
  }

  return {
    frameIndex,
    timestamp: Date.now(),
    features: [...rightFeatures, ...leftFeatures],
    handsDetected: hands.length,
    qualityWarnings: warnings,
  }
}

/**
 * Draws the hand skeleton overlay onto an HTML canvas.
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  hands: HandLandmarks[],
  width: number,
  height: number,
) {
  ctx.save()

  for (const h of hands) {
    const isRight = h.handedness === 'Right'
    const jointColor = isRight ? '#E8761A' : '#1B7A6E' // saffron for right, teal for left
    const lineColor = isRight ? 'rgba(232, 118, 26, 0.7)' : 'rgba(27, 122, 110, 0.7)'

    // Draw connections
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2.5
    for (const [i, j] of HAND_CONNECTIONS) {
      const p1 = h.landmarks[i]
      const p2 = h.landmarks[j]
      if (!p1 || !p2) continue

      ctx.beginPath()
      ctx.moveTo(p1.x * width, p1.y * height)
      ctx.lineTo(p2.x * width, p2.y * height)
      ctx.stroke()
    }

    // Draw landmarks
    for (let i = 0; i < h.landmarks.length; i++) {
      const p = h.landmarks[i]
      if (!p) continue

      ctx.fillStyle = i === 0 ? '#FFFFFF' : jointColor // wrist is white
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1.5

      ctx.beginPath()
      ctx.arc(p.x * width, p.y * height, i === 0 ? 5 : 3.5, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }
  }

  ctx.restore()
}
