import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MovieRow from './components/MovieRow';
import FeaturedLists from './components/FeaturedLists';
import VideoPlayer from './components/VideoPlayer';
import AIAssistant from './components/AIAssistant';
import { getHomeData } from './services/movieService';
import { Movie } from './types';
import { Loader2 } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'player'>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [ongoingMovies, setOngoingMovies] = useState<Movie[]>([]); // Anime Baru (Sedang Tayang)
  const [completedMovies, setCompletedMovies] = useState<Movie[]>([]); // Anime Lama (Tamat)
  const [youtubeMovies, setYoutubeMovies] = useState<Movie[]>([]); // Youtube Resmi Indo
  const [scrapedMovies, setScrapedMovies] = useState<Movie[]>([]); // Film Barat

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { ongoing, completed, youtube, movies } = await getHomeData();
      
      setOngoingMovies(ongoing);
      setCompletedMovies(completed);
      setYoutubeMovies(youtube);
      setScrapedMovies(movies);
      
      // Pick a random featured movie from ongoing list
      if (ongoing.length > 0) {
        setFeaturedMovie(ongoing[Math.floor(Math.random() * Math.min(ongoing.length, 5))]);
      } else if (movies.length > 0) {
        setFeaturedMovie(movies[0]);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handlePlayMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setCurrentView('player');
  };

  const handleClosePlayer = () => {
    setSelectedMovie(null);
    setCurrentView('home');
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      setCurrentView('home');
      setSelectedMovie(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#1ce783]" />
      </div>
    );
  }

  return (
    <div className="bg-[#0b0c0f] min-h-screen text-white font-sans selection:bg-[#1ce783] selection:text-black">
      {currentView === 'home' && (
        <>
          <Navbar 
            onSearch={(q) => console.log('Searching:', q)} 
            onNavigate={handleNavigate}
          />
          
          <main className="pb-20">
            {featuredMovie && <Hero movie={featuredMovie} onPlay={handlePlayMovie} />}
            
            <div className="relative z-10 -mt-24 md:-mt-32 space-y-2 md:space-y-6">
              
              {/* Row 1: Anime Baru / Sedang Tayang */}
              <MovieRow 
                title="Anime Terbaru (Sedang Tayang)" 
                movies={ongoingMovies} 
                onMovieSelect={handlePlayMovie} 
              />

              {/* Row 2: Resmi & Legal (Youtube) */}
              {youtubeMovies.length > 0 && (
                <MovieRow 
                  title="Gratis & Legal (Youtube Indo)" 
                  movies={youtubeMovies} 
                  onMovieSelect={handlePlayMovie} 
                />
              )}

              {/* Row 3: Film Barat */}
              {scrapedMovies.length > 0 && (
                <MovieRow 
                  title="Film Populer" 
                  movies={scrapedMovies} 
                  onMovieSelect={handlePlayMovie} 
                />
              )}
              
              {/* Grid Layout */}
              <div className="bg-[#0f1014] mt-8 pt-4 pb-8 border-t border-gray-800">
                 <FeaturedLists 
                    topAiring={ongoingMovies.slice(0, 5)}
                    mostPopular={completedMovies.slice(0, 5)} 
                    mostFavorite={completedMovies.slice(5, 10)} 
                    latestCompleted={ongoingMovies.slice(5, 10)}
                    onPlay={handlePlayMovie}
                 />
              </div>

               {/* Row 4: Anime Lama / Tamat */}
               <MovieRow 
                title="Anime Lawas & Legendaris" 
                movies={completedMovies} 
                onMovieSelect={handlePlayMovie} 
              />
            </div>
          </main>
          
          <footer className="bg-black py-12 px-12 border-t border-gray-800 text-gray-500 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-white font-bold mb-4">JELAJAH</h4>
                <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Perpustakaan Streaming</li>
                  <li className="hover:text-white cursor-pointer">Jadwal Tayang</li>
                </ul>
              </div>
               <div>
                <h4 className="text-white font-bold mb-4">BANTUAN</h4>
                <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Akun & Tagihan</li>
                  <li className="hover:text-white cursor-pointer">Perangkat yang Didukung</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">TENTANG KAMI</h4>
                <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Media</li>
                  <li className="hover:text-white cursor-pointer">Kontak</li>
                </ul>
              </div>
            </div>
            <div className="mt-12 text-center text-xs">
              &copy; 2024 StreamHulu ID. Data provided by Jikan API & YouTube & MovieBox.
            </div>
          </footer>

          <AIAssistant />
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
}

export default App;