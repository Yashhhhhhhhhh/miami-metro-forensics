// High-End Web Audio DSP & Equalizer Engine
export type EQPreset = 'flat' | 'cinema' | 'vocal' | 'bass' | 'iem' | 'laptop'

class AudioEngine {
  private ctx: AudioContext | null = null
  private source: MediaElementAudioSourceNode | null = null
  private lowFilter: BiquadFilterNode | null = null
  private midFilter: BiquadFilterNode | null = null
  private highFilter: BiquadFilterNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private gainNode: GainNode | null = null
  private analyserNode: AnalyserNode | null = null
  private streamDest: MediaStreamAudioDestinationNode | null = null
  private connectedElement: HTMLMediaElement | null = null

  public init(mediaEl: HTMLMediaElement) {
    if (this.connectedElement === mediaEl && this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.ctx = new AudioCtx()
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume()
      }

      // Safe source creation (prevent InvalidStateError on same element)
      if (this.connectedElement !== mediaEl) {
        if (this.source) {
          try { this.source.disconnect() } catch {}
        }
        this.source = this.ctx.createMediaElementSource(mediaEl)
        this.connectedElement = mediaEl
      }

      // 3-Band Equalizer Filters
      this.lowFilter = this.ctx.createBiquadFilter()
      this.lowFilter.type = 'lowshelf'
      this.lowFilter.frequency.value = 250

      this.midFilter = this.ctx.createBiquadFilter()
      this.midFilter.type = 'peaking'
      this.midFilter.frequency.value = 1500
      this.midFilter.Q.value = 1

      this.highFilter = this.ctx.createBiquadFilter()
      this.highFilter.type = 'highshelf'
      this.highFilter.frequency.value = 6000

      // Dialogue Enhancer Dynamics Compressor
      this.compressor = this.ctx.createDynamicsCompressor()
      this.compressor.threshold.value = -20
      this.compressor.knee.value = 10
      this.compressor.ratio.value = 4
      this.compressor.attack.value = 0.005
      this.compressor.release.value = 0.1

      // Volume Booster Gain Node (supports up to 250% amplification)
      this.gainNode = this.ctx.createGain()
      this.gainNode.gain.value = 1.0

      // Visualizer Analyser Node
      this.analyserNode = this.ctx.createAnalyser()
      this.analyserNode.fftSize = 128
      this.analyserNode.smoothingTimeConstant = 0.8

      // Stream destination for WebRTC broadcaster
      this.streamDest = this.ctx.createMediaStreamDestination()

      // Wire up graph: Source -> Low -> Mid -> High -> Compressor -> Gain -> Analyser -> Output & Dest
      this.source.connect(this.lowFilter)
      this.lowFilter.connect(this.midFilter)
      this.midFilter.connect(this.highFilter)
      this.highFilter.connect(this.compressor)
      this.compressor.connect(this.gainNode)
      this.gainNode.connect(this.analyserNode)
      this.analyserNode.connect(this.ctx.destination)
      this.analyserNode.connect(this.streamDest)

      this.applyPreset('cinema')
    } catch (err) {
      console.warn('AudioEngine init notice:', err)
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setVolume(val: number) {
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(Math.max(0, val), this.ctx?.currentTime || 0, 0.02)
    }
  }

  public setCompressorEnabled(enabled: boolean) {
    if (this.compressor) {
      this.compressor.ratio.value = enabled ? 5 : 1
    }
  }

  public applyPreset(preset: EQPreset) {
    if (!this.lowFilter || !this.midFilter || !this.highFilter) return

    switch (preset) {
      case 'cinema':
        this.lowFilter.gain.value = 4.0
        this.midFilter.gain.value = -1.0
        this.highFilter.gain.value = 3.0
        break
      case 'vocal':
        this.lowFilter.gain.value = -3.0
        this.midFilter.gain.value = 6.0
        this.highFilter.gain.value = 2.0
        break
      case 'bass':
        this.lowFilter.gain.value = 8.0
        this.midFilter.gain.value = -2.0
        this.highFilter.gain.value = 0.0
        break
      case 'iem':
        this.lowFilter.gain.value = 2.0
        this.midFilter.gain.value = 1.0
        this.highFilter.gain.value = 4.0
        break
      case 'laptop':
        this.lowFilter.gain.value = -6.0 // cut distorted bass on tinny laptop speakers
        this.midFilter.gain.value = 4.0 // boost speech intelligibility
        this.highFilter.gain.value = 3.0
        break
      case 'flat':
      default:
        this.lowFilter.gain.value = 0
        this.midFilter.gain.value = 0
        this.highFilter.gain.value = 0
        break
    }
  }

  public getAudioTrack(): MediaStreamTrack | null {
    if (this.streamDest && this.streamDest.stream.getAudioTracks().length > 0) {
      return this.streamDest.stream.getAudioTracks()[0]
    }
    return null
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as any)
    }
  }
}

export const audioEngine = new AudioEngine()
