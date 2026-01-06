import { Movie, Episode } from '../types';

const BASE_URL = 'https://api.jikan.moe/v4';
const MOVIEBOX_URL = 'https://moviebox.ph'; // Target Site

// Helper to delay requests slightly to avoid Rate Limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Channel IDs for Legal Anime
const CHANNELS = {
    MUSE_ASIA: 'UCGbshtvS9t-8CW11W7TooQg',
    MUSE_ID: 'UCxxnxya_3y9bdNMOWgFIVjg', 
    ANI_ONE: 'UC0wXx3lHGq5hO0vE1E4F7gQ',
    ANI_ONE_ID: 'UCRjQYlP3sQj4x5I2y0lJ3qg',
    // Placeholder ID for "Tropics Anime Asia" - GANTI DENGAN ID CHANNEL ASLI
    // Contoh ID valid formatnya: UCxxxxxxxxxxxxxxxxxxxxxxx
    TROPICS_ID: 'UC_TROPICS_ANIME_PLACEHOLDER' 
};

// Map Jikan API response to our Movie Interface
const mapJikanToMovie = (item: any): Movie => {
  return {
    id: item.mal_id,
    slug: item.mal_id.toString(),
    title: item.title,
    description: item.synopsis || 'Sinopsis belum tersedia.',
    thumbnailUrl: item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url,
    coverUrl: item.trailer?.images?.maximum_image_url || item.images?.webp?.large_image_url,
    videoUrl: item.trailer?.embed_url || '',
    youtubeId: item.trailer?.youtube_id,
    genre: item.genres?.map((g: any) => g.name) || [],
    rating: item.score ? item.score.toString() : 'N/A',
    year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : 'N/A'),
    duration: item.duration || 'N/A',
    type: item.type === 'Movie' ? 'Movie' : 'Anime',
    status: item.status,
    totalEpisodes: item.episodes,
    source: 'youtube'
  };
};

// --- SCRAPING LOGIC ---

// Fetch HTML via Proxy to bypass CORS
const fetchViaProxy = async (url: string): Promise<Document | null> => {
    try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        if (!data.contents) return null;

        const parser = new DOMParser();
        return parser.parseFromString(data.contents, "text/html");
    } catch (e) {
        console.warn("Proxy Fetch Error:", e);
        return null;
    }
};

// Scraper for MovieBox (or generic fallback)
const fetchMovieBoxScraper = async (): Promise<Movie[]> => {
    // 1. Try to scrape the homepage of the target site
    const doc = await fetchViaProxy(MOVIEBOX_URL);
    if (!doc) return [];

    const movies: Movie[] = [];
    
    // Generic selectors common in streaming themes (adjust if specific site layout is known)
    // Looking for article tags or items with class 'item', 'movie', 'post'
    const items = doc.querySelectorAll('article, .item, .movie-card, .post');

    items.forEach((item, index) => {
        if (index > 10) return; // Limit items

        const titleEl = item.querySelector('h1, h2, h3, .title, .entry-title');
        const imgEl = item.querySelector('img');
        const linkEl = item.querySelector('a');

        if (titleEl && imgEl && linkEl) {
            const title = titleEl.textContent?.trim() || "Unknown Title";
            const link = linkEl.getAttribute('href');
            let img = imgEl.getAttribute('src') || imgEl.getAttribute('data-src');

            // Fix relative URLs
            if (link && !link.startsWith('http')) return; 

            movies.push({
                id: `mb-${index}`,
                slug: link || `mb-${index}`, // Use the URL as slug for detail fetching
                title: title,
                // Changed description to be generic
                description: "Film Box Office Terbaru. Klik untuk menonton.",
                thumbnailUrl: img || '',
                coverUrl: img || '',
                // Smart Fallback: Use a generic embed finder if scraping detail fails later
                videoUrl: '', 
                genre: ['Movie', 'Box Office'],
                rating: 'Hot',
                year: 2024,
                duration: 'Full Movie',
                type: 'Movie',
                source: 'external',
                youtubeId: undefined
            });
        }
    });

    return movies;
};

// Fetch Detail from External Site (Crawling the video player)
export const getExternalDetail = async (movie: Movie): Promise<Movie> => {
    if (!movie.slug || !movie.slug.startsWith('http')) {
        // If we don't have a scrape link, use "Smart Embed"
        // This constructs a player URL based on the title (Simulating a search)
        // NOTE: This uses a popular 3rd party embed API that functions like MovieBox
        // Remove spaces and special chars for query
        const query = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return {
            ...movie,
            // Fallback to a "Smart Player" that accepts a query or IMDB ID. 
            // Since we only have title here, we use a search-based embed or generic placeholder.
            // For demo purposes, we will return a flag that tells VideoPlayer to search.
            videoUrl: `https://www.google.com/search?q=${movie.title}+full+movie` 
        };
    }

    // If we have a link, try to scrape the player
    const doc = await fetchViaProxy(movie.slug);
    if (doc) {
        // Look for iframe inside the page
        const iframe = doc.querySelector('iframe');
        if (iframe) {
            const src = iframe.getAttribute('src');
            if (src) {
                return { ...movie, videoUrl: src };
            }
        }
    }
    
    return movie;
};

// Fetch RSS Feed from YouTube with OPTIONAL FILTER
const fetchYoutubeRSS = async (channelId: string, channelName: string, filterKeywords: string[] = []): Promise<Movie[]> => {
    try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)}`);
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const entries = Array.from(xml.querySelectorAll("entry"));

        const movies = entries.map((entry): Movie => {
            const videoId = entry.querySelector("videoId")?.textContent || "";
            const title = entry.querySelector("title")?.textContent || "";
            const published = entry.querySelector("published")?.textContent || "";
            const date = new Date(published);
            
            return {
                id: videoId,
                slug: videoId,
                title: title,
                // Changed description to be generic
                description: `Update episode terbaru. Tonton sekarang dalam resolusi HD.`,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                coverUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                videoUrl: `https://www.youtube.com/embed/${videoId}`,
                youtubeId: videoId,
                genre: ['Anime', 'Update'],
                rating: 'New',
                year: date.getFullYear(),
                duration: 'Full',
                type: 'Anime',
                status: 'Ongoing',
                source: 'youtube'
            };
        });

        // Filter Logic: If keywords are provided, only return items matching keywords (case-insensitive)
        if (filterKeywords.length > 0) {
            return movies.filter(movie => {
                const titleLower = movie.title.toLowerCase();
                return filterKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
            });
        }

        return movies;

    } catch (error) {
        console.error(`RSS Error ${channelName}:`, error);
        return [];
    }
};

export const getHomeData = async () => {
    try {
        // Parallel Fetching: Jikan (Anime), YouTube (Updates), MovieBox (External)
        const [ongoingRes, popularRes, moviesRes, museData, aniOneData, tropicsData, externalMovies] = await Promise.all([
            fetch(`${BASE_URL}/seasons/now?limit=10`).then(r => r.json()),
            fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=10`).then(r => r.json()),
            fetch(`${BASE_URL}/top/anime?type=movie&limit=10`).then(r => r.json()),
            fetchYoutubeRSS(CHANNELS.MUSE_ID, 'Muse Indonesia'),
            fetchYoutubeRSS(CHANNELS.ANI_ONE, 'Ani-One Asia'),
            // Fetch Tropics Anime Asia with INDO filters
            fetchYoutubeRSS(CHANNELS.TROPICS_ID, 'Tropics Anime Asia', ['Indonesia', 'Indo', 'Sub Indo', 'Bahasa']),
            fetchMovieBoxScraper() // Fetch from MovieBox
        ]);

        const ongoing = ongoingRes.data?.map(mapJikanToMovie) || [];
        const completed = popularRes.data?.map(mapJikanToMovie) || [];
        const animeMovies = moviesRes.data?.map(mapJikanToMovie) || [];

        // If External Scrape fails (empty), provide some backup Mock Data for "Box Office" visualization
        // so the UI doesn't look broken if moviebox.ph is down.
        const boxOffice = externalMovies.length > 0 ? externalMovies : [
            {
                id: 'backup-1', slug: 'dune-2', title: 'Dune: Part Two', 
                thumbnailUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
                description: 'Paul Atreides unites with Chani and the Fremen.', videoUrl: 'https://vidsrc.to/embed/movie/693134', 
                genre: ['Action', 'Sci-Fi'], rating: '8.8', year: 2024, duration: '2h 46m', type: 'Movie', source: 'external'
            },
            {
                id: 'backup-2', slug: 'godzilla-x-kong', title: 'Godzilla x Kong', 
                thumbnailUrl: 'https://image.tmdb.org/t/p/w500/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
                description: 'The new empire rises.', videoUrl: 'https://vidsrc.to/embed/movie/823464', 
                genre: ['Action', 'Monster'], rating: '7.2', year: 2024, duration: '1h 55m', type: 'Movie', source: 'external'
            }
        ];

        return {
            ongoing,
            completed,
            youtube: museData,
            tropics: tropicsData, // NEW DATA
            movies: animeMovies,
            bstation: aniOneData,
            boxOffice: boxOffice as Movie[]
        };

    } catch (error) {
        console.error("Error fetching data:", error);
        return { ongoing: [], completed: [], youtube: [], tropics: [], movies: [], bstation: [], boxOffice: [] };
    }
};

export const getAnimeDetail = async (id: string, movie?: Movie): Promise<Movie | undefined> => {
    // 1. If it's an External source (MovieBox), try to scrape the video player
    if (movie && movie.source === 'external') {
        const details = await getExternalDetail(movie);
        return details;
    }

    // 2. YouTube ID handling
    if (id.length === 11 && !/^\d+$/.test(id)) {
         return {
            id: id,
            title: 'YouTube Video',
            description: '',
            thumbnailUrl: '',
            coverUrl: '',
            videoUrl: '',
            genre: [],
            rating: '',
            year: '',
            duration: '',
            type: 'Anime',
            youtubeId: id
        }; 
    }

    // 3. Jikan Standard Fetch
    try {
        const detailRes = await fetch(`${BASE_URL}/anime/${id}/full`);
        const detailJson = await detailRes.json();
        
        if (!detailJson.data) return undefined;

        const result = mapJikanToMovie(detailJson.data);

        // Fetch Episodes
        const epRes = await fetch(`${BASE_URL}/anime/${id}/episodes`);
        const epJson = await epRes.json();

        if (epJson.data) {
            result.episodes = epJson.data.map((ep: any) => ({
                id: ep.mal_id.toString(),
                number: ep.mal_id,
                title: ep.title,
                thumbnailUrl: result.thumbnailUrl, 
                videoUrl: result.videoUrl, 
                duration: '24m',
                slug: id
            }));
        }
        return result;
    } catch (error) {
        return undefined;
    }
};