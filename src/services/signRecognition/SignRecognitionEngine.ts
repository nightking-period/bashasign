// SignRecognitionEngine — Real Trained ML Model + Demo Fallback
// Phase 2: Trained custom MLP model weights (model_v1) loaded for real landmark inference.

import type { RecognitionResult } from '@/types'
import modelPackage from '@/models/sign_classifier_v1/model_weights.json'

export type RecognitionStatus =
  | 'idle'
  | 'requesting_permission'
  | 'permission_denied'
  | 'camera_unavailable'
  | 'loading_model'
  | 'ready'
  | 'detecting'
  | 'no_hand'
  | 'processing'
  | 'result'
  | 'low_confidence'
  | 'error'

export interface ModelPrediction {
  label: string
  confidence: number
  probabilities: Record<string, number>
}

export class TrainedSignClassifierProvider {
  private classes: string[]
  private W1: number[][]
  private b1: number[]
  private W2: number[][]
  private b2: number[]
  private W3: number[][]
  private b3: number[]
  private h1Dim: number
  private h2Dim: number
  private outDim: number
  private inDim: number

  constructor() {
    this.classes = modelPackage.classes
    this.inDim = modelPackage.architecture.inputDim
    this.h1Dim = modelPackage.architecture.hidden1Dim
    this.h2Dim = modelPackage.architecture.hidden2Dim
    this.outDim = modelPackage.architecture.outputDim

    this.W1 = modelPackage.weights.W1
    this.b1 = modelPackage.weights.b1
    this.W2 = modelPackage.weights.W2
    this.b2 = modelPackage.weights.b2
    this.W3 = modelPackage.weights.W3
    this.b3 = modelPackage.weights.b3
  }

  getMetadata() {
    return {
      version: modelPackage.modelVersion,
      trainedAt: modelPackage.trainedAt,
      classes: this.classes,
      metrics: modelPackage.metrics,
    }
  }

  predict(features: number[]): ModelPrediction {
    if (!features || features.length !== this.inDim) {
      return {
        label: 'UNKNOWN',
        confidence: 0,
        probabilities: {},
      }
    }

    // Layer 1
    const a1 = new Float32Array(this.h1Dim)
    for (let j = 0; j < this.h1Dim; j++) {
      let sum = this.b1[j]
      for (let i = 0; i < this.inDim; i++) {
        sum += features[i] * this.W1[i][j]
      }
      a1[j] = Math.max(0, sum) // ReLU
    }

    // Layer 2
    const a2 = new Float32Array(this.h2Dim)
    for (let j = 0; j < this.h2Dim; j++) {
      let sum = this.b2[j]
      for (let i = 0; i < this.h1Dim; i++) {
        sum += a1[i] * this.W2[i][j]
      }
      a2[j] = Math.max(0, sum) // ReLU
    }

    // Layer 3 (logits)
    const logits = new Float32Array(this.outDim)
    for (let j = 0; j < this.outDim; j++) {
      let sum = this.b3[j]
      for (let i = 0; i < this.h2Dim; i++) {
        sum += a2[i] * this.W3[i][j]
      }
      logits[j] = sum
    }

    // Softmax
    let maxL = -Infinity
    for (let j = 0; j < this.outDim; j++) {
      if (logits[j] > maxL) maxL = logits[j]
    }

    let expSum = 0
    const exp = new Float32Array(this.outDim)
    for (let j = 0; j < this.outDim; j++) {
      exp[j] = Math.exp(logits[j] - maxL)
      expSum += exp[j]
    }

    let maxProb = -1
    let bestIdx = 0
    const probabilities: Record<string, number> = {}

    for (let j = 0; j < this.outDim; j++) {
      const p = exp[j] / expSum
      const lbl = this.classes[j]
      probabilities[lbl] = parseFloat(p.toFixed(4))
      if (p > maxProb) {
        maxProb = p
        bestIdx = j
      }
    }

    return {
      label: this.classes[bestIdx],
      confidence: parseFloat(maxProb.toFixed(4)),
      probabilities,
    }
  }

  predictSequence(framesFeatures: number[][]): RecognitionResult {
    if (!framesFeatures || framesFeatures.length === 0) {
      return {
        conceptSequence: ['UNKNOWN'],
        rawLabels: ['UNKNOWN'],
        confidence: 0,
        timestamp: Date.now(),
        source: 'mlp',
        isMock: false,
      }
    }

    // Average predictions across active frames
    const votes: Record<string, number> = {}
    let validFrames = 0

    for (const feats of framesFeatures) {
      const pred = this.predict(feats)
      if (pred.label !== 'IDLE' && pred.label !== 'UNKNOWN') {
        votes[pred.label] = (votes[pred.label] || 0) + pred.confidence
        validFrames += 1
      }
    }

    // Pick dominant sign concept
    let bestConcept = 'UNKNOWN'
    let bestScore = 0

    for (const [concept, score] of Object.entries(votes)) {
      if (score > bestScore) {
        bestScore = score
        bestConcept = concept
      }
    }

    const conf = validFrames > 0 ? Math.min(1.0, bestScore / validFrames) : 0

    return {
      conceptSequence: bestConcept !== 'UNKNOWN' ? [bestConcept] : [],
      rawLabels: [bestConcept],
      confidence: parseFloat(conf.toFixed(4)),
      timestamp: Date.now(),
      source: 'mlp',
      isMock: false,
    }
  }
}

export const trainedClassifier = new TrainedSignClassifierProvider()

// Demo sign sequences for mock fallback
const DEMO_RESULTS: RecognitionResult[] = [
  {
    conceptSequence: ['PENSION', 'RECEIVED'],
    rawLabels: ['PENSION', 'RECEIVED'],
    confidence: 0.92,
    timestamp: Date.now(),
    source: 'mock',
    isMock: true,
  },
  {
    conceptSequence: ['AADHAAR', 'BRING'],
    rawLabels: ['AADHAAR', 'BRING'],
    confidence: 0.87,
    timestamp: Date.now(),
    source: 'mock',
    isMock: true,
  },
  {
    conceptSequence: ['DOCUMENT', 'GIVE'],
    rawLabels: ['DOCUMENT', 'GIVE'],
    confidence: 0.84,
    timestamp: Date.now(),
    source: 'mock',
    isMock: true,
  },
  {
    conceptSequence: ['CARD', 'SHOW'],
    rawLabels: ['CARD', 'SHOW'],
    confidence: 0.88,
    timestamp: Date.now(),
    source: 'mock',
    isMock: true,
  },
]

export class MockSignRecognitionProvider {
  private resultIndex = 0

  async getDemoResult(): Promise<RecognitionResult> {
    await new Promise((r) => setTimeout(r, 1200))
    const result = {
      ...DEMO_RESULTS[this.resultIndex % DEMO_RESULTS.length],
      timestamp: Date.now(),
    }
    this.resultIndex++
    return result
  }
}

export const mockRecognitionProvider = new MockSignRecognitionProvider()