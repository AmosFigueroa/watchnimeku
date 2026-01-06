import { Movie, Episode, Stream } from '../types';

// --- CONFIGURATION ---
const SOURCES = {
    SAMEHADAKU: 'https://v1.samehadaku.how',
};

const JIKAN_API = 'https://api.jikan.moe/v4';

// --- PROXY ROTATION SYSTEM ---
const PROXIES = [
    {
        // CodeTabs: Best for full HTML
        url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
        isJson: false
    },
    {
        // AllOrigins JSON: Reliable fallback
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        isJson: true
    },
    {
        // CorsProxy.io: Fast but sometimes blocks
        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        isJson: false
    }
];

// --- UTILS ---

const cleanText = (text: string | undefined | null) => {
    return text ? text.trim().replace(/\s+/g, ' ') : '';
};

/**
 * Fetch HTML using Proxy Rotation with Retries
 */
const fetchHTML = async (targetUrl: string): Promise<string> => {
  let lastError;
  
  // Try each proxy
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.url(targetUrl);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(proxyUrl, { 
          signal: controller.signal,
          headers: { 
            'Origin': window.location.origin
          }
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
      // Wait 1s before next proxy to avoid rate limit
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
        description: data.synopsis || "No synopsis available.",
        thumbnailUrl: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || '',
        coverUrl: data.images?.jpg?.large_image_url || data.images?.jpg?.image_url || '',
        videoUrl: '', // Not available from Jikan
        genre: data.genres?.map((g: any) => g.name) || [],
        rating: data.score ? `${data.score}` : 'N/A',
        year: data.year || (data.aired?.from ? new Date(data.aired.from).getFullYear() : 'Unknown'),
        duration: data.duration || '24m',
        type: data.type || 'Anime',
        status: data.status,
        totalEpisodes: data.episodes
    };
};

// --- STREAM EXTRACTOR ---

const extractStreams = (doc: Document): Stream[] => {
    const streams: Stream[] = [];
    const VALID_HOSTS = ['blogger', 'kurama', 'mp4upload', 'streamsb', 'dood', 'file', 'archive', 'youtube', 'ok.ru', 'gdrive', 'zippyshare'];

    // 1. Gather Iframes
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

    // 2. Parse "Mirror" Selects (Common in WordPress Anime Themes)
    const options = doc.querySelectorAll('select.mirror option');
    options.forEach((opt) => {
        let val = opt.getAttribute('value');
        const label = opt.textContent?.trim() || 'Server';
        
        if (val) {
            // Decode base64 if needed
            if (!val.startsWith('http')) {
                try { val = atob(val); } catch(e) {}
            }
            if (val && val.startsWith('http')) {
                streams.push({
                    server: label,
                    resolution: 'HD',
                    url: val,
                    type: 'iframe'
                });
            }
        }
    });

    // 3. Parse explicit lists (e.g. "360p", "480p" links) if available
    // Structure: .download-eps a (often download links, but sometimes streamable)
    // We stick to iframes for now as they are safer for streaming directly.

    // Deduplicate by URL
    return streams.filter((v,i,a)=>a.findIndex(t=>(t.url===v.url))===i);
};

// --- EXPORTED SERVICE FUNCTIONS ---

export const getHomeData = async (): Promise<{ ongoing: Movie[], completed: Movie[] }> => {
    try {
        // Fetch from Jikan API v4
        const [nowRes, topRes] = await Promise.all([
            fetch(`${JIKAN_API}/seasons/now?limit=20`),
            fetch(`${JIKAN_API}/top/anime?filter=bypopularity&limit=20`)
        ]);

        const nowData = await nowRes.json();
        const topData = await topRes.json();

        const ongoing = nowData.data?.map(mapJikanToMovie) || [];
        const completed = topData.data?.map(mapJikanToMovie) || [];

        return { ongoing, completed };
    } catch (e) {
        console.error("Jikan Home Error:", e);
        return { ongoing: [], completed: [] };
    }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
    // Ensure we are using Jikan ID (numeric)
    if (!/^\d+$/.test(slug)) return null;

    try {
        const [infoRes, epRes] = await Promise.all([
            fetch(`${JIKAN_API}/anime/${slug}/full`),
            fetch(`${JIKAN_API}/anime/${slug}/episodes`)
        ]);

        const info = await infoRes.json();
        const eps = await epRes.json();

        const movie = mapJikanToMovie(info.data);

        // Map Episodes with "Search Slug"
        // This slug tells getEpisodeStreams to search Samehadaku for this specific episode
        if (eps.data && Array.isArray(eps.data)) {
            movie.episodes = eps.data.map((ep: any) => ({
                id: ep.mal_id.toString(),
                number: ep.mal_id,
                title: ep.title || `Episode ${ep.mal_id}`,
                description: ep.aired ? new Date(ep.aired).toLocaleDateString() : 'Available',
                thumbnailUrl: movie.thumbnailUrl, // Use series thumb as fallback
                videoUrl: '',
                duration: '24m',
                // Construct a search query: "Naruto Shippuden Episode 5"
                // We use a prefix "SEARCH:" to identify this logic in getEpisodeStreams
                slug: `SEARCH:${movie.title} Episode ${ep.mal_id}`
            }));
        }

        return movie;
    } catch (e) {
        console.error("Jikan Detail Error:", e);
        return null;
    }
};

export const getEpisodeStreams = async (slug: string): Promise<Stream[]> => {
    let targetUrl = slug;

    // 1. Resolve Search Query (Bridge Jikan -> Samehadaku)
    if (slug.startsWith('SEARCH:')) {
        const query = slug.replace('SEARCH:', '');
        console.log("Resolving Stream for:", query);
        
        try {
            // Clean query for better search results
            // e.g. "Bleach: Sennen Kessen-hen" -> "Bleach Sennen Kessen hen"
            const cleanQuery = query.replace(/[^\w\s\d]/g, ' ').trim();
            const searchUrl = `${SOURCES.SAMEHADAKU}/?s=${encodeURIComponent(cleanQuery)}`;
            
            const html = await fetchHTML(searchUrl);
            const doc = parseDOM(html);
            
            // Find the best match. 
            // Samehadaku usually lists episodes in .post-show or .animepost
            // We want the first valid link that looks like an episode or anime page.
            
            // Strategy: Look for specific episode links first
            const episodeLink = doc.querySelector('.post-show ul li a, .animepost .animposx a');
            
            if (episodeLink) {
                targetUrl = episodeLink.getAttribute('href') || '';
            } else {
                console.warn("Stream resolution failed: No results found for", cleanQuery);
                return [];
            }
        } catch (e) {
            console.error("Stream resolution error:", e);
            return [];
        }
    }

    // 2. Scrape Streams
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

// Deprecated
export const getEpisodeStream = async (slug: string): Promise<string | null> => {
    const streams = await getEpisodeStreams(slug);
    return streams.length > 0 ? streams[0].url : null;
};
