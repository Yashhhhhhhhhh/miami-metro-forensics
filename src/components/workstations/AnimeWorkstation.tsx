import { useState } from 'react'
import { Camera, FastForward, SkipForward, Sparkles, BookOpen, Layers, MessageSquare } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { peerEngine } from '../../lib/PeerEngine'

export default function AnimeWorkstation({
  onSeek
}: {
  onSeek: (time: number) => void
}) {
  const {
    currentTime,
    duration,
    isHost,
    triggerReaction,
    subtitles,
    mediaTitle
  } = useStore()

  const [snapNotice, setSnapNotice] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'skip' | 'snap' | 'binge'>('skip')

  // Auto-Skip Opening / Ending / Recap
  const handleSkip = (seconds: number, label: string) => {
    const target = Math.max(0, Math.min(duration, currentTime + seconds))
    onSeek(target)
    if (isHost) {
      peerEngine.broadcast({ type: 'ACTION_SEEK', time: target })
    }
  }

  // Anime Frame Snapper (Canvas snapshot of current video + active subtitle)
  const handleCaptureFrame = () => {
    try {
      const video = document.querySelector('video')
      if (!video) {
        setSnapNotice('Capture only available on direct video / stream.')
        setTimeout(() => setSnapNotice(null), 2500)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Burn current active subtitle onto snapshot if present
      const activeCue = subtitles.find(c => currentTime >= c.start && currentTime <= c.end)
      if (activeCue) {
        ctx.font = 'bold 28px sans-serif'
        ctx.fillStyle = '#ffe600'
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 4
        ctx.textAlign = 'center'
        ctx.strokeText(activeCue.text, canvas.width / 2, canvas.height - 40)
        ctx.fillText(activeCue.text, canvas.width / 2, canvas.height - 40)
      }

      // Trigger automatic download
      const dataUrl = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `anime-snapshot-${Math.floor(currentTime)}s.png`
      a.click()

      setSnapNotice('Frame Snapshot Captured & Downloaded!')
      setTimeout(() => setSnapNotice(null), 2500)
    } catch (e) {
      setSnapNotice('Snapshot failed (CORS protected stream).')
      setTimeout(() => setSnapNotice(null), 2500)
    }
  }

  // Manga Reaction Emotes
  const animeReactions = [
    { text: '何?! NANI?!', emoji: '⚡' },
    { text: '凄い! SUGOI!', emoji: '✨' },
    { text: '草 WWWW', emoji: '🌿' },
    { text: '待って! MATTE!', emoji: '✋' },
    { text: '神回 GOD EP', emoji: '🔥' }
  ]

  const sendAnimeReaction = (r: { text: string; emoji: string }) => {
    triggerReaction(r.emoji)
    peerEngine.broadcast({ type: 'REACTION', emoji: r.emoji })
  }

  return (
    <div className="w-full bg-[#0e0a17] border-2 border-black p-3.5 shadow-[4px_4px_0px_#ff2a5f] select-none text-white font-syne">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-black pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#ffe600] text-black text-[10px] font-black uppercase tracking-wider border border-black shadow-[2px_2px_0px_#ff2a5f]">
            ANIME WORKSTATION
          </span>
          <span className="text-xs font-black uppercase text-[#ff2a5f] tracking-wide">
            TRANSLATION & BINGE SUITE // アニメ特化
          </span>
        </div>

        {/* Workstation Tabs */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          <button
            onClick={() => setActiveTab('skip')}
            className={`px-2.5 py-1 font-black uppercase transition-all ${
              activeTab === 'skip' ? 'bg-[#ff2a5f] text-white' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Auto-Skip
          </button>
          <button
            onClick={() => setActiveTab('snap')}
            className={`px-2.5 py-1 font-black uppercase transition-all ${
              activeTab === 'snap' ? 'bg-[#ff2a5f] text-white' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Frame Snapper
          </button>
          <button
            onClick={() => setActiveTab('binge')}
            className={`px-2.5 py-1 font-black uppercase transition-all ${
              activeTab === 'binge' ? 'bg-[#ff2a5f] text-white' : 'bg-black text-white/60 hover:text-white'
            }`}
          >
            Binge Queue
          </button>
        </div>
      </div>

      {/* Tab 1: Smart Anime Timing Skip Engine */}
      {activeTab === 'skip' && (
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSkip(85, 'Opening')}
              className="manga-btn px-3 py-1.5 bg-[#ff2a5f] text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              title="Skip standard 85-second Opening Theme"
            >
              <FastForward className="w-3.5 h-3.5 text-[#ffe600]" />
              <span>Skip OP (+85s)</span>
            </button>
            <button
              onClick={() => handleSkip(90, 'Ending')}
              className="manga-btn px-3 py-1.5 bg-[#ffe600] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              title="Skip standard 90-second Ending Theme"
            >
              <SkipForward className="w-3.5 h-3.5 text-black" />
              <span>Skip ED (+90s)</span>
            </button>
            <button
              onClick={() => handleSkip(120, 'Recap')}
              className="manga-btn px-3 py-1.5 bg-black text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/20"
              title="Skip 2-minute episode recap"
            >
              <span>Skip Recap (+120s)</span>
            </button>
          </div>

          {/* Anime Floating Reaction Soundboard */}
          <div className="flex items-center gap-1.5">
            {animeReactions.map((r) => (
              <button
                key={r.text}
                onClick={() => sendAnimeReaction(r)}
                className="px-2 py-1 bg-black text-[#ffe600] hover:bg-[#ff2a5f] hover:text-white border border-black text-[10px] font-black uppercase transition-all active:scale-95"
              >
                {r.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Anime Frame & Subtitle Snapper */}
      {activeTab === 'snap' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">1-Click Anime Frame & Subtitle Snapper</p>
            <p className="text-[10px] text-white/50">Grabs the current video frame with Japanese/English subtitles burned in.</p>
          </div>
          <button
            onClick={handleCaptureFrame}
            className="manga-btn px-4 py-2 bg-[#ff2a5f] text-white text-xs font-black uppercase tracking-wider flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-[#ffe600]" />
            <span>CAPTURE FRAME (PNG)</span>
          </button>
        </div>
      )}

      {/* Tab 3: Binge Episode Queue */}
      {activeTab === 'binge' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#ffe600] font-bold">CURRENT: EPISODE 01</span>
            <span className="text-white/30">•</span>
            <span className="text-white/60">NEXT: EPISODE 02 (Canon Arc)</span>
          </div>
          <button
            onClick={() => handleSkip(duration - currentTime - 5, 'Next Episode')}
            className="manga-btn px-3.5 py-1.5 bg-[#ffe600] text-black text-xs font-black uppercase tracking-wider"
          >
            Roll Next Episode // 次の回
          </button>
        </div>
      )}

      {/* Toast Notice */}
      {snapNotice && (
        <div className="mt-2 text-[10px] font-mono text-[#ffe600] font-bold animate-fade-in">
          {snapNotice}
        </div>
      )}
    </div>
  )
}
