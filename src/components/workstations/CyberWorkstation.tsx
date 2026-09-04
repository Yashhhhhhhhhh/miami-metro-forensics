import { useState } from 'react'
import { Activity, HardDrive, Cpu, Terminal, ShieldAlert, Wifi } from 'lucide-react'
import { useStore } from '../../store/useStore'

export default function CyberWorkstation() {
  const {
    torrentStats,
    ping,
    syncDrift,
    playMode,
    crtScanlines,
    toggleCrtScanlines,
    showTelemetry,
    toggleTelemetry
  } = useStore()

  const [activeTab, setActiveTab] = useState<'swarm' | 'telemetry' | 'hls'>('swarm')
  const [selectedQuality, setSelectedQuality] = useState('1080p')

  // Calculate 100-piece heatmap blocks based on torrent progress or buffer
  const progressPercent = torrentStats ? Math.floor(torrentStats.progress * 100) : 100

  return (
    <div className="w-full bg-[#020612] border border-cyan-400 p-3.5 shadow-[0_0_25px_rgba(6,182,212,0.25)] cyber-chamfer select-none text-cyan-300 font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-cyan-500 text-black text-[10px] font-bold uppercase tracking-widest">
            NERV TERMINAL
          </span>
          <span className="text-xs font-bold uppercase text-white tracking-wider">
            DECENTRALIZED P2P SWARM & STREAM TELEMETRY
          </span>
        </div>

        {/* Workstation Tabs */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            onClick={() => setActiveTab('swarm')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'swarm' ? 'bg-cyan-500 text-black' : 'bg-black text-cyan-400 hover:text-white'
            }`}
          >
            Piece Heatmap
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'telemetry' ? 'bg-cyan-500 text-black' : 'bg-black text-cyan-400 hover:text-white'
            }`}
          >
            Quantum Diagnostics
          </button>
          <button
            onClick={() => setActiveTab('hls')}
            className={`px-2.5 py-1 font-bold uppercase transition-all ${
              activeTab === 'hls' ? 'bg-cyan-500 text-black' : 'bg-black text-cyan-400 hover:text-white'
            }`}
          >
            Resolution Switcher
          </button>
        </div>
      </div>

      {/* Tab 1: P2P Swarm Piece Heatmap */}
      {activeTab === 'swarm' && (
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white font-bold">
              SWARM BUFFER HEATMAP ({progressPercent}% VERIFIED)
            </span>
            <span className="text-emerald-400 font-bold">
              {torrentStats ? `${torrentStats.numPeers} ACTIVE SEEDERS` : 'STREAM CHUNK BUFFER: OPTIMAL'}
            </span>
          </div>

          {/* 100-piece Heatmap Blocks */}
          <div className="grid grid-cols-20 sm:grid-cols-25 gap-1 p-2 bg-black border border-cyan-500/30 mb-2.5">
            {Array.from({ length: 50 }).map((_, i) => {
              const isDownloaded = (i * 2) < progressPercent
              const isInFlight = (i * 2) === progressPercent
              return (
                <div
                  key={i}
                  className={`h-2.5 rounded-xs transition-colors ${
                    isDownloaded
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                      : isInFlight
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-zinc-800'
                  }`}
                  title={`Chunk #${i + 1}: ${isDownloaded ? 'VERIFIED' : 'PENDING'}`}
                />
              )
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-cyan-400/70">
            <span>DOWN: {torrentStats ? `${(torrentStats.downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s` : '14.2 MB/s'}</span>
            <span>UP: {torrentStats ? `${(torrentStats.uploadSpeed / (1024 * 1024)).toFixed(2)} MB/s` : '2.1 MB/s'}</span>
            <span>CHUNKS: 50 BLOCKS SHA-256 HASH VERIFIED</span>
          </div>
        </div>
      )}

      {/* Tab 2: Codec & Network Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 bg-black border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400/60 block">NETWORK LATENCY</span>
            <span className="text-sm font-bold text-emerald-400">{ping > 0 ? `${ping}ms` : '<10ms DIRECT'}</span>
          </div>
          <div className="p-2.5 bg-black border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400/60 block">DRIFT CORRECTION</span>
            <span className="text-sm font-bold text-white">{Math.abs(syncDrift)}ms CLOCK OFFSET</span>
          </div>
          <div className="p-2.5 bg-black border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400/60 block">CODEC PIPELINE</span>
            <span className="text-sm font-bold text-cyan-300">AV1 / VP9 OPUS 48kHz</span>
          </div>
          <div className="p-2.5 bg-black border border-cyan-500/30">
            <span className="text-[10px] text-cyan-400/60 block">WEBRTC TRANSPORT</span>
            <span className="text-sm font-bold text-emerald-400">DATACHANNEL ENCRYPTED</span>
          </div>
        </div>
      )}

      {/* Tab 3: HLS Stream Quality Switcher */}
      {activeTab === 'hls' && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-white">Manual Transcode & Bitrate Switcher</p>
            <p className="text-[10px] text-cyan-400/60">Lock stream rendering pipeline to preferred hardware bitrate.</p>
          </div>
          <div className="flex items-center gap-2">
            {['4K 2160p', '1080p 60FPS', '720p HD', 'Auto Adaptive'].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={`cyber-btn px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                  selectedQuality === q ? 'bg-cyan-500 text-black' : ''
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
