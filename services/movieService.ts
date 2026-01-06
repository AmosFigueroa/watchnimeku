import { Movie, Episode } from '../types';

// API Configuration for MastayY/kumanime-api
// Since this is a specific git repo, you should deploy it to Vercel (or similar) 
// and add your URL here.
const API_MIRRORS = [
  // Hypothetical public deployments for this repo structure
  'https://kumanime-api.vercel.app/api', 
  'https://kumanime-api-git-master-mastayy.vercel.app/api',
  // Fallback to localhost if running locally
  'http://localhost:3000/api'
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/**
 * Robust fetch function that tries multiple mirrors and a proxy fallback.
 */
const fetchSafe = async (endpoint: string) => {
  for (const base of API_MIRRORS) {
    try {
      const url = `${base}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn(`Mirror ${base} failed or timed out, trying next...`);
    }
  }

  // Proxy Fallback
  try {
    console.log("Direct access failed, attempting via CORS proxy...");
    const target = `${API_MIRRORS[0]}${endpoint}`;
    const url = `${CORS_PROXY}${encodeURIComponent(target)}`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("Proxy attempt failed");
  }

  throw new Error("Unable to fetch data from any available source.");
};

// --- API Response Types (Kumanime Structure) ---
interface KumanimeItem {
  title: string;
  slug: string;
  thumb: string;
  type?: string;
  status?: string;
  episode?: string; // Latest episode for home items
  uploaded_on?: string;
}

interface KumanimeDetail {
  title: string;
  thumb: string;
  synopsis: string;
  score: string;
  status: string;
  total_episode: string;
  genre_list: { genre_name: string }[];
  episode_list: { title: string; id: string; uploaded_on: string }[]; // 'id' here is usually the slug
}

// --- Mapper Functions ---

const mapKumanimeItemToMovie = (item: KumanimeItem, index: number): Movie => {
  return {
    id: item.slug || `anime-${index}`,
    slug: item.slug,
    title: item.title,
    description: "Loading description...", 
    thumbnailUrl: item.thumb || "https://via.placeholder.com/300x450?text=No+Image",
    coverUrl: item.thumb || "https://via.placeholder.com/300x450?text=No+Image",
    videoUrl: "", 
    genre: ["Anime"],
    rating: "N/A", // Kumanime home data often lacks score
    year: new Date().getFullYear(),
    duration: item.episode || "24m",
    type: 'anime',
    status: item.status || "Unknown"
  };
};

// --- Public Async Methods ---

export const getHomeData = async (): Promise<{ ongoing: Movie[], completed: Movie[] }> => {
  try {
    const json = await fetchSafe('/home');
    
    // Kumanime API usually returns { status: true, data: { ongoing: [], completed: [] } }
    const data = json.data || json; 

    const ongoingList = data.ongoing || [];
    const completedList = data.completed || [];

    const ongoing = ongoingList.map((item: any, idx: number) => mapKumanimeItemToMovie(item, idx));
    const completed = completedList.map((item: any, idx: number) => mapKumanimeItemToMovie(item, idx + 100));

    return { ongoing, completed };
  } catch (error) {
    console.error("Failed to fetch home data:", error);
    return { ongoing: [], completed: [] };
  }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
  try {
    const json = await fetchSafe(`/anime/${slug}`);
    const detail: KumanimeDetail = json.data || json;

    if (!detail) return null;

    // Map Episodes
    // Kumanime episode list items usually have `id` as the slug endpoint
    const episodeList = detail.episode_list || [];
    const episodes: Episode[] = episodeList.map((ep: any, idx: number) => ({
      id: ep.id,
      slug: ep.id, // Important: use 'id' as slug for fetching stream
      number: episodeList.length - idx,
      title: ep.title,
      thumbnailUrl: detail.thumb, 
      videoUrl: "", 
      duration: "24m",
      description: `Uploaded: ${ep.uploaded_on}`
    }));

    return {
      id: slug,
      slug: slug,
      title: detail.title,
      description: detail.synopsis || "No description available.",
      thumbnailUrl: detail.thumb,
      coverUrl: detail.thumb,
      videoUrl: "",
      genre: detail.genre_list ? detail.genre_list.map((g: any) => g.genre_name) : [],
      rating: detail.score || "N/A",
      year: new Date().getFullYear(),
      duration: "24m",
      type: 'anime',
      totalEpisodes: parseInt(detail.total_episode) || episodes.length,
      status: detail.status,
      episodes: episodes
    };
  } catch (error) {
    console.error("Failed to fetch details:", error);
    return null;
  }
};

export const getEpisodeStream = async (slug: string): Promise<string | null> => {
  try {
    const json = await fetchSafe(`/episode/${slug}`);
    const data = json.data || json;

    // Kumanime API structure for episode usually contains 'stream_link' or 'video_url'
    if (data.stream_link) return data.stream_link;
    if (data.video_url) return data.video_url;
    
    // Check for nested stream objects often found in these scrapers
    if (data.stream && data.stream.url) return data.stream.url;

    // If there is a list of servers
    if (Array.isArray(data.servers)) {
        const bestServer = data.servers.find((s: any) => s.name?.toLowerCase().includes('desu') || s.name?.toLowerCase().includes('p')) || data.servers[0];
        return bestServer?.url || bestServer?.iframe || null;
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch stream:", error);
    return null;
  }
};

// --- Mock/Sync Placeholders ---

export const getFeaturedMovie = (): Movie => {
   return {
    id: 0,
    title: "Loading...",
    description: "",
    thumbnailUrl: "https://via.placeholder.com/800x400?text=Loading",
    coverUrl: "https://via.placeholder.com/800x400?text=Loading",
    videoUrl: "",
    genre: [],
    rating: "",
    year: 0,
    duration: "",
    type: 'anime'
   };
};

export const getMoviesByCategory = (category: string): Movie[] => [];
export const getTopAiring = (): Movie[] => [];
export const getMostPopular = (): Movie[] => [];
export const getMostFavorite = (): Movie[] => [];
export const getLatestCompleted = (): Movie[] => [];