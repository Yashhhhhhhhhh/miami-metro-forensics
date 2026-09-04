import { useEffect, useRef, useState, useCallback } from 'react'
import ReactPlayer from 'react-player'
import { useStore } from '../store/useStore'
import { peerEngine } from '../lib/PeerEngine'
import { audioEngine } from '../lib/AudioEngine'
import Ambilight from './Ambilight'
import Reactions from './Reactions'

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
    setMedia
  } = useStore()

  const nativeVideoRef = useRef<HTMLVideoElement>(null)
  const reactPlayerRef = useRef<ReactPlayer>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const transcodeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const transcodeAnimRef = useRef<number | null>(null)

  // Global window time getters for P2P sync
  const getCurrentTime = useCallback(() => {
    if (playMode === 'youtube' || playMode === 'url') {
      return reactPlayerRef.current?.getCurrentTime() || 0
    }
    return nativeVideoRef.current?.currentTime || 0
  }, [playMode])

  const getDuration = useCallback(() => {
    if (playMode === 'youtube' || playMode === 'url') {
      return reactPlayerRef.current?.getDuration() || 0
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
        reactPlayerRef.current?.seekTo(time, 'seconds')
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
    const dur = reactPlayerRef.current?.getDuration() || 0
    updatePlayback(state.playedSeconds, dur, false, state.loadedSeconds)
  }

  const isUrlMode = playMode === 'youtube' || playMode === 'url'
  const isNativeMode = playMode === 'local_stream' || playMode === 'local_sync' || playMode === 'screenshare'

  // Dynamic aspect ratio class
  const aspectClass =
    aspectRatio === 'cover'
      ? 'object-cover'
      : aspectRatio === 'fill'
      ? 'object-fill'
      : 'object-contain'

  return (
    <div className="absolute inset-0 z-10 bg-black flex items-center justify-center overflow-hidden">
      {/* 360° Dynamic Ambilight Lighting */}
      <Ambilight videoRef={nativeVideoRef} />

      {/* Floating Reactions Burst Layer */}
      <Reactions />

      {/* URL / YouTube Streaming Engine */}
      {isUrlMode && (
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <ReactPlayer
            ref={reactPlayerRef}
            url={mediaUrl}
            width="100%"
            height="100%"
            playing={true}
            volume={isMuted ? 0 : Math.min(1.0, volume)}
            controls={false}
            onProgress={handleReactPlayerProgress}
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
            }}
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
        <div className="relative z-10 text-center max-w-md px-6 select-none animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--primary)] to-rose-400 p-[1px] mx-auto mb-6 shadow-[0_0_50px_var(--primary)] animate-pulse">
            <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
              <span className="w-4 h-4 rounded-full bg-[var(--primary)] shadow-[0_0_20px_var(--primary)]" />
            </div>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white mb-2">Theater Standby</h2>
          <p className="text-xs text-white/50 leading-relaxed font-light">
            {isHost
              ? 'Choose a movie to broadcast via WebRTC, paste a YouTube link, or mount a local file for bit-perfect sync.'
              : 'Connected to the encrypted peer link. Waiting for the Host to initiate playback...'}
          </p>
        </div>
      )}
    </div>
  )
}
