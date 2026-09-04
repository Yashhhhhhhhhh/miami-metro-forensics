import { useState, useEffect, useRef } from 'react'
import {
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Film,
  Wifi,
  Activity,
  Maximize2,
  Tv
} from 'lucide-react'
import { useStore, type Theme } from '../store/useStore'
import { peerEngine } from '../lib/PeerEngine'
import Player from './Player'
import Controls from './Controls'
import Sidebar from './Sidebar'
import Catalog from './Catalog'

export default function Theater() {
  const {
    roomCode,
    isHost,
    mediaTitle,
    isPaused,
    setSidebarOpen,
    sidebarOpen,
    setActiveSidebarTab,
    theme,
    setTheme,
    ping,
    syncDrift,
    chatMessages,
    viewMode,
    setViewMode
  } = useStore()

  const [copied, setCopied] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hudToast, setHudToast] = useState<string | null>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastMsgCountRef = useRef(chatMessages.length)

  // Listen to system room events for Floating HUD notifications
  useEffect(() => {
    if (chatMessages.length > lastMsgCountRef.current) {
      const latest = chatMessages[chatMessages.length - 1]
      if (latest && latest.isSystem) {
        setHudToast(latest.text)
        const timer = setTimeout(() => setHudToast(null), 3500)
        return () => clearTimeout(timer)
      }
    }
    lastMsgCountRef.current = chatMessages.length
  }, [chatMessages])

  const copyRoomCode = () => {
    if (roomCode) {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePlayPause = () => {
    if (isPaused) {
      peerEngine.broadcast({ type: 'ACTION_PLAY' })
      if (peerEngine.onPlay) peerEngine.onPlay()
    } else {
      peerEngine.broadcast({ type: 'ACTION_PAUSE' })
      if (peerEngine.onPause) peerEngine.onPause()
    }
  }

  const handleSeek = (time: number) => {
    if (peerEngine.onSeek) peerEngine.onSeek(time)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Auto-hide controls on inactivity
  const handleMouseMove = () => {
    setControlsVisible(true)
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      if (!isPaused) {
        setControlsVisible(false)
      }
    }, 3500)
  }

  // Keyboard Shortcuts (Space, F, M, Left/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          handlePlayPause()
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'c':
          e.preventDefault()
          setSidebarOpen(!sidebarOpen)
          break
        case 'arrowleft':
          e.preventDefault()
          handleSeek(Math.max(0, (window.getExactCurrentTime?.() || 0) - 10))
          break
        case 'arrowright':
          e.preventDefault()
          handleSeek((window.getExactCurrentTime?.() || 0) + 10)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPaused, sidebarOpen])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="w-full h-full relative overflow-hidden bg-black flex select-none"
    >
      {/* Central Viewport: Auditorium Cinema Screen OR Streaming Catalog */}
      <div className="flex-1 h-full relative overflow-hidden flex flex-col justify-between">
        {viewMode === 'catalog' ? (
          <Catalog />
        ) : (
          <Player />
        )}

        {/* Top Floating Cinema HUD */}
        <header
          className={`absolute top-0 left-0 right-0 p-5 lg:p-6 z-30 flex items-center justify-between pointer-events-none transition-all duration-300 ${
            controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          {/* Left: Host/Viewer Badge & Room Code */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <div className={theme === 'anime'
              ? "px-4 py-2 bg-[#0e0a17] border-2 border-black shadow-[3px_3px_0px_#ff2a5f] flex items-center gap-3"
              : "px-4 py-2 rounded-2xl bg-zinc-950/85 border border-white/10 backdrop-blur-xl shadow-xl flex items-center gap-3"}>
              <span className="text-xs font-black uppercase tracking-widest text-[var(--primary)] flex items-center gap-2 font-syne">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
                {isHost ? (theme === 'anime' ? '主催 HOST' : 'Host Director') : (theme === 'anime' ? '観客 VIEWER' : 'Viewer')}
              </span>
              <div className="w-px h-4 bg-white/20" />
              <span className="font-mono text-base font-black tracking-[0.2em] text-white">
                {roomCode}
              </span>
              <button
                onClick={copyRoomCode}
                className={theme === 'anime'
                  ? "manga-btn px-2.5 py-1 bg-[#ffe600] text-black font-black text-xs uppercase"
                  : "px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all flex items-center gap-1.5"}
                title="Copy Direct Invite Link"
              >
                {copied ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">COPIED</span>
                ) : (
                  <span className="text-[10px] font-mono font-bold">INVITE</span>
                )}
              </button>
            </div>

            {/* Sync Diagnostics Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-none bg-black border border-white/10 text-[11px] font-mono font-medium text-white/70">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>{ping > 0 ? `${ping}ms` : 'Direct Link'}</span>
              <span className="text-white/20">•</span>
              <span className="text-white/50">{Math.abs(syncDrift)}ms drift</span>
            </div>
          </div>

          {/* Center: Top View Switcher (Auditorium Screen vs Streaming Catalog) */}
          <div className="pointer-events-auto flex items-center p-1 bg-black/90 border-2 border-black shadow-[3px_3px_0px_#ff2a5f]">
            <button
              onClick={() => setViewMode('auditorium')}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all font-syne ${
                viewMode === 'auditorium'
                  ? 'bg-[#ffe600] text-black shadow-[2px_2px_0px_#000000]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{theme === 'anime' ? 'スクリーン AUDITORIUM' : 'Screen'}</span>
            </button>
            <button
              onClick={() => setViewMode('catalog')}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all font-syne ${
                viewMode === 'catalog'
                  ? 'bg-[#ff2a5f] text-white shadow-[2px_2px_0px_#000000]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>{theme === 'anime' ? 'カタログ CATALOG' : 'Catalog'}</span>
            </button>
          </div>

          {/* Floating Ambient HUD Notification */}
          {hudToast && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-fade-in">
              <div className="px-4 py-2 bg-[#0e0a17] border-2 border-black shadow-[4px_4px_0px_#ff2a5f] text-xs font-mono text-white flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#ff2a5f] animate-ping" />
                <span className="text-[10px] text-yellow-300 uppercase tracking-widest font-bold">EVENT //</span>
                <span className="font-semibold text-white/90">{hudToast}</span>
              </div>
            </div>
          )}

          {/* Right: Mode Selector & Sidebar Toggle */}
          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Thematic Dimension Switcher */}
            <div className="hidden lg:flex items-center p-0.5 bg-black border border-white/20 text-[10px] font-mono font-bold">
              {[
                { id: 'anime', label: '🌸 ANIME' },
                { id: 'cinema', label: '🎞️ CINEMA' },
                { id: 'cyberpunk', label: '⚡ CYBER' },
                { id: 'music', label: '🎛️ HI-FI' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTheme(m.id as Theme)}
                  className={`px-2 py-1 transition-all uppercase ${
                    theme === m.id
                      ? 'bg-[#ff2a5f] text-white font-black'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Open Media Deck */}
            {isHost && (
              <button
                onClick={() => {
                  setActiveSidebarTab('media')
                  setSidebarOpen(true)
                }}
                className={theme === 'anime'
                  ? "manga-btn px-3 py-1.5 bg-[#0e0a17] text-white flex items-center gap-2 text-xs font-black uppercase tracking-wider"
                  : "px-3 py-2 rounded-xl bg-zinc-950/80 border border-white/10 backdrop-blur-xl text-white/80 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider"}
              >
                <Film className="w-4 h-4 text-[var(--primary)]" />
                <span>{theme === 'anime' ? 'デッキ DECK' : 'Media Deck'}</span>
              </button>
            )}

            {/* Open Sidebar (Chat / Roster) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={theme === 'anime'
                ? "manga-btn p-2 bg-[#ffe600] text-black font-black"
                : `p-2.5 rounded-xl border transition-all ${
                    sidebarOpen
                      ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-lg'
                      : 'bg-zinc-950/80 border-white/10 text-white/80 hover:text-white backdrop-blur-xl'
                  }`}
              title="Toggle Sidebar"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Bottom Cinema Controls Pill (Only visible in auditorium view) */}
        {viewMode === 'auditorium' && (
          <div
            className={`absolute bottom-6 left-0 right-0 z-30 transition-all duration-300 pointer-events-auto ${
              controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
            }`}
          >
            <Controls
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>
        )}
      </div>

      {/* Slide-out Cinema Sidebar */}
      <Sidebar />
    </div>
  )
}
