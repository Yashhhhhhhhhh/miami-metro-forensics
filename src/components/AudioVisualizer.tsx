import { useEffect, useRef } from 'react'
import { audioEngine } from '../lib/AudioEngine'
import { useStore } from '../store/useStore'

export default function AudioVisualizer() {
  const { theme, playMode } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 320
    canvas.height = 70
    const bufferLength = 48
    const dataArray = new Uint8Array(bufferLength)
    const peakArray = new Float32Array(bufferLength) // Decaying peak markers

    let animId: number

    const draw = () => {
      animId = requestAnimationFrame(draw)
      audioEngine.getFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = Math.floor(canvas.width / bufferLength) - 1.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255
        const barHeight = Math.max(2, val * canvas.height * 0.88)

        // Peak decay gravity physics
        if (val > peakArray[i]) {
          peakArray[i] = val
        } else {
          peakArray[i] = Math.max(0, peakArray[i] - 0.015)
        }

        const peakY = canvas.height - peakArray[i] * canvas.height * 0.88 - 2

        // Dynamic theme gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        if (theme === 'music') {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
          gradient.addColorStop(0.6, 'rgba(52, 211, 153, 0.75)')
          gradient.addColorStop(1, 'rgba(167, 243, 208, 0.95)')
        } else if (theme === 'anime') {
          gradient.addColorStop(0, 'rgba(217, 70, 239, 0.25)')
          gradient.addColorStop(0.6, 'rgba(236, 72, 153, 0.75)')
          gradient.addColorStop(1, 'rgba(251, 207, 232, 0.95)')
        } else if (theme === 'cyberpunk') {
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)')
          gradient.addColorStop(0.6, 'rgba(59, 130, 246, 0.75)')
          gradient.addColorStop(1, 'rgba(191, 219, 254, 0.95)')
        } else {
          gradient.addColorStop(0, 'rgba(225, 29, 72, 0.25)')
          gradient.addColorStop(0.6, 'rgba(244, 63, 94, 0.75)')
          gradient.addColorStop(1, 'rgba(254, 205, 211, 0.95)')
        }

        // Draw EQ Bar with rounded top
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, [2, 2, 0, 0])
        ctx.fill()

        // Draw Decaying Floating Peak Indicator
        if (peakArray[i] > 0.05) {
          ctx.fillStyle = theme === 'music' ? '#34d399' : theme === 'cyberpunk' ? '#38bdf8' : '#fda4af'
          ctx.fillRect(x, Math.max(0, peakY), barWidth, 1.5)
        }

        x += barWidth + 2.5
      }
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [theme, playMode])

  return (
    <div className="flex flex-col items-center justify-center p-1.5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
      <canvas ref={canvasRef} className="w-48 h-10 rounded-md" />
      <div className="w-full flex items-center justify-between px-2 pt-0.5 text-[8px] font-mono text-white/40 tracking-wider">
        <span>20Hz</span>
        <span className="text-[7px] text-emerald-400 font-bold uppercase tracking-widest">
          {theme === 'music' ? 'HI-RES // 48kHz' : 'ACOUSTIC DSP'}
        </span>
        <span>20kHz</span>
      </div>
    </div>
  )
}
