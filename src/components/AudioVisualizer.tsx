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

    canvas.width = 300
    canvas.height = 80
    const bufferLength = 64
    const dataArray = new Uint8Array(bufferLength)

    let animId: number

    const draw = () => {
      animId = requestAnimationFrame(draw)
      audioEngine.getFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.2
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9

        // Dynamic theme gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        if (theme === 'music') {
          gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)')
          gradient.addColorStop(1, 'rgba(74, 222, 128, 0.9)')
        } else if (theme === 'anime') {
          gradient.addColorStop(0, 'rgba(217, 70, 239, 0.2)')
          gradient.addColorStop(1, 'rgba(244, 114, 182, 0.9)')
        } else {
          gradient.addColorStop(0, 'rgba(225, 29, 72, 0.2)')
          gradient.addColorStop(1, 'rgba(251, 113, 133, 0.9)')
        }

        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

        x += barWidth + 2
      }
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [theme, playMode])

  return (
    <div className="flex items-center justify-center p-2 opacity-80 hover:opacity-100 transition-opacity">
      <canvas ref={canvasRef} className="w-48 h-12 rounded-lg" />
    </div>
  )
}
