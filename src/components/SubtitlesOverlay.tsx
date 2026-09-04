import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { getCurrentSubtitle } from '../lib/SubtitleEngine'

export default function SubtitlesOverlay() {
  const {
    subtitles,
    subtitlesEnabled,
    subtitleOffset,
    subtitleFontSize,
    currentTime
  } = useStore()

  const currentText = useMemo(() => {
    if (!subtitlesEnabled || subtitles.length === 0) return ''
    return getCurrentSubtitle(subtitles, currentTime, subtitleOffset)
  }, [subtitles, subtitlesEnabled, currentTime, subtitleOffset])

  if (!currentText) return null

  const sizeClass =
    subtitleFontSize === 'sm'
      ? 'text-sm sm:text-base'
      : subtitleFontSize === 'lg'
      ? 'text-xl sm:text-2xl lg:text-3xl font-semibold'
      : 'text-base sm:text-xl lg:text-2xl font-medium'

  return (
    <div className="absolute bottom-24 lg:bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-100 max-w-[90vw] sm:max-w-3xl text-center px-4">
      <div className="inline-block bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <p
          className={`text-white text-center leading-relaxed whitespace-pre-line tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${sizeClass}`}
        >
          {currentText}
        </p>
      </div>
    </div>
  )
}
