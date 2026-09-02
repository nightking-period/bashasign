// SignPlaybackEngine — Avatar animation abstraction
// Phase 1: FallbackAvatarProvider (visual placeholder)
// Phase 2: Will support video, GIF, or 3D avatar providers

import type { ISLSign } from '@/types'
import { SIGN_DICTIONARY } from '@/data/signs'

export type AvatarProviderType = 'fallback' | 'video' | 'gif' | '3d'

export interface PlaybackState {
  isPlaying: boolean
  currentSignIndex: number
  totalSigns: number
  currentSign: ISLSign | null
  speed: number
}

export class SignPlaybackEngine {
  private sequence: string[] = []
  private currentIndex = 0
  private speed = 1.0
  private playing = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private onUpdate: (state: PlaybackState) => void

  constructor(onUpdate: (state: PlaybackState) => void) {
    this.onUpdate = onUpdate
  }

  load(signSequence: string[]): void {
    this.stop()
    this.sequence = signSequence
    this.currentIndex = 0
    this.emitUpdate()
  }

  play(): void {
    if (this.sequence.length === 0) return
    this.playing = true
    this.scheduleNext()
  }

  pause(): void {
    this.playing = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.emitUpdate()
  }

  stop(): void {
    this.pause()
    this.currentIndex = 0
    this.emitUpdate()
  }

  replay(): void {
    this.stop()
    this.play()
  }

  setSpeed(speed: number): void {
    this.speed = speed
  }

  jumpTo(index: number): void {
    this.currentIndex = Math.max(0, Math.min(index, this.sequence.length - 1))
    this.emitUpdate()
  }

  private scheduleNext(): void {
    if (!this.playing) return
    const delay = (2000 / this.speed)
    this.timer = setTimeout(() => {
      if (this.currentIndex < this.sequence.length - 1) {
        this.currentIndex++
        this.emitUpdate()
        this.scheduleNext()
      } else {
        this.playing = false
        this.emitUpdate()
      }
    }, delay)
  }

  private emitUpdate(): void {
    const conceptId = this.sequence[this.currentIndex]
    const entry = conceptId ? SIGN_DICTIONARY[conceptId] : null
    const sign = entry?.signs[0] ?? null
    this.onUpdate({
      isPlaying: this.playing,
      currentSignIndex: this.currentIndex,
      totalSigns: this.sequence.length,
      currentSign: sign,
      speed: this.speed,
    })
  }

  destroy(): void {
    this.pause()
  }
}