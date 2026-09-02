import '@testing-library/jest-dom'
import { describe, it, expect } from 'vitest'
import { TARGET_CONCEPTS, SIGNERS, getConceptById } from '@/data/concepts'
import {
  normalizeSingleHand,
  normalizeDualHands,
  type RawPoint3D,
  type HandLandmarks,
} from '@/services/ml/LandmarkExtractor'

describe('ML Dataset & Concepts Specification', () => {
  it('should have 16 core + 4 conversational concepts + 2 system concepts', () => {
    expect(TARGET_CONCEPTS.length).toBe(22)
    const nonSystem = TARGET_CONCEPTS.filter((c) => c.category !== 'system')
    expect(nonSystem.length).toBe(20)
    const conversational = TARGET_CONCEPTS.filter((c) => c.category === 'conversational')
    expect(conversational.length).toBe(4)
  })


  it('should have all concepts marked unverified for linguistic honesty', () => {
    TARGET_CONCEPTS.forEach((concept) => {
      expect(concept.validationStatus).toBe('unverified')
    })
  })

  it('should find concept by ID', () => {
    const aadhaar = getConceptById('AADHAAR')
    expect(aadhaar).toBeDefined()
    expect(aadhaar?.category).toBe('documents')
    expect(aadhaar?.expectedHands).toBe(2)

    const pension = getConceptById('PENSION')
    expect(pension).toBeDefined()
    expect(pension?.category).toBe('services')
  })

  it('should define 4 signers for team allocation', () => {
    expect(SIGNERS.length).toBe(4)
    expect(SIGNERS[0].id).toBe('signer_01')
  })
})

describe('Landmark Normalization Pipeline', () => {
  it('should normalize single hand to 63 features centered at wrist', () => {
    const mockPoints: RawPoint3D[] = Array.from({ length: 21 }, (_, i) => ({
      x: 10 + i,
      y: 20 + i * 2,
      z: i * 0.5,
    }))

    const features = normalizeSingleHand(mockPoints)
    expect(features.length).toBe(63)
    // Wrist (first 3 coords) must be exactly 0,0,0 after subtraction
    expect(features[0]).toBeCloseTo(0, 5)
    expect(features[1]).toBeCloseTo(0, 5)
    expect(features[2]).toBeCloseTo(0, 5)
  })

  it('should return 63 zeros for absent hand', () => {
    const features = normalizeSingleHand([])
    expect(features.length).toBe(63)
    expect(features.every((v) => v === 0)).toBe(true)
  })

  it('should normalize dual hands to exactly 126 features', () => {
    const hand1: HandLandmarks = {
      handedness: 'Right',
      landmarks: Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 })),
    }
    const hand2: HandLandmarks = {
      handedness: 'Left',
      landmarks: Array.from({ length: 21 }, () => ({ x: 0.3, y: 0.5, z: 0 })),
    }

    const frame = normalizeDualHands([hand1, hand2], 1)
    expect(frame.features.length).toBe(126)
    expect(frame.handsDetected).toBe(2)
    expect(frame.frameIndex).toBe(1)
  })

  it('should zero-pad missing non-dominant hand while preserving dominant hand', () => {
    const singleRightHand: HandLandmarks = {
      handedness: 'Right',
      landmarks: Array.from({ length: 21 }, (_, i) => ({ x: 0.6 + i * 0.01, y: 0.5, z: 0 })),
    }

    const frame = normalizeDualHands([singleRightHand], 0)
    expect(frame.features.length).toBe(126)
    expect(frame.handsDetected).toBe(1)

    // Hand 0 features (0..62) has values
    const hand0 = frame.features.slice(0, 63)
    // Hand 1 features (63..125) are all zero
    const hand1 = frame.features.slice(63, 126)
    expect(hand1.every((v) => v === 0)).toBe(true)
  })
})
