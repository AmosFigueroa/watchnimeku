import { Movie, Episode } from '../types';

const TARGET_BASE = 'https://kuramanime.tel';

// Robust Proxy List
// 1. AllOrigins (JSON mode) - reliable, handles headers well
// 2. CodeTabs - good for raw HTML
// 3. CorsProxy.io - fast but strict
const PROXIES = [
    {
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        isJson: true
    },
    {
        url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
        isJson: false
    },
    {
        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        isJson: false
    }
];

/**
 * Helper: Try to fetch text/html from the target using proxies
 */
const fetchHTML = async (path: string): Promise<string> => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const targetUrl = `${TARGET_BASE}${cleanPath}`;
  
  for (const proxy of PROXIES) {
    try {
      const url = proxy.url(targetUrl);
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const res = await fetch(url, { 
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        let text = '';
        if (proxy.isJson) {
            const json = await res.json();
            text = json.contents;
        } else {
            text = await res.text();
        }

        // Cloudflare & Error Page Detection
        if (!text || text.length < 500 || text.includes('Just a moment') || text.includes('Attention Required!') || text.includes('403 Forbidden')) {
            console.warn(`Proxy ${url} blocked or failed.`);
            continue;
        }
        return text;
      }
    } catch (e) {
      console.warn(`Proxy failed for ${targetUrl}:`, e);
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

// --- ROBUST FALLBACK DATA (Offline Mode) ---
const FALLBACK_MOVIES: Movie[] = [
    {
        id: 'one-piece',
        slug: 'anime/one-piece',
        title: 'One Piece',
        description: 'Gol D. Roger was known as the "Pirate King", the strongest and most infamous being to have sailed the Grand Line. The capture and execution of Roger by the World Government brought a change throughout the world.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
        coverUrl: 'https://images7.alphacoders.com/611/611138.png',
        videoUrl: '',
        genre: ['Action', 'Adventure', 'Fantasy'],
        rating: '9.0',
        year: 1999,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing',
        episodes: Array.from({length: 10}, (_, i) => ({
            id: `op-${1100+i}`,
            number: 1100+i,
            title: `Episode ${1100+i}`,
            thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
            videoUrl: '',
            duration: '24m',
            slug: 'episode/one-piece-episode-1100', // Mock slug
            streamUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' // Mock stream
        }))
    },
    {
        id: 'jujutsu-kaisen',
        slug: 'anime/jujutsu-kaisen-2nd-season',
        title: 'Jujutsu Kaisen 2nd Season',
        description: 'Ideally, a high schooler would lead a normal life. However, Itadori Yuuji is not your average high schooler.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg',
        coverUrl: 'https://images8.alphacoders.com/133/1337340.png',
        videoUrl: '',
        genre: ['Action', 'Supernatural'],
        rating: '8.8',
        year: 2023,
        duration: '24m',
        type: 'anime',
        status: 'Completed',
        episodes: Array.from({length: 23}, (_, i) => ({
            id: `jjk-${i+1}`,
            number: i+1,
            title: `Episode ${i+1}`,
            thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1792/138022.jpg',
            videoUrl: '',
            duration: '24m',
            slug: 'episode/jujutsu-kaisen-episode-1',
            streamUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        }))
    },
    {
        id: 'frieren',
        slug: 'anime/sousou-no-frieren',
        title: 'Sousou no Frieren',
        description: 'The demon king has been defeated, and the victorious hero party returns home before disbanding. The four—mage Frieren, hero Himmel, priest Heiter, and warrior Eisen—reminisce about their decade-long journey.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1015/138006.jpg',
        coverUrl: 'https://images.alphacoders.com/133/1330968.jpeg',
        videoUrl: '',
        genre: ['Adventure', 'Drama', 'Fantasy'],
        rating: '9.1',
        year: 2023,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    },
    {
        id: 'solo-leveling',
        slug: 'anime/ore-dake-level-up-na-ken',
        title: 'Solo Leveling',
        description: 'Ten years ago, "the Gate" appeared and connected the real world with the realm of magic and monsters. To combat these vile beasts, ordinary people received superhuman powers and became known as "Hunters".',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1164/141093.jpg',
        coverUrl: 'https://images8.alphacoders.com/112/1127029.jpg',
        videoUrl: '',
        genre: ['Action', 'Fantasy'],
        rating: '8.5',
        year: 2024,
        duration: '24m',
        type: 'anime',
        status: 'Ongoing'
    },
    {
        id: 'kimetsu',
        slug: 'anime/kimetsu-no-yaiba',
        title: 'Demon Slayer: Kimetsu no Yaiba',
        description: 'Ever since the death of his father, the burden of supporting the family has fallen upon Tanjirou Kamado\'s shoulders.',
        thumbnailUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
        coverUrl: 'https://images.alphacoders.com/100/1002081.png',
        videoUrl: '',
        genre: ['Action', 'Demons'],
        rating: '8.6',
        year: 2019,
        duration: '24m',
        type: 'anime',
        status: 'Completed'
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
        const titleEl = el.querySelector('h5 a, .product__item__text h5 a, .entry-title a, .title a');
        const linkEl = el.querySelector('a');
        const imgEl = el.querySelector('.product__item__pic, img');
        
        // Extract URL for thumbnail
        let thumb = '';
        if (imgEl) {
           thumb = imgEl.getAttribute('data-setbg') || imgEl.getAttribute('src') || '';
           if (thumb && !thumb.startsWith('http')) {
               if (thumb.startsWith('//')) thumb = `https:${thumb}`;
               else thumb = `${TARGET_BASE}${thumb}`;
           }
        }

        const link = linkEl?.getAttribute('href') || '';
        let slug = link.replace(TARGET_BASE, '');
        slug = slug.replace(/^\/+|\/+$/g, '');

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

    let ongoing = scrapeSection('.product__item, .animepost');
    let completed = scrapeSection('.popular__product .product__item, .recent-release .items');

    // Combine with fallback if scraping yields very few results (partial block)
    if (ongoing.length === 0) {
        console.log("Scraping returned 0 items, using fallback data.");
        return { ongoing: FALLBACK_MOVIES, completed: FALLBACK_MOVIES.slice().reverse() };
    }

    return { ongoing, completed: completed.length > 0 ? completed : ongoing.slice().reverse() };

  } catch (error) {
    console.error("Home Data Fetch Error (Using Fallback):", error);
    // Graceful degradation: Return mock data instead of crashing
    return { ongoing: FALLBACK_MOVIES, completed: FALLBACK_MOVIES.slice().reverse() };
  }
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
  // Check if it's a fallback ID first to return instant mock data
  const fallbackMatch = FALLBACK_MOVIES.find(m => m.slug === slug || m.id === slug);
  if (fallbackMatch && fallbackMatch.episodes) {
      return fallbackMatch;
  }

  try {
    const path = slug.startsWith('anime/') ? `/${slug}` : `/anime/${slug}`;
    const html = await fetchHTML(path);
    const doc = parseDOM(html);

    const title = doc.querySelector('.anime__details__title h3, .entry-title, h1.title')?.textContent?.trim() || "Unknown Title";
    const synopsis = doc.querySelector('.anime__details__text p, .entry-content p, .description')?.textContent?.trim() || "No description available.";
    
    const thumbEl = doc.querySelector('.anime__details__pic, .thumb img');
    let thumb = thumbEl?.getAttribute('data-setbg') || thumbEl?.getAttribute('src') || "";
    if (thumb && !thumb.startsWith('http')) {
       if (thumb.startsWith('//')) thumb = `https:${thumb}`;
       else thumb = `${TARGET_BASE}${thumb}`;
    }

    const episodeList: Episode[] = [];
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
    // If detail fetch fails but we have basic info from home, return that? 
    // Currently returning null will show loading forever or error.
    // Try to return a dummy object if possible, but null is safer to signal error.
    return null;
  }
};

export const getEpisodeStream = async (slug: string): Promise<string | null> => {
  try {
    // If it's a mock slug
    if (slug.includes('one-piece-episode') || slug.includes('jujutsu-kaisen-episode')) {
        return 'https://www.w3schools.com/html/mov_bbb.mp4';
    }

    const path = slug.includes('episode') ? `/${slug}` : `/episode/${slug}`; 
    
    const html = await fetchHTML(path);
    const doc = parseDOM(html);

    const iframes = doc.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
        const src = iframes[i].getAttribute('src');
        if (src && (src.includes('embed') || src.includes('player') || src.includes('google') || src.includes('blogger') || src.includes('youtube') || src.includes('ok.ru'))) {
             if (src.startsWith('/')) return `${TARGET_BASE}${src}`;
             return src;
        }
    }

    const options = doc.querySelectorAll('select.mirror option');
    if (options.length > 0) {
        const val = options[0].getAttribute('value');
        if (val) {
             if (val.startsWith('http')) return val;
             try { return atob(val); } catch(e) {}
        }
    }

    console.warn("Could not extract clean video source. Returning sample.");
    return "https://www.w3schools.com/html/mov_bbb.mp4"; 

  } catch (error) {
    console.error("Stream Fetch Error:", error);
    // Fallback stream
    return "https://www.w3schools.com/html/mov_bbb.mp4";
  }
};

export const getFeaturedMovie = (): Movie => FALLBACK_MOVIES[0];
export const getMoviesByCategory = (category: string): Movie[] => FALLBACK_MOVIES;
export const getTopAiring = (): Movie[] => FALLBACK_MOVIES;
export const getMostPopular = (): Movie[] => FALLBACK_MOVIES;
export const getMostFavorite = (): Movie[] => FALLBACK_MOVIES;
export const getLatestCompleted = (): Movie[] => FALLBACK_MOVIES;
