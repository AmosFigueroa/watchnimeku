export interface Episode {
  id: string;
  number: number;
  title: string;
  description?: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  slug?: string; // For API fetching
  streamUrl?: string;
}

export interface Stream {
  server: string;
  resolution: string; // '360p', '480p', '720p', '1080p', 'HD'
  url: string;
  type: 'iframe' | 'mp4' | 'youtube';
}

export interface Movie {
  id: number | string;
  slug?: string; // Unique identifier for API
  title: string;
  description: string;
  thumbnailUrl: string;
  coverUrl: string; // High res for hero
  videoUrl: string;
  genre: string[];
  rating: string;
  year: number | string;
  duration: string;
  type: 'movie' | 'Movie' | 'series' | 'TV' | 'anime' | 'Anime' | 'ONA' | 'Special' | 'OVA' | 'Music' | 'Drama';
  subCount?: number; // For CC icon
  dubCount?: number; // For Mic icon
  totalEpisodes?: number;
  episodes?: Episode[]; // List of episodes
  status?: string;
  lastUpdated?: string;
  source?: 'scrape' | 'youtube' | 'external' | 'otakudesu'; // Added 'otakudesu'
  youtubeId?: string; // Playlist or Video ID
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// --- NEW TYPES FOR BACKEND INTEGRATION ---

export interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  watchlist: Array<{
    slug: string;
    title: string;
    thumbnailUrl: string;
    type: string;
    addedAt: string;
  }>;
}

export interface Review {
  _id: string;
  userId: string;
  username: string;
  movieSlug: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  type: 'info' | 'alert' | 'success';
}

export interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  type: 'info' | 'alert' | 'success';
}