import * as fs from 'fs'
import * as path from 'path'

interface FrameData {
  frameIndex: number
  timestamp: number
  features: number[]
}

interface LandmarkFile {
  sampleId: string
  concept: string
  frames: FrameData[]
}

interface DatasetSplit {
  trainX: number[][]
  trainY: number[]
  testX: number[][]
  testY: number[]
  classes: string[]
  samplesPerClass: Record<string, { train: number; test: number }>
}

// ── 1. Load and Split Dataset ──────────────────────────────────────────────────

function loadAndSplitDataset(landmarksDir: string): DatasetSplit {
  const files = fs.readdirSync(landmarksDir).filter((f) => f.endsWith('.json'))
  console.log(`Found ${files.length} landmark JSON files in ${landmarksDir}`)

  const conceptSamplesMap: Record<string, LandmarkFile[]> = {}

  for (const file of files) {
    const raw = fs.readFileSync(path.join(landmarksDir, file), 'utf-8')
    const parsed: LandmarkFile = JSON.parse(raw)
    if (!conceptSamplesMap[parsed.concept]) {
      conceptSamplesMap[parsed.concept] = []
    }
    conceptSamplesMap[parsed.concept].push(parsed)
  }

  const rawClasses = Object.keys(conceptSamplesMap).sort()
  console.log(`Loaded ${rawClasses.length} unique concepts: ${rawClasses.join(', ')}`)

  // Add system classes IDLE and UNKNOWN
  const classes = [...rawClasses, 'IDLE', 'UNKNOWN']
  const classToIndex = new Map(classes.map((c, i) => [c, i]))

  const trainX: number[][] = []
  const trainY: number[] = []
  const testX: number[][] = []
  const testY: number[] = []

  const samplesPerClass: Record<string, { train: number; test: number }> = {}

  for (const concept of rawClasses) {
    const samples = conceptSamplesMap[concept]
    const classIdx = classToIndex.get(concept)!

    // Hold out 1 whole recording session for test/validation (no frame leakage)
    const testSampleCount = 1
    const trainSampleCount = samples.length - testSampleCount

    samplesPerClass[concept] = { train: trainSampleCount, test: testSampleCount }

    const trainSamples = samples.slice(0, trainSampleCount)
    const testSamples = samples.slice(trainSampleCount)

    // Extract frames for train (only frames where hands were detected)
    for (const sample of trainSamples) {
      for (const f of sample.frames) {
        const hasHand = f.features && f.features.some((val) => Math.abs(val) > 1e-4)
        if (f.features && f.features.length === 126 && hasHand) {
          trainX.push(f.features)
          trainY.push(classIdx)
        }
      }
    }

    // Extract frames for test (only frames where hands were detected)
    for (const sample of testSamples) {
      for (const f of sample.frames) {
        const hasHand = f.features && f.features.some((val) => Math.abs(val) > 1e-4)
        if (f.features && f.features.length === 126 && hasHand) {
          testX.push(f.features)
          testY.push(classIdx)
        }
      }
    }

  }

  // Generate synthetic baseline IDLE samples (zeros / hands resting)
  const idleIdx = classToIndex.get('IDLE')!
  samplesPerClass['IDLE'] = { train: 1, test: 1 }
  for (let i = 0; i < 150; i++) {
    // Zero-vector with slight sensor noise
    const idleFeat = new Array(126).fill(0).map(() => (Math.random() - 0.5) * 0.01)
    if (i < 100) {
      trainX.push(idleFeat)
      trainY.push(idleIdx)
    } else {
      testX.push(idleFeat)
      testY.push(idleIdx)
    }
  }

  // Generate synthetic baseline UNKNOWN / noise samples (random uncoordinated positions)
  const unknownIdx = classToIndex.get('UNKNOWN')!
  samplesPerClass['UNKNOWN'] = { train: 1, test: 1 }
  for (let i = 0; i < 150; i++) {
    const randFeat = new Array(126).fill(0).map(() => (Math.random() - 0.5) * 2.0)
    if (i < 100) {
      trainX.push(randFeat)
      trainY.push(unknownIdx)
    } else {
      testX.push(randFeat)
      testY.push(unknownIdx)
    }
  }

  console.log(`Dataset Split Summary:`)
  console.log(`  • Training frames:   ${trainX.length}`)
  console.log(`  • Testing frames:    ${testX.length}`)
  console.log(`  • Total feature dim: ${trainX[0]?.length ?? 126}`)

  return { trainX, trainY, testX, testY, classes, samplesPerClass }
}

// ── 2. Multi-Layer Perceptron (Dense 128 -> ReLU -> Dense 64 -> ReLU -> Dense K -> Softmax)

class MLPClassifier {
  inDim: number
  h1Dim: number
  h2Dim: number
  outDim: number

  W1: number[][]
  b1: number[]
  W2: number[][]
  b2: number[]
  W3: number[][]
  b3: number[]

  // Adam optimizer velocity & momentum
  mW1: number[][]
  vW1: number[][]
  mb1: number[]
  vb1: number[]
  mW2: number[][]
  vW2: number[][]
  mb2: number[]
  vb2: number[]
  mW3: number[][]
  vW3: number[][]
  mb3: number[]
  vb3: number[]

  t = 0

  constructor(inDim: number, h1Dim: number, h2Dim: number, outDim: number) {
    this.inDim = inDim
    this.h1Dim = h1Dim
    this.h2Dim = h2Dim
    this.outDim = outDim

    // He initialization: std = sqrt(2 / fan_in)
    this.W1 = this.initWeights(inDim, h1Dim, Math.sqrt(2 / inDim))
    this.b1 = new Array(h1Dim).fill(0)
    this.W2 = this.initWeights(h1Dim, h2Dim, Math.sqrt(2 / h1Dim))
    this.b2 = new Array(h2Dim).fill(0)
    this.W3 = this.initWeights(h2Dim, outDim, Math.sqrt(2 / h2Dim))
    this.b3 = new Array(outDim).fill(0)

    this.mW1 = this.initZeros(inDim, h1Dim)
    this.vW1 = this.initZeros(inDim, h1Dim)
    this.mb1 = new Array(h1Dim).fill(0)
    this.vb1 = new Array(h1Dim).fill(0)

    this.mW2 = this.initZeros(h1Dim, h2Dim)
    this.vW2 = this.initZeros(h1Dim, h2Dim)
    this.mb2 = new Array(h2Dim).fill(0)
    this.vb2 = new Array(h2Dim).fill(0)

    this.mW3 = this.initZeros(h2Dim, outDim)
    this.vW3 = this.initZeros(h2Dim, outDim)
    this.mb3 = new Array(outDim).fill(0)
    this.vb3 = new Array(outDim).fill(0)
  }

  private initWeights(rows: number, cols: number, std: number): number[][] {
    const mat: number[][] = []
    for (let i = 0; i < rows; i++) {
      const row: number[] = []
      for (let j = 0; j < cols; j++) {
        // Box-Muller normal distribution
        const u1 = Math.max(1e-10, Math.random())
        const u2 = Math.random()
        const norm = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        row.push(norm * std)
      }
      mat.push(row)
    }
    return mat
  }

  private initZeros(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => new Array(cols).fill(0))
  }

  // Forward pass
  predictProbs(x: number[]): number[] {
    // Layer 1
    const a1: number[] = new Array(this.h1Dim).fill(0)
    for (let j = 0; j < this.h1Dim; j++) {
      let sum = this.b1[j]
      for (let i = 0; i < this.inDim; i++) {
        sum += x[i] * this.W1[i][j]
      }
      a1[j] = Math.max(0, sum) // ReLU
    }

    // Layer 2
    const a2: number[] = new Array(this.h2Dim).fill(0)
    for (let j = 0; j < this.h2Dim; j++) {
      let sum = this.b2[j]
      for (let i = 0; i < this.h1Dim; i++) {
        sum += a1[i] * this.W2[i][j]
      }
      a2[j] = Math.max(0, sum) // ReLU
    }

    // Layer 3 (logits)
    const logits: number[] = new Array(this.outDim).fill(0)
    for (let j = 0; j < this.outDim; j++) {
      let sum = this.b3[j]
      for (let i = 0; i < this.h2Dim; i++) {
        sum += a2[i] * this.W3[i][j]
      }
      logits[j] = sum
    }

    // Softmax
    const maxLogit = Math.max(...logits)
    const exp = logits.map((v) => Math.exp(v - maxLogit))
    const expSum = exp.reduce((a, b) => a + b, 0)
    return exp.map((e) => e / expSum)
  }

  // Forward and backward step on batch
  trainBatch(
    batchX: number[][],
    batchY: number[],
    lr = 0.003,
    beta1 = 0.9,
    beta2 = 0.999,
    eps = 1e-8,
  ): number {
    this.t += 1
    const N = batchX.length
    let totalLoss = 0

    const gradW1 = this.initZeros(this.inDim, this.h1Dim)
    const gradB1 = new Array(this.h1Dim).fill(0)
    const gradW2 = this.initZeros(this.h1Dim, this.h2Dim)
    const gradB2 = new Array(this.h2Dim).fill(0)
    const gradW3 = this.initZeros(this.h2Dim, this.outDim)
    const gradB3 = new Array(this.outDim).fill(0)

    for (let n = 0; n < N; n++) {
      const x = batchX[n]
      const yTrue = batchY[n]

      // Forward
      const z1 = new Array(this.h1Dim)
      const a1 = new Array(this.h1Dim)
      for (let j = 0; j < this.h1Dim; j++) {
        let sum = this.b1[j]
        for (let i = 0; i < this.inDim; i++) sum += x[i] * this.W1[i][j]
        z1[j] = sum
        a1[j] = Math.max(0, sum)
      }

      const z2 = new Array(this.h2Dim)
      const a2 = new Array(this.h2Dim)
      for (let j = 0; j < this.h2Dim; j++) {
        let sum = this.b2[j]
        for (let i = 0; i < this.h1Dim; i++) sum += a1[i] * this.W2[i][j]
        z2[j] = sum
        a2[j] = Math.max(0, sum)
      }

      const logits = new Array(this.outDim)
      for (let j = 0; j < this.outDim; j++) {
        let sum = this.b3[j]
        for (let i = 0; i < this.h2Dim; i++) sum += a2[i] * this.W3[i][j]
        logits[j] = sum
      }

      const maxL = Math.max(...logits)
      const exp = logits.map((v) => Math.exp(v - maxL))
      const expSum = exp.reduce((a, b) => a + b, 0)
      const probs = exp.map((e) => e / expSum)

      // Loss: -log(p_y)
      const probTrue = Math.max(probs[yTrue], 1e-12)
      totalLoss += -Math.log(probTrue)

      // Backward pass: dLoss/dLogits = probs - one_hot
      const dLogits = [...probs]
      dLogits[yTrue] -= 1

      // Gradients for Layer 3
      for (let j = 0; j < this.outDim; j++) {
        const dL = dLogits[j]
        gradB3[j] += dL
        for (let i = 0; i < this.h2Dim; i++) {
          gradW3[i][j] += a2[i] * dL
        }
      }

      // Backprop to Layer 2
      const da2 = new Array(this.h2Dim).fill(0)
      for (let i = 0; i < this.h2Dim; i++) {
        let sum = 0
        for (let j = 0; j < this.outDim; j++) {
          sum += dLogits[j] * this.W3[i][j]
        }
        da2[i] = sum
      }

      // ReLU derivative
      const dz2 = da2.map((da, i) => (z2[i] > 0 ? da : 0))
      for (let j = 0; j < this.h2Dim; j++) {
        const dL = dz2[j]
        gradB2[j] += dL
        for (let i = 0; i < this.h1Dim; i++) {
          gradW2[i][j] += a1[i] * dL
        }
      }

      // Backprop to Layer 1
      const da1 = new Array(this.h1Dim).fill(0)
      for (let i = 0; i < this.h1Dim; i++) {
        let sum = 0
        for (let j = 0; j < this.h2Dim; j++) {
          sum += dz2[j] * this.W2[i][j]
        }
        da1[i] = sum
      }

      const dz1 = da1.map((da, i) => (z1[i] > 0 ? da : 0))
      for (let j = 0; j < this.h1Dim; j++) {
        const dL = dz1[j]
        gradB1[j] += dL
        for (let i = 0; i < this.inDim; i++) {
          gradW1[i][j] += x[i] * dL
        }
      }
    }

    // Normalize gradients by batch size & apply Adam
    this.adamStep(this.W1, gradW1, this.mW1, this.vW1, N, lr, beta1, beta2, eps)
    this.adamStepVector(this.b1, gradB1, this.mb1, this.vb1, N, lr, beta1, beta2, eps)

    this.adamStep(this.W2, gradW2, this.mW2, this.vW2, N, lr, beta1, beta2, eps)
    this.adamStepVector(this.b2, gradB2, this.mb2, this.vb2, N, lr, beta1, beta2, eps)

    this.adamStep(this.W3, gradW3, this.mW3, this.vW3, N, lr, beta1, beta2, eps)
    this.adamStepVector(this.b3, gradB3, this.mb3, this.vb3, N, lr, beta1, beta2, eps)

    return totalLoss / N
  }

  private adamStep(
    W: number[][],
    grad: number[][],
    m: number[][],
    v: number[][],
    N: number,
    lr: number,
    beta1: number,
    beta2: number,
    eps: number,
  ) {
    const corr1 = 1 - Math.pow(beta1, this.t)
    const corr2 = 1 - Math.pow(beta2, this.t)

    for (let i = 0; i < W.length; i++) {
      for (let j = 0; j < W[0].length; j++) {
        const g = grad[i][j] / N
        m[i][j] = beta1 * m[i][j] + (1 - beta1) * g
        v[i][j] = beta2 * v[i][j] + (1 - beta2) * g * g
        const mHat = m[i][j] / corr1
        const vHat = v[i][j] / corr2
        W[i][j] -= (lr * mHat) / (Math.sqrt(vHat) + eps)
      }
    }
  }

  private adamStepVector(
    b: number[],
    grad: number[],
    m: number[],
    v: number[],
    N: number,
    lr: number,
    beta1: number,
    beta2: number,
    eps: number,
  ) {
    const corr1 = 1 - Math.pow(beta1, this.t)
    const corr2 = 1 - Math.pow(beta2, this.t)

    for (let j = 0; j < b.length; j++) {
      const g = grad[j] / N
      m[j] = beta1 * m[j] + (1 - beta1) * g
      v[j] = beta2 * v[j] + (1 - beta2) * g * g
      const mHat = m[j] / corr1
      const vHat = v[j] / corr2
      b[j] -= (lr * mHat) / (Math.sqrt(vHat) + eps)
    }
  }
}

// ── 3. Evaluation & Metrics Calculation ────────────────────────────────────────

interface ClassMetrics {
  precision: number
  recall: number
  f1: number
  support: number
}

interface EvaluationResult {
  overallAccuracy: number
  perClass: Record<string, ClassMetrics>
  confusionMatrix: number[][]
  classes: string[]
  totalSamples: number
}

function evaluateModel(
  model: MLPClassifier,
  X: number[][],
  yTrue: number[],
  classes: string[],
): EvaluationResult {
  const K = classes.length
  const matrix: number[][] = Array.from({ length: K }, () => new Array(K).fill(0))

  let correct = 0
  for (let i = 0; i < X.length; i++) {
    const probs = model.predictProbs(X[i])
    let maxP = -1
    let pred = 0
    for (let c = 0; c < K; c++) {
      if (probs[c] > maxP) {
        maxP = probs[c]
        pred = c
      }
    }

    const actual = yTrue[i]
    matrix[actual][pred] += 1
    if (pred === actual) correct += 1
  }

  const overallAccuracy = correct / X.length

  const perClass: Record<string, ClassMetrics> = {}
  for (let c = 0; c < K; c++) {
    const label = classes[c]
    const tp = matrix[c][c]
    let fp = 0
    let fn = 0
    let support = 0

    for (let r = 0; r < K; r++) {
      if (r !== c) fp += matrix[r][c]
      support += matrix[c][r]
    }
    for (let col = 0; col < K; col++) {
      if (col !== c) fn += matrix[c][col]
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

    perClass[label] = {
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      f1: parseFloat(f1.toFixed(4)),
      support,
    }
  }

  return {
    overallAccuracy: parseFloat(overallAccuracy.toFixed(4)),
    perClass,
    confusionMatrix: matrix,
    classes,
    totalSamples: X.length,
  }
}

// ── 4. Main Training Routine ───────────────────────────────────────────────────

async function runTraining() {
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('       BHASHASIGN — ISL CUSTOM CLASSIFIER TRAINING (PHASE 2)       ')
  console.log('═══════════════════════════════════════════════════════════════════')

  const landmarksDir = path.resolve('recordings', 'processed', 'landmarks')
  if (!fs.existsSync(landmarksDir)) {
    throw new Error(`Directory not found: ${landmarksDir}`)
  }

  const dataset = loadAndSplitDataset(landmarksDir)
  const { trainX, trainY, testX, testY, classes } = dataset

  const inDim = 126
  const h1Dim = 128
  const h2Dim = 64
  const outDim = classes.length

  console.log(`\nInitializing MLP: ${inDim} -> ${h1Dim} -> ${h2Dim} -> ${outDim}`)
  const model = new MLPClassifier(inDim, h1Dim, h2Dim, outDim)

  const epochs = 45
  const batchSize = 64

  console.log(`\nStarting Training for ${epochs} epochs (Batch size: ${batchSize})...`)

  for (let ep = 1; ep <= epochs; ep++) {
    // Shuffle training data each epoch
    const indices = Array.from({ length: trainX.length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }

    let epochLoss = 0
    let batches = 0

    for (let b = 0; b < trainX.length; b += batchSize) {
      const batchIndices = indices.slice(b, b + batchSize)
      const bX = batchIndices.map((i) => trainX[i])
      const bY = batchIndices.map((i) => trainY[i])
      const loss = model.trainBatch(bX, bY, 0.003)
      epochLoss += loss
      batches += 1
    }

    const avgLoss = epochLoss / batches

    if (ep === 1 || ep % 5 === 0 || ep === epochs) {
      const trainEval = evaluateModel(model, trainX, trainY, classes)
      const testEval = evaluateModel(model, testX, testY, classes)
      console.log(
        `Epoch ${String(ep).padStart(2)}/${epochs} | Loss: ${avgLoss.toFixed(4)} | Train Acc: ${(trainEval.overallAccuracy * 100).toFixed(1)}% | Test Acc: ${(testEval.overallAccuracy * 100).toFixed(1)}%`,
      )
    }
  }

  // Final Detailed Evaluation
  console.log('\n═══════════════════════════════════════════════════════════════════')
  console.log('                     FINAL EVALUATION METRICS                      ')
  console.log('═══════════════════════════════════════════════════════════════════')

  const finalMetrics = evaluateModel(model, testX, testY, classes)

  console.log(`Overall Test Accuracy: ${(finalMetrics.overallAccuracy * 100).toFixed(2)}%`)
  console.log(`Test Set Size: ${finalMetrics.totalSamples} frames across unseen holdout clips\n`)

  console.log('Per-Class Performance Table:')
  console.log('-------------------------------------------------------------------')
  console.log('Concept          | Precision | Recall  | F1-Score | Support (Frames)')
  console.log('-------------------------------------------------------------------')
  for (const c of classes) {
    const m = finalMetrics.perClass[c]
    console.log(
      `${c.padEnd(16)} | ${m.precision.toFixed(4).padStart(9)} | ${m.recall.toFixed(4).padStart(7)} | ${m.f1.toFixed(4).padStart(8)} | ${String(m.support).padStart(16)}`,
    )
  }
  console.log('-------------------------------------------------------------------')

  // Export Trained Model Weights for Browser Inference
  const modelExportDir = path.resolve('src', 'models', 'sign_classifier_v1')
  if (!fs.existsSync(modelExportDir)) {
    fs.mkdirSync(modelExportDir, { recursive: true })
  }

  const modelPackage = {
    modelVersion: 'model_v1',
    trainedAt: new Date().toISOString(),
    architecture: {
      inputDim: inDim,
      hidden1Dim: h1Dim,
      hidden2Dim: h2Dim,
      outputDim: outDim,
    },
    classes,
    weights: {
      W1: model.W1,
      b1: model.b1,
      W2: model.W2,
      b2: model.b2,
      W3: model.W3,
      b3: model.b3,
    },
    metrics: {
      overallAccuracy: finalMetrics.overallAccuracy,
      perClass: finalMetrics.perClass,
      samplesPerClass: dataset.samplesPerClass,
      trainFrames: trainX.length,
      testFrames: testX.length,
    },
  }

  const weightsPath = path.join(modelExportDir, 'model_weights.json')
  fs.writeFileSync(weightsPath, JSON.stringify(modelPackage, null, 2))
  console.log(`\n✓ Model weights exported to: ${weightsPath}`)

  // Save Evaluation Report to dataset metadata
  const metadataReportPath = path.resolve('recordings', 'metadata', 'evaluation_report.json')
  fs.writeFileSync(metadataReportPath, JSON.stringify(modelPackage.metrics, null, 2))
  console.log(`✓ Detailed evaluation report saved to: ${metadataReportPath}`)
}

runTraining().catch((err) => {
  console.error('Training failed:', err)
  process.exit(1)
})
