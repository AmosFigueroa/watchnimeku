import { Movie, Episode, Stream } from '../types';

// --- CONFIGURATION ---
const SOURCES = {
    SAMEHADAKU: 'https://v1.samehadaku.how', // Indonesian Anime Site
    MOVIEBOX: 'https://moviebox.ph', // Western Movies (Global)
    YOUTUBE_SEARCH: 'https://www.youtube.com/results?search_query=',
    DAILYMOTION_API: 'https://api.dailymotion.com/videos',
};

const JIKAN_API = 'https://api.jikan.moe/v4';

// --- EXPANDED LEGAL YOUTUBE CATALOG (INDONESIA REGION) ---
const YOUTUBE_CATALOG = [
    // --- MUSE INDONESIA ---
    { title: 'Frieren: Beyond Journey\'s End', ytId: 'PLwLSw1_eDZl2d3L2C3r37F4i_1p6o9-wM', channel: 'Muse Indonesia' },
    { title: 'Spy x Family', ytId: 'PLwLSw1_eDZl0fx5q3f15q2g4W33TfF_Wb', channel: 'Muse Indonesia' },
    { title: 'Tensei Shitara Slime Datta Ken', ytId: 'PLwLSw1_eDZl2eP86ZJD1W49W1b2F8F6sB', channel: 'Muse Indonesia' },
    { title: 'Mushoku Tensei Season 1', ytId: 'PLwLSw1_eDZl33k_744_41y9fK3XwMmsf2', channel: 'Muse Indonesia' },
    { title: 'Classroom of the Elite', ytId: 'PLwLSw1_eDZl08aDUEvY2Ygl2yJ8XvUezR', channel: 'Muse Indonesia' },
    { title: 'One Punch Man', ytId: 'PLwLSw1_eDZl1n9fJOuLlgR6ZVhM8O-7Xb', channel: 'Muse Indonesia' },
    { title: 'Mob Psycho 100', ytId: 'PLwLSw1_eDZl2AouX4kL6-k_iZ7RQUjN6H', channel: 'Muse Indonesia' },
    { title: 'Dr. STONE', ytId: 'PLwLSw1_eDZl0k95_6P9K34lXz841P1Vj_', channel: 'Muse Indonesia' },
    { title: 'Hyouka', ytId: 'PLwLSw1_eDZl0i_8yJj9rFdhQ4J4Dk9v57', channel: 'Muse Indonesia' },
    { title: 'Hunter x Hunter', ytId: 'PLwLSw1_eDZl1s7w9-i_r9Qj9yZ8Q4k1a', channel: 'Muse Indonesia' },
    { title: 'Kage no Jitsuryokusha', ytId: 'PLwLSw1_eDZl0f_xH-G7C8iXjR_jQ2Zq_', channel: 'Muse Indonesia' },
    { title: 'Tokyo Revengers', ytId: 'PLwLSw1_eDZl0rKVf6vt4y6bk3Q_b_C8XQ', channel: 'Muse Indonesia' },

    // --- ANI-ONE INDONESIA / ASIA ---
    { title: 'Chainsaw Man', ytId: 'PLxSscENEp7JiG259lWz1yG6_j50nQp_p', channel: 'Ani-One Asia' },
    { title: 'Haikyuu', ytId: 'PLxSscENEp7Jj7fOsh_vnCcS0r_n_3bYF-', channel: 'Ani-One Asia' },
    { title: 'Blue Lock', ytId: 'PLxSscENEp7JhO1D9Q3R_C5c-L_j_Kj_q', channel: 'Ani-One Asia' },
    { title: 'Jujutsu Kaisen', ytId: 'PLxSscENEp7JilsOQy_y0X61V3BdbG6YQ5', channel: 'Ani-One Asia' },
    { title: 'Dr. Stone New World', ytId: 'PLxSscENEp7JjS958_1-G9-C7-C57gL2h-', channel: 'Ani-One Asia' },
    
    // --- GUNDAM INFO ---
    { title: 'Mobile Suit Gundam: The Witch from Mercury', ytId: 'PLJV1h9xQ7Hx_jXtO1GTqjdDfC5Q5tuON9', channel: 'GundamInfo' },
    { title: 'Gundam Build Metaverse', ytId: 'PLJV1h9xQ7Hx_p49Tj_1A9s5otvY--SshK', channel: 'GundamInfo' },

    // --- TROPICS / POPS ANIME / LAINNYA ---
    { title: 'Slam Dunk', ytId: 'PL0-e22Q_tG3pHMh_J869M0O5P_90bMvC-', channel: 'POPS Anime' }, 
    { title: 'Detective Conan', ytId: 'PL0-e22Q_tG3oFm58dJdOqjSpP-65L7gO-', channel: 'POPS Anime' }, 
    { title: 'Initial D', ytId: 'PL0-e22Q_tG3o-MiwB23NfTIEIDL1Tjbv2', channel: 'POPS Anime' }, 
];

const BSTATION_TITLES = [
    'Naruto: Shippuuden',
    'Boruto: Naruto Next Generations',
    'Demon Slayer',
    'Black Clover',
    'Bleach',
    'One Piece',
    'Fate/stay night'
];

// --- PROXY ROTATION SYSTEM ---
const PROXIES = [
    {
        url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
        isJson: false
    },
    {
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        isJson: true
    },
    {
        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        isJson: false
    }
];

// --- UTILS ---

const cleanText = (text: string | undefined | null) => {
    return text ? text.trim().replace(/\s+/g, ' ') : '';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchHTML = async (targetUrl: string): Promise<string> => {
  let lastError;
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.url(targetUrl);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(proxyUrl, { 
          signal: controller.signal,
          headers: { 'Origin': window.location.origin }
      });
      clearTimeout(id);

      if (res.ok) {
        let text = '';
        if (proxy.isJson) {
            const data = await res.json();
            text = data.contents;
        } else {
            text = await res.text();
        }

        if (text && text.length > 500 && !text.includes('403 Forbidden')) {
            return text;
        }
      }
    } catch (e) {
      lastError = e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw new Error(`Failed to fetch ${targetUrl}. Last error: ${lastError}`);
};

const parseDOM = (html: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

// --- YOUTUBE SPECIFIC HELPERS ---

/**
 * Enhanced Search: Parses ytInitialData for accuracy, falls back to regex.
 */
const searchYouTubeVideoId = async (query: string): Promise<string | null> => {
    try {
        const url = `${SOURCES.YOUTUBE_SEARCH}${encodeURIComponent(query)}`;
        const html = await fetchHTML(url);
        
        // Strategy 1: Parse JSON (Most Accurate)
        const jsonMatch = html.match(/var ytInitialData\s*=\s*({.+?});/);
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
                if (contents) {
                    for (const item of contents) {
                        if (item.videoRenderer) {
                            return item.videoRenderer.videoId;
                        }
                    }
                }
            } catch (e) { /* ignore parse error */ }
        }
        
        // Strategy 2: Regex Fallback
        const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (videoIdMatch && videoIdMatch[1]) {
            return videoIdMatch[1];
        }

        return null;
    } catch (e) {
        console.warn("YouTube Search Failed:", e);
        return null;
    }
};

/**
 * Scrapes a YouTube playlist page to get REAL video IDs and titles.
 * This avoids relying on "index" which causes playback errors.
 */
export const getYouTubePlaylistEpisodes = async (playlistId: string): Promise<Episode[]> => {
    try {
        const url = `https://www.youtube.com/playlist?list=${playlistId}`;
        const html = await fetchHTML(url);
        
        const jsonMatch = html.match(/var ytInitialData\s*=\s*({.+?});/);
        if (!jsonMatch) return [];
        
        const data = JSON.parse(jsonMatch[1]);
        
        // Traverse deeply nested JSON structure of YouTube
        const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const tab = tabs?.find((t: any) => t.tabRenderer?.selected);
        const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
        const itemSection = contents?.find((c: any) => c.itemSectionRenderer);
        const videos = itemSection?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
        
        if (!videos) return [];
        
        return videos.map((item: any, index: number) => {
            const vid = item.playlistVideoRenderer;
            if (!vid) return null;
            
            // Prefer high res thumbnail
            const thumb = vid.thumbnail?.thumbnails?.reduce((prev: any, current: any) => {
                return (prev.width > current.width) ? prev : current;
            })?.url || '';

            return {
                id: vid.videoId,
                number: parseInt(vid.index?.simpleText) || index + 1,
                title: vid.title?.runs?.[0]?.text || `Episode ${index + 1}`,
                description: 'Tonton Video Ini',
                thumbnailUrl: thumb,
                videoUrl: '',
                duration: vid.lengthText?.simpleText || '24m',
                slug: vid.videoId // IMPORTANT: Use Direct ID as slug
            };
        }).filter((e: any) => e !== null);

    } catch (e) {
        console.error("Playlist Scrape Failed", e);
        return [];
    }
};

// --- DAILYMOTION HELPER ---

/**
 * Search Dailymotion for videos based on query (e.g., Short Dramas)
 */
const getDailymotionData = async (query: string, type: 'Anime' | 'Drama' = 'Drama'): Promise<Movie[]> => {
    try {
        // Dailymotion API Public Search
        // fields: id, title, thumbnail_url, description, duration, owner.username
        const url = `${SOURCES.DAILYMOTION_API}?fields=id,title,thumbnail_720_url,description,duration,owner.username&limit=15&search=${encodeURIComponent(query)}&sort=visited`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.list) return [];

        return data.list.map((item: any) => ({
            id: item.id,
            slug: `dm-${item.id}`, // Custom slug prefix for Dailymotion
            title: item.title,
            description: item.description || `Tonton ${type} seru ini di Dailymotion.`,
            thumbnailUrl: item.thumbnail_720_url || item.thumbnail_url,
            coverUrl: item.thumbnail_720_url || item.thumbnail_url,
            videoUrl: '',
            genre: [type, 'Shorts'],
            rating: 'N/A',
            year: '2024',
            duration: Math.floor(item.duration / 60) + 'm',
            type: type,
            status: 'Released',
            source: 'dailymotion',
            episodes: [{
                id: item.id,
                number: 1,
                title: item.title,
                thumbnailUrl: item.thumbnail_720_url,
                videoUrl: '',
                duration: Math.floor(item.duration / 60) + 'm',
                slug: `dm-${item.id}`
            }]
        }));

    } catch (e) {
        console.warn(`Dailymotion fetch failed for ${query}`, e);
        return [];
    }
};


// --- JIKAN MAPPERS ---
const mapJikanToMovie = (data: any): Movie => {
    return {
        id: data.mal_id,
        slug: data.mal_id.toString(),
        title: data.title,
        description: data.synopsis || "Sinopsis belum tersedia.",
        thumbnailUrl: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || '',
        coverUrl: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || '',
        videoUrl: '', 
        genre: data.genres?.map((g: any) => g.name) || [],
        rating: data.score ? `${data.score}` : 'N/A',
        year: data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : 'Unknown'),
        duration: data.duration || '24m',
        type: data.type || 'Anime',
        status: data.status,
        totalEpisodes: data.episodes,
        source: 'scrape'
    };
};

// --- MOVIEBOX SCRAPER HELPERS ---
const extractMovieBoxHome = (doc: Document): Movie[] => {
    const movies: Movie[] = [];
    const items = doc.querySelectorAll('.items article, .filmlist .item, .movies-list .movie-item, article.item');

    items.forEach((el) => {
        const titleEl = el.querySelector('.title, h3 a, .entry-title a, h2');
        const linkEl = el.querySelector('a');
        const imgEl = el.querySelector('img');
        const yearEl = el.querySelector('.year, .meta .date, .create-time');
        const ratingEl = el.querySelector('.rating, .vote');

        let thumb = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || '';
        if (thumb.startsWith('//')) thumb = `https:${thumb}`;
        thumb = thumb.replace(/w=\d+&h=\d+/, 'w=600&h=900');

        const title = cleanText(titleEl?.textContent);
        const url = linkEl?.getAttribute('href') || '';
        const year = cleanText(yearEl?.textContent) || new Date().getFullYear().toString();
        const rating = cleanText(ratingEl?.textContent) || 'N/A';

        if (title && url) {
            movies.push({
                id: url,
                slug: url, 
                title: title,
                description: `Nonton film ${title} subtitle Indonesia.`,
                thumbnailUrl: thumb,
                coverUrl: thumb,
                videoUrl: '',
                genre: ['Movie'],
                rating: rating,
                year: year,
                duration: 'Movie',
                type: 'movie',
                status: 'Released',
                source: 'scrape'
            });
        }
    });

    return movies;
};

const extractMovieBoxDetails = (doc: Document, url: string): Movie => {
    const title = cleanText(doc.querySelector('h1.entry-title, .s-title, h1.title')?.textContent) || 'Movie';
    const desc = cleanText(doc.querySelector('.entry-content, .description, .story')?.textContent) || 'Tidak ada deskripsi.';
    
    let thumb = doc.querySelector('.poster img, .thumb img')?.getAttribute('src') || '';
    if (thumb.startsWith('//')) thumb = `https:${thumb}`;

    const episodeList = doc.querySelectorAll('.episodes li a, .eplister li a');
    const episodes: Episode[] = [];

    if (episodeList.length > 0) {
        episodeList.forEach((el) => {
            const epUrl = el.getAttribute('href') || '';
            const epTitle = cleanText(el.querySelector('.num-ep, .e-num')?.textContent) || cleanText(el.textContent);
            const epNum = parseInt(epTitle.replace(/\D/g, '')) || 0;

            if (epUrl) {
                episodes.push({
                    id: epUrl,
                    slug: epUrl, 
                    number: epNum,
                    title: `Episode ${epNum}`,
                    thumbnailUrl: thumb,
                    videoUrl: '',
                    duration: '45m'
                });
            }
        });
        episodes.sort((a, b) => a.number - b.number);
    } else {
        episodes.push({
            id: url,
            slug: url,
            number: 1,
            title: "Full Movie",
            thumbnailUrl: thumb,
            videoUrl: '',
            duration: 'Movie'
        });
    }

    return {
        id: url,
        slug: url,
        title: title,
        description: desc,
        thumbnailUrl: thumb,
        coverUrl: thumb,
        videoUrl: '',
        genre: ['Movie'],
        rating: 'N/A',
        year: '2024',
        duration: 'Movie',
        type: episodes.length > 1 ? 'series' : 'movie',
        episodes: episodes,
        status: 'Released',
        source: 'scrape'
    };
};

const extractStreams = (doc: Document): Stream[] => {
    const streams: Stream[] = [];
    const VALID_HOSTS = ['blogger', 'kurama', 'mp4upload', 'streamsb', 'dood', 'file', 'archive', 'youtube', 'ok.ru', 'gdrive', 'zippyshare', 'vid', 'player', 'emb'];

    const iframes = doc.querySelectorAll('iframe');
    iframes.forEach((iframe, idx) => {
        const src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
        if (!src) return;

        const isAd = src.includes('google') || src.includes('facebook') || src.includes('mgid') || src.includes('ads');
        const isValid = VALID_HOSTS.some(host => src.includes(host)) || src.includes('/play/') || src.includes('embed');

        if (isValid && !isAd) {
            const cleanSrc = src.startsWith('//') ? `https:${src}` : src;
            streams.push({
                server: `Server ${idx + 1}`,
                resolution: 'Auto',
                url: cleanSrc,
                type: 'iframe'
            });
        }
    });
    
    return streams.filter((v,i,a)=>a.findIndex(t=>(t.url===v.url))===i);
};

// --- EXPORTED SERVICE FUNCTIONS ---

export const getBstationData = async (): Promise<Movie[]> => {
    const results: Movie[] = [];
    for (const title of BSTATION_TITLES) {
        try {
            await delay(300);
            const res = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(title)}&limit=1`);
            const json = await res.json();
            if (json.data && json.data.length > 0) {
                 const movie = mapJikanToMovie(json.data[0]);
                 movie.source = 'scrape'; 
                 results.push(movie);
            }
        } catch(e) { /* ignore */ }
    }
    return results;
};

export const getYouTubeAnimeData = async (): Promise<Movie[]> => {
    const results: Movie[] = [];
    const catalog = [...YOUTUBE_CATALOG]; 

    for (const item of catalog) {
        try {
            await delay(350); 
            const res = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(item.title)}&limit=1`);
            const json = await res.json();
            
            if (json.data && json.data.length > 0) {
                const animeData = json.data[0];
                const movie = mapJikanToMovie(animeData);
                movie.source = 'youtube';
                movie.youtubeId = item.ytId;
                
                const epCount = animeData.episodes || 12;
                
                // Construct "Smart" Slugs for Search Fallback
                movie.episodes = Array.from({ length: epCount }, (_, i) => ({
                    id: `yt-${item.ytId}-${i+1}`,
                    number: i + 1,
                    title: `Episode ${i + 1}`,
                    thumbnailUrl: movie.thumbnailUrl,
                    videoUrl: '', 
                    duration: '24m',
                    // FORMAT: YT_V2 : PLAYLIST_ID : INDEX : ENCODED_TITLE : CHANNEL_NAME
                    slug: `YT_V2:${item.ytId}:${i}:${encodeURIComponent(item.title)}:${encodeURIComponent(item.channel || '')}` 
                }));
                results.push(movie);
            }
        } catch (e) { 
            console.warn(`Skipping ${item.title} due to API error.`);
        }
    }
    return results;
};

export const getHomeData = async (): Promise<{ 
    ongoing: Movie[], 
    completed: Movie[], 
    youtube: Movie[], 
    movies: Movie[], 
    bstation: Movie[],
    shortDramas: Movie[] // NEW RETURN TYPE
}> => {
    try {
        const [nowRes, topRes] = await Promise.all([
            fetch(`${JIKAN_API}/seasons/now?limit=25`),
            fetch(`${JIKAN_API}/top/anime?filter=bypopularity&limit=25`)
        ]);

        const nowData = await nowRes.json();
        const topData = await topRes.json();

        const ongoing = nowData.data?.map(mapJikanToMovie) || [];
        const completed = topData.data?.map(mapJikanToMovie) || [];
        
        const [youtube, bstation, dmShorts, dmAnime] = await Promise.all([
            getYouTubeAnimeData(),
            getBstationData(),
            getDailymotionData('asian short drama', 'Drama'),
            getDailymotionData('anime sub indo', 'Anime')
        ]);

        const shortDramas = [...dmShorts, ...dmAnime];

        let movies: Movie[] = [];
        try {
            const movieHtml = await fetchHTML(SOURCES.MOVIEBOX);
            const movieDoc = parseDOM(movieHtml);
            movies = extractMovieBoxHome(movieDoc);
        } catch (err) { /* ignore */ }

        return { ongoing, completed, youtube, movies, bstation, shortDramas };
    } catch (e) {
        console.error("Home Data Error:", e);
        return { ongoing: [], completed: [], youtube: [], movies: [], bstation: [], shortDramas: [] };
    }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
    if (slug.startsWith('dm-')) {
        // Dailymotion detail logic (simplified, usually the ID is enough)
        return null; // VideoPlayer handles details from list usually
    }

    if (/^\d+$/.test(slug)) {
        try {
            const [infoRes, epRes] = await Promise.all([
                fetch(`${JIKAN_API}/anime/${slug}/full`),
                fetch(`${JIKAN_API}/anime/${slug}/episodes`)
            ]);

            const info = await infoRes.json();
            const eps = await epRes.json();
            const movie = mapJikanToMovie(info.data);

            if (eps.data && Array.isArray(eps.data)) {
                movie.episodes = eps.data.map((ep: any) => ({
                    id: ep.mal_id.toString(),
                    number: ep.mal_id,
                    title: ep.title || `Episode ${ep.mal_id}`,
                    description: ep.aired ? new Date(ep.aired).toLocaleDateString() : 'Tonton Sekarang',
                    thumbnailUrl: movie.thumbnailUrl, 
                    videoUrl: '',
                    duration: '24m',
                    slug: `SEARCH:Nonton ${movie.title} Episode ${ep.mal_id} Sub Indo`
                }));
            }
            return movie;
        } catch (e) { return null; }
    } else if (slug.startsWith('http')) {
        try {
            const html = await fetchHTML(slug);
            const doc = parseDOM(html);
            return extractMovieBoxDetails(doc, slug);
        } catch (e) { return null; }
    }
    return null;
};

export const getEpisodeStreams = async (slug: string): Promise<Stream[]> => {
    const origin = window.location.origin;

    // 0. Dailymotion Handling
    if (slug.startsWith('dm-')) {
        const videoId = slug.replace('dm-', '');
        return [{
            server: 'Dailymotion',
            resolution: 'HD',
            url: `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`,
            type: 'dailymotion'
        }];
    }

    // 1. Direct YouTube ID (from Scraped Playlist)
    // IDs are usually 11 chars. slug "YT_V2..." is longer.
    if (slug.length === 11 && /^[a-zA-Z0-9_-]+$/.test(slug)) {
         return [{
            server: 'Server YouTube (Official)',
            resolution: '1080p',
            url: `https://www.youtube.com/embed/${slug}?autoplay=1&modestbranding=1&rel=0`,
            type: 'youtube'
         }];
    }

    // 2. YT_V2 Logic (Legacy/Fallback)
    if (slug.startsWith('YT') || slug.startsWith('YT_V2')) {
        let listId = '';
        let index = 0;
        let title = '';
        let channel = '';
        let smartId: string | null = null;

        if (slug.startsWith('YT_V2:')) {
            // New Format: YT_V2:LIST:INDEX:TITLE:CHANNEL
            const parts = slug.split(':');
            listId = parts[1];
            index = parseInt(parts[2] || '0');
            title = decodeURIComponent(parts[3] || '');
            channel = decodeURIComponent(parts[4] || '');

            // Try to find the specific video ID via search
            const episodeNum = index + 1;
            const searchQuery = `${channel} ${title} Episode ${episodeNum}`;
            console.log("Smart Searching YouTube for:", searchQuery);
            smartId = await searchYouTubeVideoId(searchQuery);
        } else {
            // Legacy/Fallback Format: YT:LIST:INDEX
            const parts = slug.split(':');
            listId = parts[1];
            index = parseInt(parts[2] || '0');
        }
        
        const streams: Stream[] = [];

        // Priority: Smart Search Result (Direct Video)
        if (smartId) {
            streams.push({
                server: 'Server Utama (Auto Match)',
                resolution: '1080p',
                url: `https://www.youtube.com/embed/${smartId}?origin=${origin}&modestbranding=1&rel=0&autoplay=1`,
                type: 'youtube'
            });
        }

        // Fallback: Playlist Index (Often causes Error 153 but good as backup)
        streams.push({
            server: 'Server Playlist (Backup)',
            resolution: 'HD',
            url: `https://www.youtube.com/embed?listType=playlist&list=${listId}&index=${index}&origin=${origin}&modestbranding=1&rel=0`,
            type: 'youtube'
        });

        return streams;
    }

    let targetUrl = slug;

    // 3. Resolve Search (Samehadaku)
    if (slug.startsWith('SEARCH:')) {
        const query = slug.replace('SEARCH:', '');
        try {
            const cleanQuery = query.replace(/[^\w\s\d]/g, ' ').trim();
            const searchUrl = `${SOURCES.SAMEHADAKU}/?s=${encodeURIComponent(cleanQuery)}`;
            const html = await fetchHTML(searchUrl);
            const doc = parseDOM(html);
            
            const episodeLink = doc.querySelector('.post-show ul li a, .animepost .animposx a, .ml-item a');
            
            if (episodeLink) {
                targetUrl = episodeLink.getAttribute('href') || '';
            } else {
                return [];
            }
        } catch (e) {
            return [];
        }
    }

    // 4. Scrape Streams
    if (targetUrl && targetUrl.startsWith('http')) {
        try {
            const html = await fetchHTML(targetUrl);
            const doc = parseDOM(html);
            return extractStreams(doc);
        } catch (e) {
            return [];
        }
    }

    return [];
};
