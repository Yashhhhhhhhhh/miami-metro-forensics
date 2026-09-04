import { useState, useMemo } from 'react'
import {
  Play,
  Info,
  Search,
  Server,
  Sparkles,
  Radio,
  Film,
  HardDrive,
  X,
  ExternalLink,
  ChevronRight,
  Tv
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { peerEngine } from '../lib/PeerEngine'
import { CATALOG_ITEMS, type CatalogItem } from '../lib/catalogData'
import { AnimeSpeedlines } from './AnimeElements'

export default function Catalog() {
  const {
    theme,
    isHost,
    setMedia,
    setViewMode,
    addMessage,
    alias
  } = useStore()

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'anime' | 'spotlight' | 'classics' | 'live'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeHero, setActiveHero] = useState<CatalogItem>(CATALOG_ITEMS[0])
  const [showServerModal, setShowServerModal] = useState(false)
  const [serverUrl, setServerUrl] = useState('')
  const [serverTitle, setServerTitle] = useState('')

  // Filter items based on category and search query
  const filteredItems = useMemo(() => {
    return CATALOG_ITEMS.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query ||
        item.title.toLowerCase().includes(query) ||
        (item.japaneseTitle && item.japaneseTitle.toLowerCase().includes(query)) ||
        item.genres.some(g => g.toLowerCase().includes(query)) ||
        item.synopsis.toLowerCase().includes(query)
      return matchesCat && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  // Group items by category for horizontal shelves
  const animeItems = useMemo(() => CATALOG_ITEMS.filter(i => i.category === 'anime'), [])
  const spotlightItems = useMemo(() => CATALOG_ITEMS.filter(i => i.category === 'spotlight'), [])
  const liveItems = useMemo(() => CATALOG_ITEMS.filter(i => i.category === 'live'), [])
  const classicItems = useMemo(() => CATALOG_ITEMS.filter(i => i.category === 'classics'), [])

  // 1-Click "Watch with Room" Broadcast Handler
  const handleWatchWithRoom = (item: CatalogItem) => {
    setMedia(item.playMode, item.title, item.streamUrl)
    if (isHost) {
      peerEngine.broadcast({
        type: 'STATE',
        mode: item.playMode,
        title: item.title,
        url: item.streamUrl,
        time: 0,
        paused: false,
        serverTime: Date.now()
      })
      addMessage({
        id: Math.random().toString(36),
        sender: 'System',
        text: `Room screening started: ${item.title}`,
        isSystem: true
      })
    }
    setViewMode('auditorium')
  }

  // Handle Custom Stream / Server Submission
  const handleCustomServerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverUrl.trim()) return

    const title = serverTitle.trim() || 'Custom Media Server Feed'
    const isTorrent = serverUrl.startsWith('magnet:')
    const isYt = /(?:youtube\.com|youtu\.be)/i.test(serverUrl)
    const mode = isTorrent ? 'torrent' : isYt ? 'youtube' : 'url'

    setMedia(mode, title, serverUrl.trim())
    if (isHost) {
      peerEngine.broadcast({
        type: 'STATE',
        mode,
        title,
        url: serverUrl.trim(),
        time: 0,
        paused: false,
        serverTime: Date.now()
      })
    }
    setShowServerModal(false)
    setServerUrl('')
    setServerTitle('')
    setViewMode('auditorium')
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-[#08070d] text-white select-none relative pb-28">
      {/* Anime Mode Screentone Background */}
      {theme === 'anime' && <div className="absolute inset-0 pointer-events-none manga-screentone opacity-50 z-0" />}

      {/* Hero Billboard Banner */}
      <div className="relative w-full min-h-[500px] lg:min-h-[560px] flex items-end p-6 lg:p-12 overflow-hidden border-b-2 border-black">
        {/* Background Image with Cinematic Edge Fades */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
          style={{ backgroundImage: `url(${activeHero.backdropUrl})` }}
        >
          {/* Gradients to merge into catalog background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08070d] via-[#08070d]/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08070d] via-[#08070d]/70 to-transparent" />
        </div>

        {/* Anime Speedlines on Hero */}
        {theme === 'anime' && <AnimeSpeedlines />}

        {/* Hero Billboard Content */}
        <div className="relative z-10 max-w-3xl space-y-4 animate-fade-in">
          {/* Japanese Kanji Header Badge */}
          {activeHero.japaneseTitle && (
            <div className="inline-flex items-center gap-2 bg-[#ffe600] text-black border-2 border-black px-3.5 py-1 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_#ff2a5f] -rotate-1">
              <span className="w-2 h-2 rounded-full bg-[#ff2a5f] animate-ping" />
              <span>{activeHero.japaneseTitle}</span>
            </div>
          )}

          <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-white uppercase font-syne drop-shadow-[3px_3px_0px_#000000] leading-none">
            {activeHero.title}
          </h1>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <span className="px-2 py-0.5 bg-[#ff2a5f] text-white font-black border border-black shadow-[2px_2px_0px_#000000]">
              {activeHero.quality}
            </span>
            <span className="px-2 py-0.5 bg-black text-[#ffe600] border border-black font-black">
              {activeHero.audio}
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-white/90 border border-white/20 font-bold">
              {activeHero.duration}
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-white/70 border border-white/20 font-bold">
              {activeHero.rating}
            </span>
            <div className="hidden sm:flex items-center gap-2 text-white/60">
              {activeHero.genres.map(g => (
                <span key={g} className="after:content-['•'] after:ml-2 last:after:content-none font-sans">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <p className="text-sm lg:text-base text-white/80 line-clamp-3 leading-relaxed max-w-2xl font-normal bg-black/40 p-3.5 border-l-4 border-[#ff2a5f] backdrop-blur-sm">
            {activeHero.synopsis}
          </p>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => handleWatchWithRoom(activeHero)}
              className={theme === 'anime'
                ? "manga-btn px-6 py-3.5 bg-[#ffe600] text-black font-black text-sm uppercase tracking-wider flex items-center gap-2.5 font-syne"
                : "px-6 py-3.5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-wider flex items-center gap-2.5 hover:scale-105 active:scale-95 transition-all shadow-xl"}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{theme === 'anime' ? '▶ 同期上映開始 WATCH WITH ROOM' : 'Watch with Room'}</span>
            </button>

            <button
              onClick={() => setShowServerModal(true)}
              className={theme === 'anime'
                ? "manga-btn px-5 py-3.5 bg-[#120c1f] text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 font-syne"
                : "px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all"}
            >
              <Server className="w-4 h-4 text-[#ffe600]" />
              <span>Connect Server / HLS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Search & Category Bar */}
      <div className="sticky top-0 z-30 bg-[#08070d]/95 border-b-2 border-black px-6 lg:px-12 py-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Catalog / 全作品' },
            { id: 'anime', label: '🌸 Anime & 4K / アニメ' },
            { id: 'spotlight', label: '🔥 Spotlight / 特選' },
            { id: 'live', label: '📡 Live Feeds / 生中継' },
            { id: 'classics', label: '🏛️ Classics Vault / 名作' }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id as any)}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                selectedCategory === c.id
                  ? theme === 'anime'
                    ? 'bg-[#ff2a5f] text-white border-2 border-black shadow-[3px_3px_0px_#ffe600]'
                    : 'bg-white text-black rounded-xl font-black'
                  : 'bg-black/60 text-white/70 border border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Real-time Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            type="text"
            placeholder="Search anime, movies, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black border-2 border-white/20 text-xs font-medium text-white focus:outline-none focus:border-[#ff2a5f] transition-all"
          />
        </div>
      </div>

      {/* Main Content Shelves */}
      <div className="px-6 lg:px-12 py-8 space-y-10 relative z-10">
        {/* Filtered Results if searching or filtered */}
        {searchQuery ? (
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider mb-4 flex items-center gap-2 font-syne">
              <Search className="w-5 h-5 text-[#ff2a5f]" />
              <span>Search Results ({filteredItems.length})</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredItems.map((item) => (
                <MovieCard
                  key={item.id}
                  item={item}
                  theme={theme}
                  onSelect={() => setActiveHero(item)}
                  onPlay={() => handleWatchWithRoom(item)}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Shelf 1: Anime & 4K Originals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2 font-syne text-[#ffe600]">
                  <span className="px-2 py-0.5 bg-[#ff2a5f] text-white text-[10px] border border-black shadow-[2px_2px_0px_#000000]">
                    ORIGINALS
                  </span>
                  <span>🌸 Anime Masterpieces & 4K Originals // アニメ傑作選</span>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                {animeItems.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    theme={theme}
                    onSelect={() => setActiveHero(item)}
                    onPlay={() => handleWatchWithRoom(item)}
                  />
                ))}
              </div>
            </div>

            {/* Shelf 2: Spotlight VFX Sci-Fi */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2 font-syne text-white">
                  <span className="px-2 py-0.5 bg-[#ffe600] text-black text-[10px] border border-black shadow-[2px_2px_0px_#ff2a5f]">
                    PREMIERE
                  </span>
                  <span>🔥 Spotlight Cinema Releases // 特選プレミアム</span>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                {spotlightItems.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    theme={theme}
                    onSelect={() => setActiveHero(item)}
                    onPlay={() => handleWatchWithRoom(item)}
                  />
                ))}
              </div>
            </div>

            {/* Shelf 3: 24/7 Live Broadcasts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2 font-syne text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping mr-1" />
                  <span>📡 24/7 Live Satellite & Global Feeds // 生中継</span>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                {liveItems.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    theme={theme}
                    onSelect={() => setActiveHero(item)}
                    onPlay={() => handleWatchWithRoom(item)}
                  />
                ))}
              </div>
            </div>

            {/* Shelf 4: Classics Remastered Vault */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2 font-syne text-white/90">
                  <span>🏛️ Golden Classics Remastered Vault // 名作アーカイブ</span>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                {classicItems.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    theme={theme}
                    onSelect={() => setActiveHero(item)}
                    onPlay={() => handleWatchWithRoom(item)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Connect Personal Media Server / Custom HLS Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#0e0a17] border-2 border-black p-6 shadow-[8px_8px_0px_#ff2a5f] relative">
            <button
              onClick={() => setShowServerModal(false)}
              className="absolute top-4 right-4 p-1.5 bg-black text-white hover:text-[#ff2a5f] border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <Server className="w-5 h-5 text-[#ffe600]" />
              <h3 className="text-lg font-black uppercase tracking-wider font-syne text-white">
                Connect Media Server or Stream
              </h3>
            </div>
            <p className="text-xs text-white/60 mb-5">
              Stream directly from your personal Jellyfin, Plex, Emby server, custom HLS (.m3u8), or P2P BitTorrent magnet link in full sync with the room.
            </p>

            <form onSubmit={handleCustomServerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-white/80 mb-1.5">
                  Stream or Server URL (HLS / MP4 / Magnet)
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://.../stream.m3u8 or magnet:?xt=urn:btih:..."
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full p-3 bg-black border-2 border-white/20 text-xs font-mono text-white focus:outline-none focus:border-[#ff2a5f]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-white/80 mb-1.5">
                  Custom Stream Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Anime Library / Live Server"
                  value={serverTitle}
                  onChange={(e) => setServerTitle(e.target.value)}
                  className="w-full p-3 bg-black border-2 border-white/20 text-xs font-medium text-white focus:outline-none focus:border-[#ff2a5f]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowServerModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="manga-btn px-6 py-2.5 bg-[#ffe600] text-black font-black text-xs uppercase tracking-wider font-syne"
                >
                  Stream to Room // 上映開始
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-component for individual Movie Cards
function MovieCard({
  item,
  theme,
  onSelect,
  onPlay
}: {
  item: CatalogItem
  theme: string
  onSelect: () => void
  onPlay: () => void
}) {
  return (
    <div
      onClick={onSelect}
      className={`flex-shrink-0 w-48 sm:w-56 cursor-pointer group relative transition-all duration-200 ${
        theme === 'anime'
          ? 'manga-box hover:-translate-y-1.5'
          : 'rounded-2xl overflow-hidden border border-white/10 hover:border-white/40 hover:scale-105'
      }`}
    >
      {/* Poster Aspect Ratio Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
        <img
          src={item.backdropUrl}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Quality Badge */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 border border-white/20 text-[9px] font-mono font-bold text-white">
          {item.quality}
        </div>

        {/* 1-Click Play Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPlay()
          }}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-[#ffe600] text-black border-2 border-black flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 active:scale-95 transition-all shadow-[3px_3px_0px_#ff2a5f]"
          title="Stream with Room Now"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* Card Details */}
      <div className="p-3 bg-[#0e0a17]">
        {item.japaneseTitle && (
          <span className="text-[10px] text-[#ffe600] font-black truncate block">
            {item.japaneseTitle}
          </span>
        )}
        <h4 className="text-xs font-black text-white truncate font-syne uppercase">
          {item.title}
        </h4>
        <div className="flex items-center justify-between text-[10px] text-white/50 font-mono mt-1">
          <span>{item.year}</span>
          <span>{item.duration}</span>
        </div>
      </div>
    </div>
  )
}
