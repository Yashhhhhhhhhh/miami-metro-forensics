import { useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Sparkles,
  Tv,
  Sliders,
  Radio,
  SlidersHorizontal
} from 'lucide-react'
import { useStore, type AspectRatio } from '../store/useStore'
import { formatTime } from '../lib/utils'
import { peerEngine } from '../lib/PeerEngine'
import { type EQPreset } from '../lib/AudioEngine'
import Scrubber from './Scrubber'
import AudioVisualizer from './AudioVisualizer'

interface ControlsProps {
  onPlayPause: () => void
  onSeek: (time: number) => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
}

export default function Controls({
  onPlayPause,
  onSeek,
  onToggleFullscreen,
  isFullscreen
}: ControlsProps) {
  const {
    currentTime,
    duration,
    isPaused,
    volume,
    isMuted,
    setVolume,
    toggleMute,
    eqPreset,
    setEQPreset,
    compressorEnabled,
    setCompressorEnabled,
    aspectRatio,
    setAspectRatio,
    ambilight,
    setAmbilight,
    isHost,
    triggerReaction,
    theme,
    crtScanlines,
    toggleCrtScanlines,
    cinemascopeMode,
    toggleCinemascopeMode,
    showTelemetry,
    toggleTelemetry
  } = useStore()

  const [showAudioStudio, setShowAudioStudio] = useState(false)

  const themeEmojis = {
    anime: ['🌸', '⚡', '🍙', '💢', '✨', '🦊'],
    music: ['🎵', '🎶', '🎸', '🎹', '🎧', '🔥'],
    cyberpunk: ['🤖', '⚡', '💻', '🛸', '👾', '💣'],
    cinema: ['🍿', '🎬', '❤️', '👏', '🏆', '🔥']
  }[theme] || ['❤️', '🔥', '😂', '🍿', '👏']

  const handleSkip = (delta: number) => {
    const target = Math.max(0, Math.min(duration, currentTime + delta))
    onSeek(target)
    if (isHost) {
      peerEngine.broadcast({ type: 'ACTION_SEEK', time: target })
    }
  }

  const cycleAspectRatio = () => {
    const modes: AspectRatio[] = ['contain', 'cover', 'fill']
    const next = modes[(modes.indexOf(aspectRatio) + 1) % modes.length]
    setAspectRatio(next)
  }

  const sendReaction = (emoji: string) => {
    triggerReaction(emoji)
    peerEngine.broadcast({ type: 'REACTION', emoji })
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Audio Studio Modal Popover */}
      {showAudioStudio && (
        <div className="mb-3 p-5 rounded-3xl bg-zinc-950/90 border border-white/10 backdrop-blur-2xl shadow-2xl animate-fade-in max-w-md mx-auto relative z-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Acoustic DSP Studio
            </h4>
            <button
              onClick={() => setShowAudioStudio(false)}
              className="text-xs text-white/50 hover:text-white px-2 py-1"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            {/* Equalizer Presets */}
            <div>
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block mb-2">
                Equalizer Profile
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['cinema', 'vocal', 'bass', 'iem', 'laptop', 'flat'] as EQPreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setEQPreset(p)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      eqPreset === p
                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-[1.02]'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Dialogue Booster Compressor */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <p className="text-xs font-bold text-white">Night Mode (Dialogue Enhancer)</p>
                <p className="text-[10px] text-white/50">Softens loud explosions, boosts whispering</p>
              </div>
              <button
                onClick={() => setCompressorEnabled(!compressorEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  compressorEnabled ? 'bg-[var(--primary)]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    compressorEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cinema Control Dock */}
      <div className="rounded-[2.5rem] p-4 lg:p-5 bg-zinc-950/85 border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col gap-2.5">
        {/* Theme-Specific Experience Ribbon */}
        <div className="flex items-center justify-between px-2 pb-1 border-b border-white/5">
          <div className="flex items-center gap-2">
            {theme === 'anime' && (
              <>
                <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-400 font-bold flex items-center gap-1.5 mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" /> アニメ VAULT
                </span>
                <button
                  onClick={() => handleSkip(85)}
                  className="px-2.5 py-1 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider transition-all"
                  title="Skip 85s Opening Song"
                >
                  Skip OP (+85s)
                </button>
                <button
                  onClick={() => handleSkip(90)}
                  className="px-2.5 py-1 rounded-xl bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-500/30 text-[10px] font-bold text-fuchsia-300 uppercase tracking-wider transition-all"
                  title="Skip 90s Ending Song"
                >
                  Skip ED (+90s)
                </button>
              </>
            )}

            {theme === 'music' && (
              <>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5 mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> SONIC LOUNGE
                </span>
                <button
                  onClick={() => setEQPreset(eqPreset === 'bass' ? 'flat' : 'bass')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    eqPreset === 'bass'
                      ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow-lg shadow-emerald-500/30'
                      : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  Sub-Bass Overdrive
                </button>
                <button
                  onClick={() => setEQPreset(eqPreset === 'vocal' ? 'flat' : 'vocal')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    eqPreset === 'vocal'
                      ? 'bg-emerald-500 text-black border-emerald-400 font-black shadow-lg shadow-emerald-500/30'
                      : 'bg-white/5 text-white/60 border-white/10'
                  }`}
                >
                  Vocal Focus
                </button>
              </>
            )}

            {theme === 'cyberpunk' && (
              <>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5 mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> CYBER // DECK
                </span>
                <button
                  onClick={toggleCrtScanlines}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                    crtScanlines
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                >
                  CRT Scanlines: {crtScanlines ? 'ACTIVE' : 'OFF'}
                </button>
                <button
                  onClick={toggleTelemetry}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                    showTelemetry
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                >
                  HUD Telemetry: {showTelemetry ? 'VISIBLE' : 'OFF'}
                </button>
              </>
            )}

            {theme === 'cinema' && (
              <>
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold flex items-center gap-1.5 mr-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> IMAX DCI-P3
                </span>
                <button
                  onClick={toggleCinemascopeMode}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    cinemascopeMode
                      ? 'bg-rose-500/25 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/20'
                      : 'bg-white/5 text-white/50 border-white/10'
                  }`}
                >
                  2.39:1 Cinemascope: {cinemascopeMode ? 'ENGAGED' : 'OFF'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scrubber Line */}
        <Scrubber onSeek={onSeek} />

        {/* Main Controls Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Playback & Timestamps */}
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={onPlayPause}
              className="p-3 lg:p-3.5 rounded-full bg-white text-zinc-950 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
              title={isPaused ? 'Play (Space)' : 'Pause (Space)'}
            >
              {isPaused ? <Play className="w-5 h-5 fill-current ml-0.5" /> : <Pause className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={() => handleSkip(-10)}
              className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSkip(10)}
              className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Fast-forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time Indicator */}
            <div className="font-mono text-xs text-white/80 font-medium pl-1">
              <span className="text-white font-bold">{formatTime(currentTime)}</span>
              <span className="text-white/30 mx-1.5">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Center: Live Music Visualizer (When in Music Mode or active audio) */}
          {theme === 'music' && (
            <div className="hidden md:block">
              <AudioVisualizer />
            </div>
          )}

          {/* Right: Sound, DSP, Ambilight, Aspect & Fullscreen */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Quick Reactions Bar */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-2xl bg-white/5 border border-white/5">
              {themeEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="hover:scale-125 active:scale-90 transition-transform text-sm p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Volume Control with 250% Overdrive Booster */}
            <div className="flex items-center gap-2 group/vol relative">
              <button
                onClick={toggleMute}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Mute / Unmute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume > 1.0 ? (
                  <Volume2 className="w-5 h-5 text-[var(--primary)]" />
                ) : volume > 0.4 ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <Volume1 className="w-5 h-5" />
                )}
              </button>

              <div className="w-20 lg:w-28 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="2.5"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
                />
              </div>

              {volume > 1.0 && !isMuted && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  {Math.round(volume * 100)}%
                </span>
              )}
            </div>

            {/* Audio Studio Toggle */}
            <button
              onClick={() => setShowAudioStudio(!showAudioStudio)}
              className={`p-2 rounded-xl transition-all ${
                showAudioStudio
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Acoustic DSP Studio"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Ambilight Toggle */}
            <button
              onClick={() => setAmbilight(!ambilight)}
              className={`p-2 rounded-xl transition-all ${
                ambilight
                  ? 'text-[var(--primary)] bg-[var(--primary)]/15 border border-[var(--primary)]/30'
                  : 'text-white/40 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle 360° Ambilight Glow"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Aspect Ratio */}
            <button
              onClick={cycleAspectRatio}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-mono font-bold uppercase transition-colors"
              title="Aspect Ratio (Fit / Fill / Stretch)"
            >
              {aspectRatio}
            </button>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
