import { useState, useRef } from 'react'
import {
  X,
  MessageSquare,
  Users,
  Film,
  Send,
  Upload,
  Monitor,
  Check,
  Copy,
  Activity,
  HardDrive,
  Smartphone,
  Laptop
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { peerEngine } from '../lib/PeerEngine'

export default function Sidebar() {
  const {
    sidebarOpen,
    setSidebarOpen,
    activeSidebarTab,
    setActiveSidebarTab,
    chatMessages,
    addMessage,
    peers,
    alias,
    isHost,
    roomCode,
    ping,
    syncDrift,
    setMedia
  } = useStore()

  const [chatInput, setChatInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [torrentInput, setTorrentInput] = useState('')
  const [copied, setCopied] = useState(false)
  const localFileInputRef = useRef<HTMLInputElement>(null)
  const dualSyncInputRef = useRef<HTMLInputElement>(null)
  const torrentFileInputRef = useRef<HTMLInputElement>(null)

  const handleTorrentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!torrentInput.trim()) return

    const magnet = torrentInput.trim()
    setMedia('torrent', 'P2P BitTorrent Stream', magnet)
    if (isHost) {
      peerEngine.broadcast({
        type: 'STATE',
        mode: 'torrent',
        title: 'P2P BitTorrent Stream',
        url: magnet,
        time: 0,
        paused: false,
        serverTime: Date.now()
      })
    }
    setTorrentInput('')
  }

  const handleTorrentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileUrl = URL.createObjectURL(file)
    setMedia('torrent', file.name, fileUrl)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const text = chatInput.trim()
    addMessage({ id: Math.random().toString(36), sender: alias, text })
    peerEngine.broadcast({ type: 'CHAT', text, name: alias })
    setChatInput('')
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim()) return

    const isYt = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(urlInput)
    const mode = isYt ? 'youtube' : 'url'
    const title = isYt ? 'YouTube Stream' : 'Web Stream'

    setMedia(mode, title, urlInput.trim())
    peerEngine.broadcast({
      type: 'STATE',
      mode,
      title,
      url: urlInput.trim(),
      time: 0,
      paused: false,
      serverTime: Date.now()
    })
    setUrlInput('')
  }

  const handleLocalFileStream = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setMedia('local_stream', file.name, objectUrl)
  }

  const handleDualSyncMount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setMedia('local_sync', `Bit-Perfect Sync: ${file.name}`, objectUrl)
    if (isHost) {
      peerEngine.broadcast({
        type: 'LOCAL_FILE_OFFER',
        fileName: file.name,
        fileSize: file.size
      })
    }
  }

  const handleScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      })

      setMedia('screenshare', 'Screen & Audio Broadcast', '')
      peerEngine.broadcastMediaStream(stream, 'Screen & Audio Broadcast')

      stream.getVideoTracks()[0].onended = () => {
        peerEngine.stopActiveMediaStream()
        setMedia('idle', 'Theater Standby', '')
      }
    } catch (err) {
      console.warn('Screen share canceled:', err)
    }
  }

  const copyCode = () => {
    if (roomCode) {
      const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`
      navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const requestSync = () => {
    peerEngine.broadcast({ type: 'REQ_SYNC' })
  }

  if (!sidebarOpen) return null

  return (
    <aside className="w-80 lg:w-96 h-full bg-zinc-950/95 border-l border-white/10 backdrop-blur-3xl z-40 flex flex-col shadow-2xl animate-slide-left">
      {/* Header with Tabs */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex gap-2">
          {(['chat', 'roster', 'media'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSidebarTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeSidebarTab === tab
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'chat' && <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Chat</span>}
              {tab === 'roster' && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Roster ({Object.keys(peers).length + 1})</span>}
              {tab === 'media' && <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" /> Media</span>}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* TAB 1: LIVE CHAT */}
        {activeSidebarTab === 'chat' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {chatMessages.map((msg) => {
                const isMe = msg.sender === alias
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="text-center py-1">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/50 font-mono tracking-wider">
                        {msg.text}
                      </span>
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                        {msg.sender}
                      </span>
                      <span className="text-[9px] text-white/30 font-mono">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ${
                        isMe
                          ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                          : 'bg-white/10 text-white/90 border border-white/5'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })}
            </div>

            <form onSubmit={handleSendMessage} className="mt-3 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Say something to the theater..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--primary)] transition-all"
              />
              <button
                type="submit"
                className="p-2.5 rounded-2xl bg-[var(--primary)] text-white hover:scale-105 active:scale-95 transition-transform"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: ROSTER & DIAGNOSTICS */}
        {activeSidebarTab === 'roster' && (
          <div className="space-y-4">
            {/* Sync Diagnostics Pill */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> P2P Health
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {ping > 0 ? `${ping}ms RTT` : 'Direct Sync'}
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Clock Drift: <span className="font-mono text-white">{syncDrift}ms</span>
              </p>
              {!isHost && (
                <button
                  onClick={requestSync}
                  className="w-full mt-2 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                >
                  Force Resync Frame
                </button>
              )}
            </div>

            {/* Room Code Card */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/40 block">Room Invite Code</span>
                <span className="font-mono text-xl font-black text-white tracking-[0.2em]">{roomCode}</span>
              </div>
              <button
                onClick={copyCode}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Viewers List */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                Audience
              </span>

              {/* Self */}
              <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center font-bold text-xs text-white">
                    {alias.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      {alias} <span className="text-[10px] text-[var(--primary)]">(You)</span>
                    </p>
                    <p className="text-[10px] text-white/50">{isHost ? 'Session Host' : 'Viewer'}</p>
                  </div>
                </div>
                {isHost && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 text-[10px] font-bold text-[var(--primary)] uppercase">
                    Host
                  </span>
                )}
              </div>

              {/* Peers */}
              {Object.values(peers).map((peer) => (
                <div
                  key={peer.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white/80">
                      {peer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{peer.name}</p>
                      <p className="text-[10px] text-white/40 flex items-center gap-1">
                        {peer.device === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
                        {peer.device || 'desktop'}
                      </p>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA DECK */}
        {activeSidebarTab === 'media' && (
          <div className="space-y-5">
            {/* Stream via URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] flex items-center gap-2">
                <Film className="w-4 h-4" /> Direct Web Stream / YouTube
              </label>
              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Paste YouTube, MP4, HLS (.m3u8)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold"
                >
                  Play
                </button>
              </form>
            </div>

            <div className="w-full border-t border-white/10" />

            {/* P2P BitTorrent & Magnet Streamer */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> BitTorrent / Magnet P2P Streamer
              </label>
              <p className="text-[11px] text-white/50">
                Streams video directly from P2P torrent swarms using in-browser WebTorrent. Transcodes live to room viewers.
              </p>
              <form onSubmit={handleTorrentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={torrentInput}
                  onChange={(e) => setTorrentInput(e.target.value)}
                  placeholder="magnet:?xt=urn:btih:..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 font-mono text-[11px]"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-colors"
                >
                  Stream
                </button>
              </form>
              <input
                ref={torrentFileInputRef}
                type="file"
                accept=".torrent"
                onChange={handleTorrentFileUpload}
                className="hidden"
              />
              <button
                onClick={() => torrentFileInputRef.current?.click()}
                className="w-full py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Or Load .torrent File
              </button>
            </div>

            <div className="w-full border-t border-white/10" />

            {/* Local Media Streamer (Mobile-Compatible Transcoder) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Universal WebRTC Broadcaster
              </label>
              <p className="text-[11px] text-white/50">
                Transcodes any local movie (.mp4, .mkv, .webm) into a smooth WebRTC live feed for all connected phones & laptops.
              </p>
              <input
                ref={localFileInputRef}
                type="file"
                accept="video/*"
                onChange={handleLocalFileStream}
                className="hidden"
              />
              <button
                onClick={() => localFileInputRef.current?.click()}
                className="w-full py-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                <Upload className="w-4 h-4" /> Choose Movie to Broadcast
              </button>
            </div>

            <div className="w-full border-t border-white/10" />

            {/* Bit-Perfect 4K Dual-Sync */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4" /> Bit-Perfect Dual-Local Sync
              </label>
              <p className="text-[11px] text-white/50">
                Both parties select the same movie file on their device. Zero internet bandwidth usage, 4K/HDR bit-for-bit lossless, synced to the millisecond.
              </p>
              <input
                ref={dualSyncInputRef}
                type="file"
                accept="video/*"
                onChange={handleDualSyncMount}
                className="hidden"
              />
              <button
                onClick={() => dualSyncInputRef.current?.click()}
                className="w-full py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10"
              >
                <HardDrive className="w-4 h-4" /> Mount Local Copy
              </button>
            </div>

            <div className="w-full border-t border-white/10" />

            {/* Screen & Audio Share */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <Monitor className="w-4 h-4" /> Screen & System Audio Share
              </label>
              <p className="text-[11px] text-white/50">
                Play in VLC media player and capture with uncompressed 48kHz audio.
              </p>
              <button
                onClick={handleScreenShare}
                className="w-full py-3 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/10"
              >
                <Monitor className="w-4 h-4" /> Start Screen Share
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
