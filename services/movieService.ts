import { Movie, Episode } from '../types';

// --- CONFIGURATION ---
const SOURCES = {
    SAMEHADAKU: 'https://samehadaku.care',
    KURAMANIME: 'https://v9.kuramanime.tel'
};

const JIKAN_API = 'https://api.jikan.moe/v4';

// --- PROXY ROTATION SYSTEM ---
// Digunakan untuk bypass CORS dan proteksi dasar website target
const PROXIES = [
    {
        // AllOrigins Raw: Paling stabil untuk scraping HTML mentah
        url: (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
        isJson: false
    },
    {
        // CorsProxy.io: Cepat, tapi kadang ada rate limit
        url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
        isJson: false
    },
    {
        // AllOrigins JSON: Alternatif jika raw gagal
        url: (target: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        isJson: true
    }
];

// --- HELPER FUNCTIONS ---

const buildUrl = (base: string, path: string) => {
    const cleanBase = base.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
};

/**
 * Mencari gambar dari MyAnimeList via Jikan API jika gambar source rusak
 */
const fetchMalCover = async (query: string): Promise<string | null> => {
    try {
        // Delay sedikit untuk menghindari rate limit Jikan
        await new Promise(r => setTimeout(r, 500)); 
        const res = await fetch(`${JIKAN_API}/anime?q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].images.jpg.large_image_url;
        }
    } catch (e) {
        console.warn("Jikan API error:", e);
    }
    return null;
};

/**
 * Fetch HTML menggunakan rotasi proxy
 */
const fetchHTML = async (targetUrl: string): Promise<string> => {
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

        if (text && text.length > 1000 && !text.includes('403 Forbidden')) {
            return text;
        }
      }
    } catch (e) {
      // Continue to next proxy
    }
  }
  throw new Error(`Gagal scraping: ${targetUrl}`);
};

const parseDOM = (html: string) => {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
};

// --- SCRAPING LOGIC: SAMEHADAKU ---

const scrapeSamehadakuHome = async (): Promise<Movie[]> => {
    try {
        const html = await fetchHTML(SOURCES.SAMEHADAKU);
        const doc = parseDOM(html);
        const results: Movie[] = [];
        
        // Selector untuk "Latest Episodes" di Samehadaku
        const items = doc.querySelectorAll('.post-show ul li, .animepost');

        items.forEach((el) => {
            const titleEl = el.querySelector('.entry-title a, .title a');
            const linkEl = el.querySelector('a');
            const imgEl = el.querySelector('img');
            
            // Handle Lazy Loading Images
            let thumb = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || '';
            if (thumb.startsWith('//')) thumb = `https:${thumb}`;

            // Cleanup Title
            let title = titleEl?.textContent?.trim() || '';
            // Hapus kata "Episode" untuk mendapatkan judul seri bersih
            const seriesTitle = title.replace(/Episode\s+\d+.*/i, '').trim();

            const href = linkEl?.getAttribute('href') || '';
            // Simpan full URL sebagai slug karena struktur samehadaku kompleks
            const slug = href; 

            if (title && slug) {
                results.push({
                    id: slug,
                    slug: slug,
                    title: title,
                    description: 'Nonton update terbaru di Samehadaku',
                    thumbnailUrl: thumb, // Gambar sementara
                    coverUrl: thumb,
                    videoUrl: '',
                    genre: ['Anime'],
                    rating: 'New',
                    year: new Date().getFullYear(),
                    duration: '24m',
                    type: 'anime',
                    status: 'Ongoing',
                    // Simpan judul bersih untuk pencarian MAL nanti
                    lastUpdated: seriesTitle 
                });
            }
        });
        return results.slice(0, 15);
    } catch (e) {
        console.error("Samehadaku Home Error:", e);
        return [];
    }
};

const scrapeSamehadakuDetail = async (url: string, originalMovie?: Movie): Promise<Movie | null> => {
    try {
        // Jika URL adalah link episode (karena diklik dari home), kita harus cari link induk anime-nya
        // Tapi untuk simplifikasi, kita scrape halaman episode itu sendiri untuk dapat stream
        const html = await fetchHTML(url);
        const doc = parseDOM(html);

        const title = doc.querySelector('h1.entry-title')?.textContent?.replace('Nonton Anime', '').trim() || originalMovie?.title || "Anime Detail";
        const desc = doc.querySelector('.entry-content p')?.textContent || "Deskripsi tersedia.";
        
        let thumb = doc.querySelector('.thumb img')?.getAttribute('src') || originalMovie?.thumbnailUrl || '';
        if (!thumb || thumb.includes('placeholder')) {
             // Coba cari di MAL jika gambar kosong
             const malCover = await fetchMalCover(title.replace(/Episode\s+\d+/i, ''));
             if (malCover) thumb = malCover;
        }

        // Extract Stream Links (Iframe)
        // Samehadaku sering pakai #player_embed
        let streamUrl = '';
        const iframes = doc.querySelectorAll('#player_embed iframe, .player-embed iframe');
        for (let i = 0; i < iframes.length; i++) {
            const src = iframes[i].getAttribute('src');
            if (src) {
                streamUrl = src;
                break;
            }
        }

        // Extract Episodes List
        // Biasanya ada di widget sidebar atau di bawah player
        const episodes: Episode[] = [];
        const epLinks = doc.querySelectorAll('.lstepsiode.listeps ul li a');
        
        epLinks.forEach((el) => {
            const epUrl = el.getAttribute('href') || '';
            const epText = el.querySelector('.lchx')?.textContent || el.textContent || '';
            const epNum = parseInt(epText.match(/\d+/)?.[0] || '0');

            if (epUrl) {
                episodes.push({
                    id: epUrl,
                    slug: epUrl, // Full URL sebagai slug
                    number: epNum,
                    title: `Episode ${epNum}`,
                    thumbnailUrl: thumb,
                    videoUrl: '',
                    duration: '24m'
                });
            }
        });

        // Jika tidak ada list episode (halaman episode tunggal), buat dummy list dari current
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
        console.error("Detail Error:", e);
        return null;
    }
};


// --- SCRAPING LOGIC: KURAMANIME ---

const scrapeKuramaHome = async (): Promise<Movie[]> => {
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
        console.error("Kurama Home Error:", e);
        return [];
    }
};

// --- OFFLINE FALLBACK ---
const FALLBACK_MOVIES: Movie[] = [
    {
        id: 'offline-1',
        title: 'Server Busy / Offline',
        slug: 'offline',
        description: 'Maaf, kami tidak dapat terhubung ke server sumber (Samehadaku/Kuramanime) saat ini karena traffic tinggi atau proteksi cloudflare. Silakan coba lagi nanti.',
        thumbnailUrl: 'https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif',
        coverUrl: 'https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif',
        videoUrl: '',
        genre: ['Error'],
        rating: '0',
        year: '2024',
        duration: '0m',
        type: 'anime'
    }
];

// --- EXPORTED FUNCTIONS ---

export const getHomeData = async (): Promise<{ ongoing: Movie[], completed: Movie[] }> => {
    // Strategi: Coba Samehadaku dulu, kalau kosong/gagal, coba Kuramanime
    let ongoing: Movie[] = [];
    
    // 1. Try Samehadaku
    ongoing = await scrapeSamehadakuHome();

    // 2. If Samehadaku fails (empty), try Kuramanime
    if (ongoing.length === 0) {
        console.log("Switching to Kuramanime source...");
        ongoing = await scrapeKuramaHome();
    }

    // 3. Fallback Offline
    if (ongoing.length === 0) {
        return { ongoing: FALLBACK_MOVIES, completed: [] };
    }

    // Enhance Images asynchronously (Opsional, untuk memperbaiki gambar pecah)
    // Kita tidak await ini agar UI muncul cepat, gambar update belakangan kalau perlu
    // ongoing.forEach(async (movie) => {
    //     if (movie.thumbnailUrl.includes('placeholder') || !movie.thumbnailUrl) {
    //         const newCover = await fetchMalCover(movie.lastUpdated || movie.title);
    //         if (newCover) movie.thumbnailUrl = newCover;
    //     }
    // });

    return {
        ongoing: ongoing,
        completed: ongoing.slice().reverse() // Mock completed data dari data yang sama
    };
};

export const getAnimeDetail = async (slug: string): Promise<Movie | null> => {
    // Deteksi sumber berdasarkan format URL slug
    if (slug.includes('samehadaku')) {
        return await scrapeSamehadakuDetail(slug);
    } else {
        // Fallback untuk kuramanime atau general
        // Untuk saat ini kita arahkan logika umum ke samehadaku handler atau generic scraping
        // Jika slug diawali 'http', gunakan langsung
        if (slug.startsWith('http')) {
             return await scrapeSamehadakuDetail(slug);
        }
        
        // Construct URL for kuramanime if it's a relative path
        const url = buildUrl(SOURCES.KURAMANIME, slug);
        // Implementasi detail kuramanime bisa ditambahkan disini, 
        // tapi untuk efisiensi kita pakai logika generic scraper di atas
        return await scrapeSamehadakuDetail(url); 
    }
};

export const getEpisodeStream = async (slug: string): Promise<string | null> => {
    // Slug di sini sebenarnya adalah URL halaman episode (karena struktur scraping kita)
    try {
        const html = await fetchHTML(slug);
        const doc = parseDOM(html);

        // Cari Iframe
        const iframes = doc.querySelectorAll('iframe');
        for (const iframe of Array.from(iframes)) {
            const src = iframe.getAttribute('src') || iframe.getAttribute('data-src');
            // Filter src yang valid (bukan iklan)
            if (src && (src.includes('kurama') || src.includes('blogger') || src.includes('youtube') || src.includes('pixeldrain') || src.includes('kraken'))) {
                 return src.startsWith('//') ? `https:${src}` : src;
            }
        }
        
        // Cari decoded links di script variable (sering dipakai di samehadaku)
        // Ini advanced, tapi kita coba cari post-content yang berisi link
        const postContent = doc.querySelector('.entry-content');
        if (postContent) {
            const links = postContent.querySelectorAll('a');
            for (const link of Array.from(links)) {
                 const href = link.getAttribute('href');
                 if (href && (href.includes('zippyshare') || href.includes('gdrive'))) {
                     return href;
                 }
            }
        }

        return null;
    } catch (e) {
        console.error("Stream Fetch Error:", e);
        return null;
    }
};

// --- MOCKS ---
export const getFeaturedMovie = (): Movie => FALLBACK_MOVIES[0];
export const getMoviesByCategory = (category: string): Movie[] => FALLBACK_MOVIES;
export const getTopAiring = (): Movie[] => FALLBACK_MOVIES;
export const getMostPopular = (): Movie[] => FALLBACK_MOVIES;
export const getMostFavorite = (): Movie[] => FALLBACK_MOVIES;
export const getLatestCompleted = (): Movie[] => FALLBACK_MOVIES;
