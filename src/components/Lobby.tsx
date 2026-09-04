import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import {
  MonitorPlay,
  LogIn,
  Sparkles,
  Zap,
  Sliders,
  Tv,
  Film,
  Disc,
  Terminal,
  Ticket,
  Headphones,
  Check
} from 'lucide-react'
import { useStore, type Theme } from '../store/useStore'
import { generateRoomCode } from '../lib/utils'
import { peerEngine } from '../lib/PeerEngine'

export default function Lobby() {
  const { alias, setAlias, setRoom, theme, setTheme } = useStore()
  const [joinCode, setJoinCode] = useState('')
  const [hasInvite, setHasInvite] = useState(false)

  // 3D Card Tilt Physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 25, stiffness: 200 }
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig)
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('room')
    if (code && code.trim().length >= 4) {
      setJoinCode(code.trim().toUpperCase())
      setHasInvite(true)
    }
  }, [])

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleCardMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleHost = () => {
    const code = generateRoomCode()
    setRoom(code, true)
    peerEngine.initHost(code)
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const cleaned = joinCode.trim().toUpperCase()
    if (cleaned.length < 4) return
    setRoom(cleaned, false)
    peerEngine.joinRoom(cleaned)
  }

  const themeExperiences = [
    {
      id: 'cinema' as Theme,
      name: 'Cinema Hall',
      subtitle: '70mm DCI-P3 • Velvet Black',
      desc: '2.39:1 Cinemascope letterboxing, dialogue booster, 35mm film grain.',
      icon: Film,
      color: 'from-rose-600 via-red-500 to-amber-500',
      accent: 'border-rose-500/40 text-rose-400 shadow-rose-500/20'
    },
    {
      id: 'anime' as Theme,
      name: 'Anime Lounge',
      subtitle: 'Neo-Tokyo • Sakura Violet',
      desc: 'OP/ED macro skips (+85s/+90s), vocal clarity EQ, anime emoji bursts.',
      icon: Sparkles,
      color: 'from-fuchsia-600 via-purple-500 to-pink-500',
      accent: 'border-fuchsia-500/40 text-fuchsia-400 shadow-fuchsia-500/20'
    },
    {
      id: 'music' as Theme,
      name: 'Sonic Space',
      subtitle: 'Audiophile Hi-Fi • Emerald',
      desc: 'Rotating vinyl turntable, 64-band frequency spectrum, Sub-Bass overdrive.',
      icon: Headphones,
      color: 'from-emerald-500 via-teal-500 to-cyan-500',
      accent: 'border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
    },
    {
      id: 'cyberpunk' as Theme,
      name: 'Cyberpunk Deck',
      subtitle: 'Neural HUD • Neon Cyan',
      desc: 'Retro-futuristic CRT scanlines, live FPS & drift telemetry, sub-50ms sync.',
      icon: Terminal,
      color: 'from-cyan-500 via-blue-500 to-indigo-500',
      accent: 'border-cyan-500/40 text-cyan-400 shadow-cyan-500/20'
    }
  ]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 lg:p-10 overflow-y-auto overflow-x-hidden bg-[#050508]">
      {/* 35mm Film Grain Atmosphere */}
      <div className="film-grain" />

      {/* Dynamic Ambient Radiant Glows */}
      <div className="absolute top-1/4 left-1/4 w-[650px] h-[650px] bg-[var(--primary)] opacity-20 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[550px] h-[550px] bg-[var(--primary)] opacity-10 rounded-full blur-[180px] pointer-events-none" />

      {/* Floating Theme Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            backgroundColor: 'var(--primary)'
          }}
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1400),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 900),
            opacity: 0.1
          }}
          animate={{
            y: [null, -180],
            x: [null, (Math.random() - 0.5) * 100],
            opacity: [0.1, 0.75, 0]
          }}
          transition={{
            duration: Math.random() * 9 + 8,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 5
          }}
        />
      ))}

      {/* Main Theatrical Container */}
      <div className="w-full max-w-7xl grid lg:grid-cols-12 gap-8 lg:gap-14 items-center relative z-10 py-6">
        {/* Left Column: Theatrical Branding & Experiential Selectors */}
        <div className="lg:col-span-7 space-y-6 lg:space-y-8 text-center lg:text-left">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/90 text-xs font-mono tracking-widest uppercase shadow-2xl backdrop-blur-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse" />
            <span className="text-[11px] text-white/80 font-medium">
              WebRTC P2P Mesh • NTP Sub-50ms Drift Lock
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none font-cinema uppercase">
              LUMIÈRE{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-rose-400 to-amber-300 font-syne">
                STUDIO
              </span>
            </h1>
            <p className="text-sm lg:text-base text-white/60 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Synchronous cinema engineered for cinephiles and friends. Stream direct torrents, local files via hardware transcoder, or web media with bit-perfect sync and acoustic DSP master tuning.
            </p>
          </div>

          {/* Atmospheric Experience Deck */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-mono font-bold text-white/50 tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" /> Select Atmospheric World
              </span>
              <span className="text-[10px] font-mono text-[var(--primary)] uppercase font-bold tracking-widest">
                Active: {theme.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themeExperiences.map((exp) => {
                const IconComponent = exp.icon
                const isActive = theme === exp.id
                return (
                  <button
                    key={exp.id}
                    onClick={() => setTheme(exp.id)}
                    className={`p-4 rounded-3xl border text-left transition-all duration-200 relative overflow-hidden group ${
                      isActive
                        ? `bg-white/[0.08] ${exp.accent} shadow-xl scale-[1.01]`
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Top gradient strip */}
                    <div className={`w-full h-1 rounded-full bg-gradient-to-r ${exp.color} mb-3`} />

                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2.5 rounded-2xl ${
                          isActive ? 'bg-white/10 text-white shadow-inner' : 'bg-white/5 text-white/60'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white font-syne">{exp.name}</p>
                          {isActive && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <p className="text-[11px] font-mono text-white/50 mt-0.5">{exp.subtitle}</p>
                        <p className="text-[11px] text-white/40 leading-snug mt-1 line-clamp-2">
                          {exp.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Holographic Premiere Pass */}
        <div className="lg:col-span-5" style={{ perspective: 1200 }}>
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="p-7 lg:p-9 rounded-[2.5rem] bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border border-white/15 backdrop-blur-3xl shadow-[0_25px_90px_rgba(0,0,0,0.85)] relative overflow-hidden transition-shadow hover:shadow-[0_30px_100px_var(--primary-glow)]"
          >
            {/* Holographic Sheen Layer */}
            <div className="hologram-sheen absolute inset-0 pointer-events-none opacity-40" />

            {/* Perforated Ticket Top Header */}
            <div className="relative z-10 pb-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-[var(--primary)]" />
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40 block">
                    ADMIT ONE // STUDIO ACCESS
                  </span>
                  <span className="text-xs font-mono font-bold text-white tracking-widest">
                    PASS #LUM-2026
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-[10px] font-mono font-bold text-[var(--primary)] uppercase tracking-widest">
                VERIFIED VIP
              </span>
            </div>

            {/* VIP Invite Detection Banner */}
            {hasInvite && (
              <div className="relative z-10 mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-fade-in flex items-center gap-3">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400 animate-spin-slow" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">Private Screening Invite</p>
                  <p className="text-[11px] text-amber-200/70 font-light">
                    You've been invited to Room <span className="font-mono font-bold text-white">{joinCode}</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Pass Body Controls */}
            <div className="space-y-6 pt-5 relative z-10">
              {/* Alias Field */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-widest text-white/60 flex items-center justify-between">
                  <span>Director / Viewer Alias</span>
                  <span className="text-[10px] text-white/30 font-normal">Identifies you in room</span>
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Denis Villeneuve"
                  className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-white/[0.08] transition-all shadow-inner placeholder:text-white/20"
                />
              </div>

              {/* Host Action Button */}
              <button
                onClick={handleHost}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[var(--primary)] via-rose-500 to-amber-500 hover:opacity-95 active:scale-[0.98] text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/30 transition-all font-syne"
              >
                <MonitorPlay className="w-5 h-5" />
                <span>Host Premiere Screening</span>
              </button>

              {/* Aesthetic Divider */}
              <div className="relative flex items-center justify-center my-2">
                <div className="w-full border-t border-white/10" />
                <span className="absolute px-4 bg-zinc-950 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white/40">
                  OR ENTER ROOM CODE
                </span>
              </div>

              {/* Join Code Input Form */}
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={6}
                  className="flex-1 px-5 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center font-mono text-xl font-bold tracking-[0.25em] text-white focus:outline-none focus:border-[var(--primary)] transition-all shadow-inner placeholder:text-white/20"
                />
                <button
                  type="submit"
                  disabled={joinCode.trim().length < 4}
                  className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-[var(--primary)]/20"
                  title="Join Room"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

