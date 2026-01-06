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
  type: 'movie' | 'series' | 'anime' | 'ONA' | 'Special';
  subCount?: number; // For CC icon
  dubCount?: number; // For Mic icon
  totalEpisodes?: number;
  episodes?: Episode[]; // List of episodes
  status?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}