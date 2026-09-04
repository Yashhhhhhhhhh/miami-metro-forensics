import React, { useState, useRef, useCallback } from 'react'
import { useStore } from '../store/useStore'
import { formatTime } from '../lib/utils'
import { peerEngine } from '../lib/PeerEngine'

interface ScrubberProps {
  onSeek: (time: number) => void
}

export default function Scrubber({ onSeek }: ScrubberProps) {
  const { currentTime, duration, buffered, isHost, playMode } = useStore()
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPos, setHoverPos] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const isLiveStream = playMode === 'screenshare' || (duration <= 0 && playMode === 'url')

  const calculateTimeFromEvent = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current || duration <= 0) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    return ratio * duration
  }, [duration])

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0 || isLiveStream) return
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return

    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverPos(ratio * 100)
    setHoverTime(ratio * duration)

    if (isDragging) {
      const targetTime = ratio * duration
      onSeek(targetTime)
      if (isHost) {
        peerEngine.broadcast({ type: 'ACTION_SEEK', time: targetTime })
      }
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0 || isLiveStream) return
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const targetTime = calculateTimeFromEvent(e)
    onSeek(targetTime)
    if (isHost) {
      peerEngine.broadcast({ type: 'ACTION_SEEK', time: targetTime })
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false)
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
    }
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

  if (isLiveStream) {
    return (
      <div className="w-full flex items-center gap-3 py-1">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-400 animate-pulse" />
        </div>
        <span className="text-[10px] font-mono tracking-widest text-red-400 uppercase font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE BROADCAST
        </span>
      </div>
    )
  }

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setHoverTime(null)}
      className="relative w-full py-3 cursor-pointer group select-none touch-none"
    >
      {/* Background Track */}
      <div className="w-full h-1.5 group-hover:h-2.5 bg-white/15 rounded-full overflow-hidden relative transition-all duration-200">
        {/* Buffered Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-white/25 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, bufferedPercent)}%` }}
        />
        {/* Playback Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[var(--primary)] to-rose-400 rounded-full shadow-[0_0_15px_var(--primary-glow)] transition-all duration-75"
          style={{ width: `${Math.min(100, progressPercent)}%` }}
        />
      </div>

      {/* Halo Scrubber Thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[var(--primary)] shadow-[0_0_18px_var(--primary-glow)] opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-110 transition-all duration-150 pointer-events-none"
        style={{ left: `${progressPercent}%` }}
      />

      {/* Hover Time Tooltip with Caret */}
      {hoverTime !== null && (
        <div
          className="absolute -top-8 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-zinc-950/95 border border-[var(--primary)]/40 text-white font-mono text-[10px] font-bold tracking-wider shadow-2xl pointer-events-none backdrop-blur-xl animate-fade-in"
          style={{ left: `${hoverPos}%` }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  )
}
