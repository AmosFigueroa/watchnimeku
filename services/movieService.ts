import { Movie, Episode } from '../types';

const BASE_URL = 'https://api.jikan.moe/v4';
const MOVIEBOX_URL = 'https://moviebox.ph'; // Target Site

// Helper to delay requests slightly to avoid Rate Limits
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Channel IDs for Legal Anime
const CHANNELS = {
    // Muse Indonesia: https://www.youtube.com/@MuseIndonesia
    MUSE_ID: 'UCxxnxya_3y9bdNMOWgFIVjg', 
    
    // Ani-One Indonesia: https://www.youtube.com/@AniOneID
    ANI_ONE_ID: 'UCRjQYlP3sQj4x5I2y0lJ3qg',

    // Tropics Anime Asia: https://www.youtube.com/@TropicsAnimeAsia
    TROPICS_ID: 'UCq09tX1y-5C0kY92XlZ6T_g' 
};

// Map Jikan API response to our Movie Interface
const mapJikanToMovie = (item: any): Movie => {
  return {
    id: item.mal_id,
    slug: item.mal_id.toString(),
    title: item.title,
    description: item.synopsis || 'Sinopsis belum tersedia untuk judul ini.',
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

// --- ROBUST PROXY UTILITIES ---

// List of Proxies to rotate through if one fails
const PROXY_PROVIDERS = [
    // 1. AllOrigins (Returns JSON with 'contents' field)
    {
        name: 'AllOrigins',
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        extract: async (res: Response) => {
            const json = await res.json();
            return json.contents;
        }
    },
    // 2. CodeTabs (Direct Raw)
    {
        name: 'CodeTabs',
        url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
        extract: async (res: Response) => await res.text()
    },
    // 3. CorsProxy.io (Direct Raw)
    {
        name: 'CorsProxy',
        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        extract: async (res: Response) => await res.text()
    },
    // 4. ThingProxy (Direct Raw)
    {
        name: 'ThingProxy',
        url: (target: string) => `https://thingproxy.freeboard.io/fetch/${target}`,
        extract: async (res: Response) => await res.text()
    }
];

// Generic Fetcher with Fallback Strategy
const fetchWithFallback = async (targetUrl: string, type: 'html' | 'xml'): Promise<string | null> => {
    for (const provider of PROXY_PROVIDERS) {
        try {
            const proxyUrl = provider.url(targetUrl);
            const response = await fetch(proxyUrl);
            
            if (!response.ok) throw new Error(`Status ${response.status}`);
            
            const content = await provider.extract(response);
            
            if (!content || content.length < 50) throw new Error("Empty or invalid content");

            // Basic validation to ensure we didn't just fetch an error page
            if (type === 'xml' && !content.includes('<?xml') && !content.includes('<feed')) {
                throw new Error("Not XML");
            }

            return content;
        } catch (e) {
            // Silently fail and try next proxy
            // console.warn(`Proxy ${provider.name} failed for ${targetUrl}`);
            continue;
        }
    }
    return null;
};

// --- SCRAPING LOGIC ---

// Fetch HTML via Proxy Rotation
const fetchViaProxy = async (url: string): Promise<Document | null> => {
    const htmlContent = await fetchWithFallback(url, 'html');
    
    if (htmlContent) {
        const parser = new DOMParser();
        return parser.parseFromString(htmlContent, "text/html");
    }
    
    return null;
};

// Scraper for MovieBox
const fetchMovieBoxScraper = async (): Promise<Movie[]> => {
    // 1. Try to scrape the homepage of the target site
    const doc = await fetchViaProxy(MOVIEBOX_URL);
    if (!doc) return [];

    const movies: Movie[] = [];
    
    // Generic selectors common in streaming themes
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
                slug: link || `mb-${index}`, 
                title: title,
                // GENERIC DESCRIPTION (No branding)
                description: "Saksikan film bioskop pilihan ini dengan kualitas terbaik.",
                thumbnailUrl: img || '',
                coverUrl: img || '',
                videoUrl: '', 
                genre: ['Movie', 'Cinema'],
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

// Fetch Detail from External Site
export const getExternalDetail = async (movie: Movie): Promise<Movie> => {
    if (!movie.slug || !movie.slug.startsWith('http')) {
        return {
            ...movie,
            videoUrl: `https://www.google.com/search?q=${encodeURIComponent(movie.title)}+full+movie+streaming` 
        };
    }

    const doc = await fetchViaProxy(movie.slug);
    if (doc) {
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

// Fetch RSS Feed from YouTube
const fetchYoutubeRSS = async (channelId: string, channelName: string, filterKeywords: string[] = []): Promise<Movie[]> => {
    if (!channelId) {
        return [];
    }

    const targetUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    // Helper to extract strictly necessary data
    const processItems = (items: any[], type: 'json' | 'xml') => {
        return items.map((entry): Movie | null => {
            let videoId = "";
            let title = "";
            let published = "";

            if (type === 'json') {
                // RSS2JSON Format
                // Clean video ID from guid or link
                const rawId = entry.guid || entry.link;
                if(rawId) {
                     videoId = rawId.includes('v=') ? rawId.split('v=')[1] : rawId.replace('yt:video:', '');
                }
                title = entry.title;
                published = entry.pubDate;
            } else {
                // XML DOM Element
                videoId = entry.querySelector("videoId")?.textContent || "";
                title = entry.querySelector("title")?.textContent || "";
                published = entry.querySelector("published")?.textContent || "";
            }

            if (!videoId || !title) return null;

            // Remove typical file noise if needed
            title = title.replace(/\[.*?\]/g, '').trim();

            const date = new Date(published);
            
            return {
                id: videoId,
                slug: videoId,
                title: title,
                description: `Saksikan episode terbaru dari ${title} di channel resmi ${channelName}.`,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, // Use mqdefault for lighter load
                coverUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                videoUrl: `https://www.youtube.com/embed/${videoId}`,
                youtubeId: videoId,
                genre: ['Anime', 'Series'],
                rating: 'New',
                year: date.getFullYear() || new Date().getFullYear(),
                duration: 'Full',
                type: 'Anime',
                status: 'Ongoing',
                source: 'youtube'
            };
        }).filter((m): m is Movie => m !== null); // Remove nulls
    };

    // STRATEGY 1: rss2json (Primary - Best for Client-Side JSON)
    try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}&api_key=0`); // api_key=0 often bypasses caches
        const data = await res.json();
        
        if (data.status === 'ok' && Array.isArray(data.items)) {
             const movies = processItems(data.items, 'json');
             return filterMovies(movies, filterKeywords);
        }
    } catch (e) {
        // Fallthrough to proxies
    }

    // STRATEGY 2: XML Proxy Rotation (Fallback)
    try {
        const xmlText = await fetchWithFallback(targetUrl, 'xml');

        if (xmlText) {
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, "text/xml");
            const entries = Array.from(xml.querySelectorAll("entry"));

            const movies = processItems(entries, 'xml');
            return filterMovies(movies, filterKeywords);
        }
    } catch (error) {
        console.error(`All proxies failed for ${channelName}`);
    }

    return [];
};

// Helper for filtering keywords
const filterMovies = (movies: Movie[], keywords: string[]) => {
    if (keywords.length === 0) return movies;
    return movies.filter(movie => {
        const titleLower = movie.title.toLowerCase();
        return keywords.some(keyword => titleLower.includes(keyword.toLowerCase()));
    });
}

export const getHomeData = async () => {
    try {
        const [ongoingRes, popularRes, moviesRes, museData, aniOneData, tropicsData, externalMovies] = await Promise.all([
            fetch(`${BASE_URL}/seasons/now?limit=10`).then(r => r.json()).catch(() => ({ data: [] })),
            fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=10`).then(r => r.json()).catch(() => ({ data: [] })),
            fetch(`${BASE_URL}/top/anime?type=movie&limit=10`).then(r => r.json()).catch(() => ({ data: [] })),
            // Muse Indonesia (Specific ID)
            fetchYoutubeRSS(CHANNELS.MUSE_ID, 'Muse Indonesia'),
            // Ani-One Indonesia (Specific ID)
            fetchYoutubeRSS(CHANNELS.ANI_ONE_ID, 'Ani-One Indonesia'),
            // Tropics Anime Asia
            fetchYoutubeRSS(CHANNELS.TROPICS_ID, 'Tropics Anime'),
            // MovieBox
            fetchMovieBoxScraper() 
        ]);

        const ongoing = ongoingRes.data?.map(mapJikanToMovie) || [];
        const completed = popularRes.data?.map(mapJikanToMovie) || [];
        const animeMovies = moviesRes.data?.map(mapJikanToMovie) || [];

        // Backup Data if External fails
        const boxOffice = externalMovies.length > 0 ? externalMovies : [
            {
                id: 'backup-1', slug: 'dune-2', title: 'Dune: Part Two', 
                thumbnailUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
                description: 'Perjuangan Paul Atreides di planet Arrakis.', videoUrl: '', 
                genre: ['Action', 'Sci-Fi'], rating: '8.8', year: 2024, duration: '2h 46m', type: 'Movie', source: 'external'
            },
            {
                id: 'backup-2', slug: 'godzilla-x-kong', title: 'Godzilla x Kong', 
                thumbnailUrl: 'https://image.tmdb.org/t/p/w500/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
                description: 'Pertarungan raksasa baru dimulai.', videoUrl: '', 
                genre: ['Action', 'Monster'], rating: '7.2', year: 2024, duration: '1h 55m', type: 'Movie', source: 'external'
            }
        ];

        return {
            ongoing,
            completed,
            youtube: museData,
            tropics: tropicsData,
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
    if (movie && movie.source === 'external') {
        const details = await getExternalDetail(movie);
        return details;
    }
    // YouTube ID handling
    if (id.length === 11 && !/^\d+$/.test(id)) {
         return {
            id: id,
            title: 'Official Stream',
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
    try {
        const detailRes = await fetch(`${BASE_URL}/anime/${id}/full`);
        const detailJson = await detailRes.json();
        if (!detailJson.data) return undefined;
        const result = mapJikanToMovie(detailJson.data);
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