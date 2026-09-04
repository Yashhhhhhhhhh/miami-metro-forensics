import { type PlayMode } from '../store/useStore'

export interface CatalogItem {
  id: string
  title: string
  japaneseTitle?: string
  category: 'anime' | 'spotlight' | 'classics' | 'live'
  year: string
  rating: string
  quality: string
  audio: string
  duration: string
  synopsis: string
  genres: string[]
  backdropUrl: string
  posterUrl: string
  streamUrl: string
  playMode: PlayMode
  isLive?: boolean
}

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'sintel',
    title: 'Sintel: The Dragon Chronicles',
    japaneseTitle: 'シンテル：龍の絆',
    category: 'anime',
    year: '2024 Remaster',
    rating: 'PG-13',
    quality: '4K ULTRA HD',
    audio: 'Dolby Atmos 5.1',
    duration: '15m',
    synopsis: 'A lonely warrior searches through deserts, frosty summits, and ruins for her companion baby dragon Scales. An emotional, high-stakes cinematic anime journey rendered in breathtaking 4K.',
    genres: ['Anime', 'Fantasy', 'Action', 'Cinematic'],
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    playMode: 'url'
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel (Sci-Fi VFX)',
    japaneseTitle: '鋼鉄の涙 // ネオ・アムステルダム',
    category: 'spotlight',
    year: '2023 4K Master',
    rating: 'TV-14',
    quality: '4K UHD 60FPS',
    audio: 'DTS Master Audio',
    duration: '12m',
    synopsis: 'Set in a dystopian future where humanity battles sentient military robotics. A team of scientists in the Oude Kerk must reconstruct a crucial romantic memory to stop the mechanical apocalypse.',
    genres: ['Sci-Fi', 'Cyberpunk', 'VFX', 'Action'],
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    playMode: 'url'
  },
  {
    id: 'cosmos-laundromat',
    title: 'Cosmos Laundromat (First Cycle)',
    japaneseTitle: '宇宙ランドロマット：第一環',
    category: 'anime',
    year: '2022 Remaster',
    rating: 'TV-MA',
    quality: '4K ULTRA HD',
    audio: 'Dolby 5.1 Surround',
    duration: '12m',
    synopsis: 'On a desolate windswept island, a suicidal sheep named Franck meets Victor, a mysterious salesman who offers him the gift of infinite parallel lives across the cosmos.',
    genres: ['Surrealist', 'Sci-Fi', 'Comedy', 'Animation'],
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    playMode: 'url'
  },
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny (Animation Classic)',
    japaneseTitle: '大角ウサギの逆襲',
    category: 'anime',
    year: '4K 60FPS Edition',
    rating: 'G',
    quality: '4K 60FPS',
    audio: '5.1 Spatial Audio',
    duration: '10m',
    synopsis: 'A benevolent giant rabbit enjoys the beauty of nature until mischievous forest bullies push him over the edge, provoking a hilarious tactical revenge trap.',
    genres: ['Animation', 'Comedy', 'Family'],
    backdropUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    playMode: 'url'
  },
  {
    id: 'night-living-dead',
    title: 'Night of the Living Dead (1968 Remaster)',
    japaneseTitle: '生ける屍の夜 1080p リマスター',
    category: 'classics',
    year: '1968 HD',
    rating: 'R',
    quality: '1080p HD Noir',
    audio: 'Original Mono Master',
    duration: '1h 36m',
    synopsis: 'George A. Romero’s legendary horror pioneer. A disparate group of individuals seek shelter in an abandoned rural Pennsylvania farmhouse while reanimated corpses surround them.',
    genres: ['Horror', 'Cinema Classic', 'Public Domain Vault'],
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    playMode: 'url'
  },
  {
    id: 'nasa-tv',
    title: 'NASA TV Live: Earth Views & Deep Space',
    japaneseTitle: 'NASA 宇宙ステーション生中継',
    category: 'live',
    year: '24/7 LIVE FEED',
    rating: 'LIVE',
    quality: 'LIVE 1080p 60FPS',
    audio: 'Stereo Comms',
    duration: 'Continuous Broadcast',
    synopsis: 'Live streaming views of Earth from the International Space Station (ISS), rocket launches, spacewalks, and deep space telemetry directly from NASA.',
    genres: ['Live Satellite', 'Space', 'Documentary', 'HLS Stream'],
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    playMode: 'url',
    isLive: true
  },
  {
    id: 'bloomberg-live',
    title: 'Bloomberg Television Global News',
    japaneseTitle: 'ブルームバーグ 国際報道 24時間',
    category: 'live',
    year: '24/7 LIVE FEED',
    rating: 'LIVE',
    quality: 'LIVE 1080p',
    audio: 'Live Broadcast Stereo',
    duration: 'Continuous Broadcast',
    synopsis: 'Worldwide business, technology, market intelligence, and global breaking news live 24/7 from international bureaus.',
    genres: ['Live News', 'Global Markets', 'HLS Stream'],
    backdropUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    streamUrl: 'https://liveproduseast.akamaized.net/us/Channel-HD-AWS-virginia-1/playlist.m3u8',
    playMode: 'url',
    isLive: true
  }
]
