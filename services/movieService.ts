import { Movie, Episode } from '../types';

const TARGET_BASE = 'https://kuramanime.tel';

// Array of proxies to bypass CORS and Anti-Bot (Rotated if one fails)
// api.codetabs.com is often reliable for text/html
// corsproxy.io is fast but sometimes strict
// allorigins is good fallback
const PROXIES = [
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Helper: Try to fetch text/html from the target using proxies
 */
const fetchHTML = async (path: string): Promise<string> => {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `${TARGET_BASE}${cleanPath}`;
  
  for (const proxyGen of PROXIES) {
    try {
      const url = proxyGen(targetUrl);
      const controller = new AbortController();
      // Short timeout to fail fast if a proxy is hanging
      const id = setTimeout(() => controller.abort(), 6000);
      
      const res = await fetch(url, { 
        // Remove custom User-Agent to avoid CORS Preflight (OPTIONS) failures on some proxies
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const text = await res.text();
        // Basic check for Cloudflare or Empty responses
        if (text.length < 500 || text.includes('Just a moment') || text.includes('Attention Required!')) {
            // Treat as failure to try next proxy
            console.warn(`Proxy ${url} returned Cloudflare/Block page.`);
            continue;
        }
        return text;
      }
    } catch (e) {
      console.warn(`Proxy failed for ${targetUrl} via ${proxyGen('')}:`, e);
    }
  }
  throw new Error("All proxies failed to fetch data.");
};

/**
 * Helper: Parse HTML string into DOM
 */
const parseDOM = (html: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

// --- Mock Data for Fallback ---
const FALLBACK_MOVIES: Movie[] = [
    {
        id: 'solo-leveling',
        slug: 'anime/solo-leveling',
        title: 'Solo Leveling (Demo/Fallback)',
        description: 'Connection to anime source failed. This is demo content. The gate connected the real world with the realm of magic and monsters.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1164/141093.jpg',
        coverUrl: 'https://cdn.myanimelist.net/images/anime/1164/141093l.jpg',
        videoUrl: '',
        genre: ['Action', 'Fantasy'],
        rating: '8.5',
        year: 2024,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    }
];

// --- Main Functions ---

export const getHomeData = async (): Promise<{ ongoing: Movie[], completed: Movie[] }> => {
  try {
    const html = await fetchHTML('/');
    const doc = parseDOM(html);
    
    const scrapeSection = (selector: string): Movie[] => {
      const items = doc.querySelectorAll(selector);
      const movies: Movie[] = [];
      
      items.forEach((el, idx) => {
        // Adapt selectors based on standard anime site structures
        const titleEl = el.querySelector('h5 a, .product__item__text h5 a, .entry-title a, .title a');
        const linkEl = el.querySelector('a');
        const imgEl = el.querySelector('.product__item__pic, img');
        
        // Extract URL for thumbnail
        let thumb = '';
        if (imgEl) {
           thumb = imgEl.getAttribute('data-setbg') || imgEl.getAttribute('src') || '';
           if (thumb && !thumb.startsWith('http')) {
               // Handle relative paths
               if (thumb.startsWith('//')) thumb = `https:${thumb}`;
               else thumb = `${TARGET_BASE}${thumb}`;
           }
        }

        const link = linkEl?.getAttribute('href') || '';
        // Clean slug: remove domain if present
        // Handle cases where link is full URL
        let slug = link.replace(TARGET_BASE, '');
        // Remove trailing/leading slashes
        slug = slug.replace(/^\/+|\/+$/g, '');

        // Fallback for slug if empty (shouldn't happen on good scrape)
        if (!slug && link) {
             const parts = link.split('/');
             slug = parts[parts.length - 1] || parts[parts.length - 2];
        }

        if (titleEl && slug) {
            movies.push({
                id: slug || `anime-${idx}`,
                slug: slug,
                title: titleEl.textContent?.trim() || 'Unknown Title',
                description: 'Watch now on StreamHulu',
                thumbnailUrl: thumb || 'https://via.placeholder.com/200x300',
                coverUrl: thumb || 'https://via.placeholder.com/200x300',
                videoUrl: '',
                genre: ['Anime'],
                rating: 'Unknown',
                year: new Date().getFullYear(),
                duration: '24m',
                type: 'anime',
                status: 'Ongoing'
            });
        }
      });
      return movies;
    };

    // Try multiple selectors common in anime sites (Kuramanime usually uses product__item)
    let ongoing = scrapeSection('.product__item, .animepost');
    let completed = scrapeSection('.popular__product .product__item, .recent-release .items');

    // If scraping failed (DOM structure mismatch), use fallback
    if (ongoing.length === 0) {
        console.warn("Scraping returned 0 items, using fallback.");
        return { ongoing: FALLBACK_MOVIES, completed: FALLBACK_MOVIES };
    }

    return { ongoing, completed: completed.length > 0 ? completed : ongoing.slice().reverse() };

  } catch (error) {
    console.error("Home Data Fetch Error:", error);
    return { ongoing: FALLBACK_MOVIES, completed: FALLBACK_MOVIES };
  }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
  try {
    // Determine path.
    const path = slug.startsWith('anime/') ? `/${slug}` : `/anime/${slug}`;
    const html = await fetchHTML(path);
    const doc = parseDOM(html);

    // Selectors
    const title = doc.querySelector('.anime__details__title h3, .entry-title, h1.title')?.textContent?.trim() || "Unknown Title";
    const synopsis = doc.querySelector('.anime__details__text p, .entry-content p, .description')?.textContent?.trim() || "No description available.";
    
    const thumbEl = doc.querySelector('.anime__details__pic, .thumb img');
    let thumb = thumbEl?.getAttribute('data-setbg') || thumbEl?.getAttribute('src') || "";
    if (thumb && !thumb.startsWith('http')) {
       if (thumb.startsWith('//')) thumb = `https:${thumb}`;
       else thumb = `${TARGET_BASE}${thumb}`;
    }

    // Parse Episodes
    const episodeList: Episode[] = [];
    // Selectors for episode list
    const epLinks = doc.querySelectorAll('.anime__details__episodes a, .eplister ul li a, .episodes-list a');
    
    epLinks.forEach((el, idx) => {
        const href = el.getAttribute('href') || '';
        let epSlug = href.replace(TARGET_BASE, '');
        epSlug = epSlug.replace(/^\/+|\/+$/g, '');

        const text = el.textContent?.trim() || `Episode ${idx + 1}`;
        const numberMatch = text.match(/\d+/);
        const num = numberMatch ? parseInt(numberMatch[0]) : idx + 1;

        episodeList.push({
            id: `ep-${num}`,
            number: num,
            title: text,
            description: 'Ready to watch',
            thumbnailUrl: thumb,
            videoUrl: '',
            duration: '24m',
            slug: epSlug,
            streamUrl: ''
        });
    });

    episodeList.sort((a, b) => b.number - a.number);

    return {
        id: slug,
        slug: slug,
        title: title,
        description: synopsis,
        thumbnailUrl: thumb,
        coverUrl: thumb,
        videoUrl: '',
        genre: ['Anime'],
        rating: '8.0',
        year: 2024,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing',
        episodes: episodeList,
        totalEpisodes: episodeList.length
    };

  } catch (error) {
    console.error("Detail Fetch Error:", error);
    return null;
  }
};

export const getEpisodeStream = async (slug: string): Promise<string | null> => {
  try {
    const path = slug.includes('episode') ? `/${slug}` : `/episode/${slug}`; 
    
    const html = await fetchHTML(path);
    const doc = parseDOM(html);

    // Strategy 1: Find iframe directly (common in Kuramanime)
    const iframes = doc.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
        const src = iframes[i].getAttribute('src');
        if (src && (src.includes('embed') || src.includes('player') || src.includes('google') || src.includes('blogger') || src.includes('youtube'))) {
             if (src.startsWith('/')) return `${TARGET_BASE}${src}`;
             return src;
        }
    }

    // Strategy 2: Dropdowns/Selects for mirrors
    const options = doc.querySelectorAll('select.mirror option');
    if (options.length > 0) {
        const val = options[0].getAttribute('value');
        if (val) {
             if (val.startsWith('http')) return val;
             try { return atob(val); } catch(e) {}
        }
    }

    // Fallback: Use sample if none found (better than crashing or black screen)
    console.warn("Could not extract clean video source. Returning sample.");
    return "https://www.w3schools.com/html/mov_bbb.mp4"; 

  } catch (error) {
    console.error("Stream Fetch Error:", error);
    return null;
  }
};

// --- Mock/Sync Placeholders ---
export const getFeaturedMovie = (): Movie => FALLBACK_MOVIES[0];
export const getMoviesByCategory = (category: string): Movie[] => [];
export const getTopAiring = (): Movie[] => [];
export const getMostPopular = (): Movie[] => [];
export const getMostFavorite = (): Movie[] => [];
export const getLatestCompleted = (): Movie[] => [];