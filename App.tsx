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

// Internal Component to access Auth Context
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
  const [youtubeMovies, setYoutubeMovies] = useState<Movie[]>([]); 
  const [bstationMovies, setBstationMovies] = useState<Movie[]>([]); 
  const [scrapedMovies, setScrapedMovies] = useState<Movie[]>([]);
  const [shortDramas, setShortDramas] = useState<Movie[]>([]); // NEW STATE
  
  const { user } = useAuth(); // Access user for Collection
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { ongoing, completed, youtube, movies, bstation, shortDramas } = await getHomeData();
      
      setOngoingMovies(ongoing);
      setCompletedMovies(completed);
      setYoutubeMovies(youtube);
      setBstationMovies(bstation);
      setScrapedMovies(movies);
      setShortDramas(shortDramas);
      
      const safeOngoing = ongoing.slice(0, 3);
      const safeYoutube = youtube.slice(0, 2);
      let combinedHero = [...safeOngoing, ...safeYoutube];
      if (combinedHero.length === 0 && movies.length > 0) {
        combinedHero = movies.slice(0, 5);
      }
      const uniqueHero = Array.from(new Set(combinedHero.map(m => m.id)))
        .map(id => combinedHero.find(m => m.id === id)!);
        
      setHeroMovies(uniqueHero);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Fetch Watchlist details when Category is 'collection'
  useEffect(() => {
    if (activeCategory === 'collection' && user && user.watchlist) {
        // Convert stored lightweight watchlist items back to Movie objects for display
        const mappedList: Movie[] = user.watchlist.map(item => ({
            id: item.slug, // Use slug as ID for list
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
            source: item.slug.startsWith('YT') ? 'youtube' : (item.slug.startsWith('dm-') ? 'dailymotion' : 'scrape'),
            youtubeId: item.slug.startsWith('YT') ? item.slug.split(':')[1] : undefined
        }));
        setWatchlistMovies(mappedList);
    }
  }, [activeCategory, user]);

  const handleMovieSelect = (movie: Movie) => {
    setDetailMovie(movie);
  };

  const handlePlayFromDetail = (movie: Movie) => {
    setDetailMovie(null);
    setSelectedMovie(movie);
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
             <MovieRow title="Anime Terbaru (Sedang Tayang)" movies={ongoingMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Anime dari Dailymotion" movies={shortDramas.filter(m => m.type === 'Anime')} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Gratis & Legal (Youtube)" movies={youtubeMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Populer di Bstation" movies={bstationMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Anime Legendaris" movies={completedMovies} onMovieSelect={handleMovieSelect} />
          </>
        );
      case 'series':
        return (
          <>
             <MovieRow title="Short Drama (Dailymotion)" movies={shortDramas.filter(m => m.type === 'Drama')} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Serial TV Populer" movies={bstationMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Serial Anime Pilihan" movies={ongoingMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Youtube Series" movies={youtubeMovies} onMovieSelect={handleMovieSelect} />
          </>
        );
      case 'movies':
        return (
          <>
             <MovieRow title="Film Barat & Box Office" movies={scrapedMovies} onMovieSelect={handleMovieSelect} />
             <MovieRow title="Anime Movie" movies={completedMovies.filter(m => m.type === 'Movie' || m.type === 'Special')} onMovieSelect={handleMovieSelect} />
          </>
        );
      case 'collection':
        return (
          <div className="min-h-[50vh] px-12 py-8">
             <h2 className="text-2xl font-bold text-white mb-6">Daftar Tontonan Saya</h2>
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
                    <h2 className="text-xl font-bold text-white mb-2">Koleksi Masih Kosong</h2>
                    <p>Simpan anime dan film favoritmu di sini.</p>
                </div>
             )}
          </div>
        );
      case 'home':
      default:
        return (
          <>
            <MovieRow title="Anime Terbaru (Sedang Tayang)" movies={ongoingMovies} onMovieSelect={handleMovieSelect} />
            <MovieRow title="Drama Pendek & Anime (Dailymotion)" movies={shortDramas} onMovieSelect={handleMovieSelect} />
            <MovieRow title="Gratis & Legal (Muse, Ani-One, Tropics)" movies={youtubeMovies} onMovieSelect={handleMovieSelect} />
            <MovieRow title="Populer di Bstation (Bilibili)" movies={bstationMovies} onMovieSelect={handleMovieSelect} />
            <MovieRow title="Film Populer" movies={scrapedMovies} onMovieSelect={handleMovieSelect} />
            
            <div className="bg-[#0f1014] mt-8 pt-4 pb-8 border-t border-gray-800">
                <FeaturedLists 
                  topAiring={ongoingMovies}
                  mostPopular={completedMovies} 
                  mostFavorite={youtubeMovies} 
                  latestCompleted={bstationMovies}
                  onPlay={handleMovieSelect}
                />
            </div>

            <MovieRow title="Anime Lawas & Legendaris" movies={completedMovies} onMovieSelect={handleMovieSelect} />
          </>
        );
    }
  };

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
             {/* Footer content same as before */}
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

// Root Component Wraps with Provider
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;