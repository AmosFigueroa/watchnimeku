import { Movie, Episode, Stream } from '../types';

// --- CONFIGURATION ---
const SOURCES = {
    SAMEHADAKU: 'https://v1.samehadaku.how', // Indonesian Anime Site
    MOVIEBOX: 'https://moviebox.ph', // Western Movies (Global)
};

const JIKAN_API = 'https://api.jikan.moe/v4';

// List of Legal YouTube Anime (Prioritize Indonesia Channels: Muse Indonesia, Ani-One Indo)
const YOUTUBE_CATALOG = [
    { title: 'Spy x Family', ytId: 'PLwLSw1_eDZl0fx5q3f15q2g4W33TfF_Wb' }, // Muse Indo
    { title: 'One Punch Man', ytId: 'PLwLSw1_eDZl1n9fJOuLlgR6ZVhM8O-7Xb' }, // Muse Indo
    { title: 'Dr. STONE', ytId: 'PLwLSw1_eDZl0k95_6P9K34lXz841P1Vj_' }, // Muse Indo
    { title: 'Mob Psycho 100', ytId: 'PLwLSw1_eDZl2AouX4kL6-k_iZ7RQUjN6H' }, // Muse Indo
    { title: 'Tensei Shitara Slime Datta Ken', ytId: 'PLwLSw1_eDZl2eP86ZJD1W49W1b2F8F6sB' }, // Muse Indo
    { title: 'Mushoku Tensei', ytId: 'PLwLSw1_eDZl33k_744_41y9fK3XwMmsf2' }, // Muse Indo
    { title: 'Classroom of the Elite', ytId: 'PLwLSw1_eDZl08aDUEvY2Ygl2yJ8XvUezR' }, // Muse Indo
    { title: 'Frieren', ytId: 'PLwLSw1_eDZl2d3L2C3r37F4i_1p6o9-wM' } // Muse Indo
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

const fetchHTML = async (targetUrl: string): Promise<string> => {
  let lastError;
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.url(targetUrl);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000); 

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
        status: data.status, // "Currently Airing" or "Finished Airing"
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
    
    // Fallback for Samehadaku specific players (often hidden in JS or distinct divs)
    // This is a basic catch-all for mirrors
    const mirrorLinks = doc.querySelectorAll('.mirror option, .server-list li a');
    mirrorLinks.forEach((el, idx) => {
         let url = el.getAttribute('value') || el.getAttribute('href');
         if(url && url.startsWith('http')) {
             streams.push({
                 server: `Mirror ${idx+1}`,
                 resolution: 'HD',
                 url: url,
                 type: 'iframe'
             })
         }
    });

    return streams.filter((v,i,a)=>a.findIndex(t=>(t.url===v.url))===i);
};

// --- EXPORTED SERVICE FUNCTIONS ---

export const getYouTubeAnimeData = async (): Promise<Movie[]> => {
    const promises = YOUTUBE_CATALOG.map(async (item) => {
        try {
            const res = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(item.title)}&limit=1`);
            const json = await res.json();
            
            if (json.data && json.data.length > 0) {
                const animeData = json.data[0];
                const movie = mapJikanToMovie(animeData);
                movie.source = 'youtube';
                movie.youtubeId = item.ytId;
                movie.episodes = Array.from({ length: animeData.episodes || 12 }, (_, i) => ({
                    id: `yt-${item.ytId}-${i+1}`,
                    number: i + 1,
                    title: `Episode ${i + 1}`,
                    thumbnailUrl: movie.thumbnailUrl,
                    videoUrl: `https://www.youtube.com/embed/videoseries?list=${item.ytId}&index=${i}`,
                    duration: '24m',
                    slug: `YT:${item.ytId}:${i}` 
                }));
                return movie;
            }
        } catch (e) { /* ignore */ }
        return null;
    });
    const results = await Promise.all(promises);
    return results.filter((m): m is Movie => m !== null);
};

export const getHomeData = async (): Promise<{ ongoing: Movie[], completed: Movie[], youtube: Movie[], movies: Movie[] }> => {
    try {
        // Fetch from Jikan API v4
        // 'now' = New Anime (Baru/Sedang Tayang)
        // 'top' = Old/Classic/Legendary (Lama)
        const [nowRes, topRes] = await Promise.all([
            fetch(`${JIKAN_API}/seasons/now?limit=25`),
            fetch(`${JIKAN_API}/top/anime?filter=bypopularity&limit=25`)
        ]);

        const nowData = await nowRes.json();
        const topData = await topRes.json();

        const ongoing = nowData.data?.map(mapJikanToMovie) || [];
        const completed = topData.data?.map(mapJikanToMovie) || [];
        
        // Fetch YouTube Data (Muse Indo)
        const youtube = await getYouTubeAnimeData();

        // Fetch MovieBox Data
        let movies: Movie[] = [];
        try {
            const movieHtml = await fetchHTML(SOURCES.MOVIEBOX);
            const movieDoc = parseDOM(movieHtml);
            movies = extractMovieBoxHome(movieDoc);
        } catch (err) {
            console.warn("Failed to scrape MovieBox:", err);
        }

        return { ongoing, completed, youtube, movies };
    } catch (e) {
        console.error("Home Data Error:", e);
        return { ongoing: [], completed: [], youtube: [], movies: [] };
    }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
    
    // CASE 1: Jikan ID (Numeric)
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
                    // SMART LOGIC: Add "Sub Indo" to the search query specifically for Indonesian audience
                    slug: `SEARCH:Nonton ${movie.title} Episode ${ep.mal_id} Sub Indo`
                }));
            }
            return movie;
        } catch (e) {
            console.error("Jikan Detail Error:", e);
            return null;
        }
    } 
    
    // CASE 2: Scraped URL (MovieBox or others)
    else if (slug.startsWith('http')) {
        try {
            const html = await fetchHTML(slug);
            const doc = parseDOM(html);
            return extractMovieBoxDetails(doc, slug);
        } catch (e) {
            console.error("Scraper Detail Error:", e);
            return null;
        }
    }

    return null;
};

export const getEpisodeStreams = async (slug: string): Promise<Stream[]> => {
    // 0. YouTube
    if (slug.startsWith('YT:')) {
        const parts = slug.split(':');
        const listId = parts[1];
        const index = parseInt(parts[2] || '0');
        return [{
            server: 'YouTube Official (Muse/Ani-One Indo)',
            resolution: '1080p',
            url: `https://www.youtube.com/embed?listType=playlist&list=${listId}&index=${index}`,
            type: 'youtube'
        }];
    }

    let targetUrl = slug;

    // 1. Resolve Search (For Anime from Jikan -> Samehadaku)
    if (slug.startsWith('SEARCH:')) {
        const query = slug.replace('SEARCH:', '');
        console.log("Mencari Stream Indo untuk:", query);
        try {
            // Clean query but keep "Sub Indo"
            const cleanQuery = query.replace(/[^\w\s\d]/g, ' ').trim();
            const searchUrl = `${SOURCES.SAMEHADAKU}/?s=${encodeURIComponent(cleanQuery)}`;
            const html = await fetchHTML(searchUrl);
            const doc = parseDOM(html);
            
            // Try to find specific episode post first
            const episodeLink = doc.querySelector('.post-show ul li a, .animepost .animposx a, .ml-item a');
            
            if (episodeLink) {
                targetUrl = episodeLink.getAttribute('href') || '';
            } else {
                console.warn("Tidak ada hasil di Samehadaku untuk:", cleanQuery);
                return [];
            }
        } catch (e) {
            return [];
        }
    }

    // 2. Scrape Streams (For MovieBox URLs or Resolved Anime URLs)
    if (targetUrl && targetUrl.startsWith('http')) {
        try {
            const html = await fetchHTML(targetUrl);
            const doc = parseDOM(html);
            return extractStreams(doc);
        } catch (e) {
            console.error("Scraping error:", e);
            return [];
        }
    }

    return [];
};
