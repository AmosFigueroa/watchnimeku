import { Movie, Episode } from '../types';

const BASE_URL = 'https://api.jikan.moe/v4';

// --- DATA CADANGAN (FALLBACK) ---
// Digunakan jika API error atau terkena limit/CORS.
const FALLBACK_DATA = {
    MUSE: [
        { id: 'frieren-1', title: 'Frieren: Beyond Journey\'s End', thumbnailUrl: 'https://img.youtube.com/vi/qgQunNCiUFE/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/qgQunNCiUFE', youtubeId: 'qgQunNCiUFE', type: 'Anime', year: 2024, rating: '9.2', duration: '24m', description: 'Elf penyihir Frieren memulai perjalanan baru.', source: 'youtube' },
        { id: 'apothecary-1', title: 'The Apothecary Diaries', thumbnailUrl: 'https://img.youtube.com/vi/3M08ssH8tso/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/3M08ssH8tso', youtubeId: '3M08ssH8tso', type: 'Anime', year: 2024, rating: '8.9', duration: '24m', description: 'Maomao memecahkan misteri di istana dalam.', source: 'youtube' },
        { id: 'mushoku-1', title: 'Mushoku Tensei Season 2', thumbnailUrl: 'https://img.youtube.com/vi/6qLwH2gZgXw/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/6qLwH2gZgXw', youtubeId: '6qLwH2gZgXw', type: 'Anime', year: 2024, rating: '8.5', duration: '24m', description: 'Rudeus melanjutkan petualangannya.', source: 'youtube' },
        { id: 'slime-1', title: 'Tensei Shitara Slime Datta Ken', thumbnailUrl: 'https://img.youtube.com/vi/j5hVz6CgK7M/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/j5hVz6CgK7M', youtubeId: 'j5hVz6CgK7M', type: 'Anime', year: 2024, rating: '8.6', duration: '24m', description: 'Rimuru membangun negara monster.', source: 'youtube' }
    ],
    ANI_ONE: [
        { id: 'jjk-1', title: 'Jujutsu Kaisen Season 2', thumbnailUrl: 'https://img.youtube.com/vi/M__j_Lq4Vpw/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/M__j_Lq4Vpw', youtubeId: 'M__j_Lq4Vpw', type: 'Anime', year: 2024, rating: '9.0', duration: '24m', description: 'Insiden Shibuya dimulai.', source: 'youtube' },
        { id: 'csm-1', title: 'Chainsaw Man', thumbnailUrl: 'https://img.youtube.com/vi/q15CRdE5Bv0/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/q15CRdE5Bv0', youtubeId: 'q15CRdE5Bv0', type: 'Anime', year: 2023, rating: '8.8', duration: '24m', description: 'Denji menjadi pemburu iblis.', source: 'youtube' },
        { id: 'solo-1', title: 'Solo Leveling', thumbnailUrl: 'https://img.youtube.com/vi/WCHHtDyU0fI/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/WCHHtDyU0fI', youtubeId: 'WCHHtDyU0fI', type: 'Anime', year: 2024, rating: '8.7', duration: '24m', description: 'Sung Jinwoo bangkit dari hunter terlemah.', source: 'youtube' },
        { id: 'kaiju-8', title: 'Kaiju No. 8', thumbnailUrl: 'https://img.youtube.com/vi/t8b0hH-l9bI/maxresdefault.jpg', videoUrl: 'https://www.youtube.com/embed/t8b0hH-l9bI', youtubeId: 't8b0hH-l9bI', type: 'Anime', year: 2024, rating: '8.5', duration: '24m', description: 'Kafka Hibino ingin membasmi Kaiju.', source: 'youtube' }
    ],
    BOX_OFFICE: [
        { id: 'bo-1', title: 'Dune: Part Two', slug: 'dune-part-two', thumbnailUrl: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', type: 'Movie', year: 2024, rating: '8.8', duration: '2h 46m', description: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.', videoUrl: 'https://www.youtube.com/embed/Way9Dexny3w', youtubeId: 'Way9Dexny3w', genre: ['Sci-Fi', 'Action'], source: 'external' },
        { id: 'bo-2', title: 'Godzilla x Kong', slug: 'godzilla-x-kong', thumbnailUrl: 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg', type: 'Movie', year: 2024, rating: '7.2', duration: '1h 55m', description: 'Two ancient titans, Godzilla and Kong, clash in an epic battle as humans unravel their intertwined origins and connection to Skull Island\'s mysteries.', videoUrl: 'https://www.youtube.com/embed/lV1OOlGwExM', youtubeId: 'lV1OOlGwExM', genre: ['Action', 'Monster'], source: 'external' },
        { id: 'bo-3', title: 'Kung Fu Panda 4', slug: 'kung-fu-panda-4', thumbnailUrl: 'https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg', type: 'Movie', year: 2024, rating: '7.6', duration: '1h 34m', description: 'Po is gearing up to become the Spiritual Leader of his Valley of Peace.', videoUrl: 'https://www.youtube.com/embed/_inKs4eeHiI', youtubeId: '_inKs4eeHiI', genre: ['Animation', 'Comedy'], source: 'external' },
        { id: 'bo-4', title: 'Oppenheimer', slug: 'oppenheimer', thumbnailUrl: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', type: 'Movie', year: 2023, rating: '8.9', duration: '3h', description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.', videoUrl: 'https://www.youtube.com/embed/uYPbbksJxIg', youtubeId: 'uYPbbksJxIg', genre: ['Drama', 'History'], source: 'external' },
        { id: 'bo-5', title: 'Exhuma', slug: 'exhuma', thumbnailUrl: 'https://image.tmdb.org/t/p/original/pQYHouPsDf32FhIKYB72laNSJS.jpg', coverUrl: 'https://image.tmdb.org/t/p/original/pQYHouPsDf32FhIKYB72laNSJS.jpg', type: 'Movie', year: 2024, rating: '8.0', duration: '2h 14m', description: 'A wealthy family in LA experiences paranormal events.', videoUrl: 'https://www.youtube.com/embed/M2Z7v1rZtPQ', youtubeId: 'M2Z7v1rZtPQ', genre: ['Horror', 'Mystery'], source: 'external' }
    ]
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
    genre: Array.isArray(item.genres) ? item.genres.map((g: any) => g.name) : [],
    rating: item.score ? item.score.toString() : 'N/A',
    year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : 'N/A'),
    duration: item.duration || 'N/A',
    type: item.type === 'Movie' ? 'Movie' : 'Anime',
    status: item.status,
    totalEpisodes: item.episodes,
    source: 'youtube'
  };
};

// --- DATA FETCHING ---

// Channel IDs for Legal Anime
const CHANNELS = {
    MUSE_ID: 'UCxxnxya_3y9bdNMOWgFIVjg', 
    ANI_ONE_ID: 'UCRjQYlP3sQj4x5I2y0lJ3qg',
    TROPICS_ID: 'UCq09tX1y-5C0kY92XlZ6T_g' 
};

// Fetch RSS Feed from YouTube (with fallback)
const fetchYoutubeRSS = async (channelId: string, channelName: string, fallbackKey: keyof typeof FALLBACK_DATA): Promise<Movie[]> => {
    const targetUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    // Helper to process items
    const processItems = (items: any[], type: 'json' | 'xml') => {
        return items.map((entry): Movie | null => {
            let videoId = "", title = "", published = "";

            if (type === 'json') {
                const rawId = entry.guid || entry.link;
                if(rawId) videoId = rawId.includes('v=') ? rawId.split('v=')[1] : rawId.replace('yt:video:', '');
                title = entry.title;
                published = entry.pubDate;
            } else {
                videoId = entry.querySelector("videoId")?.textContent || "";
                title = entry.querySelector("title")?.textContent || "";
                published = entry.querySelector("published")?.textContent || "";
            }

            if (!videoId) return null;

            return {
                id: videoId,
                slug: videoId,
                title: title,
                description: `Tonton resmi dari ${channelName}.`,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                coverUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                videoUrl: `https://www.youtube.com/embed/${videoId}`,
                youtubeId: videoId,
                genre: ['Anime', 'Series'],
                rating: 'New',
                year: new Date(published).getFullYear() || 2024,
                duration: 'Full',
                type: 'Anime',
                status: 'Ongoing',
                source: 'youtube'
            };
        }).filter((m): m is Movie => m !== null);
    };

    try {
        // Try rss2json first
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}&api_key=0`);
        const data = await res.json();
        
        if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
             return processItems(data.items, 'json');
        }
        
        // If items are empty, it might be an API glitch, throw to use fallback
        throw new Error("RSS Empty");
    } catch (e) {
        // Fallback to static data if API fails or returns empty
        return FALLBACK_DATA[fallbackKey] as Movie[];
    }
};

// "Fake" Scraper that returns high quality static data because real client-side scraping is blocked
const fetchMovieBoxScraper = async (): Promise<Movie[]> => {
    // Return robust static data to ensure the "Movies" section is never empty
    return FALLBACK_DATA.BOX_OFFICE as Movie[];
};

export const getHomeData = async () => {
    try {
        // Use Promise.allSettled so if one fails, others still load
        const results = await Promise.allSettled([
            fetch(`${BASE_URL}/seasons/now?limit=10`).then(r => r.json()),
            fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=10`).then(r => r.json()),
            fetch(`${BASE_URL}/top/anime?type=movie&limit=10`).then(r => r.json()),
            fetchYoutubeRSS(CHANNELS.MUSE_ID, 'Muse Indonesia', 'MUSE'),
            fetchYoutubeRSS(CHANNELS.ANI_ONE_ID, 'Ani-One Indonesia', 'ANI_ONE'),
            fetchYoutubeRSS(CHANNELS.TROPICS_ID, 'Tropics Anime', 'MUSE'), // Reuse Muse fallback if needed
            fetchMovieBoxScraper() 
        ]);

        // Helper to extract data safely
        const getResult = (index: number, fallback: any[] = []) => {
            const res = results[index];
            if (res.status === 'fulfilled' && res.value) {
                // If it's a Jikan response
                if (res.value.data && Array.isArray(res.value.data)) return res.value.data.map(mapJikanToMovie);
                // If it's our array response (Youtube/Scraper)
                if (Array.isArray(res.value) && res.value.length > 0) return res.value;
            }
            return fallback;
        };

        const ongoing = getResult(0);
        const popular = getResult(1);
        const animeMovies = getResult(2);
        
        // If Jikan fails (empty array), fallback to some static data for "Ongoing"
        const finalOngoing = ongoing.length > 0 ? ongoing : FALLBACK_DATA.ANI_ONE;
        const finalPopular = popular.length > 0 ? popular : FALLBACK_DATA.MUSE;

        // Ensure youtube results are never empty
        const youtubeData = getResult(3, FALLBACK_DATA.MUSE);
        const bstationData = getResult(4, FALLBACK_DATA.ANI_ONE);
        
        return {
            ongoing: finalOngoing,
            completed: finalPopular,
            movies: animeMovies.length > 0 ? animeMovies : FALLBACK_DATA.BOX_OFFICE,
            youtube: youtubeData.length > 0 ? youtubeData : FALLBACK_DATA.MUSE,
            bstation: bstationData.length > 0 ? bstationData : FALLBACK_DATA.ANI_ONE,
            tropics: getResult(5, FALLBACK_DATA.MUSE),
            boxOffice: getResult(6, FALLBACK_DATA.BOX_OFFICE)
        };

    } catch (error) {
        console.error("Critical Error fetching data:", error);
        // Absolute fail-safe
        return {
            ongoing: FALLBACK_DATA.ANI_ONE as Movie[],
            completed: FALLBACK_DATA.MUSE as Movie[],
            youtube: FALLBACK_DATA.MUSE as Movie[],
            tropics: FALLBACK_DATA.MUSE as Movie[],
            movies: FALLBACK_DATA.BOX_OFFICE as Movie[],
            bstation: FALLBACK_DATA.ANI_ONE as Movie[],
            boxOffice: FALLBACK_DATA.BOX_OFFICE as Movie[]
        };
    }
};

export const getAnimeDetail = async (id: string, movie?: Movie): Promise<Movie | undefined> => {
    // If it's a static fallback movie, return it as is
    if (movie && movie.source === 'external') {
        return movie;
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
        if (!detailRes.ok) throw new Error('API Fail');
        const detailJson = await detailRes.json();
        const result = mapJikanToMovie(detailJson.data);
        
        try {
            const epRes = await fetch(`${BASE_URL}/anime/${id}/episodes`);
            const epJson = await epRes.json();
            if (epJson.data && Array.isArray(epJson.data)) {
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
        } catch(e) { /* ignore episode fetch fail */ }

        return result;
    } catch (error) {
        return movie; // Return original movie object if detailed fetch fails
    }
};