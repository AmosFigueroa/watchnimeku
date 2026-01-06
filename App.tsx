import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import FeaturedLists from './components/FeaturedLists';
import VideoPlayer from './components/VideoPlayer';
import AIAssistant from './components/AIAssistant';
import MovieDetailModal from './components/MovieDetailModal';
import SkeletonHome from './components/SkeletonHome';
import { getHomeData, getAnimeDetail } from './services/movieService';
import { Movie } from './types';
import { MonitorPlay } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';

const AppContent = () => {
  const [currentView, setCurrentView] = useState<'home' | 'player'>('home');
  const [activeCategory, setActiveCategory] = useState('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [detailMovie, setDetailMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [ongoingMovies, setOngoingMovies] = useState<Movie[]>([]); 
  const [completedMovies, setCompletedMovies] = useState<Movie[]>([]); 
  const [museMovies, setMuseMovies] = useState<Movie[]>([]); 
  const [tropicsMovies, setTropicsMovies] = useState<Movie[]>([]); 
  const [aniOneMovies, setAniOneMovies] = useState<Movie[]>([]); 
  const [animeMovies, setAnimeMovies] = useState<Movie[]>([]);
  const [boxOfficeMovies, setBoxOfficeMovies] = useState<Movie[]>([]);
  
  const { user } = useAuth(); 
  const { t } = useLanguage();
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { ongoing, completed, youtube, tropics, movies, bstation, boxOffice } = await getHomeData();
      
      setOngoingMovies(ongoing);
      setCompletedMovies(completed);
      setMuseMovies(youtube); 
      setTropicsMovies(tropics); 
      setAniOneMovies(bstation);
      setAnimeMovies(movies);
      setBoxOfficeMovies(boxOffice);
      
      // Select Hero Movies
      const safeOngoing = ongoing.slice(0, 3);
      const safeBoxOffice = boxOffice.slice(0, 2); 
      const combinedHero = [...safeOngoing, ...safeBoxOffice];
      const uniqueHero = Array.from(new Set(combinedHero.map(m => m.id)))
        .map(id => combinedHero.find(m => m.id === id)!);
        
      setHeroMovies(uniqueHero);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Fetch Watchlist details
  useEffect(() => {
    if (activeCategory === 'collection' && user && user.watchlist) {
        const mappedList: Movie[] = user.watchlist.map(item => ({
            id: item.slug, 
            slug: item.slug,
            title: item.title,
            thumbnailUrl: item.thumbnailUrl,
            coverUrl: item.thumbnailUrl,
            type: item.type as any,
            description: '',
            videoUrl: '',
            genre: [],
            rating: 'N/A',
            year: '',
            duration: '',
            source: item.type === 'Movie' ? 'external' : 'youtube', 
            youtubeId: undefined
        }));
        setWatchlistMovies(mappedList);
    }
  }, [activeCategory, user]);

  const handleMovieSelect = async (movie: Movie) => {
    if (movie.source === 'youtube' && movie.youtubeId) {
        setSelectedMovie(movie);
        setCurrentView('player');
        return;
    } 
    setDetailMovie(movie);
  };

  const handlePlayFromDetail = async (movie: Movie) => {
    setDetailMovie(null);
    if (movie.source === 'external' && !movie.videoUrl) {
         const enrichedMovie = await getAnimeDetail(movie.id.toString(), movie);
         if (enrichedMovie) {
             setSelectedMovie(enrichedMovie);
         } else {
             setSelectedMovie(movie);
         }
    } else {
        setSelectedMovie(movie);
    }
    setCurrentView('player');
  };

  const handleClosePlayer = () => {
    setSelectedMovie(null);
    setCurrentView('home');
  };

  const handleNavigate = (page: string) => {
    setActiveCategory(page);
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'anime':
        return (
          <>
             <MovieRow title="Update Resmi (Indonesia)" movies={museMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Serial Terpopuler (Simulcast)" movies={aniOneMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title={t.topAiring} movies={ongoingMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title={t.mostFavorite} movies={animeMovies} onMovieSelect={handleMovieSelect} />
          </>
        );
      case 'series':
        return (
          <>
             <MovieRow title="Episode Baru" movies={aniOneMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title={t.tvSeries} movies={ongoingMovies} onMovieSelect={handleMovieSelect} />
          </>
        );
      case 'movies':
        return (
          <>
             <MovieRow title="Bioskop Online" movies={boxOfficeMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title={t.mostFavorite} movies={animeMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title={t.mostPopular} movies={completedMovies.filter(m => m.type === 'Movie')} onMovieSelect={handleMovieSelect} />
          </>
        );
      case 'collection':
        return (
          <div className="min-h-[50vh] px-12 py-8">
             <h2 className="text-2xl font-bold text-white mb-6">{t.myList}</h2>
             {watchlistMovies.length > 0 ? (
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {watchlistMovies.map(movie => (
                         <div 
                            key={movie.id} 
                            onClick={() => handleMovieSelect(movie)}
                            className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition group"
                         >
                             <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                 <MonitorPlay className="text-[#1ce783] w-12 h-12" />
                             </div>
                             <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black to-transparent">
                                 <p className="text-white text-sm font-bold truncate">{movie.title}</p>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                <div className="flex flex-col items-center justify-center text-gray-500 h-64 border-2 border-dashed border-gray-800 rounded-xl">
                    <MonitorPlay className="w-16 h-16 mb-4 opacity-50" />
                    <h2 className="text-xl font-bold text-white mb-2">{t.myList} Kosong</h2>
                    <p>Simpan anime dan film favoritmu di sini.</p>
                </div>
             )}
          </div>
        );
      case 'home':
      default:
        return (
          <>
            {/* 1. Official YT Sources (Muse & AniOne Combined Concept) */}
            <MovieRow title="Tayangan Resmi Indonesia (Gratis)" movies={museMovies} onMovieSelect={handleMovieSelect} />
            <MovieRow title="Anime Asia Highlights" movies={aniOneMovies} onMovieSelect={handleMovieSelect} />
            
            {/* 2. External Scraper (Moviebox) - Labelled generically */}
            <MovieRow title="Box Office & Cinema" movies={boxOfficeMovies} onMovieSelect={handleMovieSelect} />
            
            {/* 3. Global Data */}
            <MovieRow title={t.topAiring} movies={ongoingMovies} onMovieSelect={handleMovieSelect} />
            
            <div className="bg-[#0f1014] mt-8 pt-4 pb-8 border-t border-gray-800">
                <FeaturedLists 
                  topAiring={ongoingMovies}
                  mostPopular={boxOfficeMovies} 
                  mostFavorite={animeMovies} 
                  latestCompleted={museMovies}
                  onPlay={handleMovieSelect}
                />
            </div>

            <MovieRow title={t.mostPopular} movies={completedMovies} onMovieSelect={handleMovieSelect} />
          </>
        );
    }
  };

  // USE SKELETON FOR LOADING
  if (isLoading) {
    return <SkeletonHome />;
  }

  return (
    <div className="bg-[#0b0c0f] min-h-screen text-white font-sans selection:bg-[#1ce783] selection:text-black">
      {currentView === 'home' && (
        <>
          <Navbar 
            onSearch={(q) => console.log('Searching:', q)} 
            onNavigate={handleNavigate}
            activeCategory={activeCategory}
          />
          
          <main className="pb-20">
            {activeCategory === 'home' && heroMovies.length > 0 && (
               <Hero movies={heroMovies} onPlay={handleMovieSelect} />
            )}
            
            <div className={`relative z-10 space-y-2 md:space-y-6 ${activeCategory === 'home' ? '-mt-16 md:-mt-20' : 'pt-24'}`}>
              {activeCategory === 'home' && (
                 <div className="w-full h-12 bg-gradient-to-b from-transparent to-[#0b0c0f] absolute -top-12 left-0 z-0"></div>
              )}
              {renderContent()}
            </div>
          </main>
          
          <footer className="bg-black py-12 px-12 border-t border-gray-800 text-gray-500 text-sm">
             <div className="text-center">&copy; 2024 StreamHulu ID.</div>
          </footer>

          <AIAssistant />

          {detailMovie && (
            <MovieDetailModal 
              movie={detailMovie} 
              onClose={() => setDetailMovie(null)} 
              onPlay={handlePlayFromDetail} 
            />
          )}
        </>
      )}

      {currentView === 'player' && selectedMovie && (
        <VideoPlayer 
          movie={selectedMovie} 
          onClose={handleClosePlayer} 
        />
      )}
    </div>
  );
};

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;