// In-Browser WebTorrent Client Engine
export interface TorrentStats {
  numPeers: number
  downloadSpeed: number // bytes/sec
  uploadSpeed: number
  progress: number // 0 - 1
  downloaded: number // bytes
  total: number // bytes
  timeRemaining: number // ms
  name: string
}

class TorrentEngine {
  private client: any = null
  private currentTorrent: any = null
  private statsInterval: ReturnType<typeof setInterval> | null = null

  public isAvailable(): boolean {
    return typeof (window as any).WebTorrent !== 'undefined'
  }

  public getClient(): any {
    if (!this.client && this.isAvailable()) {
      const WebTorrent = (window as any).WebTorrent
      this.client = new WebTorrent({
        tracker: {
          rtcConfig: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        }
      })
    }
    return this.client
  }

  public sanitizeMagnet(source: string | File): string | File {
    if (typeof source !== 'string' || !source.startsWith('magnet:')) return source

    // 1. Remove malformed "tracker:" prefixes often created by indexers or scrapers
    let cleaned = source
      .replace(/([&?]tr=)tracker%3A/gi, '$1')
      .replace(/([&?]tr=)tracker:/gi, '$1')
      .replace(/%0A/gi, ' ') // Replace newlines in dn with space

    // 2. Ensure vital WebRTC browser-compatible trackers are present
    const webrtcTrackers = [
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'wss://tracker.files.fm:7073/announce',
      'wss://tracker.fastcast.nz'
    ]

    for (const tr of webrtcTrackers) {
      const encoded = encodeURIComponent(tr)
      if (!cleaned.includes(encoded) && !cleaned.includes(tr)) {
        cleaned += `&tr=${encoded}`
      }
    }

    return cleaned
  }

  public async stream(
    source: string | File,
    videoEl: HTMLVideoElement,
    onStatsUpdate?: (stats: TorrentStats) => void
  ): Promise<string> {
    const client = this.getClient()
    if (!client) {
      throw new Error('WebTorrent browser engine is still initializing. Please retry in a few seconds.')
    }

    this.stop()

    return new Promise((resolve, reject) => {
      try {
        const cleanSource = this.sanitizeMagnet(source)
        const opts = {
          announce: [
            'wss://tracker.openwebtorrent.com',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.files.fm:7073/announce',
            'wss://tracker.fastcast.nz'
          ]
        }

        client.add(cleanSource, opts, (torrent: any) => {
          this.currentTorrent = torrent

          // Find the largest playable video file
          const file = torrent.files.find((f: any) =>
            /\.(mp4|mkv|webm|mov|mp3|m4v)$/i.test(f.name)
          ) || torrent.files[0]

          if (!file) {
            return reject(new Error('No streamable video or audio file found in this torrent.'))
          }

          // Stream directly into the video element
          file.renderTo(videoEl, { autoplay: true }, (err: any) => {
            if (err) console.warn('Render notice:', err)
          })

          if (onStatsUpdate) {
            this.statsInterval = setInterval(() => {
              if (!this.currentTorrent) return
              onStatsUpdate({
                name: file.name,
                numPeers: this.currentTorrent.numPeers || 0,
                downloadSpeed: this.currentTorrent.downloadSpeed || 0,
                uploadSpeed: this.currentTorrent.uploadSpeed || 0,
                progress: this.currentTorrent.progress || 0,
                downloaded: this.currentTorrent.downloaded || 0,
                total: this.currentTorrent.length || 0,
                timeRemaining: this.currentTorrent.timeRemaining || 0
              })
            }, 1000)
          }

          resolve(file.name)
        })

        client.on('error', (err: any) => {
          reject(err)
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  public stop() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }
    if (this.currentTorrent) {
      try {
        this.currentTorrent.destroy()
      } catch {}
      this.currentTorrent = null
    }
  }
}

export const torrentEngine = new TorrentEngine()
