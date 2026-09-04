import Peer, { type DataConnection, type MediaConnection } from 'peerjs'
import { useStore, type PlayMode } from '../store/useStore'
import { audioEngine } from './AudioEngine'

type PeerMessage =
  | { type: 'INFO'; name: string; device: 'mobile' | 'desktop' }
  | { type: 'PING'; sent: number }
  | { type: 'PONG'; origSent: number; hostTime: number }
  | { type: 'STATE'; mode: PlayMode; title: string; url: string; time: number; paused: boolean; serverTime: number }
  | { type: 'ACTION_PLAY' }
  | { type: 'ACTION_PAUSE' }
  | { type: 'ACTION_SEEK'; time: number }
  | { type: 'REQ_SYNC' }
  | { type: 'REACTION'; emoji: string }
  | { type: 'CHAT'; text: string; name: string }
  | { type: 'LOCAL_FILE_OFFER'; fileName: string; fileSize: number }

class PeerEngine {
  private peer: Peer | null = null
  private conns: Map<string, DataConnection> = new Map()
  private mediaConns: Map<string, MediaConnection> = new Map()
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private hostBroadcastInterval: ReturnType<typeof setInterval> | null = null

  // WebRTC Active Broadcast Stream (Canvas transcode or Screen Share)
  public activeStream: MediaStream | null = null

  // Callbacks hooked into player
  public onRemoteStream?: (stream: MediaStream) => void
  public onSeek?: (time: number) => void
  public onPlay?: () => void
  public onPause?: () => void
  public onDriftAdjust?: (rate: number) => void

  // Clock Synchronization metrics
  public clockOffset: number = 0
  public roundTripTime: number = 0

  public initHost(roomId: string) {
    this.cleanup()
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]

    this.peer = new Peer(`lum-${roomId}`, { config: { iceServers } })

    this.peer.on('open', () => {
      useStore.getState().addMessage({
        id: 'sys-start',
        sender: 'System',
        text: `Cinema Room ${roomId} is live. Viewers can join via code or direct link.`,
        isSystem: true
      })
      this.startHostBroadcasting()
    })

    this.peer.on('connection', (c) => this.setupDataConnection(c))
    this.peer.on('call', (call) => call.answer()) // Host accepts incoming audio if needed
  }

  public joinRoom(roomId: string) {
    this.cleanup()
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]

    this.peer = new Peer({ config: { iceServers } })

    this.peer.on('open', () => {
      const c = this.peer!.connect(`lum-${roomId}`, { reliable: true })
      this.setupDataConnection(c)

      c.on('open', () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
        c.send({
          type: 'INFO',
          name: useStore.getState().alias,
          device: isMobile ? 'mobile' : 'desktop'
        })
        // Initial ping for clock sync
        c.send({ type: 'PING', sent: Date.now() })
        this.startViewerPing(c)
      })
    })

    // Listen for Host Video/Audio Calls (Local Transcode or Screen Share)
    this.peer.on('call', (call) => {
      call.answer()
      call.on('stream', (remoteStream) => {
        const title = call.metadata?.title || 'Live Studio Broadcast'
        useStore.getState().setMedia('local_stream', title, '')
        if (this.onRemoteStream) this.onRemoteStream(remoteStream)
      })
    })
  }

  private setupDataConnection(c: DataConnection) {
    c.on('open', () => {
      this.conns.set(c.peer, c)
      const store = useStore.getState()

      if (store.isHost) {
        // Immediate snapshot state to catch up new viewer
        c.send({
          type: 'STATE',
          mode: store.playMode,
          title: store.mediaTitle,
          url: store.mediaUrl,
          time: window.getExactCurrentTime ? window.getExactCurrentTime() : store.currentTime,
          paused: store.isPaused,
          serverTime: Date.now()
        })

        // If WebRTC stream is currently active, dial the new peer immediately
        if (this.activeStream) {
          setTimeout(() => {
            if (this.activeStream && this.peer && c.open) {
              const call = this.peer.call(c.peer, this.activeStream, {
                metadata: { title: store.mediaTitle }
              })
              this.mediaConns.set(c.peer, call)
            }
          }, 800)
        }
      }
    })

    c.on('data', (raw: unknown) => {
      const msg = raw as PeerMessage
      const store = useStore.getState()

      switch (msg.type) {
        case 'PING':
          if (store.isHost) {
            c.send({ type: 'PONG', origSent: msg.sent, hostTime: Date.now() })
          }
          break

        case 'PONG':
          if (!store.isHost) {
            const now = Date.now()
            this.roundTripTime = now - msg.origSent
            // Calculate one-way transit delay & clock difference
            const transit = this.roundTripTime / 2
            this.clockOffset = (msg.hostTime + transit) - now
            store.setSyncStats(store.syncDrift, this.roundTripTime)
          }
          break

        case 'INFO':
          store.addPeer({
            id: c.peer,
            name: msg.name,
            isHost: false,
            device: msg.device
          })
          store.addMessage({
            id: Math.random().toString(36),
            sender: 'System',
            text: `${msg.name} entered the theater (${msg.device}).`,
            isSystem: true
          })
          break

        case 'CHAT':
          store.addMessage({
            id: Math.random().toString(36),
            sender: msg.name,
            text: msg.text
          })
          if (store.isHost) this.broadcast(msg, c.peer)
          break

        case 'REACTION':
          store.triggerReaction(msg.emoji)
          if (store.isHost) this.broadcast(msg, c.peer)
          break

        case 'STATE':
          if (!store.isHost) {
            this.handleIncomingState(msg)
          }
          break

        case 'ACTION_PLAY':
          if (!store.isHost && this.onPlay) this.onPlay()
          if (store.isHost) this.broadcast(msg, c.peer)
          break

        case 'ACTION_PAUSE':
          if (!store.isHost && this.onPause) this.onPause()
          if (store.isHost) this.broadcast(msg, c.peer)
          break

        case 'ACTION_SEEK':
          if (!store.isHost && this.onSeek) this.onSeek(msg.time)
          if (store.isHost) this.broadcast(msg, c.peer)
          break

        case 'REQ_SYNC':
          if (store.isHost) {
            c.send({
              type: 'STATE',
              mode: store.playMode,
              title: store.mediaTitle,
              url: store.mediaUrl,
              time: window.getExactCurrentTime ? window.getExactCurrentTime() : store.currentTime,
              paused: store.isPaused,
              serverTime: Date.now()
            })
          }
          break
      }
    })

    c.on('close', () => {
      this.conns.delete(c.peer)
      if (this.mediaConns.has(c.peer)) {
        this.mediaConns.get(c.peer)?.close()
        this.mediaConns.delete(c.peer)
      }
      useStore.getState().removePeer(c.peer)
    })
  }

  // NTP Clock Drifting Correction
  private handleIncomingState(msg: Extract<PeerMessage, { type: 'STATE' }>) {
    const store = useStore.getState()

    // If media source changed, load it
    if (store.playMode !== msg.mode || store.mediaUrl !== msg.url) {
      store.setMedia(msg.mode, msg.title, msg.url)
    }

    // If it's a live WebRTC stream, sync is handled by WebRTC itself
    if (msg.mode === 'local_stream' || msg.mode === 'screenshare') {
      return
    }

    // Calculate host estimated current time including latency
    const transitSeconds = (this.roundTripTime / 2) / 1000
    const timeSinceBroadcast = (Date.now() - (msg.serverTime - this.clockOffset)) / 1000
    const estimatedHostTime = msg.time + (msg.paused ? 0 : Math.max(0, timeSinceBroadcast + transitSeconds))

    const myTime = window.getExactCurrentTime ? window.getExactCurrentTime() : store.currentTime
    const drift = myTime - estimatedHostTime
    store.setSyncStats(Math.round(drift * 1000), this.roundTripTime)

    // Smooth playbackRate catch-up or micro-seek
    const absDrift = Math.abs(drift)

    if (msg.paused) {
      if (this.onPause) this.onPause()
      if (absDrift > 0.1 && this.onSeek) this.onSeek(estimatedHostTime)
    } else {
      if (store.isPaused && this.onPlay) this.onPlay()

      if (absDrift > 2.0) {
        // Large discrepancy: instant seek
        if (this.onSeek) this.onSeek(estimatedHostTime)
        if (this.onDriftAdjust) this.onDriftAdjust(1.0)
      } else if (absDrift > 0.1) {
        // Micro-drift: adjust playback speed imperceptibly by 4% to sync audio seamlessly
        const targetRate = drift < 0 ? 1.04 : 0.96
        if (this.onDriftAdjust) this.onDriftAdjust(targetRate)
      } else {
        // Well synced
        if (this.onDriftAdjust) this.onDriftAdjust(1.0)
      }
    }
  }

  private startHostBroadcasting() {
    if (this.hostBroadcastInterval) clearInterval(this.hostBroadcastInterval)
    this.hostBroadcastInterval = setInterval(() => {
      const store = useStore.getState()
      if (!store.isHost || store.playMode === 'idle') return

      const currentTime = window.getExactCurrentTime ? window.getExactCurrentTime() : store.currentTime
      this.broadcast({
        type: 'STATE',
        mode: store.playMode,
        title: store.mediaTitle,
        url: store.mediaUrl,
        time: currentTime,
        paused: store.isPaused,
        serverTime: Date.now()
      })
    }, 1000)
  }

  private startViewerPing(c: DataConnection) {
    if (this.pingInterval) clearInterval(this.pingInterval)
    this.pingInterval = setInterval(() => {
      if (c.open) {
        c.send({ type: 'PING', sent: Date.now() })
      }
    }, 2500)
  }

  public broadcast(data: PeerMessage, excludePeerId?: string) {
    this.conns.forEach((c, id) => {
      if (id !== excludePeerId && c.open) {
        c.send(data)
      }
    })
  }

  // High-Quality WebRTC Video Broadcast with Adaptive Mobile Constraints
  public broadcastMediaStream(stream: MediaStream, title: string) {
    this.activeStream = stream
    const store = useStore.getState()

    this.conns.forEach((c, peerId) => {
      if (this.mediaConns.has(peerId)) {
        this.mediaConns.get(peerId)?.close()
      }

      if (!this.peer) return
      const call = this.peer.call(peerId, stream, { metadata: { title } })
      this.mediaConns.set(peerId, call)

      // Tune WebRTC RTCRtpSender for reliable mobile decoding (VP8/H264)
      const pc = call.peerConnection
      if (pc) {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'video') {
            const params = sender.getParameters()
            if (!params.encodings) params.encodings = [{}]
            // Set 6Mbps max bitrate, maintaining framerate
            params.encodings[0].maxBitrate = 6000000
            params.degradationPreference = 'balanced'
            sender.setParameters(params).catch(() => {})
          }
        })
      }
    })
  }

  public stopActiveMediaStream() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((t) => t.stop())
      this.activeStream = null
    }
    this.mediaConns.forEach((call) => call.close())
    this.mediaConns.clear()
  }

  public cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval)
    if (this.hostBroadcastInterval) clearInterval(this.hostBroadcastInterval)
    this.stopActiveMediaStream()
    if (this.peer) {
      this.peer.destroy()
      this.peer = null
    }
    this.conns.clear()
  }
}

export const peerEngine = new PeerEngine()

// Global window helpers for player integration
declare global {
  interface Window {
    getExactCurrentTime?: () => number
    getExactDuration?: () => number
  }
}
