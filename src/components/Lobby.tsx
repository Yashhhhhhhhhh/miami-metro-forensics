import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MonitorPlay,
  LogIn,
  Sparkles,
  Zap,
  ShieldCheck,
  Headphones,
  Sliders,
  Tv,
  Film
} from 'lucide-react'
import { useStore, type Theme } from '../store/useStore'
import { generateRoomCode } from '../lib/utils'
import { peerEngine } from '../lib/PeerEngine'

export default function Lobby() {
  const { alias, setAlias, setRoom, theme, setTheme } = useStore()
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('room')
    if (code && code.trim().length >= 4) {
      setJoinCode(code.trim().toUpperCase())
    }
  }, [])

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

  const themeOptions: { id: Theme; name: string; color: string; desc: string }[] = [
    { id: 'cinema', name: 'Cinema Hall', color: 'from-rose-600 to-red-500', desc: 'Onyx & Crimson IMAX grade' },
    { id: 'anime', name: 'Anime Lounge', color: 'from-fuchsia-600 to-pink-500', desc: 'Midnight & Neon Magenta' },
    { id: 'music', name: 'Sonic Space', color: 'from-emerald-600 to-green-400', desc: 'Deep Emerald with Spectrum Visualizer' },
    { id: 'cyberpunk', name: 'Cyberpunk Deck', color: 'from-cyan-500 to-blue-500', desc: 'Void Black & Cyan' }
  ]

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 lg:p-8 overflow-hidden bg-zinc-950">
      {/* Dynamic Theme Radial Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--primary)] opacity-15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[var(--primary)] opacity-10 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Starfield Particles */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-[var(--primary)]"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            opacity: 0.1
          }}
          animate={{
            y: [null, -150],
            x: [null, (Math.random() - 0.5) * 80],
            opacity: [0.1, 0.7, 0]
          }}
          transition={{
            duration: Math.random() * 8 + 8,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 4
          }}
        />
      ))}

      {/* Main Container */}
      <div className="w-full max-w-6xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        {/* Left Col: Branding, Showcase & Themes */}
        <div className="lg:col-span-7 space-y-6 lg:space-y-8 text-center lg:text-left">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/90 text-xs font-mono tracking-widest uppercase shadow-xl backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>P2P Encrypted Mesh • Zero Buffer Lag</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-white leading-none">
              LUMIÈRE{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-rose-400 to-amber-300">
                STUDIO
              </span>
            </h1>
            <p className="text-sm lg:text-base text-white/60 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
              The ultimate synchronous cinema environment. Transcodes any local movie in real-time to your friends' phones, locks timecodes to the millisecond, and boosts audio with acoustic DSP.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <Zap className="w-4 h-4 text-[var(--primary)] mb-1.5" />
              <p className="text-xs font-bold text-white">NTP Drift Lock</p>
              <p className="text-[10px] text-white/40">Sub-50ms sync</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <Tv className="w-4 h-4 text-emerald-400 mb-1.5" />
              <p className="text-xs font-bold text-white">Universal Transcode</p>
              <p className="text-[10px] text-white/40">Plays on every phone</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <Sliders className="w-4 h-4 text-amber-400 mb-1.5" />
              <p className="text-xs font-bold text-white">250% Audio Boost</p>
              <p className="text-[10px] text-white/40">Dialogue enhancer</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-fuchsia-400 mb-1.5" />
              <p className="text-xs font-bold text-white">360° Ambilight</p>
              <p className="text-[10px] text-white/40">Dynamic room glow</p>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] uppercase font-mono font-bold text-white/40 tracking-wider block">
              Atmospheric Theme
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    theme === opt.id
                      ? 'bg-white/10 border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20 scale-[1.02]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-full h-1 rounded-full bg-gradient-to-r ${opt.color} mb-2`} />
                  <p className="text-xs font-bold text-white truncate">{opt.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Enter Room Card */}
        <div className="lg:col-span-5">
          <div className="p-6 lg:p-8 rounded-[2.5rem] bg-zinc-950/80 border border-white/10 backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="space-y-6">
              {/* Alias Field */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-widest text-white/50">
                  Director Alias
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Christopher Nolan"
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-medium text-sm focus:outline-none focus:border-[var(--primary)] focus:bg-white/[0.07] transition-all"
                />
              </div>

              {/* Host Button */}
              <button
                onClick={handleHost}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-rose-500 hover:opacity-95 active:scale-[0.98] text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3 shadow-xl shadow-[var(--primary)]/25 transition-all"
              >
                <MonitorPlay className="w-5 h-5" />
                <span>Host New Session</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="absolute px-4 bg-zinc-950 text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">
                  OR ENTER ROOM CODE
                </span>
              </div>

              {/* Join Form */}
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  maxLength={6}
                  className="flex-1 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-center font-mono text-xl font-bold tracking-[0.25em] text-white focus:outline-none focus:border-[var(--primary)] transition-all"
                />
                <button
                  type="submit"
                  disabled={joinCode.trim().length < 4}
                  className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center"
                >
                  <LogIn className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
