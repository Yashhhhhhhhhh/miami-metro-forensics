import { create } from 'zustand'
import { audioEngine, type EQPreset } from '../lib/AudioEngine'
import { type TorrentStats } from '../lib/TorrentEngine'
import { type SubtitleCue } from '../lib/SubtitleEngine'

export type Theme = 'cinema' | 'anime' | 'music' | 'cyberpunk'
export type PlayMode = 'idle' | 'youtube' | 'url' | 'local_stream' | 'local_sync' | 'screenshare' | 'torrent'
export type AspectRatio = 'contain' | 'cover' | 'fill'

export interface PeerUser {
  id: string
  name: string
  isHost: boolean
  rtt?: number
  device?: 'mobile' | 'desktop'
}

export interface ChatMessage {
  id: string
  sender: string
  text: string
  timestamp: string
  isSystem?: boolean
}

export interface FloatingReaction {
  id: string
  emoji: string
  x: number
}

interface AppState {
  // Theme & Appearance
  theme: Theme
  setTheme: (t: Theme) => void
  ambilight: boolean
  setAmbilight: (v: boolean) => void
  aspectRatio: AspectRatio
  setAspectRatio: (ar: AspectRatio) => void
  crtScanlines: boolean
  toggleCrtScanlines: () => void
  cinemascopeMode: boolean
  toggleCinemascopeMode: () => void
  showTelemetry: boolean
  toggleTelemetry: () => void

  // User & Room
  alias: string
  setAlias: (a: string) => void
  roomCode: string | null
  isHost: boolean
  peers: Record<string, PeerUser>
  setRoom: (code: string, isHost: boolean) => void
  addPeer: (peer: PeerUser) => void
  removePeer: (id: string) => void
  updatePeerRTT: (id: string, rtt: number) => void

  // Media State
  playMode: PlayMode
  mediaTitle: string
  mediaUrl: string
  duration: number
  currentTime: number
  buffered: number
  isPaused: boolean
  setMedia: (mode: PlayMode, title: string, url: string) => void
  updatePlayback: (current: number, duration: number, isPaused: boolean, buffered?: number) => void

  // Sync Diagnostics
  syncDrift: number
  ping: number
  setSyncStats: (drift: number, ping: number) => void

  // Torrent P2P Swarm Diagnostics
  torrentStats: TorrentStats | null
  setTorrentStats: (s: TorrentStats | null) => void

  // Audio DSP & Studio
  volume: number // 0 to 2.5
  isMuted: boolean
  eqPreset: EQPreset
  compressorEnabled: boolean
  setVolume: (v: number) => void
  toggleMute: () => void
  setEQPreset: (preset: EQPreset) => void
  setCompressorEnabled: (enabled: boolean) => void

  // Floating Reactions
  reactions: FloatingReaction[]
  triggerReaction: (emoji: string) => void
  removeReaction: (id: string) => void

  // Subtitles
  subtitles: SubtitleCue[]
  subtitlesEnabled: boolean
  subtitleOffset: number
  subtitleFontSize: 'sm' | 'md' | 'lg'
  subtitleFileName: string
  setSubtitles: (cues: SubtitleCue[], fileName?: string) => void
  toggleSubtitles: () => void
  setSubtitleOffset: (offset: number) => void
  nudgeSubtitleOffset: (delta: number) => void
  setSubtitleFontSize: (size: 'sm' | 'md' | 'lg') => void
  clearSubtitles: () => void

  // UI Panels
  sidebarOpen: boolean
  activeSidebarTab: 'chat' | 'roster' | 'media' | 'audio'
  setSidebarOpen: (open: boolean) => void
  setActiveSidebarTab: (tab: 'chat' | 'roster' | 'media' | 'audio') => void

  // Chat
  chatMessages: ChatMessage[]
  addMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void
}

export const useStore = create<AppState>((set, get) => ({
  theme: 'cinema',
  setTheme: (t) => {
    // Auto-tune DSP and Visual Experience according to medium
    if (t === 'cinema') {
      audioEngine.applyPreset('cinema')
      set({ theme: t, eqPreset: 'cinema', crtScanlines: false, cinemascopeMode: true })
    } else if (t === 'anime') {
      audioEngine.applyPreset('vocal')
      set({ theme: t, eqPreset: 'vocal', crtScanlines: false, cinemascopeMode: false })
    } else if (t === 'music') {
      audioEngine.applyPreset('bass')
      set({ theme: t, eqPreset: 'bass', crtScanlines: false, cinemascopeMode: false })
    } else if (t === 'cyberpunk') {
      audioEngine.applyPreset('laptop')
      set({ theme: t, eqPreset: 'laptop', crtScanlines: true, showTelemetry: true, cinemascopeMode: false })
    } else {
      set({ theme: t })
    }
  },
  ambilight: true,
  setAmbilight: (v) => set({ ambilight: v }),
  aspectRatio: 'contain',
  setAspectRatio: (ar) => set({ aspectRatio: ar }),
  crtScanlines: false,
  toggleCrtScanlines: () => set((s) => ({ crtScanlines: !s.crtScanlines })),
  cinemascopeMode: true,
  toggleCinemascopeMode: () => set((s) => ({ cinemascopeMode: !s.cinemascopeMode })),
  showTelemetry: false,
  toggleTelemetry: () => set((s) => ({ showTelemetry: !s.showTelemetry })),

  alias: localStorage.getItem('lum_alias') || 'Director',
  setAlias: (a) => {
    localStorage.setItem('lum_alias', a)
    set({ alias: a })
  },

  roomCode: null,
  isHost: false,
  peers: {},
  setRoom: (code, isHost) => set({ roomCode: code, isHost }),
  addPeer: (peer) => set((s) => ({ peers: { ...s.peers, [peer.id]: peer } })),
  removePeer: (id) => set((s) => {
    const newPeers = { ...s.peers }
    delete newPeers[id]
    return { peers: newPeers }
  }),
  updatePeerRTT: (id, rtt) => set((s) => {
    if (!s.peers[id]) return s
    return {
      peers: {
        ...s.peers,
        [id]: { ...s.peers[id], rtt }
      }
    }
  }),

  playMode: 'idle',
  mediaTitle: 'Theater Standby',
  mediaUrl: '',
  duration: 0,
  currentTime: 0,
  buffered: 0,
  isPaused: true,
  setMedia: (mode, title, url) => set({
    playMode: mode,
    mediaTitle: title,
    mediaUrl: url,
    currentTime: 0,
    duration: 0,
    isPaused: false
  }),
  updatePlayback: (currentTime, duration, isPaused, buffered) => set((s) => ({
    currentTime,
    duration: duration || s.duration,
    isPaused,
    buffered: buffered !== undefined ? buffered : s.buffered
  })),

  syncDrift: 0,
  ping: 0,
  setSyncStats: (drift, ping) => set({ syncDrift: drift, ping }),

  torrentStats: null,
  setTorrentStats: (stats) => set({ torrentStats: stats }),

  volume: 1.0,
  isMuted: false,
  eqPreset: 'cinema',
  compressorEnabled: true,
  setVolume: (v) => {
    audioEngine.setVolume(v)
    set({ volume: v, isMuted: v === 0 })
  },
  toggleMute: () => {
    const { isMuted, volume } = get()
    if (isMuted) {
      audioEngine.setVolume(volume || 1.0)
      set({ isMuted: false })
    } else {
      audioEngine.setVolume(0)
      set({ isMuted: true })
    }
  },
  setEQPreset: (preset) => {
    audioEngine.applyPreset(preset)
    set({ eqPreset: preset })
  },
  setCompressorEnabled: (enabled) => {
    audioEngine.setCompressorEnabled(enabled)
    set({ compressorEnabled: enabled })
  },

  reactions: [],
  triggerReaction: (emoji) => {
    const id = Math.random().toString(36).substring(2, 9)
    const x = Math.floor(Math.random() * 60) + 20 // 20% to 80% horizontal screen width
    set((s) => ({ reactions: [...s.reactions, { id, emoji, x }] }))
  },
  removeReaction: (id) => set((s) => ({
    reactions: s.reactions.filter((r) => r.id !== id)
  })),

  subtitles: [],
  subtitlesEnabled: true,
  subtitleOffset: 0,
  subtitleFontSize: 'md',
  subtitleFileName: '',
  setSubtitles: (cues, fileName = '') =>
    set({
      subtitles: cues,
      subtitlesEnabled: true,
      subtitleFileName: fileName,
      subtitleOffset: 0
    }),
  toggleSubtitles: () => set((s) => ({ subtitlesEnabled: !s.subtitlesEnabled })),
  setSubtitleOffset: (offset) => set({ subtitleOffset: offset }),
  nudgeSubtitleOffset: (delta) =>
    set((s) => ({ subtitleOffset: parseFloat((s.subtitleOffset + delta).toFixed(2)) })),
  setSubtitleFontSize: (size) => set({ subtitleFontSize: size }),
  clearSubtitles: () => set({ subtitles: [], subtitleFileName: '', subtitleOffset: 0 }),

  sidebarOpen: false,
  activeSidebarTab: 'chat',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  chatMessages: [],
  addMessage: (msg) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    set((s) => ({
      chatMessages: [...s.chatMessages, { ...msg, timestamp: timeStr }]
    }))
  }
}))
