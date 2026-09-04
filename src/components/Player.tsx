import { useEffect, useRef, useState, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { useStore } from '../store/useStore'
import { peerEngine } from '../lib/PeerEngine'
import { audioEngine } from '../lib/AudioEngine'
import { torrentEngine } from '../lib/TorrentEngine'
import { Film, HardDrive, Upload } from 'lucide-react'
import Ambilight from './Ambilight'
import Reactions from './Reactions'
import SubtitlesOverlay from './SubtitlesOverlay'
import { parseSubtitles } from '../lib/SubtitleEngine'
import { AnimeSpeedlines, MangaDoodles, AnimeMascot } from './AnimeElements'
import {
  CinemaClapperboard,
  FilmstripBorder,
  FilmLeaderCountdown,
  NervTacticalCard,
  AnalogVuMeter,
  VacuumTubeGlow
} from './ThemeDoodles'

export default function Player() {
  const {
    playMode,
    mediaUrl,
    volume,
    isMuted,
    isHost,
    mediaTitle,
    aspectRatio,
    updatePlayback,
    setMedia,
    theme,
    crtScanlines,
    cinemascopeMode,
    showTelemetry,
    ping,
    syncDrift,
    torrentStats,
    setTorrentStats,
    setSubtitles,
    filmGrain,
    setSidebarOpen,
    setActiveSidebarTab
  } = useStore()

  const nativeVideoRef = useRef<HTMLVideoElement>(null)
  const reactPlayerRef = useRef<any>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const transcodeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const transcodeAnimRef = useRef<number | null>(null)

  // Global window time getters for P2P sync
  const getCurrentTime = useCallback(() => {
    if (playMode === 'youtube' || playMode === 'url') {
      const p = reactPlayerRef.current as any
      if (p && typeof p.getCurrentTime === 'function') {
        try { return p.getCurrentTime() || 0 } catch {}
      }
      return useStore.getState().currentTime || 0
    }
    return nativeVideoRef.current?.currentTime || 0
  }, [playMode])

  const getDuration = useCallback(() => {
    if (playMode === 'youtube' || playMode === 'url') {
      const p = reactPlayerRef.current as any
      if (p && typeof p.getDuration === 'function') {
        try { return p.getDuration() || 0 } catch {}
      }
      return useStore.getState().duration || 0
    }
    return nativeVideoRef.current?.duration || 0
  }, [playMode])

  useEffect(() => {
    window.getExactCurrentTime = getCurrentTime
    window.getExactDuration = getDuration
  }, [getCurrentTime, getDuration])

  // Wire up peerEngine hooks
  useEffect(() => {
    peerEngine.onRemoteStream = (stream) => {
      setRemoteStream(stream)
    }

    peerEngine.onSeek = (time: number) => {
      if (playMode === 'youtube' || playMode === 'url') {
        const p = reactPlayerRef.current as any
        if (p && typeof p.seekTo === 'function') {
          try { p.seekTo(time, 'seconds') } catch {}
        }
      } else if (nativeVideoRef.current && playMode !== 'screenshare') {
        nativeVideoRef.current.currentTime = time
      }
    }

    peerEngine.onPlay = () => {
      if (playMode === 'youtube' || playMode === 'url') {
        // Handled by state
      } else if (nativeVideoRef.current) {
        audioEngine.resume()
        nativeVideoRef.current.play().catch(() => {})
      }
    }

    peerEngine.onPause = () => {
      if (nativeVideoRef.current) {
        nativeVideoRef.current.pause()
      }
    }

    peerEngine.onDriftAdjust = (rate: number) => {
      if (nativeVideoRef.current) {
        nativeVideoRef.current.playbackRate = rate
      }
    }
  }, [playMode])

  // Wire WebRTC remote incoming stream into video element
  useEffect(() => {
    if (!isHost && (playMode === 'local_stream' || playMode === 'screenshare') && nativeVideoRef.current && remoteStream) {
      nativeVideoRef.current.srcObject = remoteStream
      nativeVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream, isHost, playMode])

  // Host Universal WebRTC Broadcaster (Canvas Hardware Transcoder)
  useEffect(() => {
    if (isHost && playMode === 'local_stream' && mediaUrl && nativeVideoRef.current) {
      const video = nativeVideoRef.current
      video.src = mediaUrl
      video.load()

      video.onloadeddata = () => {
        audioEngine.init(video)
        video.play().catch(() => {})

        // Set up 720p hardware canvas stream for mobile compatibility
        const canvas = document.createElement('canvas')
        transcodeCanvasRef.current = canvas
        const ctx = canvas.getContext('2d', { alpha: false })

        const targetW = 1280
        const targetH = 720
        canvas.width = targetW
        canvas.height = targetH

        const renderFrame = () => {
          if (video.readyState >= 2 && ctx) {
            ctx.drawImage(video, 0, 0, targetW, targetH)
          }
          transcodeAnimRef.current = requestAnimationFrame(renderFrame)
        }
        renderFrame()

        try {
          const videoStream = canvas.captureStream(30)
          const audioTrack = audioEngine.getAudioTrack()

          const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()]
          if (audioTrack) {
            tracks.push(audioTrack)
          } else if ((video as any).captureStream) {
            const nativeStream = (video as any).captureStream()
            if (nativeStream.getAudioTracks().length > 0) {
              tracks.push(nativeStream.getAudioTracks()[0])
            }
          }

          const combinedStream = new MediaStream(tracks)
          peerEngine.broadcastMediaStream(combinedStream, mediaTitle)
        } catch (err) {
          console.warn('Canvas captureStream error:', err)
        }
      }

      return () => {
        if (transcodeAnimRef.current) cancelAnimationFrame(transcodeAnimRef.current)
      }
    }
  }, [isHost, playMode, mediaUrl, mediaTitle])

  // In-Browser WebTorrent Streaming Hook
  useEffect(() => {
    if (playMode === 'torrent' && mediaUrl && nativeVideoRef.current) {
      const video = nativeVideoRef.current
      audioEngine.init(video)

      torrentEngine.stream(mediaUrl, video, (stats) => {
        setTorrentStats(stats)
      }).then((fileName) => {
        // If Host, start canvas WebRTC broadcast so mobile peers can watch
        if (isHost) {
          setTimeout(() => {
            if (video && !video.paused) {
              try {
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d', { alpha: false })
                canvas.width = 1280
                canvas.height = 720
                const renderFrame = () => {
                  if (video.readyState >= 2 && ctx) {
                    ctx.drawImage(video, 0, 0, 1280, 720)
                  }
                  requestAnimationFrame(renderFrame)
                }
                renderFrame()
                const stream = canvas.captureStream(30)
                const audioTrack = audioEngine.getAudioTrack()
                const tracks = [...stream.getVideoTracks()]
                if (audioTrack) tracks.push(audioTrack)
                peerEngine.broadcastMediaStream(new MediaStream(tracks), fileName)
              } catch (e) {
                console.warn('Torrent WebRTC broadcast notice:', e)
              }
            }
          }, 1500)
        }
      }).catch((err) => {
        console.warn('Torrent streaming error:', err)
      })

      return () => {
        torrentEngine.stop()
        setTorrentStats(null)
      }
    }
  }, [playMode, mediaUrl, isHost])

  // Native Video Time Update Listener
  const handleNativeTimeUpdate = () => {
    if (!nativeVideoRef.current) return
    const cur = nativeVideoRef.current.currentTime
    const dur = nativeVideoRef.current.duration || 0
    const paused = nativeVideoRef.current.paused

    let buffered = 0
    if (nativeVideoRef.current.buffered.length > 0) {
      buffered = nativeVideoRef.current.buffered.end(nativeVideoRef.current.buffered.length - 1)
    }

    updatePlayback(cur, dur, paused, buffered)
  }

  // ReactPlayer Time Update Listener
  const handleReactPlayerProgress = (state: { playedSeconds: number; loadedSeconds: number }) => {
    const p = reactPlayerRef.current as any
    const dur = (p && typeof p.getDuration === 'function') ? p.getDuration() : useStore.getState().duration || 0
    updatePlayback(state.playedSeconds, dur, false, state.loadedSeconds)
  }

  const isUrlMode = playMode === 'youtube' || playMode === 'url'
  const isNativeMode = playMode === 'local_stream' || playMode === 'local_sync' || playMode === 'screenshare' || playMode === 'torrent'

  // Dynamic aspect ratio class
  const aspectClass =
    aspectRatio === 'cover'
      ? 'object-cover'
      : aspectRatio === 'fill'
      ? 'object-fill'
      : 'object-contain'

  const PlayerComponent = ReactPlayer as any

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && (file.name.endsWith('.srt') || file.name.endsWith('.vtt') || file.name.endsWith('.txt'))) {
      try {
        const text = await file.text()
        const cues = parseSubtitles(text)
        if (cues.length > 0) {
          setSubtitles(cues, file.name)
          if (isHost) {
            peerEngine.broadcast({
              type: 'SUBTITLES_LOAD',
              cues,
              fileName: file.name
            })
          }
        }
      } catch (err) {
        console.warn('Failed to parse dropped subtitle file:', err)
      }
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="absolute inset-0 z-10 bg-black flex items-center justify-center overflow-hidden"
    >
      {/* 360° Dynamic Ambilight Lighting */}
      <Ambilight videoRef={nativeVideoRef} />

      {/* Floating Reactions Burst Layer */}
      <Reactions />

      {/* Synchronized Subtitles Overlay */}
      <SubtitlesOverlay />

      {/* 35mm Analog Film Grain Filter */}
      {filmGrain && <div className="film-grain" />}

      {/* Cyberpunk CRT Scanline Layer */}
      {theme === 'cyberpunk' && crtScanlines && (
        <div className="absolute inset-0 z-20 pointer-events-none crt-scanlines opacity-50" />
      )}

      {/* Cyberpunk Live Neural Telemetry HUD */}
      {theme === 'cyberpunk' && showTelemetry && (
        <div className="absolute top-20 left-6 z-30 pointer-events-none p-3.5 rounded-2xl bg-black/85 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 backdrop-blur-xl space-y-1 shadow-[0_0_25px_rgba(6,182,212,0.2)] animate-fade-in">
          <div className="flex items-center gap-2 font-bold border-b border-cyan-500/30 pb-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>NEURAL // TELEMETRY HUD</span>
          </div>
          <p>FEED: <span className="text-white font-bold">{playMode.toUpperCase()}</span></p>
          <p>CODEC: <span className="text-white font-bold">VP8 / OPUS 48kHz</span></p>
          <p>RES: <span className="text-white font-bold">1280x720 (30 FPS)</span></p>
          <p>LATENCY: <span className="text-emerald-400 font-bold">{ping > 0 ? `${ping}ms` : '<10ms DIRECT'}</span></p>
          <p>DRIFT OFFSET: <span className="text-white font-bold">{syncDrift}ms</span></p>
        </div>
      )}

      {/* Cinema 2.39:1 IMAX Anamorphic Letterbox Bars */}
      {theme === 'cinema' && cinemascopeMode && (
        <>
          <div className="absolute top-0 left-0 right-0 h-10 lg:h-14 bg-black z-20 pointer-events-none shadow-2xl transition-all" />
          <div className="absolute bottom-0 left-0 right-0 h-10 lg:h-14 bg-black z-20 pointer-events-none shadow-2xl transition-all" />
        </>
      )}

      {/* Live P2P BitTorrent Swarm Telemetry HUD */}
      {playMode === 'torrent' && torrentStats && (
        <div className="absolute top-20 right-6 z-30 pointer-events-none p-3.5 rounded-2xl bg-black/85 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 backdrop-blur-xl space-y-1 shadow-[0_0_25px_rgba(16,185,129,0.2)] animate-fade-in">
          <div className="flex items-center gap-2 font-bold border-b border-emerald-500/20 pb-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>BITTORRENT SWARM // P2P</span>
          </div>
          <p>FILE: <span className="text-white font-bold max-w-[180px] truncate inline-block align-bottom">{torrentStats.name}</span></p>
          <p>CONNECTED PEERS: <span className="text-white font-bold">{torrentStats.numPeers} seeders</span></p>
          <p>DOWNLOAD SPEED: <span className="text-white font-bold">{(torrentStats.downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s</span></p>
          <p>BUFFER PROGRESS: <span className="text-emerald-400 font-bold">{(torrentStats.progress * 100).toFixed(1)}%</span></p>
        </div>
      )}

      {/* URL / YouTube Streaming Engine */}
      {isUrlMode && (
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <PlayerComponent
            ref={reactPlayerRef}
            url={mediaUrl}
            width="100%"
            height="100%"
            playing={true}
            volume={isMuted ? 0 : Math.min(1.0, volume)}
            controls={false}
            onProgress={handleReactPlayerProgress as any}
            onEnded={() => {
              if (isHost) peerEngine.broadcast({ type: 'ACTION_PAUSE' })
            }}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  disablekb: 1,
                  modestbranding: 1,
                  rel: 0,
                  origin: window.location.origin
                }
              }
            } as any}
          />
        </div>
      )}

      {/* Native WebRTC / Dual-Sync / Transcode Player */}
      {isNativeMode && (
        <video
          ref={nativeVideoRef}
          autoPlay
          playsInline
          onTimeUpdate={handleNativeTimeUpdate}
          onPlay={() => audioEngine.resume()}
          className={`w-full h-full relative z-10 ${aspectClass}`}
        />
      )}

      {/* Idle Standby Screen */}
      {playMode === 'idle' && (
        <>
          {theme === 'anime' ? (
            /* Bespoke Anime / Manga Studio Standby */
            <div className="relative z-10 text-center max-w-xl px-6 select-none animate-fade-in flex flex-col items-center">
              <AnimeSpeedlines />
              <MangaDoodles />

              {/* Japanese Episode Title Banner */}
              <div className="mb-4 inline-flex items-center gap-2 bg-[#ffe600] text-black border-2 border-black px-4 py-1.5 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#ff2a5f] -rotate-1">
                <span className="w-2 h-2 rounded-full bg-[#ff2a5f] animate-ping" />
                <span>第01話：上映準備完了 // EPISODE 01: ROOM SYNC READY</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 font-syne uppercase drop-shadow-[4px_4px_0px_#000000]">
                ANIME DIMENSION
              </h2>

              <p className="text-sm text-yellow-100/80 leading-relaxed font-medium max-w-md mb-6 bg-black/60 border border-white/10 p-3 rounded-none">
                {isHost
                  ? '仲間と一緒に観よう！ Select an anime file, stream URL, or BitTorrent magnet to begin synchronized screening.'
                  : '暗号化通信接続中... Connected to Room. Waiting for the Host to trigger stream.'}
              </p>

              {/* Chibi Companion */}
              <div className="mb-6">
                <AnimeMascot message={isHost ? "IKUZO! READY TO PLAY!" : "WAITING FOR HOST!"} />
              </div>

              {/* Manga Action Trigger Buttons */}
              {isHost && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setActiveSidebarTab('media')
                      setSidebarOpen(true)
                    }}
                    className="manga-btn px-5 py-3 bg-[#ff2a5f] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2.5 font-syne"
                  >
                    <Upload className="w-4 h-4 text-[#ffe600]" />
                    <span>メディア選択 LOAD MEDIA</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSidebarTab('media')
                      setSidebarOpen(true)
                    }}
                    className="manga-btn px-5 py-3 bg-[#ffe600] text-black font-black text-xs uppercase tracking-wider flex items-center gap-2.5 font-syne"
                  >
                    <HardDrive className="w-4 h-4 text-black" />
                    <span>P2P TORRENT 発信</span>
                  </button>
                </div>
              )}
            </div>
          ) : theme === 'cinema' ? (
            /* 35mm Panavision Director's Atelier Standby */
            <div className="relative z-10 text-center max-w-xl px-6 select-none animate-fade-in flex flex-col items-center">
              <FilmstripBorder />

              <div className="my-5 flex items-center justify-center gap-6">
                <FilmLeaderCountdown />
                <CinemaClapperboard title={mediaTitle || "PREMIERE SCREENING"} />
              </div>

              <div className="mb-3 px-3 py-1 bg-[#1a1722] border border-[#d4af37] text-[10px] font-mono tracking-widest text-[#e5b869] font-bold uppercase">
                ★ CANNES // 35MM PANAVISION ANAMORPHIC PROJECTION READY ★
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-[#f8f6f0] mb-2 font-cinema uppercase">
                Panavision Projection Atelier
              </h2>
              <p className="text-xs text-[#e5b869]/70 leading-relaxed font-light max-w-sm mb-6 font-cinema">
                {isHost
                  ? 'Director console standing by. Select celluloid reel, digital master stream, or P2P torrent.'
                  : 'Auditorium doors locked. Synchronizing with projection booth...'}
              </p>

              {isHost && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setActiveSidebarTab('media')
                      setSidebarOpen(true)
                    }}
                    className="cinema-btn px-5 py-2.5 text-xs font-bold uppercase tracking-widest font-cinema flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-[#d4af37]" />
                    <span>LOAD 35MM REEL</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSidebarTab('media')
                      setSidebarOpen(true)
                    }}
                    className="cinema-btn px-5 py-2.5 text-xs font-bold uppercase tracking-widest font-cinema flex items-center gap-2"
                  >
                    <HardDrive className="w-4 h-4 text-[#d4af37]" />
                    <span>P2P SWARM RELAY</span>
                  </button>
                </div>
              )}

              <div className="mt-5 w-full">
                <FilmstripBorder />
              </div>
            </div>
          ) : theme === 'cyberpunk' ? (
            /* NERV MAGI Cyberpunk Tactical Terminal */
            <div className="relative z-10 text-center max-w-lg px-6 select-none animate-fade-in flex flex-col items-center font-mono">
              <div className="w-full mb-4">
                <NervTacticalCard title="TACTICAL STREAM RELAY // MAGI-01" status={isHost ? "HOST ACTIVE" : "P2P SYNCED"} />
              </div>

              <div className="h-1 w-full hazard-stripes mb-4" />

              <h2 className="text-2xl lg:text-3xl font-black tracking-widest text-cyan-400 mb-2 uppercase cyber-chamfer bg-black px-4 py-1 border border-cyan-500">
                NERV // TACTICAL TERMINAL
              </h2>
              <p className="text-[11px] text-cyan-300/70 leading-relaxed max-w-sm mb-5">
                {isHost
                  ? 'MILITARY-GRADE P2P UPLINK ESTABLISHED. SELECT DIRECT DATASTREAM FOR SYNCHRONIZED BROADCAST.'
                  : 'CLIENT TERMINAL CONNECTED. LISTENING FOR HOST QUANTUM BROADCAST KEY.'}
              </p>

              {isHost && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setActiveSidebarTab('media')
                      setSidebarOpen(true)
                    }}
                    className="cyber-btn px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>INJECT DATASTREAM</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSidebarTab('media')
                      setSidebarOpen(true)
                    }}
                    className="cyber-btn px-5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>TORRENT SWARM UPLINK</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Sonic Space / Hi-Fi Analog Console Standby */
            <div className="relative z-10 text-center max-w-xl px-6 select-none animate-fade-in flex flex-col items-center">
              {/* Studio Rackmount Console Faceplate */}
              <div className="hifi-faceplate p-6 w-full max-w-md border-2 border-[#383e4a] shadow-2xl flex flex-col items-center">
                <div className="flex items-center justify-between w-full border-b border-white/10 pb-2 mb-4 font-mono text-[10px] text-white/50">
                  <span className="text-[#a8926b] font-bold">STUDER A800 // 24-TRACK TAPE</span>
                  <span>15 IPS • DSD 96kHz</span>
                </div>

                <div className="flex items-center justify-center gap-4 mb-4">
                  <AnalogVuMeter />
                  <div className="flex flex-col items-center gap-2">
                    <VacuumTubeGlow />
                    <span className="text-[8px] font-mono text-[#a8926b] font-bold">PREAMP</span>
                  </div>
                  <AnalogVuMeter />
                </div>

                <h3 className="text-xl font-black text-[#e2e8f0] uppercase tracking-wider font-mono mb-1">
                  Master Tape Console
                </h3>
                <p className="text-xs text-white/50 mb-5 font-mono">
                  {isHost
                    ? 'Analog bus ready. Mount master FLAC, audio-visual stream, or P2P swarm.'
                    : 'Monitoring analog feed. Waiting for master tape roll...'}
                </p>

                {isHost && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setActiveSidebarTab('media')
                        setSidebarOpen(true)
                      }}
                      className="hifi-btn px-4 py-2 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#a8926b]" />
                      <span>MOUNT TAPE</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSidebarTab('media')
                        setSidebarOpen(true)
                      }}
                      className="hifi-btn px-4 py-2 text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-2"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-[#a8926b]" />
                      <span>SWARM FEED</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
