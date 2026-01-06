import { Movie } from '../types';

const MOCK_DATA: Movie[] = [
  {
    id: '1',
    slug: 'solo-leveling',
    title: 'Solo Leveling',
    description: 'Ten years ago, "the Gate" appeared and connected the real world with the realm of magic and monsters. To combat these vile beasts, ordinary people received superhuman powers and became known as "Hunters".',
    thumbnailUrl: 'https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=contain,format=auto,quality=85,width=480,height=720/catalog/crunchyroll/5e7f533c3b4f462447938d0370366912.jpg',
    coverUrl: 'https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=contain,format=auto,quality=85,width=1200,height=675/catalog/crunchyroll/a249096c7812deb8c3c2c907173f3774.jpg',
    videoUrl: 'https://www.youtube.com/embed/j57d6kZ-K3o',
    genre: ['Action', 'Fantasy'],
    rating: '8.8',
    year: 2024,
    duration: '24m',
    type: 'Anime',
    status: 'Ongoing',
    source: 'youtube',
    youtubeId: 'j57d6kZ-K3o',
    episodes: Array.from({ length: 12 }, (_, i) => ({
        id: `ep-${i+1}`,
        number: i+1,
        title: `Episode ${i+1}`,
        thumbnailUrl: 'https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=contain,format=auto,quality=85,width=480,height=720/catalog/crunchyroll/5e7f533c3b4f462447938d0370366912.jpg',
        videoUrl: 'https://www.youtube.com/embed/j57d6kZ-K3o',
        duration: '24m'
    }))
  },
  {
    id: '2',
    slug: 'kaiju-no-8',
    title: 'Kaiju No. 8',
    description: 'Grotesque, Godzilla-like monsters called "kaijuu" have been appearing around Japan for many years. To combat these beasts, an elite military unit known as the Defense Corps risks their lives daily to protect civilians.',
    thumbnailUrl: 'https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=contain,format=auto,quality=85,width=480,height=720/catalog/crunchyroll/ce16742542a1548e3a9b75691f46d97e.jpg',
    coverUrl: 'https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=contain,format=auto,quality=85,width=1200,height=675/catalog/crunchyroll/6c043e0d86016625574581f1d13db544.jpg',
    videoUrl: 'https://www.youtube.com/embed/7n21oFv4jqo',
    genre: ['Action', 'Sci-Fi'],
    rating: '8.6',
    year: 2024,
    duration: '24m',
    type: 'Anime',
    status: 'Ongoing',
    source: 'youtube',
    youtubeId: '7n21oFv4jqo'
  },
  {
    id: '3',
    slug: 'one-piece',
    title: 'One Piece',
    description: 'Monkey D. Luffy refuses to let anyone or anything stand in the way of his quest to become the king of all pirates.',
    thumbnailUrl: 'https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=contain,format=auto,quality=85,width=480,height=720/catalog/crunchyroll/0662921aa3b81ff85737ddeb36a04067.jpg',
    coverUrl: 'https://imgsrv.crunchyroll.com/cdn-cgi/image/fit=contain,format=auto,quality=85,width=1200,height=675/catalog/crunchyroll/757b5363b76722d354972e399589a784.jpg',
    videoUrl: 'https://www.youtube.com/embed/S8_YwFLCh4U',
    genre: ['Adventure', 'Fantasy'],
    rating: '9.0',
    year: 1999,
    duration: '24m',
    type: 'Anime',
    status: 'Ongoing',
    source: 'youtube',
    youtubeId: 'S8_YwFLCh4U'
  },
  {
      id: '4',
      slug: 'oppenheimer',
      title: 'Oppenheimer',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
      thumbnailUrl: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg',
      coverUrl: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg',
      videoUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
      genre: ['Biography', 'Drama'],
      rating: '8.4',
      year: 2023,
      duration: '3h',
      type: 'Movie',
      status: 'Released',
      source: 'youtube',
      youtubeId: 'uYPbbksJxIg'
  },
   {
      id: '5',
      slug: 'avengers-endgame',
      title: 'Avengers: Endgame',
      description: 'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos\' actions and restore balance to the universe.',
      thumbnailUrl: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg',
      coverUrl: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg',
      videoUrl: 'https://www.youtube.com/embed/TcMBFSGVi1c',
      genre: ['Action', 'Sci-Fi'],
      rating: '8.4',
      year: 2019,
      duration: '3h 1m',
      type: 'Movie',
      status: 'Released',
      source: 'youtube',
      youtubeId: 'TcMBFSGVi1c'
  },
  {
      id: '6',
      slug: 'breaking-bad',
      title: 'Breaking Bad',
      description: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
      thumbnailUrl: 'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFhMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_.jpg',
      coverUrl: 'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFhMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_.jpg',
      videoUrl: 'https://www.youtube.com/embed/HhesaQXLuRY',
      genre: ['Crime', 'Drama'],
      rating: '9.5',
      year: 2008,
      duration: '49m',
      type: 'series',
      status: 'Completed',
      source: 'youtube',
      youtubeId: 'HhesaQXLuRY'
  }
];

export const getHomeData = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
        ongoing: MOCK_DATA.filter(m => m.type === 'Anime' && m.status === 'Ongoing'),
        completed: MOCK_DATA.filter(m => m.type === 'Anime' && m.status !== 'Ongoing'),
        youtube: MOCK_DATA.filter(m => m.source === 'youtube'),
        movies: MOCK_DATA.filter(m => m.type === 'Movie'),
        bstation: MOCK_DATA.filter(m => m.type === 'Anime'), // Reuse
        shortDramas: MOCK_DATA.filter(m => m.type === 'series')
    };
};

export const getAnimeDetail = async (slug: string): Promise<Movie | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_DATA.find(m => m.slug === slug || m.id === slug);
};
