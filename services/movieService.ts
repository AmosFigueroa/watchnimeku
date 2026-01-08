import { Movie, Episode } from '../types';

const BASE_URL = 'https://api.jikan.moe/v4';
const OTAKU_API_URL = 'https://web-anime-api.vercel.app/otakudesu';

// --- DATA CADANGAN (FALLBACK) ---
// Digunakan jika API error atau terkena limit/CORS.
const FALLBACK_DATA = {
    MUSE: [
        { id: 'frieren-1', title: 'Frieren: Beyond Journey\'s End', thumbnailUrl: 'https://i.ytimg.com/vi/iqisE5ocWIY/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/iqisE5ocWIY', youtubeId: 'iqisE5ocWIY', type: 'Anime', year: 2024, rating: '9.2', duration: '24m', description: 'Elf penyihir Frieren memulai perjalanan baru.', source: 'youtube' },
        { id: 'apothecary-1', title: 'The Apothecary Diaries', thumbnailUrl: 'https://i.ytimg.com/vi/_bO2sE6xH1o/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/_bO2sE6xH1o', youtubeId: '_bO2sE6xH1o', type: 'Anime', year: 2024, rating: '8.9', duration: '24m', description: 'Maomao memecahkan misteri di istana dalam.', source: 'youtube' },
        { id: 'mushoku-1', title: 'Mushoku Tensei Season 2', thumbnailUrl: 'https://i.ytimg.com/vi/D2Wq1D6v6Z4/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/D2Wq1D6v6Z4', youtubeId: 'D2Wq1D6v6Z4', type: 'Anime', year: 2024, rating: '8.5', duration: '24m', description: 'Rudeus melanjutkan petualangannya.', source: 'youtube' },
        { id: 'slime-1', title: 'Tensei Shitara Slime Datta Ken', thumbnailUrl: 'https://i.ytimg.com/vi/8_p8Y1jZ8aE/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/8_p8Y1jZ8aE', youtubeId: '8_p8Y1jZ8aE', type: 'Anime', year: 2024, rating: '8.6', duration: '24m', description: 'Rimuru membangun negara monster.', source: 'youtube' }
    ],
    ANI_ONE: [
        { id: 'jjk-1', title: 'Jujutsu Kaisen Season 2', thumbnailUrl: 'https://i.ytimg.com/vi/Pm-wNmS9RGI/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/Pm-wNmS9RGI', youtubeId: 'Pm-wNmS9RGI', type: 'Anime', year: 2024, rating: '9.0', duration: '24m', description: 'Insiden Shibuya dimulai.', source: 'youtube' },
        { id: 'csm-1', title: 'Chainsaw Man', thumbnailUrl: 'https://i.ytimg.com/vi/j9sfpn51r9I/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/j9sfpn51r9I', youtubeId: 'j9sfpn51r9I', type: 'Anime', year: 2023, rating: '8.8', duration: '24m', description: 'Denji menjadi pemburu iblis.', source: 'youtube' },
        { id: 'solo-1', title: 'Solo Leveling', thumbnailUrl: 'https://i.ytimg.com/vi/Bs_Z5Fj1h_Y/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/Bs_Z5Fj1h_Y', youtubeId: 'Bs_Z5Fj1h_Y', type: 'Anime', year: 2024, rating: '8.7', duration: '24m', description: 'Sung Jinwoo bangkit dari hunter terlemah.', source: 'youtube' },
        { id: 'kaiju-8', title: 'Kaiju No. 8', thumbnailUrl: 'https://i.ytimg.com/vi/7v1d8W8_VvY/hqdefault.jpg', videoUrl: 'https://www.youtube.com/embed/7v1d8W8_VvY', youtubeId: '7v1d8W8_VvY', type: 'Anime', year: 2024, rating: '8.5', duration: '24m', description: 'Kafka Hibino ingin membasmi Kaiju.', source: 'youtube' }
    ],
    ANIME_BLOCKBUSTER: [
        { id: 'suzume-1', title: 'Suzume no Tojimari', slug: 'suzume', thumbnailUrl: 'https://i.ytimg.com/vi/F7nQ0VUA7g0/hqdefault.jpg', coverUrl: 'https://images5.alphacoders.com/131/1310939.jpg', type: 'Movie', year: 2022, rating: '8.5', duration: '2h 2m', description: 'Seorang gadis berusia 17 tahun bernama Suzume membantu seorang pemuda misterius menutup pintu bencana yang muncul di seluruh Jepang.', videoUrl: 'https://www.youtube.com/embed/F7nQ0VUA7g0', youtubeId: 'F7nQ0VUA7g0', genre: ['Fantasy', 'Adventure'], source: 'youtube' },
        { id: 'op-red-1', title: 'One Piece Film: Red', slug: 'one-piece-red', thumbnailUrl: 'https://i.ytimg.com/vi/89J_VjXvJ20/hqdefault.jpg', coverUrl: 'https://images6.alphacoders.com/123/1237978.jpg', type: 'Movie', year: 2022, rating: '8.3', duration: '1h 55m', description: 'Uta, penyanyi paling dicintai di dunia, menyembunyikan identitasnya. Ia akan tampil di depan umum untuk pertama kalinya di konser live.', videoUrl: 'https://www.youtube.com/embed/89J_VjXvJ20', youtubeId: '89J_VjXvJ20', genre: ['Action', 'Music'], source: 'youtube' },
        { id: 'jjk-0', title: 'Jujutsu Kaisen 0', slug: 'jjk-0', thumbnailUrl: 'https://i.ytimg.com/vi/e8YBesRKq_U/hqdefault.jpg', coverUrl: 'https://images8.alphacoders.com/120/1205739.jpg', type: 'Movie', year: 2021, rating: '8.8', duration: '1h 45m', description: 'Yuta Okkotsu dihantui oleh teman masa kecilnya, Rika, yang meninggal dalam kecelakaan lalu lintas dan menjadi roh terkutuk.', videoUrl: 'https://www.youtube.com/embed/e8YBesRKq_U', youtubeId: 'e8YBesRKq_U', genre: ['Action', 'Supernatural'], source: 'youtube' },
        { id: 'kny-mugen', title: 'Demon Slayer: Mugen Train', slug: 'mugen-train', thumbnailUrl: 'https://i.ytimg.com/vi/ATJYac_dORw/hqdefault.jpg', coverUrl: 'https://images.alphacoders.com/110/1106898.jpg', type: 'Movie', year: 2020, rating: '9.0', duration: '1h 57m', description: 'Tanjiro dan kawan-kawan bergabung dengan Hashira Api Kyojuro Rengoku untuk membasmi iblis di dalam kereta yang melaju cepat.', videoUrl: 'https://www.youtube.com/embed/ATJYac_dORw', youtubeId: 'ATJYac_dORw', genre: ['Action', 'Fantasy'], source: 'youtube' },
        { id: 'kimi-no-nawa', title: 'Your Name (Kimi no Na wa)', slug: 'your-name', thumbnailUrl: 'https://i.ytimg.com/vi/a4ZNp-X42tQ/hqdefault.jpg', coverUrl: 'https://images3.alphacoders.com/762/762419.jpg', type: 'Movie', year: 2016, rating: '9.3', duration: '1h 52m', description: 'Dua remaja asing bertukar tubuh secara misterius dan mulai jatuh cinta satu sama lain.', videoUrl: 'https://www.youtube.com/embed/a4ZNp-X42tQ', youtubeId: 'a4ZNp-X42tQ', genre: ['Romance', 'Drama'], source: 'youtube' }
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

// Fetch RSS Feed from YouTube
const fetchYoutubeRSS = async (channelId: string, channelName: string, fallbackKey: keyof typeof FALLBACK_DATA): Promise<Movie[]> => {
    const targetUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    
    const processItems = (items: any[], type: 'json' | 'xml') => {
        return items.map((entry): Movie | null => {
            let videoId = "", title = "", published = "";

            if (type === 'json') {
                const rawId = entry.guid || entry.link;
                if(rawId) {
                    if (rawId.includes('v=')) {
                        videoId = rawId.split('v=')[1].split('&')[0];
                    } else {
                        videoId = rawId.replace('yt:video:', '');
                    }
                }
                title = entry.title;
                published = entry.pubDate;
            } else {
                const videoIdTag = entry.getElementsByTagName('yt:videoId')[0] || entry.getElementsByTagName('videoId')[0];
                videoId = videoIdTag ? videoIdTag.textContent : "";
                const titleTag = entry.getElementsByTagName('title')[0];
                title = titleTag ? titleTag.textContent : "";
                const publishedTag = entry.getElementsByTagName('published')[0];
                published = publishedTag ? publishedTag.textContent : "";
            }

            if (!videoId) return null;

            return {
                id: videoId,
                slug: videoId,
                title: title,
                description: `Tonton resmi dari ${channelName}.`,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
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
        try {
             const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}&api_key=0`);
             const data = await res.json();
             if (data.status === 'ok' && Array.isArray(data.items) && data.items.length > 0) {
                 return processItems(data.items, 'json');
             }
        } catch (err) {
            console.warn(`rss2json failed for ${channelName}, switching to proxy...`);
        }

        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("Proxy failed");
        
        const text = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const entries = Array.from(xmlDoc.getElementsByTagName("entry"));

        if (entries.length > 0) {
             return processItems(entries, 'xml');
        }

        throw new Error("RSS Empty");

    } catch (e) {
        console.warn(`Fetching failed for ${channelName}, utilizing fallback data.`);
        return FALLBACK_DATA[fallbackKey] as Movie[];
    }
};

// --- NEW OTAKUDESU API INTEGRATION ---
const fetchOtakuOngoing = async (): Promise<Movie[]> => {
    try {
        const res = await fetch(`${OTAKU_API_URL}/ongoing?page=1`);
        const json = await res.json();
        
        if (json.statusCode === 200 && json.data && Array.isArray(json.data.animeList)) {
             return json.data.animeList.map((item: any) => ({
                id: item.animeId,
                slug: item.animeId,
                title: item.title,
                description: `Episode ${item.episodes} • ${item.releaseDay}, ${item.latestReleaseDate}`,
                thumbnailUrl: item.poster,
                coverUrl: item.poster,
                videoUrl: '', 
                genre: ['Anime'],
                rating: 'Ongoing',
                year: new Date().getFullYear(),
                duration: `Ep ${item.episodes}`,
                type: 'Anime',
                status: 'Ongoing',
                source: 'otakudesu'
             }));
        }
        return [];
    } catch (e) {
        console.error("Otaku Fetch Error", e);
        return [];
    }
};

// "Fake" Scraper
const fetchMovieBoxScraper = async (): Promise<Movie[]> => {
    return FALLBACK_DATA.ANIME_BLOCKBUSTER as Movie[];
};

export const getHomeData = async () => {
    try {
        const results = await Promise.allSettled([
            fetchOtakuOngoing(), // Using new API for Ongoing
            fetch(`${BASE_URL}/top/anime?filter=bypopularity&limit=10`).then(r => r.json()),
            fetch(`${BASE_URL}/top/anime?type=movie&limit=10`).then(r => r.json()),
            fetchYoutubeRSS(CHANNELS.MUSE_ID, 'Muse Indonesia', 'MUSE'),
            fetchYoutubeRSS(CHANNELS.ANI_ONE_ID, 'Ani-One Indonesia', 'ANI_ONE'),
            fetchYoutubeRSS(CHANNELS.TROPICS_ID, 'Tropics Anime', 'MUSE'), 
            fetchMovieBoxScraper() 
        ]);

        const getResult = (index: number, fallback: any[] = []) => {
            const res = results[index];
            if (res.status === 'fulfilled' && res.value) {
                if (res.value.data && Array.isArray(res.value.data)) return res.value.data.map(mapJikanToMovie);
                if (Array.isArray(res.value) && res.value.length > 0) return res.value;
            }
            return fallback;
        };

        const ongoing = getResult(0); // Now from Otaku API
        const popular = getResult(1);
        const animeMovies = getResult(2);
        
        const finalOngoing = ongoing.length > 0 ? ongoing : FALLBACK_DATA.ANI_ONE;
        const finalPopular = popular.length > 0 ? popular : FALLBACK_DATA.MUSE;

        const youtubeData = getResult(3, FALLBACK_DATA.MUSE);
        const bstationData = getResult(4, FALLBACK_DATA.ANI_ONE);
        
        return {
            ongoing: finalOngoing,
            completed: finalPopular,
            movies: animeMovies.length > 0 ? animeMovies : FALLBACK_DATA.ANIME_BLOCKBUSTER,
            youtube: youtubeData.length > 0 ? youtubeData : FALLBACK_DATA.MUSE,
            bstation: bstationData.length > 0 ? bstationData : FALLBACK_DATA.ANI_ONE,
            tropics: getResult(5, FALLBACK_DATA.MUSE),
            boxOffice: getResult(6, FALLBACK_DATA.ANIME_BLOCKBUSTER)
        };

    } catch (error) {
        console.error("Critical Error fetching data:", error);
        return {
            ongoing: FALLBACK_DATA.ANI_ONE as Movie[],
            completed: FALLBACK_DATA.MUSE as Movie[],
            youtube: FALLBACK_DATA.MUSE as Movie[],
            tropics: FALLBACK_DATA.MUSE as Movie[],
            movies: FALLBACK_DATA.ANIME_BLOCKBUSTER as Movie[],
            bstation: FALLBACK_DATA.ANI_ONE as Movie[],
            boxOffice: FALLBACK_DATA.ANIME_BLOCKBUSTER as Movie[]
        };
    }
};

export const getAnimeDetail = async (id: string, movie?: Movie): Promise<Movie | undefined> => {
    // 1. Handle Otakudesu Source
    if (movie?.source === 'otakudesu') {
        try {
            // Fetch Anime Detail Info
            const res = await fetch(`${OTAKU_API_URL}/anime/${id}`);
            const json = await res.json();
            const data = json.data;
            
            // Basic details map
            const detailedMovie: Movie = {
                ...movie,
                title: data.title || movie.title,
                description: data.synopsis || movie.description,
                thumbnailUrl: data.poster || movie.thumbnailUrl,
                coverUrl: data.poster || movie.coverUrl,
                genre: data.genre_list ? data.genre_list.map((g: any) => g.genre_title) : movie.genre,
                rating: data.score || movie.rating,
                status: data.status || movie.status,
                // Map episodes
                episodes: data.episode_list ? data.episode_list.map((ep: any) => ({
                    id: ep.episodeId,
                    number: parseInt(ep.episode_title.match(/\d+/)?.[0] || '0'),
                    title: ep.episode_title,
                    thumbnailUrl: data.poster,
                    videoUrl: '', // Placeholder
                    duration: '24m',
                    slug: ep.episodeId
                })) : []
            };

            // Attempt to fetch stream for the first/latest episode to make playback instant
            if (detailedMovie.episodes && detailedMovie.episodes.length > 0) {
                 const firstEp = detailedMovie.episodes[0];
                 const streamRes = await fetch(`${OTAKU_API_URL}/episode/${firstEp.slug}`);
                 const streamJson = await streamRes.json();
                 // Try to find a valid stream URL from response
                 const streamUrl = streamJson.data?.streamLink || streamJson.data?.link_stream || streamJson.data?.mirror_list?.[0]?.mirror_link; 
                 
                 if (streamUrl) {
                     detailedMovie.videoUrl = streamUrl;
                     detailedMovie.episodes[0].videoUrl = streamUrl;
                 }
            }
            return detailedMovie;
        } catch(e) {
            console.error("Otaku Detail Error", e);
            return movie;
        }
    }

    // 2. Handle Static/YouTube Fallback
    if (movie && (movie.source === 'external' || movie.source === 'youtube')) {
        return movie;
    }

    // 3. Handle YouTube ID string
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

    // 4. Handle Jikan API
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
        return movie;
    }
};