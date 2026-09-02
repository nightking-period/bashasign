import '@testing-library/jest-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { useCommunicationStore } from '@/store/useCommunicationStore'

describe('Two-Way Live Session Store', () => {
  beforeEach(() => {
    useCommunicationStore.getState().startNewSession()
  })

  it('should initialize with valid session metadata', () => {
    const state = useCommunicationStore.getState()
    expect(state.sessionId).toMatch(/^SES-\d+-\d+$/)
    expect(state.officeName).toContain('Mandal Revenue Office')
    expect(state.serviceType).toContain('Aadhaar')
    expect(state.conversation).toHaveLength(0)
    expect(state.turnState).toBe('idle')
  })

  it('should add officer and citizen messages in sequence', () => {
    const { addMessage } = useCommunicationStore.getState()

    addMessage({
      id: 'msg-1',
      role: 'employee',
      text: 'Please show your Aadhaar card.',
      signSequence: ['YOUR', 'AADHAAR_CARD', 'SHOW'],
      timestamp: Date.now(),
    })

    addMessage({
      id: 'msg-2',
      role: 'citizen',
      text: 'Here is my Identity Card.',
      signSequence: ['CARD'],
      recognitionResult: {
        conceptSequence: ['CARD'],
        rawLabels: ['CARD'],
        confidence: 0.91,
        timestamp: Date.now(),
        source: 'mlp',
        isMock: false,
      },
      timestamp: Date.now(),
    })

    const state = useCommunicationStore.getState()
    expect(state.conversation).toHaveLength(2)
    expect(state.conversation[0].role).toBe('employee')
    expect(state.conversation[1].role).toBe('citizen')
    expect(state.conversation[0].signSequence).toContain('AADHAAR_CARD')
    expect(state.conversation[1].recognitionResult?.confidence).toBe(0.91)
  })

  it('should start a new session and clear previous dialogue', () => {
    const { addMessage, startNewSession } = useCommunicationStore.getState()

    addMessage({
      id: 'msg-test',
      role: 'employee',
      text: 'Hello',
      timestamp: Date.now(),
    })

    expect(useCommunicationStore.getState().conversation).toHaveLength(1)

    startNewSession()

    const state = useCommunicationStore.getState()
    expect(state.conversation).toHaveLength(0)
    expect(state.turnState).toBe('idle')
  })
})
