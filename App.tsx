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
  const [ongoingMovies, setOngoingMovies] = useState<Movie[]>([]);
  const [completedMovies, setCompletedMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { ongoing, completed } = await getHomeData();
      
      setOngoingMovies(ongoing);
      setCompletedMovies(completed);
      
      // Pick a random featured movie from ongoing list
      if (ongoing.length > 0) {
        setFeaturedMovie(ongoing[0]);
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
              {/* Horizontal Scroll Row (Standard Streaming UI) */}
              <MovieRow 
                title="Trending Now" 
                movies={ongoingMovies.slice(0, 10)} 
                onMovieSelect={handlePlayMovie} 
              />
              
              {/* New Detailed Grid Layout (Anime Site Style) */}
              <div className="bg-[#0f1014] mt-8 pt-4 pb-8 border-t border-gray-800">
                 <FeaturedLists 
                    topAiring={ongoingMovies.slice(0, 5)}
                    mostPopular={ongoingMovies.slice(5, 10)} // Mocking categories with slices
                    mostFavorite={completedMovies.slice(0, 5)} 
                    latestCompleted={completedMovies.slice(0, 5)}
                    onPlay={handlePlayMovie}
                 />
              </div>

               <MovieRow 
                title="Just Completed" 
                movies={completedMovies.slice(0, 10)} 
                onMovieSelect={handlePlayMovie} 
              />
            </div>
          </main>
          
          <footer className="bg-black py-12 px-12 border-t border-gray-800 text-gray-500 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="text-white font-bold mb-4">BROWSE</h4>
                <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Streaming Library</li>
                  <li className="hover:text-white cursor-pointer">Live TV</li>
                </ul>
              </div>
               <div>
                <h4 className="text-white font-bold mb-4">HELP</h4>
                <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Account & Billing</li>
                  <li className="hover:text-white cursor-pointer">Supported Devices</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-4">ABOUT US</h4>
                <ul className="space-y-2">
                  <li className="hover:text-white cursor-pointer">Press</li>
                  <li className="hover:text-white cursor-pointer">Contact</li>
                </ul>
              </div>
            </div>
            <div className="mt-12 text-center text-xs">
              &copy; 2024 StreamHulu Clone. Data provided by Wajik Anime API.
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