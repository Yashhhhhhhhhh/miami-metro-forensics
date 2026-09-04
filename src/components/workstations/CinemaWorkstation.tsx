import { useState } from 'react'
import { StepBack, StepForward, Clapperboard, Palette, Bookmark, Check } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { peerEngine } from '../../lib/PeerEngine'
import { formatTime } from '../../lib/utils'

export type FilmStock = 'normal' | 'kodak35mm' | 'technicolor' | 'noir'

export default function CinemaWorkstation({
  onSeek
}: {
  onSeek: (time: number) => void
}) {
  const {
    currentTime,
    duration,
    isHost,
    cinemascopeMode,
    toggleCinemascopeMode,
    filmGrain,
    toggleFilmGrain
  } = useStore()

  const [activeStock, setActiveStock] = useState<FilmStock>('normal')
  const [markers, setMarkers] = useState<{ time: number; label: string }[]>([])
  const [activeTab, setActiveTab] = useState<'shuttle' | 'grading' | 'markers'>('shuttle')

  // Exact 24.00 FPS Frame Stepper (1 frame = 1/24 ≈ 0.04166 seconds)
  const stepFrames = (frames: number) => {
    const frameDuration = 1 / 24
    const target = Math.max(0, Math.min(duration, currentTime + (frames * frameDuration)))
    onSeek(target)
    if (isHost) {
      peerEngine.broadcast({ type: 'ACTION_SEEK', time: target })
    }
  }

  // Apply Film Stock Color Filter to Video
  const handleStockChange = (stock: FilmStock) => {
    setActiveStock(stock)
    const video = document.querySelector('video')
    if (!video) return

    if (stock === 'kodak35mm') {
      video.style.filter = 'sepia(0.2) contrast(1.15) saturate(1.2) brightness(0.95)'
    } else if (stock === 'technicolor') {
      video.style.filter = 'contrast(1.3) saturate(1.6) brightness(1.05)'
    } else if (stock === 'noir') {
      video.style.filter = 'grayscale(1) contrast(1.4) brightness(0.9)'
    } else {
      video.style.filter = 'none'
    }
  }

  // Add Director Scene Marker
  const handleAddMarker = () => {
    const label = prompt('Enter Director Scene Note:', `Scene Take at ${formatTime(currentTime)}`)
    if (label) {
      setMarkers([...markers, { time: currentTime, label }])
    }
  }

  return (
    <div className="w-full bg-[#0c0b0f] border-2 border-[#d4af37] p-3.5 shadow-[0_0_30px_rgba(212,175,55,0.15)] select-none text-[#f8f6f0] font-cinema">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#d4af37]/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#d4af37] text-black text-[10px] font-bold uppercase tracking-widest">
            DIRECTOR LAB
          </span>
          <span className="text-xs font-bold uppercase text-[#e5b869] tracking-wider">
            35MM FRAME ANALYSIS & FILM RESTORATION
          </span>
        </div>

        {/* Workstation Tabs */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => setActiveTab('shuttle')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'shuttle' ? 'bg-[#d4af37] text-black' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            24fps Stepper
          </button>
          <button
            onClick={() => setActiveTab('grading')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'grading' ? 'bg-[#d4af37] text-black' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Film Stocks
          </button>
          <button
            onClick={() => setActiveTab('markers')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'markers' ? 'bg-[#d4af37] text-black' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Scene Notes ({markers.length})
          </button>
        </div>
      </div>

      {/* Tab 1: 24.00 FPS Frame-by-Frame Jog Shuttle */}
      {activeTab === 'shuttle' && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => stepFrames(-5)}
              className="cinema-btn px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1 font-mono"
              title="Step Backward 5 Frames (208ms)"
            >
              <StepBack className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>-5 Fr</span>
            </button>
            <button
              onClick={() => stepFrames(-1)}
              className="cinema-btn px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1 font-mono"
              title="Step Backward 1 Frame (42ms)"
            >
              <span>-1 Frame</span>
            </button>
            <div className="px-3 py-1 bg-black border border-[#d4af37]/40 text-center font-mono text-xs text-[#e5b869]">
              <span>{Math.floor(currentTime * 24)} FRAMES</span>
            </div>
            <button
              onClick={() => stepFrames(1)}
              className="cinema-btn px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1 font-mono"
              title="Step Forward 1 Frame (42ms)"
            >
              <span>+1 Frame</span>
            </button>
            <button
              onClick={() => stepFrames(5)}
              className="cinema-btn px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1 font-mono"
              title="Step Forward 5 Frames (208ms)"
            >
              <span>+5 Fr</span>
              <StepForward className="w-3.5 h-3.5 text-[#d4af37]" />
            </button>
          </div>

          {/* Anamorphic Framing Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCinemascopeMode}
              className={`cinema-btn px-3 py-1.5 text-xs font-bold uppercase ${
                cinemascopeMode ? 'bg-[#d4af37] text-black font-black' : ''
              }`}
            >
              2.39:1 Anamorphic
            </button>
            <button
              onClick={toggleFilmGrain}
              className={`cinema-btn px-3 py-1.5 text-xs font-bold uppercase ${
                filmGrain ? 'bg-[#d4af37] text-black font-black' : ''
              }`}
            >
              35mm Grain
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Analog Film Stock Color Shaders */}
      {activeTab === 'grading' && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-white/70 font-mono">Select Film Stock Emulation:</span>
          <div className="flex items-center gap-2">
            {[
              { id: 'normal', label: 'Raw Master (Default)' },
              { id: 'kodak35mm', label: 'Kodak 5207 35mm (Warm Amber)' },
              { id: 'technicolor', label: 'Technicolor 3-Strip (1950s)' },
              { id: 'noir', label: 'Film Noir 1948 (Silver Halide)' }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => handleStockChange(s.id as FilmStock)}
                className={`cinema-btn px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                  activeStock === s.id ? 'bg-[#d4af37] text-black font-bold' : ''
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Director's Scene Markers & Timecodes */}
      {activeTab === 'markers' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto max-w-lg">
            {markers.length === 0 ? (
              <span className="text-xs text-white/50 italic">No scene bookmarks added yet.</span>
            ) : (
              markers.map((m, i) => (
                <button
                  key={i}
                  onClick={() => onSeek(m.time)}
                  className="px-2.5 py-1 bg-black border border-[#d4af37] text-[10px] font-mono text-[#e5b869] truncate hover:bg-[#d4af37] hover:text-black transition-colors"
                  title={`Jump to ${formatTime(m.time)}`}
                >
                  📍 {formatTime(m.time)} - {m.label}
                </button>
              ))
            )}
          </div>
          <button
            onClick={handleAddMarker}
            className="cinema-btn px-4 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Mark Scene ({formatTime(currentTime)})</span>
          </button>
        </div>
      )}
    </div>
  )
}
