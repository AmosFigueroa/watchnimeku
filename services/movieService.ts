import { Movie, Episode, Stream } from '../types';

// --- CONFIGURATION ---
const SOURCES = {
    SAMEHADAKU: 'https://v1.samehadaku.how',
};

const JIKAN_API = 'https://api.jikan.moe/v4';

// --- PROXY ROTATION SYSTEM (Mimics requests.Session) ---
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

// --- UTILS (Mimics Python helpers) ---

const buildUrl = (base: string, path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

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

const fetchMalCover = async (query: string): Promise<string | null> => {
    try {
        const cleanQuery = query.replace(/Episode\s+\d+.*/i, '').trim();
        const res = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(cleanQuery)}&limit=1`);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].images.jpg.large_image_url;
        }
    } catch (e) { /* ignore */ }
    return null;
};

// --- SCRAPER ENGINE ---

/**
 * Extracts Home Page Data
 */
const extractHomeData = (doc: Document): Movie[] => {
    const results: Movie[] = [];
    // Selectors for "Update Anime"
    const items = doc.querySelectorAll('.post-show ul li, .animepost, .main_content .post-show li');

    items.forEach((el) => {
        const titleEl = el.querySelector('.entry-title a, .title a, h2 a');
        const linkEl = el.querySelector('a');
        const imgEl = el.querySelector('.thumb img, .content-thumb img, img');
        
        let thumb = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
        if (thumb.includes('data:image') && imgEl?.getAttribute('data-src')) {
            thumb = imgEl.getAttribute('data-src') || '';
        }
        if (thumb.startsWith('//')) thumb = `https:${thumb}`;
        if (!thumb || thumb.includes('placeholder')) thumb = '';

        const title = cleanText(titleEl?.textContent);
        const href = linkEl?.getAttribute('href') || '';
        
        // Remove "Episode X" from title to get Series title
        const cleanTitle = title.replace(/Episode\s+\d+.*/i, '').trim();

        if (title && href) {
            results.push({
                id: href, 
                slug: href,
                title: cleanTitle || title,
                description: `Latest: ${title}`,
                thumbnailUrl: thumb,
                coverUrl: thumb, 
                videoUrl: '',
                genre: ['Anime'],
                rating: 'New',
                year: new Date().getFullYear(),
                duration: '24m',
                type: 'anime',
                status: 'Ongoing'
            });
        }
    });
    return results;
};

/**
 * Extracts Anime Detail Data (Synopsis, Episodes)
 */
const extractDetailData = (doc: Document, url: string, originalMovie?: Movie): Movie => {
    // 1. Info extraction
    let title = cleanText(doc.querySelector('h1.entry-title')?.textContent?.replace('Nonton Anime', ''));
    if (!title) title = originalMovie?.title || "Anime Detail";

    const desc = cleanText(doc.querySelector('.entry-content p, .desc, .sinopsis')?.textContent) || "Deskripsi belum tersedia.";
    
    // 2. Image extraction
    let thumb = doc.querySelector('.thumb img, .infoanime img')?.getAttribute('src') || originalMovie?.thumbnailUrl || '';
    if (thumb.startsWith('//')) thumb = `https:${thumb}`;

    // 3. Metadata
    const rating = cleanText(doc.querySelector('.rating strong')?.textContent) || 'N/A';
    const genre: string[] = [];
    doc.querySelectorAll('.genre-info a').forEach(el => genre.push(cleanText(el.textContent)));

    // 4. Episode List Extraction
    const episodes: Episode[] = [];
    // Samehadaku usually has lists in .lstepsiode
    const epLinks = doc.querySelectorAll('.lstepsiode.listeps ul li, .eplister ul li');

    epLinks.forEach((el) => {
        const link = el.querySelector('a');
        const epUrl = link?.getAttribute('href') || '';
        const epTitle = cleanText(link?.textContent); // e.g., "Episode 12"
        const date = cleanText(el.querySelector('.date')?.textContent);

        // Parse number
        const epNumMatch = epTitle.match(/Episode\s+(\d+)/i) || epTitle.match(/\s+(\d+)$/);
        const epNum = epNumMatch ? parseInt(epNumMatch[1]) : 0;

        if (epUrl) {
            episodes.push({
                id: epUrl,
                slug: epUrl,
                number: epNum,
                title: `Episode ${epNum}`,
                description: date,
                thumbnailUrl: thumb,
                videoUrl: '',
                duration: '24m'
            });
        }
    });

    // Sort episodes (Newest first usually, but we might want oldest first for logic, let's keep site order)
    
    // If empty (maybe single ep page), create dummy
    if (episodes.length === 0) {
        episodes.push({
            id: url,
            slug: url,
            number: 1,
            title: title,
            thumbnailUrl: thumb,
            videoUrl: '',
            duration: '24m'
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
        genre: genre.length > 0 ? genre : ['Anime'],
        rating: rating,
        year: '2024',
        duration: '24m',
        type: 'anime',
        episodes: episodes,
        status: 'Ongoing'
    };
};

/**
 * Extracts Video Streams (Resolutions/Servers)
 */
const extractStreams = (doc: Document): Stream[] => {
    const streams: Stream[] = [];
    
    // Method 1: Check for server tab selectors (common in Samehadaku)
    // Often in #server-list or similar ID
    const serverDivs = doc.querySelectorAll('#server ul li div, .server_option div');
    
    // If specific structure isn't found, look for iframes generally
    const iframes = doc.querySelectorAll('iframe');
    
    // Common video hosts to white-list
    const VALID_HOSTS = ['blogger', 'kurama', 'mp4upload', 'streamsb', 'dood', 'file', 'archive', 'youtube', 'ok.ru'];

    // 1. Gather all Iframes
    iframes.forEach((iframe, idx) => {
        const src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
        if (!src) return;

        const isAd = src.includes('google') || src.includes('facebook') || src.includes('mgid');
        const isValid = VALID_HOSTS.some(host => src.includes(host)) || src.includes('/play/');

        if (isValid && !isAd) {
            const cleanSrc = src.startsWith('//') ? `https:${src}` : src;
            streams.push({
                server: `Server ${idx + 1} (Default)`,
                resolution: 'Auto',
                url: cleanSrc,
                type: 'iframe'
            });
        }
    });

    // 2. Parse "Download" links usually below player for resolutions (360, 480, 720, 1080)
    // Samehadaku structure: .download-eps ul li
    const downloadLinks = doc.querySelectorAll('.download-eps ul li strong, .download-eps ul li b');
    
    // This is tricky because usually these are direct download links, not streams. 
    // But sometimes they contain links to Zippyshare/Gdrive which can be streamed.
    // For now, we focus on the IFRAMES found in the DOM (the active players).

    // 3. Look for Mirror Select (common in WP themes)
    const options = doc.querySelectorAll('select.mirror option');
    options.forEach((opt, idx) => {
        let val = opt.getAttribute('value');
        const label = opt.textContent || `Server ${idx}`;
        
        if (val) {
             // Decode base64 if needed
             if (!val.startsWith('http')) {
                 try { val = atob(val); } catch(e) {}
             }
             if (val.startsWith('http')) {
                 streams.push({
                     server: label.trim(),
                     resolution: 'HD',
                     url: val,
                     type: 'iframe'
                 });
             }
        }
    });

    // Deduplicate
    const uniqueStreams = streams.filter((v,i,a)=>a.findIndex(t=>(t.url===v.url))===i);
    
    // If no streams, return empty
    return uniqueStreams;
};


// --- EXPORTED SERVICE FUNCTIONS ---

export const getHomeData = async (): Promise<{ ongoing: Movie[], completed: Movie[] }> => {
    try {
        const html = await fetchHTML(SOURCES.SAMEHADAKU);
        const doc = parseDOM(html);
        let ongoing = extractHomeData(doc);

        // Enhance images with MAL if missing
        const enhanced = await Promise.all(ongoing.slice(0, 10).map(async (m) => {
            if (!m.thumbnailUrl) {
                const cover = await fetchMalCover(m.title);
                if (cover) return { ...m, thumbnailUrl: cover, coverUrl: cover };
            }
            return m;
        }));

        // Mock completed data using reversed ongoing for now to save bandwidth
        return {
            ongoing: enhanced,
            completed: [...enhanced].reverse()
        };
    } catch (e) {
        console.error("Home Scraping Error:", e);
        return { ongoing: [], completed: [] };
    }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
    try {
        const html = await fetchHTML(slug);
        const doc = parseDOM(html);
        const movie = extractDetailData(doc, slug);
        
        // Enhance image
        if (!movie.thumbnailUrl) {
            const cover = await fetchMalCover(movie.title);
            if (cover) {
                movie.thumbnailUrl = cover;
                movie.coverUrl = cover;
            }
        }
        return movie;

    } catch (e) {
        console.error("Detail Error:", e);
        return null;
    }
};

export const getEpisodeStreams = async (slug: string): Promise<Stream[]> => {
    try {
        const html = await fetchHTML(slug);
        const doc = parseDOM(html);
        const streams = extractStreams(doc);
        return streams;
    } catch (e) {
        console.error("Stream Scraping Error:", e);
        return [];
    }
};

// Deprecated single stream function kept for compatibility if needed, but redirects to new one
export const getEpisodeStream = async (slug: string): Promise<string | null> => {
    const streams = await getEpisodeStreams(slug);
    return streams.length > 0 ? streams[0].url : null;
};
