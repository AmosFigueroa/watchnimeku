import { Movie, Episode } from '../types';

// --- CONFIGURATION ---
const SOURCES = {
    SAMEHADAKU: 'https://v1.samehadaku.how',
    KURAMANIME: 'https://v9.kuramanime.tel'
};

const JIKAN_API = 'https://api.jikan.moe/v4';

// --- PROXY ROTATION SYSTEM ---
const PROXIES = [
    {
        // CorsProxy.io: Often fastest for direct HTML
        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        isJson: false
    },
    {
        // AllOrigins JSON: Very reliable as it wraps response
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        isJson: true
    },
    {
        // CodeTabs: Good backup
        url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
        isJson: false
    },
    {
        // ThingProxy: Another backup
        url: (target: string) => `https://thingproxy.freeboard.io/fetch/${target}`,
        isJson: false
    }
];

// --- HELPER FUNCTIONS ---

const buildUrl = (base: string, path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

/**
 * Fetch Image from MAL if original is broken
 */
const fetchMalCover = async (query: string): Promise<string | null> => {
    try {
        // Simple heuristic to remove "Episode ..."
        const cleanQuery = query.replace(/Episode\s+\d+.*/i, '').trim();
        const res = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(cleanQuery)}&limit=1`);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].images.jpg.large_image_url;
        }
    } catch (e) {
        // ignore
    }
    return null;
};

/**
 * Fetch HTML using Proxy Rotation
 */
const fetchHTML = async (targetUrl: string): Promise<string> => {
  let lastError;
  
  for (const proxy of PROXIES) {
    try {
      const proxyUrl = proxy.url(targetUrl);
      const controller = new AbortController();
      // Increased timeout to 20s because free proxies can be slow
      const id = setTimeout(() => controller.abort(), 20000); 

      const res = await fetch(proxyUrl, { 
          signal: controller.signal,
          headers: { 
            'Origin': window.location.origin,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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

        // Validate content length to ensure we didn't just get an empty 200 OK
        if (text && text.length > 500 && !text.includes('403 Forbidden') && !text.includes('Just a moment')) {
            return text;
        }
      }
    } catch (e) {
      lastError = e;
      // Continue to next proxy
    }
  }
  // Log but don't crash the app hard, throw specific error for handler
  throw new Error(`Failed to fetch ${targetUrl}. Last error: ${lastError}`);
};

const parseDOM = (html: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

// --- STATIC FALLBACK (Cache) ---
const STATIC_FALLBACK: Movie[] = [
    {
        id: 'one-piece-static',
        slug: 'https://v1.samehadaku.how/anime/one-piece/',
        title: 'One Piece',
        description: 'Gol D. Roger was known as the "Pirate King", the strongest and most infamous being to have sailed the Grand Line.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/6/73245l.jpg',
        coverUrl: 'https://images7.alphacoders.com/611/611138.png',
        videoUrl: '',
        genre: ['Action', 'Adventure'],
        rating: '9.0',
        year: 1999,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    },
    {
        id: 'bleach-static',
        slug: 'https://v1.samehadaku.how/anime/bleach-sennen-kessen-hen/',
        title: 'Bleach: Thousand-Year Blood War',
        description: 'The peace is suddenly broken when warning sirens blare through the Soul Society.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1764/126627l.jpg',
        coverUrl: 'https://images.alphacoders.com/133/1330650.jpeg',
        videoUrl: '',
        genre: ['Action', 'Supernatural'],
        rating: '9.1',
        year: 2022,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    },
    {
        id: 'solo-leveling-static',
        slug: 'https://v1.samehadaku.how/anime/solo-leveling/',
        title: 'Solo Leveling',
        description: 'Ten years ago, "the Gate" appeared and connected the real world with the realm of magic and monsters.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1118/142004l.jpg',
        coverUrl: 'https://images.alphacoders.com/134/1347833.jpeg',
        videoUrl: '',
        genre: ['Action', 'Fantasy'],
        rating: '8.5',
        year: 2024,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    },
    {
        id: 'mashle-static',
        slug: 'https://v1.samehadaku.how/anime/mashle/',
        title: 'Mashle: Magic and Muscles',
        description: 'This is a world of magic where magic is used for everything.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1223/134707l.jpg',
        coverUrl: 'https://images.alphacoders.com/131/1310570.jpeg',
        videoUrl: '',
        genre: ['Comedy', 'Magic'],
        rating: '7.8',
        year: 2023,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    }
];

// --- SCRAPING LOGIC: SAMEHADAKU (v1.samehadaku.how) ---

const scrapeSamehadakuHome = async (): Promise<Movie[]> => {
    try {
        const html = await fetchHTML(SOURCES.SAMEHADAKU);
        const doc = parseDOM(html);
        const results: Movie[] = [];
        
        // Target: "Update Anime Terkini" section usually
        // Selector: .post-show > ul > li
        const items = doc.querySelectorAll('.post-show ul li, .animepost');

        items.forEach((el) => {
            // Titles often in h2.entry-title a
            const titleEl = el.querySelector('.entry-title a, .title a, h2 a');
            // Link often wraps the thumb or is in title
            const linkEl = el.querySelector('a');
            // Image
            const imgEl = el.querySelector('.thumb img, .content-thumb img, img');
            
            let thumb = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || '';
            // Fix lazy loading placeholder
            if (thumb.includes('data:image') && imgEl?.getAttribute('data-src')) {
                thumb = imgEl.getAttribute('data-src') || '';
            }
            if (thumb.startsWith('//')) thumb = `https:${thumb}`;
            
            // If thumb is missing or placeholder, set empty to trigger MAL fallback later
            if (!thumb || thumb.includes('placeholder')) {
                thumb = '';
            }

            const title = titleEl?.textContent?.trim() || '';
            const href = linkEl?.getAttribute('href') || '';
            const cleanTitle = title.replace(/Episode\s+\d+.*/i, '').trim();

            if (title && href) {
                // Determine if it's an episode link or anime detail link
                // Samehadaku home usually links to episodes
                results.push({
                    id: href, 
                    slug: href,
                    title: cleanTitle || title,
                    description: `New Episode: ${title}`,
                    thumbnailUrl: thumb,
                    coverUrl: thumb, 
                    videoUrl: '',
                    genre: ['Anime'],
                    rating: 'New',
                    year: '2024',
                    duration: '24m',
                    type: 'anime',
                    status: 'Ongoing'
                });
            }
        });
        return results;
    } catch (e) {
        console.error("Samehadaku Home Scraping Failed:", e);
        return [];
    }
};

const scrapeSamehadakuDetail = async (url: string, originalMovie?: Movie): Promise<Movie | null> => {
    try {
        const html = await fetchHTML(url);
        const doc = parseDOM(html);

        // Title: h1.entry-title
        let title = doc.querySelector('h1.entry-title')?.textContent?.replace('Nonton Anime', '').trim() || originalMovie?.title || "Anime Detail";
        const desc = doc.querySelector('.entry-content p, .desc')?.textContent?.trim() || "Deskripsi tersedia.";
        
        // Thumb: .thumb img
        let thumb = doc.querySelector('.thumb img, .infoanime img')?.getAttribute('src') || originalMovie?.thumbnailUrl || '';
        
        // Cleanup title for MAL search
        const cleanTitle = title.replace(/Episode\s+\d+.*/i, '').trim();

        // Fallback image from MAL if needed
        if (!thumb || thumb.includes('placeholder')) {
             const malCover = await fetchMalCover(cleanTitle);
             if (malCover) thumb = malCover;
        }

        // Find Stream Iframe
        // Samehadaku player usually in #player_embed or .video-content
        const iframes = doc.querySelectorAll('iframe');
        let streamUrl = '';
        
        // Filter good iframes
        for (const iframe of Array.from(iframes)) {
            const src = iframe.getAttribute('src') || iframe.getAttribute('data-src');
            if (src && (src.includes('blogger') || src.includes('kurama') || src.includes('archive.org') || src.includes('file') || src.includes('player') || src.includes('youtube'))) {
                // Avoid ads
                if(!src.includes('google') && !src.includes('facebook')) {
                    streamUrl = src.startsWith('//') ? `https:${src}` : src;
                    break; 
                }
            }
        }

        // Parse Episodes List
        // Selector: .lstepsiode.listeps ul li
        const episodes: Episode[] = [];
        const epLinks = doc.querySelectorAll('.lstepsiode.listeps ul li a, .eplister ul li a');
        
        epLinks.forEach((el) => {
            const epUrl = el.getAttribute('href') || '';
            const epText = el.querySelector('.lchx')?.textContent || el.textContent || '';
            // Parse "Episode 12" -> 12
            const epNum = parseInt(epText.match(/\d+/)?.[0] || '0');

            if (epUrl) {
                episodes.push({
                    id: epUrl,
                    slug: epUrl,
                    number: epNum,
                    title: `Episode ${epNum}`,
                    thumbnailUrl: thumb,
                    videoUrl: '',
                    duration: '24m'
                });
            }
        });

        // If no episodes found (maybe it's a single episode page), add self
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
            genre: ['Anime'],
            rating: '8.5',
            year: '2024',
            duration: '24m',
            type: 'anime',
            episodes: episodes,
            status: 'Ongoing'
        };

    } catch (e) {
        console.error("Detail Fetch Error:", e);
        // Return minimal data to prevent UI crash, using originalMovie if available
        if (originalMovie) {
             return { ...originalMovie, episodes: [] };
        }
        // If we have absolutely no data, return null which will need handling in UI
        return null;
    }
};

const scrapeKuramaHome = async (): Promise<Movie[]> => {
    // Kuramanime logic kept as secondary
    try {
        const html = await fetchHTML(SOURCES.KURAMANIME);
        const doc = parseDOM(html);
        const results: Movie[] = [];
        
        const items = doc.querySelectorAll('.product__item');
        items.forEach((el) => {
            const titleEl = el.querySelector('h5 a');
            const linkEl = el.querySelector('a');
            const imgEl = el.querySelector('.product__item__pic');
            
            let thumb = imgEl?.getAttribute('data-setbg') || '';
            if (thumb && !thumb.startsWith('http')) {
                thumb = buildUrl(SOURCES.KURAMANIME, thumb);
            }

            const href = linkEl?.getAttribute('href') || '';
            const title = titleEl?.textContent?.trim() || '';

            if (title && href) {
                results.push({
                    id: href,
                    slug: href,
                    title: title,
                    description: 'Tonton di Kuramanime',
                    thumbnailUrl: thumb,
                    coverUrl: thumb,
                    videoUrl: '',
                    genre: ['Anime'],
                    rating: 'Up',
                    year: '2024',
                    duration: '24m',
                    type: 'anime',
                    status: 'Ongoing'
                });
            }
        });
        return results;
    } catch (e) {
        return [];
    }
};

// --- EXPORTED FUNCTIONS ---

export const getHomeData = async (): Promise<{ ongoing: Movie[], completed: Movie[] }> => {
    // 1. Primary: Samehadaku
    let ongoing = await scrapeSamehadakuHome();

    // 2. Secondary: Kuramanime
    if (ongoing.length === 0) {
        console.log("Primary failed, trying Kuramanime...");
        ongoing = await scrapeKuramaHome();
    }

    // 3. Fallback: Static Data
    if (ongoing.length === 0) {
        console.warn("All scraping failed, using static fallback.");
        return { 
            ongoing: STATIC_FALLBACK, 
            completed: STATIC_FALLBACK.slice().reverse() 
        };
    }

    // Attempt to fix missing images in background (not blocking)
    // We only map over the first few to save requests
    const enhanced = await Promise.all(ongoing.map(async (m) => {
         if (!m.thumbnailUrl || m.thumbnailUrl.includes('placeholder')) {
             const cover = await fetchMalCover(m.title);
             if (cover) return { ...m, thumbnailUrl: cover, coverUrl: cover };
         }
         return m;
    }));

    return {
        ongoing: enhanced.slice(0, 15),
        completed: enhanced.slice().reverse().slice(0, 10)
    };
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
    const fallbackMovie = STATIC_FALLBACK.find(m => m.slug === slug);
    return await scrapeSamehadakuDetail(slug, fallbackMovie);
};

export const getEpisodeStream = async (slug: string): Promise<string | null> => {
    try {
        const html = await fetchHTML(slug);
        const doc = parseDOM(html);

        // Strategy 1: Look for iframes
        const iframes = doc.querySelectorAll('iframe');
        for (const iframe of Array.from(iframes)) {
            const src = iframe.getAttribute('src') || iframe.getAttribute('data-src');
            // Allow common video hosts
            if (src && (src.includes('blogger') || src.includes('kurama') || src.includes('mp4') || src.includes('video') || src.includes('stream') || src.includes('widget'))) {
                 // Block ads
                 if (!src.includes('google') && !src.includes('facebook')) {
                     return src.startsWith('//') ? `https:${src}` : src;
                 }
            }
        }
        
        // Strategy 2: Look for 'select' mirror options (common in WP themes)
        const options = doc.querySelectorAll('select.mirror option');
        for (const opt of Array.from(options)) {
            const val = opt.getAttribute('value');
            if (val) {
                // Sometimes value is base64 encoded
                if (val.startsWith('http')) return val;
                try {
                    const decoded = atob(val);
                    if (decoded.startsWith('http')) return decoded;
                } catch(e) {}
            }
        }

        return null;
    } catch (e) {
        console.error("Stream Fetch Error:", e);
        return null;
    }
};

// --- MOCKS ---
export const getFeaturedMovie = (): Movie => STATIC_FALLBACK[0];
export const getMoviesByCategory = (category: string): Movie[] => STATIC_FALLBACK;
export const getTopAiring = (): Movie[] => STATIC_FALLBACK;
export const getMostPopular = (): Movie[] => STATIC_FALLBACK;
export const getMostFavorite = (): Movie[] => STATIC_FALLBACK;
export const getLatestCompleted = (): Movie[] => STATIC_FALLBACK;
