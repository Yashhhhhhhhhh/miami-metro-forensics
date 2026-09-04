import { useState } from 'react'

// Authentic Manga Sound-Effect (SFX) Onomatopoeia Stamps
export const MANGA_SFX = [
  { id: 'dododo', kanji: 'ドドド', label: 'RUMBLE', color: '#ff2a5f', bg: '#ffe600', sub: 'MENACING' },
  { id: 'gogogo', kanji: 'ゴゴゴ', label: 'TENSION', color: '#8b5cf6', bg: '#ffffff', sub: 'INTENSITY' },
  { id: 'zukyuuun', kanji: 'ズキューン', label: 'IMPACT', color: '#06b6d4', bg: '#ffffff', sub: 'DIRECT HIT' },
  { id: 'baaan', kanji: 'バァァン', label: 'REVEAL', color: '#ec4899', bg: '#ffe600', sub: 'EXPLOSIVE' },
  { id: 'kirann', kanji: 'キラーン', label: 'SPARKLE', color: '#10b981', bg: '#ffffff', sub: 'GLINT' },
  { id: 'gashaann', kanji: 'ガシャーン', label: 'SHATTER', color: '#f59e0b', bg: '#ff2a5f', sub: 'BREAK' }
]

// Animated Manga Speedlines Canvas
export function AnimeSpeedlines({ active = true }: { active?: boolean }) {
  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-30 select-none">
      {/* Dynamic SVG Radial Speedlines */}
      <svg className="w-full h-full animate-spin-slow-reverse" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="speedlineFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff2a5f" stopOpacity="0" />
            <stop offset="65%" stopColor="#ff2a5f" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ffe600" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        <g stroke="url(#speedlineFade)" strokeWidth="2">
          {Array.from({ length: 48 }).map((_, i) => {
            const angle = (i * 360) / 48
            const rad = (angle * Math.PI) / 180
            const x1 = 400 + Math.cos(rad) * 220
            const y1 = 400 + Math.sin(rad) * 220
            const x2 = 400 + Math.cos(rad) * 450
            const y2 = 400 + Math.sin(rad) * 450
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                strokeDasharray={i % 2 === 0 ? '8 4' : '16 6'}
                strokeWidth={i % 3 === 0 ? 3 : 1.5}
                className="opacity-75"
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

// Hand-Drawn Animated Manga Doodles (Ink Cats, Chibi Eyes, Action Bursts)
export function MangaDoodles() {
  const [clickedSfx, setClickedSfx] = useState<string | null>(null)

  const playSfx = (id: string) => {
    setClickedSfx(id)
    setTimeout(() => setClickedSfx(null), 1200)
  }

  return (
    <div className="pointer-events-none select-none">
      {/* Floating Ink Splatters & Action Doodles in corners */}
      <div className="absolute top-16 left-6 pointer-events-auto group cursor-pointer transition-transform hover:scale-110 active:scale-95 z-20">
        <div 
          onClick={() => playSfx('gogogo')}
          className="relative px-3 py-1.5 bg-black text-[#ffe600] border-2 border-black font-black text-sm tracking-widest uppercase shadow-[3px_3px_0px_#ff2a5f] -rotate-6 transition-all hover:rotate-0"
        >
          <span className="font-mono text-xs text-white/70 block text-[9px] tracking-tighter">SFX // ゴゴゴ</span>
          <span className="text-base font-black">強烈 TENSION</span>
        </div>
      </div>

      <div className="absolute top-16 right-20 pointer-events-auto group cursor-pointer transition-transform hover:scale-110 active:scale-95 z-20 hidden md:block">
        <div 
          onClick={() => playSfx('baaan')}
          className="relative px-3 py-1.5 bg-[#ff2a5f] text-white border-2 border-black font-black text-sm tracking-widest uppercase shadow-[3px_3px_0px_#000000] rotate-3 transition-all hover:rotate-0"
        >
          <span className="font-mono text-xs text-yellow-300 block text-[9px] tracking-tighter">ACTION // バァァン</span>
          <span className="text-base font-black">限界突破 OVERDRIVE</span>
        </div>
      </div>

      {/* Floating Interactive Comic Sound Effect Stamped Popups */}
      {clickedSfx && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-scale-punch">
          <div className="relative px-8 py-4 bg-[#ffe600] text-black border-4 border-black font-black text-5xl tracking-tighter shadow-[8px_8px_0px_#ff2a5f] -rotate-3 flex flex-col items-center">
            <span className="text-6xl font-black">{MANGA_SFX.find(s => s.id === clickedSfx)?.kanji || 'ドドド'}</span>
            <span className="text-sm tracking-widest font-mono uppercase bg-black text-white px-2 py-0.5 mt-2">
              {MANGA_SFX.find(s => s.id === clickedSfx)?.label || 'CRITICAL HIT'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Chibi Anime Companion / Screen Mascot
export function AnimeMascot({ message = 'STREAM READY! 行くぞ！' }: { message?: string }) {
  const [mood, setMood] = useState<'happy' | 'sparkle' | 'hype'>('sparkle')

  return (
    <div className="flex items-center gap-3 bg-[#0d0914] border-2 border-black p-2.5 shadow-[4px_4px_0px_#ff2a5f] transition-all hover:translate-x-1">
      {/* Animated Chibi Avatar Badge */}
      <div 
        onClick={() => setMood(mood === 'sparkle' ? 'hype' : 'sparkle')}
        className="relative w-11 h-11 rounded-none bg-[#ffe600] border-2 border-black flex items-center justify-center cursor-pointer overflow-hidden group shadow-[2px_2px_0px_#000000] active:scale-95 transition-all"
        title="Click Mascot for Action Pose!"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-[#ff2a5f] to-[#ffe600] opacity-30" />
        <span className="text-2xl select-none group-hover:scale-125 transition-transform">
          {mood === 'sparkle' ? '⚡' : mood === 'hype' ? '🔥' : '✨'}
        </span>
      </div>

      {/* Manga Dialogue Balloon */}
      <div className="relative bg-white text-black px-3 py-1.5 text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000000] tracking-tight">
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-l-2 border-b-2 border-black rotate-45" />
        <span className="text-[10px] text-[#ff2a5f] font-mono font-bold block leading-none">P2P COMPANION //</span>
        <span className="font-extrabold uppercase">{message}</span>
      </div>
    </div>
  )
}

// Manga Impact Burst on Play/Seek Action
export function MangaImpactFlash({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center animate-fade-out">
      {/* Explosive Manga Action Flash */}
      <div className="w-full h-full bg-white opacity-25 mix-blend-difference" />
      <div className="absolute text-7xl font-black text-black bg-[#ffe600] border-4 border-black px-8 py-3 shadow-[10px_10px_0px_#ff2a5f] -rotate-6">
        再生！！ PLAY
      </div>
    </div>
  )
}
