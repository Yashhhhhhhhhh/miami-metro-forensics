import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

interface AmbilightProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export default function Ambilight({ videoRef }: AmbilightProps) {
  const { ambilight, playMode, isPaused } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!ambilight || playMode === 'idle') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    canvas.width = 160
    canvas.height = 90

    let animId: number
    let lastDraw = 0

    const render = (timestamp: number) => {
      const video = videoRef.current
      if (video && !video.paused && video.readyState >= 2) {
        if (timestamp - lastDraw > 40) { // ~25 FPS is plenty for smooth blurred ambilight
          try {
            ctx.drawImage(video, 0, 0, 160, 90)
          } catch {}
          lastDraw = timestamp
        }
      }
      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [ambilight, playMode, isPaused, videoRef])

  if (!ambilight || playMode === 'idle') return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="w-[125%] h-[125%] object-cover blur-[100px] opacity-70 transition-opacity duration-1000 scale-110"
      />
    </div>
  )
}
