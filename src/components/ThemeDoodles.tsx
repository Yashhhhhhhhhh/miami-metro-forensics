import { useState, useEffect } from 'react'

/* ==========================================================================
   1. CINEMA MODE: 35mm Film Sprockets, Clapperboard Slate & Laurel Wreaths
   ========================================================================== */

export function CinemaClapperboard({ title = "DIRECTOR'S CUT", scene = "01", take = "04" }: { title?: string; scene?: string; take?: string }) {
  return (
    <div className="relative inline-block bg-[#0f0e12] border-2 border-[#d4af37] text-[#f8f6f0] shadow-[0_0_25px_rgba(212,175,55,0.15)] font-cinema p-4 max-w-sm select-none">
      {/* Clapperboard Diagonal Striped Top Bar */}
      <div className="h-6 w-full mb-3 bg-white flex overflow-hidden border-b-2 border-[#d4af37]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-full skew-x-[-25deg] ${i % 2 === 0 ? 'bg-black' : 'bg-[#e5b869]'}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-[#d4af37]/30 pb-2 mb-2 text-center text-xs font-mono">
        <div>
          <span className="text-[9px] text-[#e5b869] block font-bold">SCENE</span>
          <span className="text-sm font-bold text-white">{scene}</span>
        </div>
        <div className="border-x border-[#d4af37]/30">
          <span className="text-[9px] text-[#e5b869] block font-bold">TAKE</span>
          <span className="text-sm font-bold text-white">{take}</span>
        </div>
        <div>
          <span className="text-[9px] text-[#e5b869] block font-bold">ROLL</span>
          <span className="text-sm font-bold text-white">35mm</span>
        </div>
      </div>

      <div className="text-center pt-1">
        <span className="text-[10px] uppercase font-mono tracking-widest text-[#e5b869] block">PROD. TITLE</span>
        <h4 className="text-sm font-bold uppercase tracking-wider text-white truncate">{title}</h4>
      </div>
    </div>
  )
}

// 35mm Film Filmstrip Sprocket Margin
export function FilmstripBorder() {
  return (
    <div className="flex items-center justify-between w-full h-4 bg-black border-y border-[#d4af37]/40 px-2 py-0.5 overflow-hidden opacity-60">
      {Array.from({ length: 32 }).map((_, i) => (
        <div key={i} className="w-2.5 h-2 bg-[#1a171f] border border-[#d4af37]/30 rounded-xs" />
      ))}
    </div>
  )
}

// Vintage Film Leader Countdown (5... 4... 3... 2... 1...)
export function FilmLeaderCountdown() {
  const [count, setCount] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => (prev > 1 ? prev - 1 : 5))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-28 h-28 rounded-full border-4 border-[#d4af37] bg-black flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.25)] select-none">
      {/* Crosshairs */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-px bg-[#d4af37]/40" />
        <div className="absolute h-full w-px bg-[#d4af37]/40" />
      </div>
      {/* Rotating Clock Hand */}
      <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#e5b869] animate-spin" />
      {/* Number */}
      <span className="text-4xl font-cinema font-bold text-[#f8f6f0] z-10">{count}</span>
    </div>
  )
}

/* ==========================================================================
   2. CYBERPUNK / NERV TACTICAL HUD: Chamfered Frames, Hex Decryptors, Reticles
   ========================================================================== */

export function NervTacticalCard({ title = "NERV TACTICAL UPLINK", status = "SECURE" }: { title?: string; status?: string }) {
  return (
    <div className="relative bg-[#020612] border border-cyan-400 p-4 font-mono select-none cyber-chamfer shadow-[0_0_20px_rgba(6,182,212,0.2)]">
      {/* Tactical Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-3 text-[10px]">
        <span className="text-cyan-400 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 bg-cyan-400 animate-ping" />
          MAGI-01 // BALTHASAR
        </span>
        <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400 text-[9px] font-bold">
          {status}
        </span>
      </div>

      {/* Crosshair Graphic */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 border border-cyan-400/50 flex items-center justify-center relative">
          <div className="w-2 h-2 bg-cyan-400" />
          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t border-l border-cyan-400" />
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 border-b border-l border-cyan-400" />
          <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b border-r border-cyan-400" />
        </div>
        <div>
          <span className="text-[10px] text-cyan-400/60 block uppercase">TERMINAL DIRECTIVE</span>
          <h4 className="text-xs font-bold text-white tracking-widest">{title}</h4>
        </div>
      </div>

      {/* Industrial Caution Line */}
      <div className="mt-3 h-1.5 w-full hazard-stripes opacity-70" />
    </div>
  )
}

/* ==========================================================================
   3. SONIC HI-FI STUDIO: Dual Analog VU Meters & Glowing Vacuum Tube
   ========================================================================== */

export function AnalogVuMeter() {
  const [needleAngle, setNeedleAngle] = useState(-20)

  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate live analog ballistics (-25 deg to +20 deg)
      const target = Math.sin(Date.now() / 250) * 18 + Math.random() * 8 - 5
      setNeedleAngle(target)
    }, 120)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-40 h-24 bg-[#14120e] border-2 border-[#524838] p-2 rounded-xs shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] select-none">
      {/* Warm Incandescent Lamp Backlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent opacity-75" />

      {/* VU Scale Arc */}
      <div className="relative w-full h-14 border-b border-[#a8926b]/40 flex items-end justify-between px-2 text-[8px] font-mono text-[#e5b869] font-bold">
        <span>-20</span>
        <span>-10</span>
        <span>-5</span>
        <span>-1</span>
        <span className="text-red-400">0</span>
        <span className="text-red-500">+3dB</span>
      </div>

      {/* Physical Galvanometer Ballistic Needle */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full h-12 overflow-hidden pointer-events-none flex justify-center">
        <div
          className="w-0.5 h-12 bg-red-500 origin-bottom transition-transform duration-100 ease-out shadow-[0_0_5px_rgba(239,68,68,0.5)]"
          style={{ transform: `rotate(${needleAngle}deg)` }}
        />
      </div>

      <div className="absolute bottom-1 left-2 right-2 flex justify-between items-center text-[7px] font-mono text-[#a8926b]">
        <span>VU-MASTER</span>
        <span className="text-red-400 font-bold">PEAK LEVEL</span>
      </div>
    </div>
  )
}

// Glowing Vacuum Tube Preamp
export function VacuumTubeGlow() {
  return (
    <div className="relative w-8 h-16 bg-[#111317] border border-[#a8926b]/30 rounded-t-full flex flex-col items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.25)]">
      {/* Glowing Filament Coil */}
      <div className="w-3 h-7 rounded-full bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 opacity-90 blur-[1px] animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-white/10" />
      <span className="text-[6px] font-mono text-white/40 absolute bottom-1">12AX7</span>
    </div>
  )
}
