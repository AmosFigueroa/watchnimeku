import { Movie, Episode } from '../types';

// API Configuration for MastayY/kumanime-api
const API_MIRRORS = [
  'https://kumanime-api.vercel.app/api',
  'https://kumanime-api-git-master-mastayy.vercel.app/api',
  // Localhost fallback for local development
  'http://localhost:3000/api'
];

// Alternate CORS Proxies
const CORS_PROXIES = [
    // Pindahkan corsproxy.io ke urutan pertama (biasanya lebih kuat)
    'https://corsproxy.io/?',
    
    // Tambahkan Thingproxy (Cadangan 1)
    'https://thingproxy.freeboard.io/fetch/',
    
    // Tambahkan CodeTabs (Cadangan 2)
    'https://api.codetabs.com/v1/proxy?quest=',
    
    // Taruh AllOrigins di paling bawah sebagai opsi terakhir
    'https://api.allorigins.win/raw?url=',
];

/**
 * Robust fetch function that tries multiple mirrors and proxy fallbacks.
 */
const fetchSafe = async (endpoint: string) => {
  // 1. Try Direct Mirrors
  for (const base of API_MIRRORS) {
    try {
      const url = `${base}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); 

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Continue to next mirror
    }
  }

  // 2. Try via Proxies
  for (const proxy of CORS_PROXIES) {
      try {
        const target = `${API_MIRRORS[0]}${endpoint}`;
        const url = `${proxy}${encodeURIComponent(target)}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) return await res.json();
      } catch (e) {
         console.warn(`Proxy ${proxy} failed.`);
      }
  }

  throw new Error("Unable to fetch data from any available source.");
};

// --- Mock Data for Fallback (Senior Engineering Pattern: Graceful Degradation) ---
const FALLBACK_MOVIES: Movie[] = [
    {
        id: 'solo-leveling',
        slug: 'solo-leveling',
        title: 'Solo Leveling',
        description: 'Ten years ago, "the Gate" appeared and connected the real world with the realm of magic and monsters. To combat these vile beasts, ordinary people received superhuman powers and became known as "Hunters".',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1164/141093.jpg',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1164/141093l.jpg',
        videoUrl: '',
        genre: ['Action', 'Fantasy'],
        rating: '8.5',
        year: 2024,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    },
    {
        id: 'one-piece',
        slug: 'one-piece',
        title: 'One Piece',
        description: 'Gol D. Roger was known as the "Pirate King", the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
        videoUrl: '',
        genre: ['Adventure', 'Fantasy'],
        rating: '8.7',
        year: 1999,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    },
    {
        id: 'jujutsu-kaisen',
        slug: 'jujutsu-kaisen',
        title: 'Jujutsu Kaisen',
        description: 'Idly indulging in baseless paranormal activities with the Occult Club, high schooler Yuuji Itadori spends his days at the clubroom or the hospital, where he visits his bedridden grandfather.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222.jpg',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg',
        videoUrl: '',
        genre: ['Action', 'Supernatural'],
        rating: '8.6',
        year: 2020,
        duration: '24m',
        type: 'anime',
        status: 'Completed'
    },
    {
        id: 'frieren',
        slug: 'sousou-no-frieren',
        title: 'Frieren: Beyond Journey\'s End',
        description: 'During their ten-year quest, the adventurer party of hero Himmel, priest Heiter, dwarf warrior Eisen, and elven mage Frieren defeat the Demon King and bring peace to the kingdom.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg',
        videoUrl: '',
        genre: ['Adventure', 'Drama', 'Fantasy'],
        rating: '9.1',
        year: 2023,
        duration: '24m',
        type: 'anime',
        status: 'Completed'
    },
    {
        id: 'kimetsu-no-yaiba',
        slug: 'kimetsu-no-yaiba',
        title: 'Demon Slayer: Kimetsu no Yaiba',
        description: 'Ever since the death of his father, the burden of supporting the family has fallen upon Tanjirou Kamado\'s shoulders.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889l.jpg',
        videoUrl: '',
        genre: ['Action', 'Demons'],
        rating: '8.5',
        year: 2019,
        duration: '24m',
        type: 'anime',
        status: 'Completed'
    }
];

// --- API Response Types (Kumanime Structure) ---
interface KumanimeItem {
  title: string;
  slug: string;
  thumb: string;
  type?: string;
  status?: string;
  episode?: string;
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
  episode_list: { title: string; id: string; uploaded_on: string }[]; 
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
    rating: "N/A", 
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

    // Handle malformed responses gracefully
    if (!data) throw new Error("Invalid data structure");

    const ongoingList = Array.isArray(data.ongoing) ? data.ongoing : [];
    const completedList = Array.isArray(data.completed) ? data.completed : [];

    if (ongoingList.length === 0 && completedList.length === 0) throw new Error("Empty data");

    const ongoing = ongoingList.map((item: any, idx: number) => mapKumanimeItemToMovie(item, idx));
    const completed = completedList.map((item: any, idx: number) => mapKumanimeItemToMovie(item, idx + 100));

    return { ongoing, completed };
  } catch (error) {
    console.warn("Using Fallback Data due to API Error:", error);
    // Return fallback data so the UI isn't empty
    return { 
        ongoing: FALLBACK_MOVIES, 
        completed: [...FALLBACK_MOVIES].reverse() 
    };
  }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
  // Check if it's a fallback ID
  const fallbackMatch = FALLBACK_MOVIES.find(m => m.slug === slug);
  if (fallbackMatch) {
      // Return mock details with fake episodes
      return {
          ...fallbackMatch,
          episodes: Array.from({ length: 12 }).map((_, i) => ({
              id: `ep-${i+1}`,
              number: i + 1,
              title: `Episode ${i + 1}`,
              thumbnailUrl: fallbackMatch.thumbnailUrl,
              videoUrl: '',
              duration: '24m',
              slug: 'mock-stream'
          }))
      };
  }

  try {
    const json = await fetchSafe(`/anime/${slug}`);
    const detail: KumanimeDetail = json.data || json;

    if (!detail) return null;

    const episodeList = detail.episode_list || [];
    const episodes: Episode[] = episodeList.map((ep: any, idx: number) => ({
      id: ep.id,
      slug: ep.id, 
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
  if (slug === 'mock-stream') {
      // Return a sample video for mock data
      return "https://www.w3schools.com/html/mov_bbb.mp4"; 
  }

  try {
    const json = await fetchSafe(`/episode/${slug}`);
    const data = json.data || json;

    if (data.stream_link) return data.stream_link;
    if (data.video_url) return data.video_url;
    if (data.stream && data.stream.url) return data.stream.url;

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
   return FALLBACK_MOVIES[0];
};

export const getMoviesByCategory = (category: string): Movie[] => [];
export const getTopAiring = (): Movie[] => [];
export const getMostPopular = (): Movie[] => [];
export const getMostFavorite = (): Movie[] => [];
export const getLatestCompleted = (): Movie[] => [];
