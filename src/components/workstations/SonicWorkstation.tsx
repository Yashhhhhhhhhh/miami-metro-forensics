import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, Radio, Disc, Volume2, Waves } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { AnalogVuMeter, VacuumTubeGlow } from '../ThemeDoodles'

export default function SonicWorkstation() {
  const {
    volume,
    setVolume,
    eqPreset,
    setEQPreset,
    compressorEnabled,
    setCompressorEnabled
  } = useStore()

  const [activeTab, setActiveTab] = useState<'meters' | 'dsp' | 'atmosphere'>('meters')
  const [vinylCrackle, setVinylCrackle] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const noiseNodeRef = useRef<AudioNode | null>(null)

  // Synthetic Vinyl Dust & Tape Crackle Generator using Web Audio API
  useEffect(() => {
    if (vinylCrackle) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioCtxRef.current = ctx

        // Generate gentle vinyl crackle pink noise buffer
        const bufferSize = ctx.sampleRate * 2
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const output = noiseBuffer.getChannelData(0)
        let b0 = 0, b1 = 0, b2 = 0
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1
          b0 = 0.99886 * b0 + white * 0.0555179
          b1 = 0.99332 * b1 + white * 0.0750759
          b2 = 0.96900 * b2 + white * 0.1538520
          output[i] = (b0 + b1 + b2) * 0.012 // Very subtle warm crackle
        }

        const whiteNoise = ctx.createBufferSource()
        whiteNoise.buffer = noiseBuffer
        whiteNoise.loop = true

        const gainNode = ctx.createGain()
        gainNode.gain.value = 0.08

        whiteNoise.connect(gainNode)
        gainNode.connect(ctx.destination)
        whiteNoise.start(0)

        noiseNodeRef.current = whiteNoise
      } catch (e) {
        console.warn('Vinyl audio generator notice:', e)
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
    }

    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
      }
    }
  }, [vinylCrackle])

  return (
    <div className="w-full hifi-faceplate p-4 shadow-2xl select-none text-[#e2e8f0] font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#383e4a] pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#a8926b] text-black text-[10px] font-bold uppercase tracking-widest">
            STUDER A800
          </span>
          <span className="text-xs font-bold uppercase text-[#e5b869] tracking-wider">
            HI-FI ACOUSTIC MASTERING LAB & PHASE SCOPE
          </span>
        </div>

        {/* Workstation Tabs */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            onClick={() => setActiveTab('meters')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'meters' ? 'bg-[#a8926b] text-black' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Ballistic VU Meters
          </button>
          <button
            onClick={() => setActiveTab('dsp')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'dsp' ? 'bg-[#a8926b] text-black' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Hardware DSP & EQ
          </button>
          <button
            onClick={() => setActiveTab('atmosphere')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'atmosphere' ? 'bg-[#a8926b] text-black' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Vinyl & Tape Crackle
          </button>
        </div>
      </div>

      {/* Tab 1: Ballistic VU Needle Meters & Vacuum Tube */}
      {activeTab === 'meters' && (
        <div className="flex items-center justify-around gap-4 p-2 bg-[#090b0e] border border-[#2a2e38]">
          <AnalogVuMeter />
          <div className="flex flex-col items-center justify-center gap-1">
            <VacuumTubeGlow />
            <span className="text-[8px] text-[#a8926b] uppercase font-bold">12AX7 TUBE</span>
          </div>
          <AnalogVuMeter />
        </div>
      )}

      {/* Tab 2: Hardware DSP Equalizer */}
      {activeTab === 'dsp' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">DSP Curve:</span>
            <div className="flex items-center gap-1.5">
              {(['cinema', 'vocal', 'bass', 'iem', 'laptop', 'flat'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setEQPreset(p)}
                  className={`hifi-btn px-2.5 py-1 text-[10px] font-bold uppercase ${
                    eqPreset === p ? 'bg-[#a8926b] text-black font-black' : ''
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#090b0e] border border-[#2a2e38] text-xs">
            <span>Dynamic Dialogue Enhancer (Night Compressor)</span>
            <button
              onClick={() => setCompressorEnabled(!compressorEnabled)}
              className={`hifi-btn px-3 py-1 text-[10px] font-bold uppercase ${
                compressorEnabled ? 'bg-emerald-600 text-white' : 'text-white/50'
              }`}
            >
              {compressorEnabled ? 'ENGAGED' : 'BYPASS'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Atmosphere Tape Hiss / Vinyl Crackle */}
      {activeTab === 'atmosphere' && (
        <div className="flex items-center justify-between p-2.5 bg-[#090b0e] border border-[#2a2e38]">
          <div>
            <p className="text-xs font-bold text-white">Vintage Analog Vinyl & Reel Tape Crackle</p>
            <p className="text-[10px] text-white/50">Generates real-time warm analog noise floor bed via Web Audio API.</p>
          </div>
          <button
            onClick={() => setVinylCrackle(!vinylCrackle)}
            className={`hifi-btn px-4 py-2 text-xs font-bold uppercase flex items-center gap-2 ${
              vinylCrackle ? 'bg-[#a8926b] text-black font-black' : 'text-white/70'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>{vinylCrackle ? 'CRACKLE ACTIVE' : 'ENABLE CRACKLE'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
